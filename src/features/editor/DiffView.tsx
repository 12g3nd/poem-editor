import { diffLines } from '@/engines/diff'

interface DiffViewProps {
  oldText: string
  newText: string
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  const ops = diffLines(oldText, newText)

  return (
    <div className="rounded-lg border border-canvas-line bg-paper font-display text-sm leading-relaxed">
      {ops.map((op, index) => (
        <div
          key={index}
          className={
            op.type === 'added'
              ? 'bg-verdigris/10 px-4 py-0.5 text-verdigris'
              : op.type === 'removed'
                ? 'bg-berry/10 px-4 py-0.5 text-berry line-through decoration-berry/40'
                : 'px-4 py-0.5 text-ink/70'
          }
        >
          <span className="mr-2 select-none text-ink/30">
            {op.type === 'added' ? '+' : op.type === 'removed' ? '−' : ' '}
          </span>
          {op.line.length > 0 ? op.line : ' '}
        </div>
      ))}
    </div>
  )
}
