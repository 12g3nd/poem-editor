/**
 * Splits a word's characters into `syllableCount` roughly-even chunks, for
 * positioning a stress mark over each syllable in the scansion overlay.
 * This is a purely visual approximation — English syllable boundaries don't
 * actually fall at even character counts (e.g. "temperate" is tem-per-ate,
 * not evenly thirds) — but the underlying stress *data* is correct either
 * way; only the on-screen letter-grouping is approximate.
 */
export function splitWordIntoSyllableChunks(word: string, syllableCount: number): string[] {
  if (word.length === 0) return []

  const count = Math.max(1, Math.min(syllableCount, word.length))
  if (count === 1) return [word]

  const base = Math.floor(word.length / count)
  const remainder = word.length % count

  const chunks: string[] = []
  let pos = 0
  for (let i = 0; i < count; i++) {
    const len = base + (i < remainder ? 1 : 0)
    chunks.push(word.slice(pos, pos + len))
    pos += len
  }
  return chunks
}
