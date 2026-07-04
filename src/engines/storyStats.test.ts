import { describe, expect, it } from 'vitest'
import { estimateReadingMinutes, countCharacters, countParagraphs } from '@/engines/storyStats'

describe('estimateReadingMinutes', () => {
  it('returns 0 for no words', () => {
    expect(estimateReadingMinutes(0)).toBe(0)
  })

  it('rounds to the nearest minute at 200 words/minute', () => {
    expect(estimateReadingMinutes(400)).toBe(2)
    expect(estimateReadingMinutes(1000)).toBe(5)
  })

  it('never returns 0 for a nonzero word count, even a very short one', () => {
    expect(estimateReadingMinutes(5)).toBe(1)
  })
})

describe('countCharacters', () => {
  it('counts every character including whitespace', () => {
    expect(countCharacters('a b')).toBe(3)
  })
})

describe('countParagraphs', () => {
  it('counts a single block of text as one paragraph', () => {
    expect(countParagraphs('one line\nstill the same paragraph')).toBe(1)
  })

  it('splits on blank lines', () => {
    expect(countParagraphs('first paragraph\n\nsecond paragraph\n\nthird')).toBe(3)
  })

  it('ignores leading/trailing/extra blank lines', () => {
    expect(countParagraphs('\n\n\nfirst\n\n\n\nsecond\n\n\n')).toBe(2)
  })

  it('returns 0 for an empty document', () => {
    expect(countParagraphs('')).toBe(0)
  })
})
