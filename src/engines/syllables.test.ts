import { describe, it, expect } from 'vitest'
import { countSyllables, estimateSyllables } from '@/engines/syllables'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'
import type { OverrideIndex } from '@/types/override'

const dict = createFixtureDictionary()

describe('countSyllables', () => {
  it('counts a simple monosyllabic word from the dictionary', () => {
    expect(countSyllables('cat', dict)).toBe(1)
  })

  it('uses the dictionary primary pronunciation for an ambiguous word', () => {
    // "fire" has both a 2-syllable (primary) and 1-syllable pronunciation in
    // CMU dict; the build pipeline keeps the primary one.
    expect(countSyllables('fire', dict)).toBe(2)
    expect(countSyllables('hour', dict)).toBe(2)
    expect(countSyllables('every', dict)).toBe(3)
  })

  it('handles a contraction as a single dictionary lookup', () => {
    expect(countSyllables("don't", dict)).toBe(1)
  })

  it('is case-insensitive', () => {
    expect(countSyllables('CAT', dict)).toBe(1)
    expect(countSyllables('Fire', dict)).toBe(2)
  })

  it('decomposes a hyphenated compound not found as a whole word', () => {
    // "well-known" itself isn't in the fixture, but "well" and "known" are.
    expect(countSyllables('well-known', dict)).toBe(2)
  })

  it('prefers a whole-word dictionary hit over hyphen decomposition', () => {
    expect(countSyllables('able-bodied', dict)).toBe(4)
  })

  it('falls back to the heuristic estimator for an unknown word', () => {
    const count = countSyllables('xanthrelle', dict)
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('lets a manual override win over the dictionary', () => {
    const overrides: OverrideIndex = new Map([['fire', { word: 'fire', syllables: 1 }]])
    expect(countSyllables('fire', dict, overrides)).toBe(1)
  })

  it('lets a manual override win for a completely unknown word', () => {
    const overrides: OverrideIndex = new Map([['zborf', { word: 'zborf', syllables: 1 }]])
    expect(countSyllables('zborf', dict, overrides)).toBe(1)
  })

  it('handles a one-word input without crashing', () => {
    expect(countSyllables('cat', dict)).toBe(1)
  })
})

describe('estimateSyllables (heuristic fallback)', () => {
  it('drops a silent trailing e', () => {
    expect(estimateSyllables('make')).toBe(1)
    expect(estimateSyllables('hope')).toBe(1)
  })

  it('keeps the syllable in a consonant + "-le" ending', () => {
    expect(estimateSyllables('table')).toBe(2)
    expect(estimateSyllables('little')).toBe(2)
    expect(estimateSyllables('apple')).toBe(2)
  })

  it('does not add a syllable for a regular "-ed" past tense', () => {
    expect(estimateSyllables('jumped')).toBe(1)
    expect(estimateSyllables('played')).toBe(1)
  })

  it('keeps the syllable for "-ed" after a t/d sound', () => {
    expect(estimateSyllables('wanted')).toBe(2)
    expect(estimateSyllables('needed')).toBe(2)
  })

  it('never returns fewer than 1 syllable', () => {
    expect(estimateSyllables('')).toBe(0)
    expect(estimateSyllables('a')).toBeGreaterThanOrEqual(1)
    expect(estimateSyllables('the')).toBeGreaterThanOrEqual(1)
  })
})
