import { describe, it, expect } from 'vitest'
import { docToPlainText, EMPTY_DOC } from '@/engines/richText/projection'
import { countParagraphs } from '@/engines/storyStats'

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapter One' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'It was ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'cold' },
        { type: 'text', text: '.' },
      ],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'The end.' }] },
  ],
}

describe('docToPlainText', () => {
  it('flattens marks and separates blocks with blank lines', () => {
    expect(docToPlainText(doc)).toBe('Chapter One\n\nIt was cold.\n\nThe end.')
  })

  it('produces a projection countParagraphs reads as 3 paragraphs', () => {
    expect(countParagraphs(docToPlainText(doc))).toBe(3)
  })

  it('empties cleanly', () => {
    expect(docToPlainText(EMPTY_DOC)).toBe('')
  })
})
