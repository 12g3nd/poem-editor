import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getStory, updateStory } from '@/db/stories'
import { createSnapshot } from '@/db/snapshots'
import { useSettings } from '@/engines/SettingsContext'
import { countWords } from '@/engines/lineStats'
import { estimateReadingMinutes, countParagraphs } from '@/engines/storyStats'
import { getWordAtPosition } from '@/engines/normalize'
import { StoryWorkbenchSidebar } from '@/features/editor/workbench/StoryWorkbenchSidebar'
import { SettingsPanel } from '@/features/settings/SettingsPanel'
import { ExportMenu } from '@/features/editor/ExportMenu'
import { PrintablePoem } from '@/features/editor/PrintablePoem'
import { useRegisterCommands, type Command } from '@/engines/CommandPaletteContext'

/** The "short story mode" editor — a plain wrapping prose surface (no
 * per-line gutters/overlays, since rhyme/scansion/meter don't apply to
 * prose) meant to stay comfortable at thousands of words: the textarea
 * autosizes to its content so the page scrolls as one document, the way a
 * word processor would, rather than scrolling inside a boxed textarea. */
export function StoryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const story = useLiveQuery(() => (id ? getStory(id) : null), [id])
  const { settings } = useSettings()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const hydratedFor = useRef<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [focusMode, setFocusMode] = useState(false)
  const [snapshotSaved, setSnapshotSaved] = useState(false)
  const [activeWord, setActiveWord] = useState<string | null>(null)

  useEffect(() => {
    if (story && hydratedFor.current !== story.id) {
      setTitle(story.title)
      setBody(story.body)
      hydratedFor.current = story.id
    }
  }, [story])

  useEffect(() => {
    if (!id || hydratedFor.current !== id) return
    const handle = setTimeout(() => {
      void updateStory(id, { title, body })
    }, 400)
    return () => clearTimeout(handle)
  }, [id, title, body])

  // Autosize the textarea to its content so the outer page scrolls as one
  // continuous document instead of inside a boxed, internally-scrolling
  // textarea — the "many thousands of words, neatly kept" requirement.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [body, settings.fontSize, settings.lineHeight])

  const wordCount = useMemo(() => countWords(body), [body])
  const paragraphCount = useMemo(() => countParagraphs(body), [body])
  const readingMinutes = useMemo(() => estimateReadingMinutes(wordCount), [wordCount])

  async function handleSnapshot() {
    if (!id) return
    await createSnapshot(id, title, body)
    setSnapshotSaved(true)
    setTimeout(() => setSnapshotSaved(false), 1600)
  }

  function handleSelectionChange() {
    const textarea = textareaRef.current
    if (!textarea) return
    const found = getWordAtPosition(body, textarea.selectionStart)
    setActiveWord(found?.word ?? null)
  }

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextBody = body.slice(0, start) + text + body.slice(end)
    setBody(nextBody)
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + text.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  const storyCommands = useMemo<Command[]>(() => {
    if (!id) return []
    return [
      {
        id: 'story-toggle-focus',
        label: focusMode ? 'Exit focus mode' : 'Enter focus mode',
        run: () => setFocusMode((v) => !v),
      },
      { id: 'story-snapshot', label: 'Save snapshot', run: () => void handleSnapshot() },
      { id: 'story-go-history', label: 'View version history', run: () => navigate(`/story/${id}/history`) },
    ]
    // handleSnapshot closes over title/body and is recreated every render
    // (not memoized) — included so a stale snapshot is never captured.
  }, [id, focusMode, navigate, handleSnapshot])

  useRegisterCommands('story-page', storyCommands)

  if (story === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    )
  }

  if (story === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas">
        <p className="font-display text-lg text-ink">This story doesn&rsquo;t exist (anymore).</p>
        <button type="button" onClick={() => navigate('/')} className="text-indigo hover:underline">
          Back to library
        </button>
      </div>
    )
  }

  const fontFamily = settings.editorFont === 'serif' ? 'var(--font-display)' : 'var(--font-sans)'

  return (
    <>
      <div className="flex min-h-full flex-col bg-canvas print:hidden">
        <header className="flex items-center justify-between border-b border-canvas-line px-8 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-ink/50 transition-colors hover:text-indigo"
          >
            ← Library
          </button>
          <div className="flex items-center gap-5 text-xs text-ink/40">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{paragraphCount} paragraphs</span>
            <span>~{readingMinutes} min read</span>
            <span className="mx-1 h-3 w-px bg-canvas-line" />
            <button
              type="button"
              onClick={() => setFocusMode((v) => !v)}
              aria-pressed={focusMode}
              className={`rounded-full px-3 py-1 transition-colors ${
                focusMode ? 'bg-indigo text-paper' : 'text-ink/50 hover:text-indigo'
              }`}
            >
              Focus
            </button>
            <button type="button" onClick={handleSnapshot} className="text-ink/50 hover:text-indigo">
              {snapshotSaved ? 'Saved ✓' : 'Snapshot'}
            </button>
            <Link to={`/story/${id}/history`} className="text-ink/50 hover:text-indigo">
              History
            </Link>
            <ExportMenu title={title} body={body} />
            <SettingsPanel />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto px-8 py-10">
            <div className={focusMode ? 'mx-auto max-w-2xl' : 'mx-auto max-w-3xl'}>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Untitled"
                aria-label="Story title"
                className="w-full bg-transparent font-display text-3xl text-ink outline-none placeholder:text-ink/30"
              />

              <textarea
                ref={textareaRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onSelect={handleSelectionChange}
                onClick={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                placeholder="Once upon a time…"
                aria-label="Story text"
                spellCheck
                className="mt-6 w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-ink/30"
                style={{
                  fontSize: settings.fontSize,
                  lineHeight: `${settings.lineHeight}px`,
                  fontFamily,
                  color: 'var(--color-ink)',
                  caretColor: 'var(--color-ink)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: '60vh',
                }}
              />
            </div>
          </main>

          {!focusMode && <StoryWorkbenchSidebar activeWord={activeWord} body={body} onInsert={insertAtCursor} />}
        </div>
      </div>
      <PrintablePoem title={title} body={body} />
    </>
  )
}
