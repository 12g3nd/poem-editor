import type { DictionaryIndex } from '@/engines/dictionary'

function stripStress(phoneme: string): string {
  return phoneme.replace(/[0-2]$/, '')
}

function isVowel(phoneme: string): boolean {
  return /[0-2]$/.test(phoneme)
}

/** Consonant phonemes before the word's first vowel sound. */
function onset(phonemes: string[]): string {
  const idx = phonemes.findIndex(isVowel)
  const end = idx === -1 ? phonemes.length : idx
  return phonemes.slice(0, end).join(' ')
}

/** The word's primary-stressed vowel, stress-stripped. */
function stressedVowel(phonemes: string[]): string | null {
  const vowel = phonemes.find((p) => /1$/.test(p))
  return vowel ? stripStress(vowel) : null
}

function consonantSet(phonemes: string[]): Set<string> {
  return new Set(phonemes.filter((p) => !isVowel(p)))
}

function entries(a: string, b: string, dict: DictionaryIndex) {
  if (a.toLowerCase() === b.toLowerCase()) return null
  const entryA = dict.get(a.toLowerCase())
  const entryB = dict.get(b.toLowerCase())
  if (!entryA || !entryB) return null
  return { entryA, entryB }
}

/** Shared initial sound: "sing" and "sun" both open with an S onset. */
export function isAlliteration(a: string, b: string, dict: DictionaryIndex): boolean {
  const pair = entries(a, b, dict)
  if (!pair) return false
  const onsetA = onset(pair.entryA.phonemes)
  const onsetB = onset(pair.entryB.phonemes)
  return onsetA.length > 0 && onsetA === onsetB
}

/** Shared stressed vowel sound: "light" and "mind" both carry an AY vowel. */
export function isAssonance(a: string, b: string, dict: DictionaryIndex): boolean {
  const pair = entries(a, b, dict)
  if (!pair) return false
  const vowelA = stressedVowel(pair.entryA.phonemes)
  const vowelB = stressedVowel(pair.entryB.phonemes)
  return vowelA !== null && vowelA === vowelB
}

/** Shared consonant sound that isn't purely a shared onset (that's
 * alliteration): "light" and "stone" both carry a T. */
export function isConsonance(a: string, b: string, dict: DictionaryIndex): boolean {
  const pair = entries(a, b, dict)
  if (!pair) return false
  if (isAlliteration(a, b, dict)) return false
  const consonantsA = consonantSet(pair.entryA.phonemes)
  for (const consonant of consonantSet(pair.entryB.phonemes)) {
    if (consonantsA.has(consonant)) return true
  }
  return false
}

export interface SoundMatches {
  alliteration: string[]
  assonance: string[]
  consonance: string[]
}

/** Finds sound-device matches for `word` among `candidates` — meant to be
 * called with the poem's own vocabulary, not the whole dictionary. */
export function findSoundMatches(word: string, candidates: Iterable<string>, dict: DictionaryIndex): SoundMatches {
  const alliteration: string[] = []
  const assonance: string[] = []
  const consonance: string[] = []

  for (const candidate of candidates) {
    if (candidate.toLowerCase() === word.toLowerCase()) continue
    if (isAlliteration(word, candidate, dict)) alliteration.push(candidate)
    if (isAssonance(word, candidate, dict)) assonance.push(candidate)
    if (isConsonance(word, candidate, dict)) consonance.push(candidate)
  }

  return { alliteration, assonance, consonance }
}
