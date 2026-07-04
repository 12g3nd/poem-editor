export interface DictionaryEntry {
  word: string
  phonemes: string[]
  /** Stress digits (0 = unstressed, 1 = primary, 2 = secondary), one per syllable. */
  stress: string
  /** Phonemes from the last primary-stressed vowel to the end, stress-stripped. */
  rhymeKey: string | null
}

export type DictionaryIndex = Map<string, DictionaryEntry>

/** [word, phonemes (space-separated), stress digits, rhyme key] — the compact
 * on-disk format produced by scripts/build-dictionary.mjs. */
export type DictionaryTuple = [word: string, phonemes: string, stress: string, rhymeKey: string]

export function buildDictionaryIndex(tuples: DictionaryTuple[]): DictionaryIndex {
  const index: DictionaryIndex = new Map()
  for (const [word, phonemesStr, stress, rhymeKey] of tuples) {
    index.set(word, {
      word,
      phonemes: phonemesStr.split(' '),
      stress,
      rhymeKey: rhymeKey.length > 0 ? rhymeKey : null,
    })
  }
  return index
}
