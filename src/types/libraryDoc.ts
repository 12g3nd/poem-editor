import type { Poem, PoemStatus } from '@/types/poem'
import type { Story } from '@/types/story'

export type DocKind = 'poem' | 'story'

/** The shape LibraryPage renders and filters — a poem or a story tagged
 * with which one it is, so the two can be listed, searched, and filtered
 * side by side without the library needing to know about poem-only fields
 * (rhyme overrides, form template, etc.) or duplicate its UI per type. */
export interface LibraryDoc {
  kind: DocKind
  id: string
  title: string
  body: string
  createdAt: number
  modifiedAt: number
  tags?: string[]
  status?: PoemStatus
  favorite?: boolean
  collectionIds?: string[]
  /** Poem-only — carried through so PoemListItem-equivalent UI can still
   * show the form-template badge for poems. */
  formId?: string | null
}

export function poemToLibraryDoc(poem: Poem): LibraryDoc {
  return { ...poem, kind: 'poem' }
}

export function storyToLibraryDoc(story: Story): LibraryDoc {
  return { ...story, kind: 'story' }
}
