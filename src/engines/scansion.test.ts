import { describe, it, expect } from 'vitest'
import { scanLine, stressSequence, applyScansionOverrides } from '@/engines/scansion'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

describe('scanLine', () => {
  it('carries a content word\'s dictionary stress through unchanged', () => {
    const syllables = scanLine('cat', dict)
    expect(syllables).toHaveLength(1)
    expect(syllables[0]).toMatchObject({ word: 'cat', stress: 1, demoted: false, unknown: false })
  })

  it('demotes a monosyllabic function word CMU marks as stressed', () => {
    // "to" is T UW1 in CMU (primary stress) but should scan as unstressed.
    const syllables = scanLine('to cat', dict)
    expect(syllables[0]).toMatchObject({ word: 'to', stress: 0, demoted: true })
    expect(syllables[1]).toMatchObject({ word: 'cat', stress: 1, demoted: false })
  })

  it('demotes every relevant function word in a realistic line', () => {
    // "of" and "is" are both CMU-stressed function words; "cat" and "well"
    // are content-bearing and keep their stress.
    const syllables = scanLine('of cat is well', dict)
    expect(syllables.map((s) => s.stress)).toEqual([0, 1, 0, 1])
    expect(syllables.map((s) => s.demoted)).toEqual([true, false, true, false])
  })

  it('does not demote a multi-syllable word even if its first syllable is stressed', () => {
    // "table" (stress "10") is not a function word at all, but this also
    // documents that demotion only applies to single-syllable words.
    const syllables = scanLine('table', dict)
    expect(syllables.map((s) => s.stress)).toEqual([1, 0])
    expect(syllables.every((s) => !s.demoted)).toBe(true)
  })

  it('marks an unknown word\'s syllables as unknown rather than guessing stress', () => {
    const syllables = scanLine('xanthrelle', dict)
    expect(syllables.length).toBeGreaterThan(0)
    expect(syllables.every((s) => s.unknown && s.stress === 0)).toBe(true)
  })

  it('records each syllable\'s word, index, and count within a multi-syllable word', () => {
    const syllables = scanLine('fire', dict)
    expect(syllables).toEqual([
      { word: 'fire', wordStart: 0, wordEnd: 4, syllableIndexInWord: 0, syllableCountInWord: 2, stress: 1, demoted: false, unknown: false },
      { word: 'fire', wordStart: 0, wordEnd: 4, syllableIndexInWord: 1, syllableCountInWord: 2, stress: 0, demoted: false, unknown: false },
    ])
  })

  it('gives correct character spans for each word in a multi-word line', () => {
    const line = 'cat and fire'
    const syllables = scanLine(line, dict)
    const fireSyllable = syllables.find((s) => s.word === 'fire')!
    expect(line.slice(fireSyllable.wordStart, fireSyllable.wordEnd)).toBe('fire')
  })

  it('returns an empty array for a blank line', () => {
    expect(scanLine('', dict)).toEqual([])
  })
})

describe('stressSequence', () => {
  it('extracts just the stress bits in order', () => {
    const syllables = scanLine('of cat is well', dict)
    expect(stressSequence(syllables)).toEqual([0, 1, 0, 1])
  })
})

describe('applyScansionOverrides', () => {
  it('replaces the stress at overridden positions only', () => {
    const syllables = scanLine('of cat is well', dict)
    const overridden = applyScansionOverrides(syllables, new Map([[0, 1]]))
    expect(stressSequence(overridden)).toEqual([1, 1, 0, 1])
  })

  it('returns the original array unchanged when there are no overrides', () => {
    const syllables = scanLine('of cat is well', dict)
    expect(applyScansionOverrides(syllables, new Map())).toBe(syllables)
  })
})
