import { describe, it, expect } from 'vitest'
import {
  normalizeWord,
  extractWords,
  lastWord,
  getWordAtPosition,
  findLastWordSpan,
  tokenizeLineWithSpans,
} from '@/engines/normalize'

describe('normalizeWord', () => {
  it('lowercases and strips surrounding punctuation', () => {
    expect(normalizeWord('Summer!')).toBe('summer')
    expect(normalizeWord('"Whispering"')).toBe('whispering')
    expect(normalizeWord('(parenthetical)')).toBe('parenthetical')
  })

  it('preserves an internal apostrophe (contraction)', () => {
    expect(normalizeWord("don't")).toBe("don't")
    expect(normalizeWord("y'all,")).toBe("y'all")
  })

  it('folds curly quotes to straight ones', () => {
    expect(normalizeWord('don’t')).toBe("don't")
    expect(normalizeWord('‘quoted’')).toBe('quoted')
  })

  it('folds em and en dashes to a plain hyphen', () => {
    expect(normalizeWord('well—known')).toBe('well-known')
    expect(normalizeWord('word—')).toBe('word')
  })

  it('preserves an internal hyphen (compound word)', () => {
    expect(normalizeWord('well-known')).toBe('well-known')
  })

  it('strips a stray leading hyphen left by an em dash', () => {
    expect(normalizeWord('—word')).toBe('word')
  })

  it('returns an empty string for pure punctuation', () => {
    expect(normalizeWord('--')).toBe('')
    expect(normalizeWord('...')).toBe('')
  })
})

describe('extractWords', () => {
  it('splits a line into normalized words', () => {
    expect(extractWords('Shall I compare thee to a summer’s day?')).toEqual([
      'shall',
      'i',
      'compare',
      'thee',
      'to',
      'a',
      "summer's",
      'day',
    ])
  })

  it('handles a single-word line', () => {
    expect(extractWords('Alone.')).toEqual(['alone'])
  })

  it('handles an empty line', () => {
    expect(extractWords('')).toEqual([])
    expect(extractWords('   ')).toEqual([])
  })
})

describe('lastWord', () => {
  it('returns the last word of a line, punctuation stripped', () => {
    expect(lastWord("Thou art more lovely and more temperate.")).toBe('temperate')
  })

  it('returns the only word on a one-word line', () => {
    expect(lastWord('Alone.')).toBe('alone')
  })

  it('returns null for an empty line', () => {
    expect(lastWord('')).toBeNull()
  })

  it('handles a line ending in an em-dash trailing off', () => {
    expect(lastWord('And then—')).toBe('then')
  })
})

describe('getWordAtPosition', () => {
  const text = "cat's well-known day"
  //            0123456789012345678901
  //            cat's = 0-4, well-known = 10-20, day = 21-23... let's index precisely below

  it('finds the word when the caret sits inside it', () => {
    // "cat's" spans indices 0-4; position 2 is inside "t".
    expect(getWordAtPosition(text, 2)).toEqual({ word: "cat's", start: 0, end: 5 })
  })

  it('finds the word when the caret sits at its right edge', () => {
    expect(getWordAtPosition(text, 5)).toEqual({ word: "cat's", start: 0, end: 5 })
  })

  it('finds the word when the caret sits at its left edge', () => {
    const start = text.indexOf('well-known')
    expect(getWordAtPosition(text, start)?.word).toBe('well-known')
  })

  it('treats a hyphenated compound as a single word', () => {
    const start = text.indexOf('well-known')
    const onTheHyphen = start + 4 // "well-known"[4] === '-'
    expect(getWordAtPosition(text, onTheHyphen)?.word).toBe('well-known')
  })

  it('returns null when the caret sits in the middle of a whitespace gap', () => {
    const gappy = 'cat  dog' // two spaces (indices 3-4); index 4 touches neither word
    expect(getWordAtPosition(gappy, 4)).toBeNull()
  })

  it('resolves to the adjacent word when the caret sits right at a single-space boundary', () => {
    // Position 5 is the space right after "cat's" — there's nothing to its
    // right, so the word to the left is what a click there should mean.
    expect(getWordAtPosition(text, 5)?.word).toBe("cat's")
  })

  it('returns null for an out-of-range position', () => {
    expect(getWordAtPosition(text, -1)).toBeNull()
    expect(getWordAtPosition(text, text.length + 1)).toBeNull()
  })

  it('normalizes surrounding punctuation out of the found word', () => {
    const quoted = '"whispering" softly'
    const position = quoted.indexOf('whispering') + 2
    expect(getWordAtPosition(quoted, position)?.word).toBe('whispering')
  })
})

describe('findLastWordSpan', () => {
  it('finds the last word, excluding trailing punctuation', () => {
    const line = "Thou art more lovely and more temperate."
    const span = findLastWordSpan(line)
    expect(line.slice(span!.start, span!.end)).toBe('temperate')
  })

  it('handles a one-word line', () => {
    const line = 'Alone.'
    const span = findLastWordSpan(line)
    expect(line.slice(span!.start, span!.end)).toBe('Alone')
  })

  it('returns null for a blank line', () => {
    expect(findLastWordSpan('')).toBeNull()
    expect(findLastWordSpan('   ')).toBeNull()
  })

  it('returns null for a line of pure punctuation', () => {
    expect(findLastWordSpan('...')).toBeNull()
  })

  it('includes a trailing hyphenated compound as one span', () => {
    const line = 'a well-known day'
    const span = findLastWordSpan(line)
    expect(line.slice(span!.start, span!.end)).toBe('day')
  })
})

describe('tokenizeLineWithSpans', () => {
  it('finds every word with its raw character span', () => {
    const line = "Shall I compare thee to a summer's day?"
    const spans = tokenizeLineWithSpans(line)
    expect(spans.map((s) => s.word)).toEqual([
      'shall',
      'i',
      'compare',
      'thee',
      'to',
      'a',
      "summer's",
      'day',
    ])
    for (const span of spans) {
      expect(normalizeWord(line.slice(span.start, span.end))).toBe(span.word)
    }
  })

  it('handles a hyphenated compound as one span', () => {
    const spans = tokenizeLineWithSpans('a well-known day')
    expect(spans.map((s) => s.word)).toEqual(['a', 'well-known', 'day'])
  })

  it('returns an empty array for a blank line', () => {
    expect(tokenizeLineWithSpans('')).toEqual([])
    expect(tokenizeLineWithSpans('   ')).toEqual([])
  })

  it('returns an empty array for a line of pure punctuation', () => {
    expect(tokenizeLineWithSpans('...')).toEqual([])
  })
})
