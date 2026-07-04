import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { buildDictionaryIndex, type DictionaryTuple } from '@/engines/dictionary'
import { countSyllables } from '@/engines/syllables'

/**
 * Sanity-checks the real bundled dictionary/thesaurus produced by
 * scripts/build-dictionary.mjs, as opposed to the hand-built fixture the
 * other engine tests use. Regenerate the data (`node
 * scripts/build-dictionary.mjs`) if these ever fail after a pipeline change.
 */
function loadRealDictionary() {
  const raw = readFileSync(path.resolve(process.cwd(), 'public/data/dictionary.json'), 'utf-8')
  const tuples = JSON.parse(raw) as DictionaryTuple[]
  return buildDictionaryIndex(tuples)
}

describe('bundled dictionary data', () => {
  const dict = loadRealDictionary()

  it('contains well over 100k words', () => {
    expect(dict.size).toBeGreaterThan(100_000)
  })

  it('keeps the primary (most common) pronunciation for an ambiguous word', () => {
    // Real cmudict lists "fire" as both 1- and 2-syllable; the primary
    // (unsuffixed) entry is the 2-syllable pronunciation.
    expect(countSyllables('fire', dict)).toBe(2)
    expect(countSyllables('hour', dict)).toBe(2)
    expect(countSyllables('every', dict)).toBe(3)
  })

  it('resolves a contraction directly', () => {
    expect(countSyllables("don't", dict)).toBe(1)
    expect(countSyllables("y'all", dict)).toBe(1)
  })

  it('resolves a known hyphenated compound as a single entry', () => {
    expect(dict.has('able-bodied')).toBe(true)
    expect(countSyllables('able-bodied', dict)).toBe(4)
  })
})

describe('bundled thesaurus data', () => {
  it('produces a reasonably sized file', () => {
    const raw = readFileSync(path.resolve(process.cwd(), 'public/data/thesaurus.json'), 'utf-8')
    const tuples = JSON.parse(raw) as [string, string[]][]
    expect(tuples.length).toBeGreaterThan(10_000)
  })
})
