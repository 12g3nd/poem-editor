import { db } from '@/db/schema'
import { createSnapshot, getSnapshot } from '@/db/snapshots'
import type { Story } from '@/types/story'

export async function createStory(title = 'Untitled'): Promise<Story> {
  const now = Date.now()
  const story: Story = {
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
  await db.stories.add(story)
  return story
}

export async function getStory(id: string): Promise<Story | null> {
  const story = await db.stories.get(id)
  return story ?? null
}

export function listStories(): Promise<Story[]> {
  return db.stories.orderBy('modifiedAt').reverse().toArray()
}

export async function updateStory(
  id: string,
  changes: Partial<Omit<Story, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.stories.update(id, { ...changes, modifiedAt: Date.now() })
}

export async function deleteStory(id: string): Promise<void> {
  await db.stories.delete(id)
}

/**
 * Restores a story to a prior snapshot. Mirrors restoreSnapshot in
 * db/snapshots.ts (which is poem-only, since it looks the current document
 * up via getPoem/updatePoem) — snapshots themselves are shared with poems
 * (see db/snapshots.ts, whose `poemId` field is reused as a plain document
 * id for stories too), only the restore target lookup differs here.
 */
export async function restoreStorySnapshot(snapshotId: string): Promise<void> {
  const snapshot = await getSnapshot(snapshotId)
  if (!snapshot) return

  const current = await getStory(snapshot.poemId)
  if (current) {
    await createSnapshot(current.id, current.title, current.body, 'Before restore')
  }

  await updateStory(snapshot.poemId, { title: snapshot.title, body: snapshot.body })
}
