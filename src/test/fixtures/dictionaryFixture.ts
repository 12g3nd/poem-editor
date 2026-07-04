import { buildDictionaryIndex, type DictionaryTuple } from '@/engines/dictionary'

/**
 * A small, hand-verified subset of real CMU Pronouncing Dictionary entries
 * (phonemes/stress copied from actual cmudict.dict output), covering the
 * cases the engine tests exercise: perfect and slant rhyme pairs, an
 * ambiguous multi-pronunciation word ("fire", kept at its primary/most-
 * common pronunciation), a contraction, and words for hyphenated-compound
 * decomposition.
 */
const FIXTURE_TUPLES: DictionaryTuple[] = [
  ['cat', 'K AE1 T', '1', 'AE T'],
  ['day', 'D EY1', '1', 'EY'],
  ['way', 'W EY1', '1', 'EY'],
  ['say', 'S EY1', '1', 'EY'],
  ['light', 'L AY1 T', '1', 'AY T'],
  ['write', 'R AY1 T', '1', 'AY T'],
  ['shape', 'SH EY1 P', '1', 'EY P'],
  ['keep', 'K IY1 P', '1', 'IY P'],
  ['moon', 'M UW1 N', '1', 'UW N'],
  ['june', 'JH UW1 N', '1', 'UW N'],
  ['stone', 'S T OW1 N', '1', 'OW N'],
  ['fire', 'F AY1 ER0', '10', 'AY ER'],
  ['hour', 'AW1 ER0', '10', 'AW ER'],
  ['every', 'EH1 V ER0 IY0', '100', 'EH V ER IY'],
  ['table', 'T EY1 B AH0 L', '10', 'EY B AH L'],
  ["don't", 'D OW1 N T', '1', 'OW N T'],
  ['well', 'W EH1 L', '1', 'EH L'],
  ['known', 'N OW1 N', '1', 'OW N'],
  ['able-bodied', 'EY1 B AH0 L B AA1 D IY0 D', '1010', 'AA D IY D'],
  // Function words — CMU's *primary* pronunciation for these happens to
  // carry stress (unlike "a", "and", "the", "in", whose primary forms are
  // already the reduced/unstressed vowel), making them the real-world case
  // the scansion demotion heuristic exists for.
  ['to', 'T UW1', '1', 'UW'],
  ['of', 'AH1 V', '1', 'AH V'],
  ['is', 'IH1 Z', '1', 'IH Z'],
]

export function createFixtureDictionary() {
  return buildDictionaryIndex(FIXTURE_TUPLES)
}
