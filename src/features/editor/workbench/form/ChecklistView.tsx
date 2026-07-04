import type { ChecklistItem } from '@/types/form'

interface ChecklistViewProps {
  items: ChecklistItem[]
  /** Strict Mode makes every deviation prominent instead of quietly muted —
   * validation still never blocks writing, it just speaks up more. */
  strictMode: boolean
}

function StatusIcon({ status, strictMode }: { status: ChecklistItem['status']; strictMode: boolean }) {
  if (status === 'pass') return <span className="text-verdigris">✓</span>
  if (status === 'pending') return <span className="text-ink/30">…</span>
  return <span className={strictMode ? 'font-bold text-berry' : 'text-berry/70'}>✗</span>
}

export function ChecklistView({ items, strictMode }: ChecklistViewProps) {
  if (items.length === 0) {
    return <p className="text-sm text-ink/40">Nothing to check for this form.</p>
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li
          key={index}
          className={`flex items-start gap-2 text-sm ${
            item.status === 'fail' && strictMode ? 'rounded bg-berry/10 px-2 py-1' : ''
          }`}
        >
          <StatusIcon status={item.status} strictMode={strictMode} />
          <span className={item.status === 'pending' ? 'text-ink/40' : 'text-ink/80'}>
            {item.line > 0 ? `Line ${item.line}: ` : ''}
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
