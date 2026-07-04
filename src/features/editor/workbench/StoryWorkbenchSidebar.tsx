import { useEffect, useState } from 'react'
import { ThesaurusTab } from '@/features/editor/workbench/ThesaurusTab'
import { SparkTab } from '@/features/editor/workbench/SparkTab'
import { AskAiTab } from '@/features/editor/workbench/AskAiTab'
import { RecentLookupsTab } from '@/features/editor/workbench/RecentLookupsTab'

const TABS = [
  { id: 'thesaurus', label: 'Thesaurus' },
  { id: 'recent', label: 'Recent' },
  { id: 'spark', label: 'Spark' },
  { id: 'ai', label: 'Ask AI' },
] as const

type TabId = (typeof TABS)[number]['id']

interface StoryWorkbenchSidebarProps {
  activeWord: string | null
  body: string
  onInsert: (word: string) => void
}

/** The poem workbench's Rhymes/Syllables/Sound/Meter/Form tabs don't apply
 * to prose — this is the same word-lookup + writing-aid tooling (Thesaurus,
 * Spark, Ask AI), reused as-is, without the poetry-analysis tabs. */
export function StoryWorkbenchSidebar({ activeWord, body, onInsert }: StoryWorkbenchSidebarProps) {
  const [tab, setTab] = useState<TabId>('thesaurus')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    if (!activeWord) return
    setRecent((prev) => [activeWord, ...prev.filter((w) => w !== activeWord)].slice(0, 12))
  }, [activeWord])

  const word = activeWord ?? ''

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-canvas-line bg-paper">
      <nav className="flex flex-wrap border-b border-canvas-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`flex-1 px-1.5 py-3 text-xs font-medium transition-colors ${
              tab === t.id ? 'border-b-2 border-indigo text-indigo' : 'text-ink/40 hover:text-ink/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'thesaurus' && <ThesaurusTab word={word} onInsert={onInsert} />}
        {tab === 'recent' && <RecentLookupsTab words={recent} onSelect={onInsert} />}
        {tab === 'spark' && <SparkTab onInsert={onInsert} />}
        {tab === 'ai' && <AskAiTab body={body} />}
      </div>
    </aside>
  )
}
