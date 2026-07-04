import { isPerfectRhyme, isSlantRhyme } from '@/engines/rhyme'
import { lastWord } from '@/engines/normalize'
import { splitLines } from '@/engines/lineStats'
import type { DictionaryIndex } from '@/engines/dictionary'

export interface LineRhyme {
  /** "" for a blank (stanza-break) line. */
  label: string
  /** True when this line only slant-rhymes with its group — displayed as label + "′". */
  variant: boolean
  endWord: string | null
}

/** Spreadsheet-style column labels so a poem with more than 26 rhyme groups
 * still gets a distinct label per group: A, B, ..., Z, AA, AB, ... */
function indexToLabel(index: number): string {
  let n = index
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

/**
 * Assigns a rhyme-scheme label to each line from its end word, in reading
 * order. A line perfectly rhyming with an earlier line's end word shares
 * that line's letter; a line only slant-rhyming with one gets the same
 * letter marked as a variant (e.g. "A′"). Each line is only ever compared
 * against the *first* end word that established a group — not every word
 * that has since joined it — so rhyme relationships don't chain into groups
 * that don't actually sound alike (A rhymes B, B slant-rhymes C, C should
 * not therefore get grouped with A).
 */
export function computeRhymeScheme(body: string, dict: DictionaryIndex): LineRhyme[] {
  const groups: { label: string; representative: string }[] = []
  const results: LineRhyme[] = []

  for (const line of splitLines(body)) {
    const word = lastWord(line)
    if (!word) {
      results.push({ label: '', variant: false, endWord: null })
      continue
    }

    let perfectMatch: { label: string } | null = null
    let slantMatch: { label: string } | null = null

    for (const group of groups) {
      // isPerfectRhyme deliberately excludes identical words (a word doesn't
      // "rhyme with itself" when looking up rhymes for it), but a literal
      // repeated end word — common in refrains, villanelles, pantoums — must
      // still join its earlier group here rather than starting a new one.
      if (word.toLowerCase() === group.representative.toLowerCase() || isPerfectRhyme(word, group.representative, dict)) {
        perfectMatch = group
        break
      }
      if (!slantMatch && isSlantRhyme(word, group.representative, dict)) {
        slantMatch = group
      }
    }

    if (perfectMatch) {
      results.push({ label: perfectMatch.label, variant: false, endWord: word })
    } else if (slantMatch) {
      results.push({ label: slantMatch.label, variant: true, endWord: word })
    } else {
      const label = indexToLabel(groups.length)
      groups.push({ label, representative: word })
      results.push({ label, variant: false, endWord: word })
    }
  }

  return results
}

export function formatRhymeLabel(line: LineRhyme): string {
  if (!line.label) return ''
  return line.variant ? `${line.label}′` : line.label
}

/** Applies user-pinned label overrides on top of the computed scheme,
 * keyed by line index. Pins are a display-only override — they don't
 * retrain how other lines get grouped. */
export function applyRhymeOverrides(scheme: LineRhyme[], overrides: Map<number, string>): LineRhyme[] {
  return scheme.map((line, index) => {
    const override = overrides.get(index)
    if (override === undefined) return line
    return { ...line, label: override, variant: false }
  })
}
