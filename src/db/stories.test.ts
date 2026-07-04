import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { createStory, getStory, listStories, updateStory, deleteStory, restoreStorySnapshot } from '@/db/stories'
import { createSnapshot, listSnapshots } from '@/db/snapshots'

beforeEach(async () => {
  await db.stories.clear()
  await db.snapshots.clear()
})

function tick(ms = 5) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('story storage', () => {
  it('creates a story with sensible defaults', async () => {
    const story = await createStory('My Story')
    expect(story.title).toBe('My Story')
    expect(story.body).toBe('')
    expect(story.id).toBeTruthy()
    expect(story.createdAt).toBe(story.modifiedAt)
    expect(story.status).toBe('draft')
    expect(story.favorite).toBe(false)
    expect(story.tags).toEqual([])
    expect(story.collectionIds).toEqual([])

    const fetched = await getStory(story.id)
    expect(fetched).toEqual(story)
  })

  it('defaults the title to "Untitled" when none is given', async () => {
    const story = await createStory()
    expect(story.title).toBe('Untitled')
  })

  it('returns null (not undefined) for a missing story', async () => {
    const fetched = await getStory('does-not-exist')
    expect(fetched).toBeNull()
  })

  it('lists stories ordered by most recently modified first', async () => {
    const a = await createStory('A')
    await tick()
    const b = await createStory('B')
    await tick()
    const c = await createStory('C')
    await tick()

    await updateStory(a.id, { title: 'A (touched)' })

    const list = await listStories()
    expect(list.map((s) => s.id)).toEqual([a.id, c.id, b.id])
  })

  it('updates fields and bumps modifiedAt without touching createdAt', async () => {
    const story = await createStory('Title')
    const originalModifiedAt = story.modifiedAt
    await tick()

    await updateStory(story.id, { body: 'new body' })
    const updated = await getStory(story.id)

    expect(updated?.body).toBe('new body')
    expect(updated?.createdAt).toBe(story.createdAt)
    expect(updated?.modifiedAt).toBeGreaterThan(originalModifiedAt)
  })

  it('deletes a story', async () => {
    const story = await createStory('Gone')
    await deleteStory(story.id)
    const fetched = await getStory(story.id)
    expect(fetched).toBeNull()
  })

  it('deleting a non-existent story does not throw', async () => {
    await expect(deleteStory('does-not-exist')).resolves.not.toThrow()
  })
})

describe('restoreStorySnapshot', () => {
  it('restores the story title/body from the snapshot', async () => {
    const story = await createStory('Original title')
    await updateStory(story.id, { body: 'original body' })
    const snapshot = await createSnapshot(story.id, 'Original title', 'original body')

    await updateStory(story.id, { title: 'Changed title', body: 'changed body' })
    await restoreStorySnapshot(snapshot.id)

    const restored = await getStory(story.id)
    expect(restored?.title).toBe('Original title')
    expect(restored?.body).toBe('original body')
  })

  it('takes a "Before restore" safety snapshot of the pre-restore state', async () => {
    const story = await createStory('Original title')
    const snapshot = await createSnapshot(story.id, 'Original title', 'v1')

    await updateStory(story.id, { title: 'v2 title', body: 'v2 body' })
    await restoreStorySnapshot(snapshot.id)

    const snapshots = await listSnapshots(story.id)
    const safety = snapshots.find((s) => s.label === 'Before restore')
    expect(safety?.title).toBe('v2 title')
    expect(safety?.body).toBe('v2 body')
  })

  it('does nothing if the snapshot does not exist', async () => {
    await expect(restoreStorySnapshot('does-not-exist')).resolves.not.toThrow()
  })
})
