import { describe, it, expect } from 'vitest'
import { isAlliteration, isAssonance, isConsonance, findSoundMatches } from '@/engines/soundTools'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

describe('isAlliteration', () => {
  it('matches words sharing an initial consonant sound', () => {
    expect(isAlliteration('cat', 'keep', dict)).toBe(true)
    expect(isAlliteration('day', "don't", dict)).toBe(true)
  })

  it('rejects words with different onsets', () => {
    expect(isAlliteration('cat', 'day', dict)).toBe(false)
  })

  it('does not count a word as alliterating with itself', () => {
    expect(isAlliteration('cat', 'cat', dict)).toBe(false)
  })

  it('returns false when either word is unknown', () => {
    expect(isAlliteration('cat', 'xanthrelle', dict)).toBe(false)
  })
})

describe('isAssonance', () => {
  it('matches words sharing a stressed vowel sound, independent of rhyme', () => {
    // "day" and "table" both carry the EY vowel but don't rhyme.
    expect(isAssonance('day', 'table', dict)).toBe(true)
  })

  it('also matches an actual rhyme pair (they share the stressed vowel too)', () => {
    expect(isAssonance('day', 'way', dict)).toBe(true)
  })

  it('rejects words with different stressed vowels', () => {
    expect(isAssonance('day', 'moon', dict)).toBe(false)
  })
})

describe('isConsonance', () => {
  it('matches words sharing a consonant sound that is not their onset', () => {
    // "light" (L, T) and "stone" (S, T, N) share T; onsets differ (L vs ST).
    expect(isConsonance('light', 'stone', dict)).toBe(true)
  })

  it('does not double-count an alliterative pair as consonance', () => {
    expect(isConsonance('cat', 'keep', dict)).toBe(false)
  })

  it('rejects words sharing no consonants', () => {
    expect(isConsonance('day', 'table', dict)).toBe(false)
  })
})

describe('findSoundMatches', () => {
  it('buckets candidates by sound device and excludes the query word', () => {
    // "light" (L, T) shares a consonant with "cat" (K, T), "table" (T, B, L)
    // and "stone" (S, T, N); "keep" and "day" share nothing with it.
    const candidates = ['cat', 'keep', 'table', 'stone', 'day']
    const result = findSoundMatches('light', candidates, dict)
    expect(result.consonance).toEqual(['cat', 'table', 'stone'])
    expect(result.alliteration).toEqual([])
    expect(result.assonance).toEqual([])
  })
})
