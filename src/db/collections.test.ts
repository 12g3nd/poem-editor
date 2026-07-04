import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { createCollection, listCollections, renameCollection, deleteCollection } from '@/db/collections'
import { createPoem, getPoem, updatePoem } from '@/db/poems'

beforeEach(async () => {
  await db.collections.clear()
  await db.poems.clear()
})

describe('collections storage', () => {
  it('creates a collection', async () => {
    const collection = await createCollection('Sonnets')
    expect(collection.name).toBe('Sonnets')
    expect(collection.id).toBeTruthy()
  })

  it('lists collections alphabetically by name', async () => {
    await createCollection('Zebra')
    await createCollection('Apple')
    const list = await listCollections()
    expect(list.map((c) => c.name)).toEqual(['Apple', 'Zebra'])
  })

  it('renames a collection', async () => {
    const collection = await createCollection('Old Name')
    await renameCollection(collection.id, 'New Name')
    const list = await listCollections()
    expect(list[0].name).toBe('New Name')
  })

  it('deletes a collection and removes it from any poem referencing it', async () => {
    const collection = await createCollection('Sonnets')
    const poem = await createPoem('A Sonnet')
    await updatePoem(poem.id, { collectionIds: [collection.id] })

    await deleteCollection(collection.id)

    const list = await listCollections()
    expect(list).toHaveLength(0)
    const updatedPoem = await getPoem(poem.id)
    expect(updatedPoem?.collectionIds).toEqual([])
  })

  it('deleting a collection does not delete poems that reference it', async () => {
    const collection = await createCollection('Sonnets')
    const poem = await createPoem('A Sonnet')
    await updatePoem(poem.id, { collectionIds: [collection.id] })

    await deleteCollection(collection.id)

    const stillThere = await getPoem(poem.id)
    expect(stillThere).not.toBeNull()
  })

  it('leaves other collection references on a poem intact when one collection is deleted', async () => {
    const keep = await createCollection('Keep')
    const remove = await createCollection('Remove')
    const poem = await createPoem('Poem')
    await updatePoem(poem.id, { collectionIds: [keep.id, remove.id] })

    await deleteCollection(remove.id)

    const updated = await getPoem(poem.id)
    expect(updated?.collectionIds).toEqual([keep.id])
  })
})
