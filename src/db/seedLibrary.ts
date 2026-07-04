import { db } from '@/db/schema'
import { listPoems } from '@/db/poems'
import { SAMPLE_POEMS } from '@/data/samplePoems'
import type { Poem } from '@/types/poem'

const SEEDED_FLAG = 'sonnet5-seeded'

/** Populates a brand-new, empty library with two public-domain sample
 * poems so first-time users have something to read and explore right
 * away. Runs at most once per browser profile — tracked via a
 * localStorage flag so deliberately clearing the library later doesn't
 * bring the samples back. */
export async function seedLibraryIfNeeded(): Promise<void> {
  if (localStorage.getItem(SEEDED_FLAG)) return
  localStorage.setItem(SEEDED_FLAG, 'true')

  const existing = await listPoems()
  if (existing.length > 0) return

  const now = Date.now()
  const poems: Poem[] = SAMPLE_POEMS.map((sample, index) => ({
    id: crypto.randomUUID(),
    title: sample.title,
    body: sample.body,
    formId: sample.formId ?? null,
    createdAt: now + index,
    modifiedAt: now + index,
    status: 'done',
    favorite: false,
    tags: ['sample'],
    collectionIds: [],
  }))

  await db.poems.bulkAdd(poems)
}
