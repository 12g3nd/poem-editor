import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { createPoem } from '@/db/poems'
import { createSnapshot, listSnapshots, getSnapshot, deleteSnapshot, restoreSnapshot } from '@/db/snapshots'

beforeEach(async () => {
  await db.poems.clear()
  await db.snapshots.clear()
})

function tick(ms = 5) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('snapshots', () => {
  it('creates a snapshot tied to a poem', async () => {
    const poem = await createPoem('Draft')
    const snapshot = await createSnapshot(poem.id, 'Draft', 'line one')
    expect(snapshot.poemId).toBe(poem.id)
    expect(snapshot.title).toBe('Draft')
    expect(snapshot.body).toBe('line one')
  })

  it('lists snapshots for a poem, newest first', async () => {
    const poem = await createPoem('Draft')
    const first = await createSnapshot(poem.id, 'Draft', 'v1')
    await tick()
    const second = await createSnapshot(poem.id, 'Draft', 'v2')

    const list = await listSnapshots(poem.id)
    expect(list.map((s) => s.id)).toEqual([second.id, first.id])
  })

  it('only lists snapshots belonging to the requested poem', async () => {
    const poemA = await createPoem('A')
    const poemB = await createPoem('B')
    await createSnapshot(poemA.id, 'A', 'a-body')
    await createSnapshot(poemB.id, 'B', 'b-body')

    const list = await listSnapshots(poemA.id)
    expect(list).toHaveLength(1)
    expect(list[0].poemId).toBe(poemA.id)
  })

  it('returns null for a missing snapshot', async () => {
    expect(await getSnapshot('does-not-exist')).toBeNull()
  })

  it('deletes a snapshot', async () => {
    const poem = await createPoem('Draft')
    const snapshot = await createSnapshot(poem.id, 'Draft', 'v1')
    await deleteSnapshot(snapshot.id)
    expect(await getSnapshot(snapshot.id)).toBeNull()
  })

  it('restores a poem to a prior snapshot', async () => {
    const poem = await createPoem('Original title')
    const snapshot = await createSnapshot(poem.id, 'Original title', 'original body')
    await db.poems.update(poem.id, { title: 'Changed title', body: 'changed body' })

    await restoreSnapshot(snapshot.id)

    const restored = await db.poems.get(poem.id)
    expect(restored?.title).toBe('Original title')
    expect(restored?.body).toBe('original body')
  })

  it('takes a safety snapshot of the current state before restoring', async () => {
    const poem = await createPoem('Original title')
    const snapshot = await createSnapshot(poem.id, 'Original title', 'original body')
    await db.poems.update(poem.id, { title: 'Changed title', body: 'changed body' })

    await restoreSnapshot(snapshot.id)

    const history = await listSnapshots(poem.id)
    const safetySnapshot = history.find((s) => s.label === 'Before restore')
    expect(safetySnapshot).toBeDefined()
    expect(safetySnapshot?.title).toBe('Changed title')
    expect(safetySnapshot?.body).toBe('changed body')
  })

  it('does nothing when restoring a snapshot that does not exist', async () => {
    await expect(restoreSnapshot('does-not-exist')).resolves.not.toThrow()
  })
})
