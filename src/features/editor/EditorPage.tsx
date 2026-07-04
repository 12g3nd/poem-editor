import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPoem, updatePoem } from '@/db/poems'
import { createSnapshot } from '@/db/snapshots'
import { useDictionary } from '@/engines/DictionaryContext'
import { countLineSyllables, countLines, countStanzas, countWords, splitLines } from '@/engines/lineStats'
import { computeRhymeScheme, applyRhymeOverrides } from '@/engines/rhymeScheme'
import { extractWords, getWordAtPosition } from '@/engines/normalize'
import { scanLine, stressSequence } from '@/engines/scansion'
import type { Foot } from '@/engines/meter'
import { SyllableGutter } from '@/features/editor/SyllableGutter'
import { RhymeColumn } from '@/features/editor/RhymeColumn'
import { RhymeHighlightBackdrop } from '@/features/editor/RhymeHighlightBackdrop'
import { ScansionOverlay } from '@/features/editor/ScansionOverlay'
import { TargetMeterSelector } from '@/features/editor/TargetMeterSelector'
import { FocusOverlay } from '@/features/editor/FocusOverlay'
import { WordInspectorPopover } from '@/features/editor/WordInspectorPopover'
import { WorkbenchSidebar } from '@/features/editor/workbench/WorkbenchSidebar'
import { SettingsPanel } from '@/features/settings/SettingsPanel'
import { ExportMenu } from '@/features/editor/ExportMenu'
import { PrintablePoem } from '@/features/editor/PrintablePoem'
import { useEditorMetrics } from '@/features/editor/editorLayout'
import { useRegisterCommands, type Command } from '@/engines/CommandPaletteContext'

type OverlayMode = 'none' | 'rhymes' | 'scansion'

/** Stable empty fallback so the scansion overlay's memoized line rows don't
 * see a new object reference (and think overrides changed) on every
 * keystroke just because `poem.scansionOverrides` happens to be unset. */
const EMPTY_SCANSION_OVERRIDES: Record<string, 0 | 1> = {}

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { dict, overrides, loading: dictLoading } = useDictionary()
  const poem = useLiveQuery(() => (id ? getPoem(id) : null), [id])
  const { fontSize, lineHeight, fontFamily, topPadding } = useEditorMetrics()
  const clearBandPadding = lineHeight * 0.75

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const hydratedFor = useRef<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const rhymeColumnRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const [focusMode, setFocusMode] = useState(false)
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none')
  const [currentLine, setCurrentLine] = useState(0)
  const [overlayWindow, setOverlayWindow] = useState({ top: 0, bottom: 0 })
  const [snapshotSaved, setSnapshotSaved] = useState(false)
  const [inspector, setInspector] = useState<{ word: string; x: number; y: number } | null>(null)

  useEffect(() => {
    if (poem && hydratedFor.current !== poem.id) {
      setTitle(poem.title)
      setBody(poem.body)
      hydratedFor.current = poem.id
    }
  }, [poem])

  useEffect(() => {
    if (!id || hydratedFor.current !== id) return
    const handle = setTimeout(() => {
      void updatePoem(id, { title, body })
    }, 400)
    return () => clearTimeout(handle)
  }, [id, title, body])

  const lines = useMemo(() => splitLines(body), [body])

  // countLineSyllables is a pure function of (line text, dict, overrides) —
  // caching by line text means editing one line of a long poem only
  // recomputes that line, not the whole poem, on every keystroke.
  const syllableCache = useRef(new Map<string, number>())
  useEffect(() => {
    syllableCache.current = new Map()
  }, [dict, overrides])

  const syllableCounts = useMemo(() => {
    if (!dict) return lines.map(() => null)
    return lines.map((line) => {
      if (line.trim().length === 0) return null
      const cached = syllableCache.current.get(line)
      if (cached !== undefined) return cached
      const count = countLineSyllables(line, dict, overrides)
      syllableCache.current.set(line, count)
      return count
    })
  }, [lines, dict, overrides])

  const rhymeOverrideEntries = useMemo(
    () => new Map(Object.entries(poem?.rhymeOverrides ?? {}).map(([k, v]) => [Number(k), v])),
    [poem?.rhymeOverrides],
  )
  const rhymeScheme = useMemo(() => {
    if (!dict) return null
    return applyRhymeOverrides(computeRhymeScheme(body, dict), rhymeOverrideEntries)
  }, [body, dict, rhymeOverrideEntries])

  const wordCount = useMemo(() => countWords(body), [body])
  const lineCount = useMemo(() => countLines(body), [body])
  const stanzaCount = useMemo(() => countStanzas(body), [body])
  const poemWords = useMemo(() => new Set(extractWords(body)), [body])
  const activeWord = lines[currentLine] ? (extractWords(lines[currentLine]).at(-1) ?? null) : null

  function syncSideColumns() {
    const scrollTop = textareaRef.current?.scrollTop ?? 0
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop
    if (rhymeColumnRef.current) rhymeColumnRef.current.scrollTop = scrollTop
    if (backdropRef.current) backdropRef.current.scrollTop = scrollTop
  }

  function updateCurrentLine() {
    const textarea = textareaRef.current
    if (!textarea) return
    const before = textarea.value.slice(0, textarea.selectionStart)
    setCurrentLine(before.split('\n').length - 1)
  }

  function recomputeOverlayWindow(lineIndex: number) {
    const textarea = textareaRef.current
    if (!textarea) return
    const lineTopInViewport = topPadding + lineIndex * lineHeight - textarea.scrollTop
    const top = Math.max(0, lineTopInViewport - clearBandPadding)
    const bottom = Math.max(0, textarea.clientHeight - (lineTopInViewport + lineHeight + clearBandPadding))
    setOverlayWindow({ top, bottom })
  }

  function handleScroll() {
    syncSideColumns()
    if (focusMode) recomputeOverlayWindow(currentLine)
  }

  function handleSelectionChange() {
    updateCurrentLine()
  }

  function handleTextareaClick(event: MouseEvent<HTMLTextAreaElement>) {
    updateCurrentLine()
    const textarea = textareaRef.current
    if (!textarea) return
    const hit = getWordAtPosition(textarea.value, textarea.selectionStart)
    if (hit && dict?.has(hit.word)) {
      setInspector({ word: hit.word, x: event.clientX, y: event.clientY })
    } else {
      setInspector(null)
    }
  }

  useEffect(() => {
    if (!focusMode) return
    const textarea = textareaRef.current
    if (!textarea) return
    const target = topPadding + currentLine * lineHeight - textarea.clientHeight / 2 + lineHeight / 2
    textarea.scrollTop = Math.max(0, target)
    syncSideColumns()
    recomputeOverlayWindow(currentLine)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMode, currentLine])

  async function handleSnapshot() {
    if (!id) return
    await createSnapshot(id, title, body)
    setSnapshotSaved(true)
    setTimeout(() => setSnapshotSaved(false), 1600)
  }

  function handlePinRhyme(lineIndex: number, label: string | null) {
    if (!id) return
    const next = { ...(poem?.rhymeOverrides ?? {}) }
    if (label === null) {
      delete next[lineIndex]
    } else {
      next[lineIndex] = label
    }
    void updatePoem(id, { rhymeOverrides: next })
  }

  // Kept referentially stable (empty dep array) via this ref, so passing it
  // to the scansion overlay's memoized line rows doesn't force every line to
  // re-render just because the poet typed a character elsewhere in the poem.
  const toggleSyllableState = useRef({ id, dict, lines, overrides, poem })
  useEffect(() => {
    toggleSyllableState.current = { id, dict, lines, overrides, poem }
  })

  const handleToggleSyllable = useCallback((lineIndex: number, syllableIndex: number) => {
    const { id, dict, lines, overrides, poem } = toggleSyllableState.current
    if (!id || !dict) return
    const key = `${lineIndex}-${syllableIndex}`
    const line = lines[lineIndex]
    const raw = stressSequence(scanLine(line, dict, overrides))
    const lineOverridesMap = new Map<number, 0 | 1>(
      Object.entries(poem?.scansionOverrides ?? {})
        .filter(([k]) => k.startsWith(`${lineIndex}-`))
        .map(([k, v]) => [Number(k.slice(`${lineIndex}-`.length)), v]),
    )
    const currentStress = lineOverridesMap.get(syllableIndex) ?? raw[syllableIndex]
    const next = { ...(poem?.scansionOverrides ?? {}) }
    next[key] = currentStress === 1 ? 0 : 1
    void updatePoem(id, { scansionOverrides: next })
  }, [])

  function handleTargetMeterChange(value: { foot: Foot; feet: number } | null) {
    if (!id) return
    void updatePoem(id, { targetMeter: value })
  }

  function handleFormChange(nextFormId: string | null) {
    if (!id) return
    void updatePoem(id, { formId: nextFormId })
  }

  function handleAcrosticWordChange(word: string) {
    if (!id) return
    void updatePoem(id, { acrosticWord: word })
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

  const editorCommands = useMemo<Command[]>(() => {
    if (!id) return []
    return [
      {
        id: 'toggle-rhyme-colors',
        label: overlayMode === 'rhymes' ? 'Turn off rhyme colors' : 'Turn on rhyme colors',
        run: () => setOverlayMode((m) => (m === 'rhymes' ? 'none' : 'rhymes')),
      },
      {
        id: 'toggle-scansion',
        label: overlayMode === 'scansion' ? 'Turn off scansion' : 'Turn on scansion',
        run: () => setOverlayMode((m) => (m === 'scansion' ? 'none' : 'scansion')),
      },
      {
        id: 'toggle-focus',
        label: focusMode ? 'Exit focus mode' : 'Enter focus mode',
        run: () => setFocusMode((v) => !v),
      },
      { id: 'snapshot', label: 'Save snapshot', run: () => void handleSnapshot() },
      { id: 'go-history', label: 'View version history', run: () => navigate(`/poem/${id}/history`) },
    ]
    // handleSnapshot closes over title/body and is recreated every render
    // (not memoized) — included here so a stale snapshot is never captured.
  }, [id, overlayMode, focusMode, navigate, handleSnapshot])

  useRegisterCommands('editor-page', editorCommands)

  if (poem === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    )
  }

  if (poem === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas">
        <p className="font-display text-lg text-ink">This poem doesn&rsquo;t exist (anymore).</p>
        <button type="button" onClick={() => navigate('/')} className="text-indigo hover:underline">
          Back to library
        </button>
      </div>
    )
  }

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
          <span>{wordCount} words</span>
          <span>{lineCount} lines</span>
          <span>{stanzaCount} stanzas</span>
          <span className="mx-1 h-3 w-px bg-canvas-line" />
          {overlayMode === 'scansion' && (
            <TargetMeterSelector value={poem.targetMeter ?? null} onChange={handleTargetMeterChange} />
          )}
          <button
            type="button"
            onClick={() => setOverlayMode((m) => (m === 'rhymes' ? 'none' : 'rhymes'))}
            aria-pressed={overlayMode === 'rhymes'}
            className={`rounded-full px-3 py-1 transition-colors ${
              overlayMode === 'rhymes' ? 'bg-indigo text-paper' : 'text-ink/50 hover:text-indigo'
            }`}
          >
            Rhyme colors
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode((m) => (m === 'scansion' ? 'none' : 'scansion'))}
            aria-pressed={overlayMode === 'scansion'}
            className={`rounded-full px-3 py-1 transition-colors ${
              overlayMode === 'scansion' ? 'bg-indigo text-paper' : 'text-ink/50 hover:text-indigo'
            }`}
          >
            Scansion
          </button>
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
          <Link to={`/poem/${id}/history`} className="text-ink/50 hover:text-indigo">
            History
          </Link>
          <ExportMenu title={title} body={body} />
          <SettingsPanel />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-8 py-10">
          <div className="mx-auto max-w-3xl">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled"
              aria-label="Poem title"
              className="w-full bg-transparent font-display text-3xl text-ink outline-none placeholder:text-ink/30"
            />

            <div className="mt-8 flex min-h-[55vh]">
              <SyllableGutter lines={lines} counts={syllableCounts} loading={dictLoading} gutterRef={gutterRef} />
              <div className="relative min-w-0 flex-1">
                {focusMode && <FocusOverlay topHeight={overlayWindow.top} bottomHeight={overlayWindow.bottom} />}
                {overlayMode === 'rhymes' && rhymeScheme && (
                  <RhymeHighlightBackdrop lines={lines} rhymeScheme={rhymeScheme} backdropRef={backdropRef} />
                )}
                {overlayMode === 'scansion' && dict && (
                  <ScansionOverlay
                    lines={lines}
                    dict={dict}
                    wordOverrides={overrides}
                    scansionOverrides={poem.scansionOverrides ?? EMPTY_SCANSION_OVERRIDES}
                    targetMeter={poem.targetMeter ?? null}
                    onToggleSyllable={handleToggleSyllable}
                    backdropRef={backdropRef}
                  />
                )}
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onScroll={handleScroll}
                  onSelect={handleSelectionChange}
                  onClick={handleTextareaClick}
                  onKeyUp={handleSelectionChange}
                  placeholder="Begin…"
                  aria-label="Poem text"
                  spellCheck={false}
                  className="h-full min-h-[55vh] w-full resize-none overflow-auto whitespace-pre bg-transparent pl-6 outline-none placeholder:text-ink/30"
                  style={{
                    fontSize,
                    lineHeight: `${lineHeight}px`,
                    fontFamily,
                    paddingTop: topPadding,
                    color: overlayMode === 'none' ? 'var(--color-ink)' : 'transparent',
                    caretColor: 'var(--color-ink)',
                  }}
                />
              </div>
              {rhymeScheme && (
                <RhymeColumn
                  lines={rhymeScheme}
                  isOverridden={(i) => rhymeOverrideEntries.has(i)}
                  onPin={handlePinRhyme}
                  gutterRef={rhymeColumnRef}
                />
              )}
            </div>
          </div>
        </main>

        <WorkbenchSidebar
          activeWord={activeWord}
          poemWords={poemWords}
          body={body}
          formId={poem.formId ?? null}
          acrosticWord={poem.acrosticWord ?? ''}
          onFormChange={handleFormChange}
          onAcrosticWordChange={handleAcrosticWordChange}
          onInsert={insertAtCursor}
        />
      </div>

      {inspector && (
        <WordInspectorPopover
          word={inspector.word}
          x={inspector.x}
          y={inspector.y}
          onClose={() => setInspector(null)}
        />
      )}
    </div>
    <PrintablePoem title={title} body={body} />
    </>
  )
}
