import { describe, it, expect } from 'vitest'
import { buildRhymeIndex, findRhymesIndexed, type RhymeIndex } from '@/engines/rhymeIndex'
import { buildDictionaryIndex, type DictionaryTuple } from '@/engines/dictionary'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()
const index = buildRhymeIndex(dict)

describe('findRhymesIndexed', () => {
  it('finds perfect and slant rhymes across the whole dictionary', () => {
    // "write" is the only perfect rhyme for "light" (shared "AY T" key).
    // "cat" shares light's final coda "T" (slant) without sharing its vowel.
    const result = findRhymesIndexed('light', dict, index)
    expect(result.perfect).toEqual(['write'])
    expect(result.slant).toEqual(['cat'])
  })

  it('excludes perfect matches from the slant list', () => {
    const result = findRhymesIndexed('day', dict, index)
    expect(result.perfect.sort()).toEqual(['say', 'way'])
    // "to" also shares day's empty final coda (both end in a bare vowel).
    expect(result.slant.sort()).toEqual(['every', 'fire', 'hour', 'shape', 'to'])
  })

  it('never includes the query word itself', () => {
    const result = findRhymesIndexed('day', dict, index)
    expect(result.perfect).not.toContain('day')
    expect(result.slant).not.toContain('day')
  })

  it('returns empty results for a word not in the dictionary', () => {
    expect(findRhymesIndexed('xanthrelle', dict, index)).toEqual({ perfect: [], slant: [] })
  })

  it('caps results even when thousands of words share a final sound', () => {
    // Simulates a word ending in a very common bare vowel (empty coda),
    // which in the real dictionary can match tens of thousands of words —
    // this must not flood the caller with all of them.
    const tuples: DictionaryTuple[] = [['query', 'K W EH1 R IY0', '10', 'EH R IY']]
    for (let i = 0; i < 5000; i++) {
      // Every one of these ends in a bare vowel (empty coda) and, for half
      // of them, the same final vowel IY as "query" — a huge slant bucket.
      tuples.push([`word${i}`, `W ER1 D${i % 2 === 0 ? ' IY0' : ''}`, i % 2 === 0 ? '10' : '1', 'placeholder'])
    }
    const hugeDict = buildDictionaryIndex(tuples)
    const hugeIndex: RhymeIndex = buildRhymeIndex(hugeDict)

    const result = findRhymesIndexed('query', hugeDict, hugeIndex)
    expect(result.slant.length).toBeLessThanOrEqual(60)
  })
})
