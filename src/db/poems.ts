import { db } from '@/db/schema'
import type { Poem } from '@/types/poem'

export async function createPoem(title = 'Untitled'): Promise<Poem> {
  const now = Date.now()
  const poem: Poem = {
    id: crypto.randomUUID(),
    title,
    body: '',
    createdAt: now,
    modifiedAt: now,
    status: 'draft',
    favorite: false,
    tags: [],
    collectionIds: [],
  }
  await db.poems.add(poem)
  return poem
}

export async function getPoem(id: string): Promise<Poem | null> {
  const poem = await db.poems.get(id)
  return poem ?? null
}

export function listPoems(): Promise<Poem[]> {
  return db.poems.orderBy('modifiedAt').reverse().toArray()
}

export async function updatePoem(
  id: string,
  changes: Partial<Omit<Poem, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.poems.update(id, { ...changes, modifiedAt: Date.now() })
}

export async function deletePoem(id: string): Promise<void> {
  await db.poems.delete(id)
}
