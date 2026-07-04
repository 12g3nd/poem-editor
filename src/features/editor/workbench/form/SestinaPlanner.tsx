import { useMemo } from 'react'
import { contentLines } from '@/engines/formValidation'
import { lastWord } from '@/engines/normalize'
import {
  planSestina,
  validateSestina,
  SESTINA_STANZA_LINES,
  SESTINA_STANZA_COUNT,
} from '@/engines/sestina'
import { ChecklistView } from '@/features/editor/workbench/form/ChecklistView'

interface SestinaPlannerProps {
  body: string
  strictMode: boolean
}

export function SestinaPlanner({ body, strictMode }: SestinaPlannerProps) {
  const lines = useMemo(() => contentLines(body), [body])
  const firstStanzaComplete = lines.length >= SESTINA_STANZA_LINES

  const plan = useMemo(() => {
    if (!firstStanzaComplete) return null
    const words = lines.slice(0, SESTINA_STANZA_LINES).map((line) => lastWord(line) ?? '')
    return planSestina(words)
  }, [lines, firstStanzaComplete])

  const items = useMemo(() => validateSestina(body), [body])

  if (!firstStanzaComplete) {
    return (
      <div className="space-y-2 border-t border-canvas-line pt-3">
        <p className="text-xs font-medium text-ink/40">End-word planner</p>
        <p className="text-sm text-ink/50">
          Write all six lines of the first stanza — the words you end them with set the required
          rotation for the rest of the poem.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 border-t border-canvas-line pt-3">
      <p className="text-xs font-medium text-ink/40">End-word plan (stanzas 2–6 + envoi)</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {plan!.slice(SESTINA_STANZA_LINES).map((req) => (
          <div key={req.lineIndex} className="flex justify-between text-ink/70">
            <span>Line {req.lineIndex + 1}</span>
            <span className="font-medium text-ink">{req.requiredEndWord}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink/30">
        Standard rotation across {SESTINA_STANZA_COUNT} stanzas, envoi included.
      </p>
      <ChecklistView items={items} strictMode={strictMode} />
    </div>
  )
}
