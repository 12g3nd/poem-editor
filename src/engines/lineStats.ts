import { countSyllables } from '@/engines/syllables'
import { extractWords } from '@/engines/normalize'
import type { DictionaryIndex } from '@/engines/dictionary'
import type { OverrideIndex } from '@/types/override'

export function splitLines(body: string): string[] {
  return body.split('\n')
}

function isBlank(line: string): boolean {
  return line.trim().length === 0
}

/** Total syllable count across every word in a single line. */
export function countLineSyllables(line: string, dict: DictionaryIndex, overrides?: OverrideIndex): number {
  return extractWords(line).reduce((sum, word) => sum + countSyllables(word, dict, overrides), 0)
}

/** Non-blank lines only — blank lines are stanza separators, not verse lines. */
export function countLines(body: string): number {
  return splitLines(body).filter((line) => !isBlank(line)).length
}

/** A stanza is a maximal run of consecutive non-blank lines. */
export function countStanzas(body: string): number {
  let stanzas = 0
  let inStanza = false
  for (const line of splitLines(body)) {
    if (isBlank(line)) {
      inStanza = false
    } else if (!inStanza) {
      stanzas++
      inStanza = true
    }
  }
  return stanzas
}

export function countWords(body: string): number {
  const trimmed = body.trim()
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
}
