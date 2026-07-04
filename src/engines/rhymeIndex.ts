import type { DictionaryIndex } from '@/engines/dictionary'
import { finalVowel, finalCoda, type RhymeMatches } from '@/engines/rhyme'

export interface RhymeIndex {
  byRhymeKey: Map<string, string[]>
  byFinalVowel: Map<string, string[]>
  byFinalCoda: Map<string, string[]>
}

function addTo(map: Map<string, string[]>, key: string, word: string) {
  const list = map.get(key)
  if (list) {
    list.push(word)
  } else {
    map.set(key, [word])
  }
}

/** Reverse indices over the whole dictionary, built once when it loads, so
 * "find every word that rhymes with X" is a couple of Map lookups instead of
 * a 126k-word scan on every keystroke. */
export function buildRhymeIndex(dict: DictionaryIndex): RhymeIndex {
  const byRhymeKey = new Map<string, string[]>()
  const byFinalVowel = new Map<string, string[]>()
  const byFinalCoda = new Map<string, string[]>()

  for (const entry of dict.values()) {
    if (entry.rhymeKey) addTo(byRhymeKey, entry.rhymeKey, entry.word)

    const vowel = finalVowel(entry.phonemes)
    if (vowel) addTo(byFinalVowel, vowel, entry.word)

    addTo(byFinalCoda, finalCoda(entry.phonemes), entry.word)
  }

  return { byRhymeKey, byFinalVowel, byFinalCoda }
}

/** Caps how many matches are ever computed/returned. A word ending in a
 * common sound (e.g. any word ending in a bare vowel has coda "") can share
 * a final vowel or coda with several thousand other dictionary entries —
 * with no limit, that both floods the UI and is expensive to render. */
const MAX_MATCHES = 60

/** Perfect and slant rhymes for `word` across the whole dictionary, using
 * the precomputed index rather than scanning every entry. Results are
 * capped at MAX_MATCHES per category (see above). */
export function findRhymesIndexed(word: string, dict: DictionaryIndex, index: RhymeIndex): RhymeMatches {
  const normalized = word.toLowerCase()
  const entry = dict.get(normalized)
  if (!entry) return { perfect: [], slant: [] }

  const perfect = entry.rhymeKey
    ? (index.byRhymeKey.get(entry.rhymeKey) ?? []).filter((w) => w !== normalized)
    : []

  const vowel = finalVowel(entry.phonemes)
  const coda = finalCoda(entry.phonemes)
  const vowelBucket = vowel ? (index.byFinalVowel.get(vowel) ?? []) : []
  const codaBucket = index.byFinalCoda.get(coda) ?? []

  const slant: string[] = []
  const seen = new Set<string>([normalized, ...perfect])
  for (const candidate of vowelBucket.length <= codaBucket.length ? [...vowelBucket, ...codaBucket] : [...codaBucket, ...vowelBucket]) {
    if (slant.length >= MAX_MATCHES) break
    if (seen.has(candidate)) continue
    seen.add(candidate)
    slant.push(candidate)
  }

  return { perfect: perfect.slice(0, MAX_MATCHES), slant }
}
