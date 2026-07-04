import type { DictionaryIndex } from '@/engines/dictionary'

function stripStress(phoneme: string): string {
  return phoneme.replace(/[0-2]$/, '')
}

/** Rhyme key: phonemes from the last primary-stressed vowel to the end
 * (dictionary-precomputed — see scripts/build-dictionary.mjs). Two words
 * are a perfect rhyme when their keys match. */
export function getRhymeKey(word: string, dict: DictionaryIndex): string | null {
  return dict.get(word.toLowerCase())?.rhymeKey ?? null
}

/** The last vowel sound in the word (stress-stripped), regardless of stress. */
export function finalVowel(phonemes: string[]): string | null {
  for (let i = phonemes.length - 1; i >= 0; i--) {
    if (/[0-2]$/.test(phonemes[i])) return stripStress(phonemes[i])
  }
  return null
}

/** The consonant cluster after the last vowel sound ("" if the word ends in
 * a vowel). */
export function finalCoda(phonemes: string[]): string {
  const idx = phonemes.findLastIndex((phoneme) => /[0-2]$/.test(phoneme))
  return phonemes
    .slice(idx + 1)
    .map(stripStress)
    .join(' ')
}

/** Perfect rhyme: matching rhyme keys (same sound from the last stressed
 * vowel onward), for two distinct words. */
export function isPerfectRhyme(a: string, b: string, dict: DictionaryIndex): boolean {
  if (a.toLowerCase() === b.toLowerCase()) return false
  const keyA = getRhymeKey(a, dict)
  const keyB = getRhymeKey(b, dict)
  return keyA !== null && keyA === keyB
}

/** Slant rhyme: not a perfect rhyme, but sharing either the final vowel
 * sound ("moon"/"June" would be perfect, but "moon"/"stone" share nothing —
 * example of a real slant pair: "shape"/"keep" share no vowel but a final
 * consonant; "worm"/"perch" share their final vowel). Documented definition
 * per the spec: shared final vowel sound OR shared final consonant cluster. */
export function isSlantRhyme(a: string, b: string, dict: DictionaryIndex): boolean {
  if (isPerfectRhyme(a, b, dict)) return false
  if (a.toLowerCase() === b.toLowerCase()) return false

  const entryA = dict.get(a.toLowerCase())
  const entryB = dict.get(b.toLowerCase())
  if (!entryA || !entryB) return false

  const vowelA = finalVowel(entryA.phonemes)
  const vowelB = finalVowel(entryB.phonemes)
  const sameFinalVowel = vowelA !== null && vowelA === vowelB

  const sameCoda = finalCoda(entryA.phonemes) === finalCoda(entryB.phonemes)

  return sameFinalVowel || sameCoda
}

export interface RhymeMatches {
  perfect: string[]
  slant: string[]
}

/** Finds perfect and slant rhymes for `word` among `candidates`. */
export function findRhymes(word: string, candidates: Iterable<string>, dict: DictionaryIndex): RhymeMatches {
  const perfect: string[] = []
  const slant: string[] = []

  for (const candidate of candidates) {
    if (candidate.toLowerCase() === word.toLowerCase()) continue
    if (isPerfectRhyme(word, candidate, dict)) {
      perfect.push(candidate)
    } else if (isSlantRhyme(word, candidate, dict)) {
      slant.push(candidate)
    }
  }

  return { perfect, slant }
}
