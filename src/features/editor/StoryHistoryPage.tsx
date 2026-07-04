import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getStory, restoreStorySnapshot } from '@/db/stories'
import { listSnapshots } from '@/db/snapshots'
import { DiffView } from '@/features/editor/DiffView'

const CURRENT = 'current'

/** Mirrors HistoryPage.tsx (the poem version history browser) for stories —
 * a separate component rather than parametrizing the poem one, since the
 * restore target lookup (getStory/updateStory vs getPoem/updatePoem)
 * differs; the shared snapshots table and DiffView are reused as-is. */
export function StoryHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const story = useLiveQuery(() => (id ? getStory(id) : null), [id])
  const snapshots = useLiveQuery(() => (id ? listSnapshots(id) : []), [id])

  const [compareA, setCompareA] = useState<string>(CURRENT)
  const [compareB, setCompareB] = useState<string>(CURRENT)
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null)

  const versions = useMemo(() => {
    const list: { id: string; label: string; body: string }[] = []
    if (story) list.push({ id: CURRENT, label: 'Current', body: story.body })
    for (const snapshot of snapshots ?? []) {
      list.push({
        id: snapshot.id,
        label: `${new Date(snapshot.createdAt).toLocaleString()}${snapshot.label ? ` — ${snapshot.label}` : ''}`,
        body: snapshot.body,
      })
    }
    return list
  }, [story, snapshots])

  const bodyById = useMemo(() => new Map(versions.map((v) => [v.id, v.body])), [versions])

  async function handleRestore(snapshotId: string) {
    await restoreStorySnapshot(snapshotId)
    setPendingRestoreId(null)
  }

  if (story === undefined || snapshots === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    )
  }

  if (story === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas">
        <p className="font-display text-lg text-ink">This story doesn&rsquo;t exist (anymore).</p>
        <button type="button" onClick={() => navigate('/')} className="text-indigo hover:underline">
          Back to library
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-canvas">
      <header className="flex items-center justify-between border-b border-canvas-line px-8 py-4">
        <Link to={`/story/${id}`} className="text-sm text-ink/50 transition-colors hover:text-indigo">
          ← Back to story
        </Link>
        <h1 className="font-display text-lg text-ink">{story.title || 'Untitled'} — History</h1>
        <span className="w-24" />
      </header>

      <main className="mx-auto max-w-3xl px-8 py-10">
        {snapshots.length === 0 ? (
          <p className="text-sm text-ink/50">
            No snapshots yet. Use the &ldquo;Snapshot&rdquo; button in the editor to save a checkpoint you can
            come back to.
          </p>
        ) : (
          <ul className="mb-10 divide-y divide-canvas-line rounded-lg border border-canvas-line bg-paper">
            {versions
              .filter((v) => v.id !== CURRENT)
              .map((version) => (
                <li key={version.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <span className="text-sm text-ink/70">{version.label}</span>
                  {pendingRestoreId === version.id ? (
                    <div className="flex shrink-0 items-center gap-3 text-sm">
                      <span className="text-ink/50">Restore this version?</span>
                      <button
                        type="button"
                        onClick={() => handleRestore(version.id)}
                        className="font-medium text-indigo hover:underline"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRestoreId(null)}
                        className="text-ink/50 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingRestoreId(version.id)}
                      className="shrink-0 text-xs text-ink/40 hover:text-indigo"
                    >
                      Restore
                    </button>
                  )}
                </li>
              ))}
          </ul>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink/70">
          <span>Compare</span>
          <select
            value={compareA}
            onChange={(event) => setCompareA(event.target.value)}
            className="rounded border border-canvas-line bg-paper px-2 py-1"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <span>with</span>
          <select
            value={compareB}
            onChange={(event) => setCompareB(event.target.value)}
            className="rounded border border-canvas-line bg-paper px-2 py-1"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <DiffView oldText={bodyById.get(compareA) ?? ''} newText={bodyById.get(compareB) ?? ''} />
      </main>
    </div>
  )
}
