import { useEffect, useState } from 'react'
import { useSettings } from '@/engines/SettingsContext'
import { DatamuseError } from '@/engines/datamuseClient'

interface OnlineExtrasSectionProps {
  word: string
  title: string
  fetcher: (word: string) => Promise<string[]>
  exclude: Set<string>
  onInsert: (word: string) => void
}

/** Shown under a tab's offline results — a clearly-labeled, opt-in Datamuse
 * lookup (see Settings > "Online extras") for words the bundled dictionary
 * doesn't cover. Fetches nothing unless the setting is on. */
export function OnlineExtrasSection({ word, title, fetcher, exclude, onInsert }: OnlineExtrasSectionProps) {
  const { settings } = useSettings()
  const [words, setWords] = useState<string[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!settings.onlineExtrasEnabled || !word) {
      setWords(null)
      setError('')
      return
    }
    let cancelled = false
    setWords(null)
    setError('')
    fetcher(word)
      .then((result) => {
        if (!cancelled) setWords(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof DatamuseError ? err.message : 'Something went wrong.')
      })
    return () => {
      cancelled = true
    }
  }, [word, settings.onlineExtrasEnabled, fetcher])

  if (!settings.onlineExtrasEnabled) return null

  const filtered = (words ?? []).filter((w) => !exclude.has(w))

  return (
    <div className="border-t border-canvas-line pt-3">
      <p className="mb-1 text-xs font-medium text-ink/40">{title}</p>
      {error ? (
        <p className="text-xs text-berry">{error}</p>
      ) : words === null ? (
        <p className="text-xs text-ink/40">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-ink/40">Nothing extra from Datamuse.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onInsert(w)}
              className="rounded-full border border-canvas-line bg-canvas px-2.5 py-0.5 text-sm text-ink hover:border-indigo hover:text-indigo"
            >
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
