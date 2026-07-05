import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, Link } from 'react-router-dom'
import { listPoems, createPoem } from '@/db/poems'
import { listStories, createStory } from '@/db/stories'
import { listCollections } from '@/db/collections'
import { listCustomForms } from '@/db/customForms'
import { useSettings } from '@/engines/SettingsContext'
import { filterPoems, allTags } from '@/engines/libraryFilter'
import { BUILT_IN_TEMPLATES_BY_ID } from '@/engines/formTemplates/index'
import type { PoemStatus } from '@/types/poem'
import { poemToLibraryDoc, storyToLibraryDoc, type DocKind } from '@/types/libraryDoc'
import { LibraryListItem } from '@/features/library/LibraryListItem'
import { LibraryToolbar } from '@/features/library/LibraryToolbar'
import { CollectionsPanel } from '@/features/library/CollectionsPanel'
import { ImportExportPanel } from '@/features/library/ImportExportPanel'
import { SettingsPanel } from '@/features/settings/SettingsPanel'

export function LibraryPage() {
  const { settings } = useSettings()
  const poems = useLiveQuery(() => listPoems(), [])
  const stories = useLiveQuery(() => listStories(), [])
  const collections = useLiveQuery(() => listCollections(), []) ?? []
  const customForms = useLiveQuery(() => listCustomForms(), []) ?? []
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [kind, setKind] = useState<DocKind | null>(null)
  const [status, setStatus] = useState<PoemStatus | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const docs = useMemo(() => {
    if (!poems || !stories) return undefined
    return [...poems.map(poemToLibraryDoc), ...stories.map(storyToLibraryDoc)].sort(
      (a, b) => b.modifiedAt - a.modifiedAt,
    )
  }, [poems, stories])

  const tags = useMemo(() => allTags(docs ?? []), [docs])

  const filteredDocs = useMemo(() => {
    if (!docs) return undefined
    return filterPoems(docs, { searchQuery, kind, status, tag, collectionId, favoriteOnly })
  }, [docs, searchQuery, kind, status, tag, collectionId, favoriteOnly])

  function formName(formId?: string | null): string | null {
    if (!formId) return null
    return BUILT_IN_TEMPLATES_BY_ID[formId]?.name ?? customForms.find((f) => f.id === formId)?.name ?? null
  }

  async function handleNewPoem() {
    const poem = await createPoem()
    navigate(`/poem/${poem.id}`)
  }

  async function handleNewStory() {
    const story = await createStory('Untitled', settings.storyEditorMode)
    navigate(`/story/${story.id}`)
  }

  return (
    <div className="min-h-full bg-canvas">
      <header className="flex items-center justify-between border-b border-canvas-line px-8 py-6">
        <h1 className="font-display text-2xl tracking-tight text-ink">Poem Editor</h1>
        <div className="flex items-center gap-5">
          <Link to="/stats" className="text-sm text-ink/50 hover:text-indigo">
            Stats
          </Link>
          <ImportExportPanel />
          <SettingsPanel />
          <button
            type="button"
            onClick={handleNewStory}
            className="rounded-full border border-canvas-line px-5 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-indigo hover:text-indigo"
          >
            New story
          </button>
          <button
            type="button"
            onClick={handleNewPoem}
            className="rounded-full bg-indigo px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-indigo-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            New poem
          </button>
        </div>
      </header>

      <CollectionsPanel collections={collections} />

      <LibraryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        kind={kind}
        onKindChange={setKind}
        status={status}
        onStatusChange={setStatus}
        tag={tag}
        onTagChange={setTag}
        tags={tags}
        collectionId={collectionId}
        onCollectionChange={setCollectionId}
        collections={collections}
        favoriteOnly={favoriteOnly}
        onFavoriteOnlyChange={setFavoriteOnly}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="mx-auto max-w-4xl px-8 py-10">
        {docs === undefined ? (
          <p className="text-sm text-ink/50">Loading your library…</p>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-canvas-line px-6 py-16 text-center">
            <p className="font-display text-lg text-ink/70">An empty shelf.</p>
            <p className="mt-2 text-sm text-ink/50">
              Start your first poem or story — it&rsquo;s waiting to be written.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleNewStory}
                className="rounded-full border border-canvas-line px-5 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-indigo hover:text-indigo"
              >
                New story
              </button>
              <button
                type="button"
                onClick={handleNewPoem}
                className="rounded-full bg-indigo px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-indigo-soft"
              >
                New poem
              </button>
            </div>
          </div>
        ) : filteredDocs && filteredDocs.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/50">Nothing matches these filters.</p>
        ) : viewMode === 'list' ? (
          <ul className="divide-y divide-canvas-line rounded-lg border border-canvas-line bg-paper">
            {filteredDocs?.map((doc) => (
              <li key={doc.id}>
                <LibraryListItem doc={doc} formName={formName(doc.formId)} viewMode="list" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs?.map((doc) => (
              <LibraryListItem key={doc.id} doc={doc} formName={formName(doc.formId)} viewMode="grid" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
