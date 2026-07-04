import { useState } from 'react'
import type { Collection } from '@/types/collection'
import { createCollection, deleteCollection } from '@/db/collections'

interface CollectionsPanelProps {
  collections: Collection[]
}

export function CollectionsPanel({ collections }: CollectionsPanelProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    await createCollection(trimmed)
    setName('')
  }

  return (
    <div className="border-b border-canvas-line px-8 py-3 text-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-ink/50 hover:text-indigo">
        {open ? '▾' : '▸'} Collections ({collections.length})
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New collection name"
              className="w-56 rounded border border-canvas-line bg-canvas px-2 py-1 outline-none focus:border-indigo"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-indigo px-3 py-1 text-xs font-medium text-paper hover:bg-indigo-soft"
            >
              Create
            </button>
          </div>

          {collections.length > 0 && (
            <ul className="space-y-1">
              {collections.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-ink/70">
                  <span>{c.name}</span>
                  {pendingDeleteId === c.id ? (
                    <span className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          void deleteCollection(c.id)
                          setPendingDeleteId(null)
                        }}
                        className="font-medium text-berry hover:underline"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="text-ink/50 hover:underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(c.id)}
                      className="text-xs text-ink/40 hover:text-berry"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
