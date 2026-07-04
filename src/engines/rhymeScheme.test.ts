import { describe, it, expect } from 'vitest'
import { computeRhymeScheme, formatRhymeLabel, applyRhymeOverrides } from '@/engines/rhymeScheme'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

function labels(body: string): string[] {
  return computeRhymeScheme(body, dict).map(formatRhymeLabel)
}

describe('computeRhymeScheme', () => {
  it('detects an ABAB scheme', () => {
    const body = ['end in day', 'end in light', 'end in way', 'end in write'].join('\n')
    expect(labels(body)).toEqual(['A', 'B', 'A', 'B'])
  })

  it('detects a couplet (AABB) scheme', () => {
    const body = ['one day', 'two way', 'three light', 'four write'].join('\n')
    expect(labels(body)).toEqual(['A', 'A', 'B', 'B'])
  })

  it('marks a slant-only match with a prime variant', () => {
    // "stone" only slant-rhymes with "moon" (shared final "N"), not a perfect rhyme.
    const body = ['a moon', 'a stone'].join('\n')
    expect(labels(body)).toEqual(['A', 'A′'])
  })

  it('gives each unrelated end word its own new letter', () => {
    const body = ['a cat', 'a moon', 'a table'].join('\n')
    expect(labels(body)).toEqual(['A', 'B', 'C'])
  })

  it('leaves blank stanza-break lines unlabeled', () => {
    const body = ['a day', '', 'a way'].join('\n')
    const scheme = computeRhymeScheme(body, dict)
    expect(scheme[1].label).toBe('')
    expect(scheme[1].endWord).toBeNull()
    expect(labels(body)).toEqual(['A', '', 'A'])
  })

  it('gives an unknown end word its own letter rather than guessing a match', () => {
    const body = ['a day', 'a xanthrelle'].join('\n')
    expect(labels(body)).toEqual(['A', 'B'])
  })

  it('keeps a later perfect match against the group representative non-variant, even after an intervening slant line', () => {
    // "moon" establishes group A. "stone" only slant-rhymes with "moon"
    // (shared final "N") and joins as "A′". "june" perfectly rhymes with
    // the group's original representative "moon" and must resolve to
    // plain "A" — not inherit the "′" from the line in between.
    const body = ['a moon', 'a stone', 'a june'].join('\n')
    expect(labels(body)).toEqual(['A', 'A′', 'A'])
  })

  it('joins a literal repeated end word to its earlier group non-variant, not a fresh letter', () => {
    // isPerfectRhyme deliberately treats identical words as not "rhyming"
    // with themselves (so word-lookup features don't suggest a word rhymes
    // with itself) — but a refrain repeating the same end word verbatim
    // must still land in the same rhyme-scheme group, not start a new one.
    const body = ['a moon', 'a stone', 'a moon'].join('\n')
    expect(labels(body)).toEqual(['A', 'A′', 'A'])
  })

  it('wraps past 26 groups using AA-style labels', () => {
    // 27 lines, each ending in a distinct, mutually non-rhyming fixture word
    // is impractical with a tiny fixture, so exercise the label formatter
    // directly for the cases that matter: 26th and 27th groups. Word
    // normalization strips trailing digits, so a numeric suffix (xanthrelle0,
    // xanthrelle1, ...) wouldn't actually vary the word — use a lowercase
    // letter suffix instead so each of the 27 end words is genuinely distinct.
    function distinctWord(i: number): string {
      let n = i
      let suffix = ''
      do {
        suffix = String.fromCharCode(97 + (n % 26)) + suffix
        n = Math.floor(n / 26) - 1
      } while (n >= 0)
      return `xanthrelle${suffix}`
    }
    const body = Array.from({ length: 27 }, (_, i) => `line ${i} ${distinctWord(i)}`).join('\n')
    const scheme = computeRhymeScheme(body, dict)
    expect(scheme[25].label).toBe('Z')
    expect(scheme[26].label).toBe('AA')
  })
})

describe('applyRhymeOverrides', () => {
  it('replaces the label for a pinned line without touching others', () => {
    const body = ['a day', 'a moon'].join('\n')
    const scheme = computeRhymeScheme(body, dict)
    const overridden = applyRhymeOverrides(scheme, new Map([[1, 'A']]))
    expect(overridden[0].label).toBe('A')
    expect(overridden[1].label).toBe('A')
    expect(overridden[1].variant).toBe(false)
  })
})
