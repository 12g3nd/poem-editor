import type { DictionaryIndex } from '@/engines/dictionary'
import type { OverrideIndex } from '@/types/override'

/**
 * Best-effort syllable count for words the dictionary doesn't know (proper
 * nouns, slang, coinages): count vowel groups, then apply the two most
 * common English corrections (silent trailing "e", rarely-syllabic "-ed").
 * This is necessarily approximate — real words should resolve via the CMU
 * dictionary lookup in countSyllables, and a poet can always correct a
 * specific miss with a manual override.
 */
export function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/'/g, '')
  if (w.length === 0) return 0
  if (w.length <= 3) return 1

  let count = 0
  let prevWasVowel = false
  for (const ch of w) {
    const isVowel = /[aeiouy]/.test(ch)
    if (isVowel && !prevWasVowel) count++
    prevWasVowel = isVowel
  }

  // Silent trailing "e" ("make", "hope") isn't its own syllable — unless
  // it's a "-le" ending after a consonant ("table", "little"), which is.
  if (w.endsWith('e') && !w.endsWith('le')) {
    count--
  }

  // "-ed" is rarely its own syllable ("walked", "hoped") except after a
  // "t"/"d" sound ("wanted", "needed").
  if (w.endsWith('ed') && !/[td]ed$/.test(w) && count > 1) {
    count--
  }

  return Math.max(1, count)
}

/**
 * Syllable count for a word, in priority order: manual override, dictionary
 * lookup, hyphenated-compound decomposition ("well-known" = "well" + "known"),
 * then the heuristic estimator.
 */
export function countSyllables(word: string, dict: DictionaryIndex, overrides?: OverrideIndex): number {
  const normalized = word.toLowerCase()

  const override = overrides?.get(normalized)?.syllables
  if (override !== undefined) return override

  const entry = dict.get(normalized)
  if (entry) return entry.stress.length

  if (normalized.includes('-')) {
    const parts = normalized.split('-').filter((part) => part.length > 0)
    if (parts.length > 1) {
      return parts.reduce((sum, part) => sum + countSyllables(part, dict, overrides), 0)
    }
  }

  return estimateSyllables(normalized)
}
