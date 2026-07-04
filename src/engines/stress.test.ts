import { describe, it, expect } from 'vitest'
import { getStressPattern } from '@/engines/stress'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'
import type { OverrideIndex } from '@/types/override'

const dict = createFixtureDictionary()

describe('getStressPattern', () => {
  it('returns the raw dictionary stress pattern for a word', () => {
    expect(getStressPattern('every', dict)).toBe('100')
    expect(getStressPattern('fire', dict)).toBe('10')
  })

  it('is case-insensitive', () => {
    expect(getStressPattern('EVERY', dict)).toBe('100')
  })

  it('decomposes a hyphenated compound not found as a whole word', () => {
    expect(getStressPattern('well-known', dict)).toBe('1' + '1')
  })

  it('prefers a whole-word dictionary hit over hyphen decomposition', () => {
    expect(getStressPattern('able-bodied', dict)).toBe('1010')
  })

  it('returns null for a genuinely unknown word rather than guessing', () => {
    expect(getStressPattern('xanthrelle', dict)).toBeNull()
  })

  it('lets a manual override win over the dictionary', () => {
    const overrides: OverrideIndex = new Map([['fire', { word: 'fire', stressPattern: '1' }]])
    expect(getStressPattern('fire', dict, overrides)).toBe('1')
  })

  it('lets a manual override supply a pattern for an unknown word', () => {
    const overrides: OverrideIndex = new Map([['zborf', { word: 'zborf', stressPattern: '1' }]])
    expect(getStressPattern('zborf', dict, overrides)).toBe('1')
  })
})
