import { useEffect, useState } from 'react'
import { RhymesTab } from '@/features/editor/workbench/RhymesTab'
import { ThesaurusTab } from '@/features/editor/workbench/ThesaurusTab'
import { SyllablesStressTab } from '@/features/editor/workbench/SyllablesStressTab'
import { SoundToolsTab } from '@/features/editor/workbench/SoundToolsTab'
import { MeterTab } from '@/features/editor/workbench/MeterTab'
import { FormTab } from '@/features/editor/workbench/form/FormTab'
import { RecentLookupsTab } from '@/features/editor/workbench/RecentLookupsTab'
import { SparkTab } from '@/features/editor/workbench/SparkTab'
import { AskAiTab } from '@/features/editor/workbench/AskAiTab'

const TABS = [
  { id: 'rhymes', label: 'Rhymes' },
  { id: 'thesaurus', label: 'Thesaurus' },
  { id: 'syllables', label: 'Syllables' },
  { id: 'sound', label: 'Sound' },
  { id: 'meter', label: 'Meter' },
  { id: 'form', label: 'Form' },
  { id: 'recent', label: 'Recent' },
  { id: 'spark', label: 'Spark' },
  { id: 'ai', label: 'Ask AI' },
] as const

type TabId = (typeof TABS)[number]['id']

interface WorkbenchSidebarProps {
  activeWord: string | null
  poemWords: Set<string>
  body: string
  formId: string | null
  acrosticWord: string
  onFormChange: (formId: string | null) => void
  onAcrosticWordChange: (word: string) => void
  onInsert: (word: string) => void
  /** Collapsed/focus mode keeps the sidebar mounted but visually hidden, so
   * the Ask AI conversation survives being toggled off and back on. */
  hidden?: boolean
}

export function WorkbenchSidebar({
  activeWord,
  poemWords,
  body,
  formId,
  acrosticWord,
  onFormChange,
  onAcrosticWordChange,
  onInsert,
  hidden,
}: WorkbenchSidebarProps) {
  const [tab, setTab] = useState<TabId>('rhymes')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    if (!activeWord) return
    setRecent((prev) => [activeWord, ...prev.filter((w) => w !== activeWord)].slice(0, 12))
  }, [activeWord])

  const word = activeWord ?? ''

  return (
    <aside className={`${hidden ? 'hidden' : 'flex'} w-80 shrink-0 flex-col border-l border-canvas-line bg-paper`}>
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
        {tab === 'rhymes' && <RhymesTab word={word} onInsert={onInsert} />}
        {tab === 'thesaurus' && <ThesaurusTab word={word} onInsert={onInsert} />}
        {tab === 'syllables' && <SyllablesStressTab />}
        {tab === 'sound' && <SoundToolsTab word={word} poemWords={poemWords} onInsert={onInsert} />}
        {tab === 'meter' && <MeterTab body={body} />}
        {tab === 'form' && (
          <FormTab
            body={body}
            formId={formId}
            acrosticWord={acrosticWord}
            onFormChange={onFormChange}
            onAcrosticWordChange={onAcrosticWordChange}
            onInsert={onInsert}
          />
        )}
        {tab === 'recent' && <RecentLookupsTab words={recent} onSelect={onInsert} />}
        {tab === 'spark' && <SparkTab onInsert={onInsert} />}
        {/* Ask AI stays mounted (just hidden) so switching tabs — or collapsing
         * the whole panel — never throws away the conversation in progress. */}
        <div className={tab === 'ai' ? 'h-full' : 'hidden'}>
          <AskAiTab body={body} />
        </div>
      </div>
    </aside>
  )
}
