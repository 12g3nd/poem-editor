import type { PoemStatus } from '@/types/poem'

/** A long-form prose document — the "short story mode" counterpart to Poem.
 * Deliberately has none of the poem-specific analysis fields (rhyme/scansion
 * overrides, target meter, form template) since none of them apply to prose;
 * shares the same status/tags/favorite/collection shape as Poem so the
 * library can list both side by side. */
export interface Story {
  id: string
  title: string
  /** Plain prose text — wrapped and paginated by the browser, not rendered
   * line-by-line the way a poem's body is. */
  body: string
  createdAt: number
  modifiedAt: number
  tags?: string[]
  status?: PoemStatus
  favorite?: boolean
  collectionIds?: string[]
}
