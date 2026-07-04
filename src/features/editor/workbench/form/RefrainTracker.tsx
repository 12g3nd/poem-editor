import { useMemo } from 'react'
import type { FormTemplate } from '@/types/form'
import { contentLines } from '@/engines/formValidation'

interface RefrainTrackerProps {
  template: FormTemplate
  body: string
  onInsert: (text: string) => void
}

function refrainGroups(template: FormTemplate): Map<number, number[]> {
  const groups = new Map<number, number[]>()
  template.lineRules.forEach((rule, index) => {
    if (rule.refrainOf !== undefined) {
      const list = groups.get(rule.refrainOf)
      if (list) list.push(index)
      else groups.set(rule.refrainOf, [index])
    }
  })
  return groups
}

export function RefrainTracker({ template, body, onInsert }: RefrainTrackerProps) {
  const groups = useMemo(() => refrainGroups(template), [template])
  const lines = useMemo(() => contentLines(body), [body])

  if (groups.size === 0) return null

  return (
    <div className="space-y-3 border-t border-canvas-line pt-3">
      <p className="text-xs font-medium text-ink/40">Refrain tracker</p>
      {Array.from(groups.entries()).map(([sourceIndex, targets]) => {
        const sourceText = lines[sourceIndex]
        return (
          <div key={sourceIndex} className="rounded border border-canvas-line bg-canvas px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink/70">
                Line {sourceIndex + 1} → repeats at line{targets.length === 1 ? '' : 's'}{' '}
                {targets.map((t) => t + 1).join(', ')}
              </span>
              {sourceText && (
                <button
                  type="button"
                  onClick={() => onInsert(sourceText)}
                  className="shrink-0 rounded-full border border-canvas-line bg-paper px-2.5 py-0.5 text-xs text-ink hover:border-indigo hover:text-indigo"
                >
                  Insert
                </button>
              )}
            </div>
            {sourceText && <p className="mt-1 italic text-ink/50">&ldquo;{sourceText}&rdquo;</p>}
          </div>
        )
      })}
    </div>
  )
}
