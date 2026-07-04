interface RecentLookupsTabProps {
  words: string[]
  onSelect: (word: string) => void
}

export function RecentLookupsTab({ words, onSelect }: RecentLookupsTabProps) {
  if (words.length === 0) {
    return <p className="text-sm text-ink/40">Words you look up will show up here for this session.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onSelect(w)}
          className="rounded-full border border-canvas-line bg-canvas px-2.5 py-0.5 text-sm text-ink hover:border-indigo hover:text-indigo"
        >
          {w}
        </button>
      ))}
    </div>
  )
}
