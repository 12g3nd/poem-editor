import { describe, it, expect } from 'vitest'
import { getRhymeKey, isPerfectRhyme, isSlantRhyme, findRhymes } from '@/engines/rhyme'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

describe('getRhymeKey', () => {
  it('returns the precomputed rhyme key for a known word', () => {
    expect(getRhymeKey('day', dict)).toBe('EY')
    expect(getRhymeKey('light', dict)).toBe('AY T')
  })

  it('returns null for an unknown word', () => {
    expect(getRhymeKey('xanthrelle', dict)).toBeNull()
  })
})

describe('isPerfectRhyme', () => {
  it('matches words with the same rhyme key', () => {
    expect(isPerfectRhyme('day', 'way', dict)).toBe(true)
    expect(isPerfectRhyme('day', 'say', dict)).toBe(true)
    expect(isPerfectRhyme('light', 'write', dict)).toBe(true)
    expect(isPerfectRhyme('moon', 'june', dict)).toBe(true)
  })

  it('rejects words with different rhyme keys', () => {
    expect(isPerfectRhyme('day', 'light', dict)).toBe(false)
    expect(isPerfectRhyme('moon', 'stone', dict)).toBe(false)
  })

  it('does not count a word as rhyming with itself', () => {
    expect(isPerfectRhyme('day', 'day', dict)).toBe(false)
    expect(isPerfectRhyme('Day', 'day', dict)).toBe(false)
  })

  it('returns false when either word is unknown', () => {
    expect(isPerfectRhyme('day', 'xanthrelle', dict)).toBe(false)
  })
})

describe('isSlantRhyme', () => {
  it('matches words sharing only a final consonant cluster', () => {
    // "shape" (EY P) and "keep" (IY P): different vowel, same final "P".
    expect(isSlantRhyme('shape', 'keep', dict)).toBe(true)
    // "moon" (UW N) and "stone" (OW N): different vowel, same final "N".
    expect(isSlantRhyme('moon', 'stone', dict)).toBe(true)
  })

  it('does not double-count a perfect rhyme as a slant rhyme', () => {
    expect(isSlantRhyme('day', 'way', dict)).toBe(false)
  })

  it('rejects words sharing neither final vowel nor final consonant', () => {
    expect(isSlantRhyme('day', 'moon', dict)).toBe(false)
  })

  it('returns false when either word is unknown', () => {
    expect(isSlantRhyme('shape', 'xanthrelle', dict)).toBe(false)
  })
})

describe('findRhymes', () => {
  it('groups candidates into perfect and slant matches', () => {
    const candidates = ['way', 'say', 'light', 'stone', 'keep', 'cat']
    const result = findRhymes('moon', candidates, dict)
    expect(result.perfect).toEqual([])
    expect(result.slant).toEqual(['stone'])
  })

  it('excludes the query word itself from candidates', () => {
    const result = findRhymes('day', ['day', 'way'], dict)
    expect(result.perfect).toEqual(['way'])
  })
})
