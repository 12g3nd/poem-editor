import { describe, it, expect, vi, afterEach } from 'vitest'

describe('loadThesaurus', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.resetModules()
  })

  it('fetches the bundled JSON and builds a synonym map', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([['happy', ['glad', 'joyful']]]),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { loadThesaurus } = await import('@/data/loadThesaurus')
    const thesaurus = await loadThesaurus()

    expect(fetchMock).toHaveBeenCalledWith('/data/thesaurus.json')
    expect(thesaurus.get('happy')).toEqual(['glad', 'joyful'])
  })

  it('only fetches once across repeated calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([['happy', ['glad']]]),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { loadThesaurus } = await import('@/data/loadThesaurus')
    await loadThesaurus()
    await loadThesaurus()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
