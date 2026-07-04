import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fetchDatamuseRhymes, fetchDatamuseSimilarMeaning, DatamuseError } from '@/engines/datamuseClient'

describe('datamuseClient', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('fetchDatamuseRhymes', () => {
    it('merges and deduplicates perfect and near rhyme results', async () => {
      vi.mocked(global.fetch).mockImplementation((input) => {
        const url = String(input)
        if (url.includes('rel_rhy')) {
          return Promise.resolve(new Response(JSON.stringify([{ word: 'moon' }, { word: 'june' }]), { status: 200 }))
        }
        return Promise.resolve(new Response(JSON.stringify([{ word: 'june' }, { word: 'noon' }]), { status: 200 }))
      })
      const rhymes = await fetchDatamuseRhymes('spoon')
      expect(rhymes.sort()).toEqual(['june', 'moon', 'noon'])
    })

    it('throws a DatamuseError when the request fails', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(fetchDatamuseRhymes('spoon')).rejects.toBeInstanceOf(DatamuseError)
    })

    it('throws a DatamuseError on a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response('', { status: 500 }))
      await expect(fetchDatamuseRhymes('spoon')).rejects.toBeInstanceOf(DatamuseError)
    })
  })

  describe('fetchDatamuseSimilarMeaning', () => {
    it('returns the words from the response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify([{ word: 'happy' }, { word: 'joyful' }]), { status: 200 }),
      )
      const words = await fetchDatamuseSimilarMeaning('glad')
      expect(words).toEqual(['happy', 'joyful'])
    })

    it('requests the means-like endpoint with the word', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
      await fetchDatamuseSimilarMeaning('glad')
      expect(global.fetch).toHaveBeenCalledWith('https://api.datamuse.com/words?ml=glad&max=25')
    })
  })
})
