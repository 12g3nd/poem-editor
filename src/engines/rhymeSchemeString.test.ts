import { describe, it, expect } from 'vitest'
import { parseRhymeSchemeString } from '@/engines/rhymeSchemeString'

describe('parseRhymeSchemeString', () => {
  it('parses a plain scheme with no stanza breaks', () => {
    expect(parseRhymeSchemeString('AABBA')).toEqual(['A', 'A', 'B', 'B', 'A'])
  })

  it('ignores spaces used as stanza separators', () => {
    expect(parseRhymeSchemeString('ABAB CDCD EFEF GG')).toEqual([
      'A', 'B', 'A', 'B', 'C', 'D', 'C', 'D', 'E', 'F', 'E', 'F', 'G', 'G',
    ])
  })

  it('returns an empty array for an empty string', () => {
    expect(parseRhymeSchemeString('')).toEqual([])
    expect(parseRhymeSchemeString('   ')).toEqual([])
  })
})
