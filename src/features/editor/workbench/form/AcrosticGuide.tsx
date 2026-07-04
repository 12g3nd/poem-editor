import { useMemo } from 'react'
import { planAcrostic, validateAcrostic } from '@/engines/acrostic'
import { ChecklistView } from '@/features/editor/workbench/form/ChecklistView'

interface AcrosticGuideProps {
  body: string
  word: string
  strictMode: boolean
  onWordChange: (word: string) => void
}

export function AcrosticGuide({ body, word, strictMode, onWordChange }: AcrosticGuideProps) {
  const requirements = useMemo(() => planAcrostic(word), [word])
  const items = useMemo(() => (word ? validateAcrostic(body, word) : []), [body, word])

  return (
    <div className="space-y-3 border-t border-canvas-line pt-3">
      <label className="block text-xs font-medium text-ink/40" htmlFor="acrostic-word">
        Acrostic word
      </label>
      <input
        id="acrostic-word"
        value={word}
        onChange={(event) => onWordChange(event.target.value)}
        placeholder="e.g. POEM"
        className="w-full rounded border border-canvas-line bg-canvas px-3 py-1.5 text-sm outline-none focus:border-indigo"
      />

      {requirements.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {requirements.map((req) => (
              <span
                key={req.lineIndex}
                className="flex h-7 w-7 items-center justify-center rounded border border-canvas-line bg-canvas font-display text-sm text-indigo"
              >
                {req.requiredLetter}
              </span>
            ))}
          </div>
          <ChecklistView items={items} strictMode={strictMode} />
        </>
      )}
    </div>
  )
}
