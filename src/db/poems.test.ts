import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { createPoem, getPoem, listPoems, updatePoem, deletePoem } from '@/db/poems'

beforeEach(async () => {
  await db.poems.clear()
})

/** Guarantees distinct Date.now() ticks between rapid-fire operations in tests. */
function tick(ms = 5) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('poem storage', () => {
  it('creates a poem with sensible defaults', async () => {
    const poem = await createPoem('My Poem')
    expect(poem.title).toBe('My Poem')
    expect(poem.body).toBe('')
    expect(poem.id).toBeTruthy()
    expect(poem.createdAt).toBe(poem.modifiedAt)
    expect(poem.status).toBe('draft')
    expect(poem.favorite).toBe(false)
    expect(poem.tags).toEqual([])
    expect(poem.collectionIds).toEqual([])

    const fetched = await getPoem(poem.id)
    expect(fetched).toEqual(poem)
  })

  it('defaults the title to "Untitled" when none is given', async () => {
    const poem = await createPoem()
    expect(poem.title).toBe('Untitled')
  })

  it('returns null (not undefined) for a missing poem', async () => {
    const fetched = await getPoem('does-not-exist')
    expect(fetched).toBeNull()
  })

  it('lists poems ordered by most recently modified first', async () => {
    const a = await createPoem('A')
    await tick()
    const b = await createPoem('B')
    await tick()
    const c = await createPoem('C')
    await tick()

    await updatePoem(a.id, { title: 'A (touched)' })

    const list = await listPoems()
    expect(list.map((p) => p.id)).toEqual([a.id, c.id, b.id])
  })

  it('updates fields and bumps modifiedAt without touching createdAt', async () => {
    const poem = await createPoem('Title')
    const originalModifiedAt = poem.modifiedAt
    await tick()

    await updatePoem(poem.id, { body: 'new body' })
    const updated = await getPoem(poem.id)

    expect(updated?.body).toBe('new body')
    expect(updated?.createdAt).toBe(poem.createdAt)
    expect(updated?.modifiedAt).toBeGreaterThan(originalModifiedAt)
  })

  it('deletes a poem', async () => {
    const poem = await createPoem('Gone')
    await deletePoem(poem.id)
    const fetched = await getPoem(poem.id)
    expect(fetched).toBeNull()
  })

  it('deleting a non-existent poem does not throw', async () => {
    await expect(deletePoem('does-not-exist')).resolves.not.toThrow()
  })
})
