import { db } from '@/db/schema'
import type { Collection } from '@/types/collection'

export async function createCollection(name: string): Promise<Collection> {
  const collection: Collection = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
  }
  await db.collections.add(collection)
  return collection
}

export function listCollections(): Promise<Collection[]> {
  return db.collections.orderBy('name').toArray()
}

export async function renameCollection(id: string, name: string): Promise<void> {
  await db.collections.update(id, { name })
}

/** Deletes a collection and removes it from every poem that referenced it —
 * poems themselves are never deleted. */
export async function deleteCollection(id: string): Promise<void> {
  await db.transaction('rw', db.collections, db.poems, async () => {
    await db.collections.delete(id)
    const affected = await db.poems.where('collectionIds').equals(id).toArray()
    for (const poem of affected) {
      await db.poems.update(poem.id, {
        collectionIds: (poem.collectionIds ?? []).filter((c) => c !== id),
      })
    }
  })
}
