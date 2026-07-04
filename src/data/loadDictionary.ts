import { buildDictionaryIndex, type DictionaryIndex, type DictionaryTuple } from '@/engines/dictionary'

let cached: Promise<DictionaryIndex> | null = null

/**
 * Fetches the bundled CMU dictionary (public/data/dictionary.json, ~1.4MB
 * gzipped) and builds the in-memory lookup index. Fetched once per session
 * and cached — this is a same-origin static asset, not a network dependency,
 * so it works fully offline once the app itself has loaded.
 */
export function loadDictionary(): Promise<DictionaryIndex> {
  if (!cached) {
    cached = fetch('/data/dictionary.json')
      .then((res) => res.json() as Promise<DictionaryTuple[]>)
      .then(buildDictionaryIndex)
  }
  return cached
}
