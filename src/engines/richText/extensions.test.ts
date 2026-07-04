import { describe, it, expect } from 'vitest'
import { getStorySchema, storyExtensions } from '@/engines/richText/extensions'

describe('story rich-text schema', () => {
  it('includes the marks and nodes the toolbar needs', () => {
    const schema = getStorySchema()
    for (const mark of ['bold', 'italic', 'underline', 'strike', 'link', 'highlight', 'textStyle', 'comment']) {
      expect(schema.marks[mark], `mark ${mark}`).toBeTruthy()
    }
    for (const node of ['heading', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule']) {
      expect(schema.nodes[node], `node ${node}`).toBeTruthy()
    }
  })

  it('exposes a stable extension array', () => {
    expect(Array.isArray(storyExtensions)).toBe(true)
    expect(storyExtensions.length).toBeGreaterThan(5)
  })
})
