import { describe, it, expect } from 'vitest'
import { splitWordIntoSyllableChunks } from '@/engines/syllableSplit'

describe('splitWordIntoSyllableChunks', () => {
  it('returns the whole word for a monosyllable', () => {
    expect(splitWordIntoSyllableChunks('cat', 1)).toEqual(['cat'])
  })

  it('splits evenly when the length divides cleanly', () => {
    expect(splitWordIntoSyllableChunks('running', 2)).toEqual(['runn', 'ing'])
  })

  it('distributes the remainder across the earlier chunks', () => {
    // 9 letters / 2 syllables -> 5 + 4
    expect(splitWordIntoSyllableChunks('temperate', 2)).toEqual(['tempe', 'rate'])
  })

  it('reassembles to the original word', () => {
    const chunks = splitWordIntoSyllableChunks('elephant', 3)
    expect(chunks.join('')).toBe('elephant')
  })

  it('clamps the syllable count to the word length rather than producing empty chunks', () => {
    const chunks = splitWordIntoSyllableChunks('a', 3)
    expect(chunks).toEqual(['a'])
  })

  it('returns an empty array for an empty word', () => {
    expect(splitWordIntoSyllableChunks('', 2)).toEqual([])
  })
})
