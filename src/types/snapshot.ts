export interface Snapshot {
  id: string
  poemId: string
  title: string
  body: string
  /** Rich-story document JSON captured with this snapshot, when present. */
  content?: object
  createdAt: number
  label?: string
}
