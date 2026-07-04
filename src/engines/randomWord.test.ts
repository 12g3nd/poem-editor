import { describe, expect, it } from 'vitest'
import { randomWord } from '@/engines/randomWord'

describe('randomWord', () => {
  it('returns null for an empty list', () => {
    expect(randomWord([])).toBeNull()
  })

  it('returns the only word when the list has one entry', () => {
    expect(randomWord(['solitary'])).toBe('solitary')
  })

  it('never returns the excluded word when alternatives exist', () => {
    for (let i = 0; i < 20; i++) {
      expect(randomWord(['a', 'b'], 'a')).toBe('b')
    }
  })

  it('only returns words from the given list', () => {
    const words = ['sun', 'moon', 'tide', 'wind']
    for (let i = 0; i < 20; i++) {
      expect(words).toContain(randomWord(words))
    }
  })
})
