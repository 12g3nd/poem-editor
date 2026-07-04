import { describe, it, expect } from 'vitest'
import { buildDictionaryIndex } from '@/engines/dictionary'

describe('buildDictionaryIndex', () => {
  it('builds a lookup map keyed by word', () => {
    const dict = buildDictionaryIndex([['cat', 'K AE1 T', '1', 'AE T']])
    const entry = dict.get('cat')
    expect(entry).toEqual({
      word: 'cat',
      phonemes: ['K', 'AE1', 'T'],
      stress: '1',
      rhymeKey: 'AE T',
    })
  })

  it('represents an empty rhyme key as null', () => {
    const dict = buildDictionaryIndex([['x', 'X', '', '']])
    expect(dict.get('x')?.rhymeKey).toBeNull()
  })
})
