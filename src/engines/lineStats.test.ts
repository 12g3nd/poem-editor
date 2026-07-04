import { describe, it, expect } from 'vitest'
import { countLineSyllables, countLines, countStanzas, countWords } from '@/engines/lineStats'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

describe('countLineSyllables', () => {
  it('sums syllables across every word in the line', () => {
    // "day" (1) + "way" (1) = 2
    expect(countLineSyllables('day way', dict)).toBe(2)
  })

  it('returns 0 for a blank line', () => {
    expect(countLineSyllables('', dict)).toBe(0)
    expect(countLineSyllables('   ', dict)).toBe(0)
  })

  it('handles a one-word line', () => {
    expect(countLineSyllables('every', dict)).toBe(3)
  })

  it('respects punctuation and contractions within the line', () => {
    expect(countLineSyllables("don't fire", dict)).toBe(1 + 2)
  })
})

describe('countStanzas', () => {
  it('counts a single stanza with no blank lines', () => {
    expect(countStanzas('one\ntwo\nthree')).toBe(1)
  })

  it('counts multiple stanzas separated by a single blank line', () => {
    expect(countStanzas('one\ntwo\n\nthree\nfour')).toBe(2)
  })

  it('collapses multiple consecutive blank lines into one separator', () => {
    expect(countStanzas('one\n\n\n\ntwo')).toBe(2)
  })

  it('ignores leading and trailing blank lines', () => {
    expect(countStanzas('\n\none\ntwo\n\n')).toBe(1)
  })

  it('returns 0 for an empty poem', () => {
    expect(countStanzas('')).toBe(0)
    expect(countStanzas('\n\n')).toBe(0)
  })
})

describe('countLines', () => {
  it('counts only non-blank lines', () => {
    expect(countLines('one\ntwo\n\nthree')).toBe(3)
  })

  it('handles a single-line poem', () => {
    expect(countLines('alone')).toBe(1)
  })

  it('returns 0 for an empty poem', () => {
    expect(countLines('')).toBe(0)
  })
})

describe('countWords', () => {
  it('counts words across the whole poem', () => {
    expect(countWords('one two\nthree')).toBe(3)
  })

  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n  ')).toBe(0)
  })
})
