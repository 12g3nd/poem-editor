import type { PoemStatus } from '@/types/poem'
import type { DocKind } from '@/types/libraryDoc'

/** The minimal shape searchPoems/filterPoems/allTags need — satisfied by
 * both Poem and the merged LibraryDoc (poem or story), so the library can
 * filter a combined list without these functions knowing about either
 * type's extra fields. Generic over T so callers get back the same
 * concrete type they passed in, not a widened base type. */
export interface FilterableDoc {
  title: string
  body: string
  tags?: string[]
  status?: PoemStatus
  favorite?: boolean
  collectionIds?: string[]
  kind?: DocKind
}

export interface LibraryFilters {
  searchQuery?: string
  status?: PoemStatus | null
  tag?: string | null
  collectionId?: string | null
  favoriteOnly?: boolean
  kind?: DocKind | null
}

/** Case-insensitive substring match across title and body. */
export function searchPoems<T extends FilterableDoc>(poems: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return poems
  return poems.filter((poem) => poem.title.toLowerCase().includes(q) || poem.body.toLowerCase().includes(q))
}

export function filterPoems<T extends FilterableDoc>(poems: T[], filters: LibraryFilters): T[] {
  let result = poems

  if (filters.searchQuery) result = searchPoems(result, filters.searchQuery)
  if (filters.status) result = result.filter((poem) => (poem.status ?? 'draft') === filters.status)
  if (filters.tag) result = result.filter((poem) => (poem.tags ?? []).includes(filters.tag as string))
  if (filters.collectionId) {
    result = result.filter((poem) => (poem.collectionIds ?? []).includes(filters.collectionId as string))
  }
  if (filters.favoriteOnly) result = result.filter((poem) => poem.favorite)
  if (filters.kind) result = result.filter((poem) => poem.kind === filters.kind)

  return result
}

/** Every distinct tag across the library, alphabetically. */
export function allTags<T extends FilterableDoc>(poems: T[]): string[] {
  const tags = new Set<string>()
  for (const poem of poems) {
    for (const tag of poem.tags ?? []) tags.add(tag)
  }
  return Array.from(tags).sort()
}
