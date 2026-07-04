import type { JSONContent } from '@tiptap/core'

export interface Snapshot {
  id: string
  poemId: string
  title: string
  body: string
  /** Rich-story document JSON captured with this snapshot, when present. */
  content?: JSONContent
  createdAt: number
  label?: string
}
