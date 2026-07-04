import { useMemo, useState } from 'react'
import { poemToPlainText, poemToMarkdown, slugifyFilename } from '@/features/editor/exportPoem'
import { useRegisterCommands, type Command } from '@/engines/CommandPaletteContext'

interface ExportMenuProps {
  title: string
  body: string
}

function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportMenu({ title, body }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(poemToPlainText(title, body))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleDownloadTxt() {
    downloadTextFile(poemToPlainText(title, body), `${slugifyFilename(title)}.txt`, 'text/plain')
    setOpen(false)
  }

  function handleDownloadMarkdown() {
    downloadTextFile(poemToMarkdown(title, body), `${slugifyFilename(title)}.md`, 'text/markdown')
    setOpen(false)
  }

  function handlePrint() {
    setOpen(false)
    window.print()
  }

  const commands = useMemo<Command[]>(
    () => [
      { id: 'export-copy', label: 'Copy to clipboard', run: () => void handleCopy() },
      { id: 'export-txt', label: 'Download as .txt', run: handleDownloadTxt },
      { id: 'export-md', label: 'Download as .md', run: handleDownloadMarkdown },
      { id: 'export-pdf', label: 'Export as PDF (print)', run: handlePrint },
    ],
    // Every handler closes over the latest title/body props and is
    // recreated each render (not memoized) — recomputing every render keeps
    // the palette from ever running a stale copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, body],
  )
  useRegisterCommands('export-menu', commands)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-ink/50 hover:text-indigo"
      >
        Export
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-48 space-y-1 rounded-lg border border-canvas-line bg-paper p-2 text-sm shadow-lg">
            <button
              type="button"
              onClick={handleCopy}
              className="block w-full rounded px-3 py-2 text-left text-ink/70 hover:bg-canvas hover:text-indigo"
            >
              {copied ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="block w-full rounded px-3 py-2 text-left text-ink/70 hover:bg-canvas hover:text-indigo"
            >
              Download .txt
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="block w-full rounded px-3 py-2 text-left text-ink/70 hover:bg-canvas hover:text-indigo"
            >
              Download .md
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="block w-full rounded px-3 py-2 text-left text-ink/70 hover:bg-canvas hover:text-indigo"
            >
              Export PDF (print)
            </button>
          </div>
        </>
      )}
    </div>
  )
}
