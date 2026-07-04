import { describe, it, expect } from 'vitest'
import { storyFormat } from '@/types/story'

describe('storyFormat', () => {
  it('treats a story with no format as plain (legacy-safe)', () => {
    expect(storyFormat({ format: undefined })).toBe('plain')
  })

  it('returns the explicit format when set', () => {
    expect(storyFormat({ format: 'rich' })).toBe('rich')
    expect(storyFormat({ format: 'plain' })).toBe('plain')
  })
})
