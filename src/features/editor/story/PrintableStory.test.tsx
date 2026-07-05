import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PrintableStory } from '@/features/editor/story/PrintableStory'

describe('PrintableStory', () => {
  it('renders rich content as HTML', () => {
    const { container } = render(
      <PrintableStory
        title="T"
        format="rich"
        body="Scene"
        content={{ type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scene' }] }] }}
      />,
    )
    expect(container.querySelector('h2')?.textContent).toBe('Scene')
  })

  it('renders plain body as lines', () => {
    const { container } = render(<PrintableStory title="T" format="plain" body={'a\nb'} />)
    expect(container.textContent).toContain('a')
    expect(container.textContent).toContain('b')
  })
})
