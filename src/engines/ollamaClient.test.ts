import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { listOllamaModels, askOllama, OllamaError } from '@/engines/ollamaClient'

describe('ollamaClient', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('listOllamaModels', () => {
    it('returns model names on success', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ models: [{ name: 'llama3' }, { name: 'mistral' }] }), { status: 200 }),
      )
      const models = await listOllamaModels('http://localhost:11434')
      expect(models).toEqual(['llama3', 'mistral'])
    })

    it('trims a trailing slash from the endpoint before requesting', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200 }))
      await listOllamaModels('http://localhost:11434/')
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags')
    })

    it('throws a network OllamaError when fetch itself rejects (Ollama down or CORS-blocked)', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(listOllamaModels('http://localhost:11434')).rejects.toMatchObject({
        name: 'OllamaError',
        cause: 'network',
      })
    })

    it('throws an http OllamaError on a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response('', { status: 500 }))
      await expect(listOllamaModels('http://localhost:11434')).rejects.toBeInstanceOf(OllamaError)
    })
  })

  describe('askOllama', () => {
    it('posts the chat payload and returns the reply text', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: { content: 'Try a slant rhyme here.' } }), { status: 200 }),
      )
      const reply = await askOllama('http://localhost:11434', 'llama3', [{ role: 'user', content: 'help' }])
      expect(reply).toBe('Try a slant rhyme here.')

      const [, init] = vi.mocked(global.fetch).mock.calls[0]
      expect(JSON.parse(init!.body as string)).toEqual({
        model: 'llama3',
        messages: [{ role: 'user', content: 'help' }],
        stream: false,
      })
    })

    it('throws a network OllamaError when the request never reaches Ollama', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(askOllama('http://localhost:11434', 'llama3', [])).rejects.toMatchObject({ cause: 'network' })
    })

    it('throws a parse OllamaError when the response has no message content', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
      await expect(askOllama('http://localhost:11434', 'llama3', [])).rejects.toMatchObject({ cause: 'parse' })
    })
  })
})
