import { describe, expect, it } from 'vitest'
import { poemToPlainText, poemToMarkdown, slugifyFilename } from '@/features/editor/exportPoem'

describe('poemToPlainText', () => {
  it('puts the title above a blank line, then the body verbatim', () => {
    expect(poemToPlainText('My Poem', 'line one\nline two')).toBe('My Poem\n\nline one\nline two')
  })

  it('falls back to "Untitled" for a blank title', () => {
    expect(poemToPlainText('   ', 'body')).toBe('Untitled\n\nbody')
  })
})

describe('poemToMarkdown', () => {
  it('renders the title as an H1 and hard-breaks each non-blank line', () => {
    expect(poemToMarkdown('My Poem', 'line one\nline two')).toBe('# My Poem\n\nline one  \nline two  ')
  })

  it('leaves stanza-break blank lines blank (no trailing spaces)', () => {
    expect(poemToMarkdown('My Poem', 'line one\n\nline two')).toBe('# My Poem\n\nline one  \n\nline two  ')
  })

  it('falls back to "Untitled" for a blank title', () => {
    expect(poemToMarkdown('', 'body')).toBe('# Untitled\n\nbody  ')
  })
})

describe('slugifyFilename', () => {
  it('lowercases and hyphenates the title', () => {
    expect(slugifyFilename('Shall I Compare Thee')).toBe('shall-i-compare-thee')
  })

  it('strips punctuation', () => {
    expect(slugifyFilename("Ode to Joy!")).toBe('ode-to-joy')
  })

  it('falls back to "untitled" for a blank title', () => {
    expect(slugifyFilename('   ')).toBe('untitled')
  })
})
