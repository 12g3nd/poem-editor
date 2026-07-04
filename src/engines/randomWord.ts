import type { DictionaryIndex } from '@/engines/dictionary'

/** Picks a random headword from the bundled dictionary, skipping the
 * previous pick so repeated clicks always surface something new. */
export function randomWord(words: string[], excluding?: string): string | null {
  if (words.length === 0) return null
  if (words.length === 1) return words[0]
  let next = words[Math.floor(Math.random() * words.length)]
  while (next === excluding) {
    next = words[Math.floor(Math.random() * words.length)]
  }
  return next
}

export function dictionaryWordList(dict: DictionaryIndex): string[] {
  return Array.from(dict.keys())
}
