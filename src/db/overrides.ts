import { db } from '@/db/schema'
import type { OverrideIndex, WordOverride } from '@/types/override'

/** Records (or replaces) a poet's correction for a word. Passing only one of
 * `syllables`/`stressPattern` leaves the other field as previously stored. */
export async function setOverride(
  word: string,
  changes: Partial<Omit<WordOverride, 'word'>>,
): Promise<void> {
  const normalized = word.toLowerCase()
  const existing = await db.wordOverrides.get(normalized)
  await db.wordOverrides.put({ ...existing, ...changes, word: normalized })
}

export async function getOverride(word: string): Promise<WordOverride | null> {
  const override = await db.wordOverrides.get(word.toLowerCase())
  return override ?? null
}

export function listOverrides(): Promise<WordOverride[]> {
  return db.wordOverrides.toArray()
}

export async function deleteOverride(word: string): Promise<void> {
  await db.wordOverrides.delete(word.toLowerCase())
}

/** Loads all stored overrides into the Map shape the engines expect. */
export async function loadOverrideIndex(): Promise<OverrideIndex> {
  const overrides = await listOverrides()
  return new Map(overrides.map((override) => [override.word, override]))
}
