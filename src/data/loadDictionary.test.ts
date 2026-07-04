import { describe, it, expect, vi, afterEach } from 'vitest'

describe('loadDictionary', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.resetModules()
  })

  it('fetches the bundled JSON and builds an index', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([['cat', 'K AE1 T', '1', 'AE T']]),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { loadDictionary } = await import('@/data/loadDictionary')
    const dict = await loadDictionary()

    expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}data/dictionary.json`)
    expect(dict.get('cat')?.stress).toBe('1')
  })

  it('only fetches once across repeated calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([['cat', 'K AE1 T', '1', 'AE T']]),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { loadDictionary } = await import('@/data/loadDictionary')
    await loadDictionary()
    await loadDictionary()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
