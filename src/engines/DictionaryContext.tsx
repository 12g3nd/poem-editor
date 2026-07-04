import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { loadDictionary } from '@/data/loadDictionary'
import { loadOverrideIndex } from '@/db/overrides'
import { buildRhymeIndex, type RhymeIndex } from '@/engines/rhymeIndex'
import type { DictionaryIndex } from '@/engines/dictionary'
import type { OverrideIndex } from '@/types/override'

interface DictionaryContextValue {
  dict: DictionaryIndex | null
  rhymeIndex: RhymeIndex | null
  overrides: OverrideIndex
  /** True until the bundled CMU dictionary has finished its one-time fetch. */
  loading: boolean
}

const DictionaryContext = createContext<DictionaryContextValue>({
  dict: null,
  rhymeIndex: null,
  overrides: new Map(),
  loading: true,
})

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const [dict, setDict] = useState<DictionaryIndex | null>(null)
  const overrides = useLiveQuery(() => loadOverrideIndex(), [])

  useEffect(() => {
    let cancelled = false
    loadDictionary().then((loaded) => {
      if (!cancelled) setDict(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Built once when the dictionary loads (not per-render): a linear pass
  // over ~126k entries, cheap once, but not something to redo on every
  // keystroke.
  const rhymeIndex = useMemo(() => (dict ? buildRhymeIndex(dict) : null), [dict])

  const value = useMemo<DictionaryContextValue>(
    () => ({
      dict,
      rhymeIndex,
      overrides: overrides ?? new Map(),
      loading: dict === null,
    }),
    [dict, rhymeIndex, overrides],
  )

  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>
}

export function useDictionary(): DictionaryContextValue {
  return useContext(DictionaryContext)
}
