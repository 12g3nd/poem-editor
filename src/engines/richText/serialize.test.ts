import { describe, it, expect } from 'vitest'
import { docToHtml, docToMarkdown } from '@/engines/richText/serialize'

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scene' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'A ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'quiet' },
        { type: 'text', text: ' room.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
      ],
    },
  ],
}

describe('docToHtml', () => {
  it('renders formatting to HTML', () => {
    const html = docToHtml(doc)
    expect(html).toContain('<h2>Scene</h2>')
    expect(html).toContain('<em>quiet</em>')
    expect(html).toContain('<li><p>one</p></li>')
  })
})

describe('docToMarkdown', () => {
  it('renders a title heading and block formatting', () => {
    const md = docToMarkdown('My Story', doc)
    expect(md).toContain('# My Story')
    expect(md).toContain('## Scene')
    expect(md).toContain('A *quiet* room.')
    expect(md).toContain('- one')
    expect(md).toContain('- two')
  })

  it('defaults an empty title to Untitled', () => {
    expect(docToMarkdown('   ', { type: 'doc', content: [] })).toContain('# Untitled')
  })
})
