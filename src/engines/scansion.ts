import type { DictionaryIndex } from '@/engines/dictionary'
import type { OverrideIndex } from '@/types/override'
import { getStressPattern } from '@/engines/stress'
import { countSyllables } from '@/engines/syllables'
import { isFunctionWord } from '@/engines/functionWords'
import { tokenizeLineWithSpans } from '@/engines/normalize'

export interface ScansionSyllable {
  word: string
  wordStart: number
  wordEnd: number
  syllableIndexInWord: number
  syllableCountInWord: number
  /** 1 = stressed (primary or secondary CMU stress), 0 = unstressed. */
  stress: 0 | 1
  /** True when a monosyllabic function word's CMU stress was overridden to
   * unstressed (see functionWords.ts). */
  demoted: boolean
  /** True when the word's stress couldn't be determined at all (unknown,
   * un-decomposable word) — displayed as unstressed but flagged as such. */
  unknown: boolean
}

/**
 * Per-syllable scansion for a line: dictionary stress for each syllable of
 * each word, with monosyllabic function words demoted to unstressed (see
 * functionWords.ts for why). This is the raw material meter detection and
 * the scansion overlay both build on.
 */
export function scanLine(line: string, dict: DictionaryIndex, overrides?: OverrideIndex): ScansionSyllable[] {
  const result: ScansionSyllable[] = []

  for (const { word, start, end } of tokenizeLineWithSpans(line)) {
    const pattern = getStressPattern(word, dict, overrides)

    if (pattern === null) {
      const count = countSyllables(word, dict, overrides)
      for (let i = 0; i < count; i++) {
        result.push({
          word,
          wordStart: start,
          wordEnd: end,
          syllableIndexInWord: i,
          syllableCountInWord: count,
          stress: 0,
          demoted: false,
          unknown: true,
        })
      }
      continue
    }

    const demotable = pattern.length === 1 && pattern === '1' && isFunctionWord(word)

    for (let i = 0; i < pattern.length; i++) {
      const rawStress: 0 | 1 = pattern[i] === '0' ? 0 : 1
      const stress: 0 | 1 = demotable ? 0 : rawStress
      result.push({
        word,
        wordStart: start,
        wordEnd: end,
        syllableIndexInWord: i,
        syllableCountInWord: pattern.length,
        stress,
        demoted: demotable && rawStress === 1,
        unknown: false,
      })
    }
  }

  return result
}

/** Just the stress bits, in order — what meter detection compares against
 * ideal foot patterns. */
export function stressSequence(syllables: ScansionSyllable[]): (0 | 1)[] {
  return syllables.map((s) => s.stress)
}

/** Applies a poet's manual per-syllable stress corrections (keyed by
 * position in this line's flat syllable array) on top of the computed
 * scansion — a poem-specific override, distinct from the word-level
 * dictionary overrides from Phase 2. */
export function applyScansionOverrides(
  syllables: ScansionSyllable[],
  overrides: Map<number, 0 | 1>,
): ScansionSyllable[] {
  if (overrides.size === 0) return syllables
  return syllables.map((syllable, index) => {
    const override = overrides.get(index)
    return override === undefined ? syllable : { ...syllable, stress: override }
  })
}
