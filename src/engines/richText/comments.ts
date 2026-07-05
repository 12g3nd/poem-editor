import type { JSONContent } from '@tiptap/core'
import type { StoryComment } from '@/types/story'

/** Walks the document JSON and collects every commentId carried by a
 * `comment` mark. Used to tell which threads are still anchored. */
export function collectCommentIds(doc: JSONContent): Set<string> {
  const ids = new Set<string>()
  const visit = (node: JSONContent) => {
    for (const mark of node.marks ?? []) {
      if (mark.type === 'comment' && mark.attrs?.commentId) {
        ids.add(mark.attrs.commentId as string)
      }
    }
    for (const child of node.content ?? []) visit(child)
  }
  visit(doc)
  return ids
}

/** Splits threads into those whose anchor still exists in the document and
 * those whose text was deleted (detached — shown separately, not lost). */
export function partitionComments(
  comments: StoryComment[],
  doc: JSONContent,
): { anchored: StoryComment[]; detached: StoryComment[] } {
  const present = collectCommentIds(doc)
  const anchored: StoryComment[] = []
  const detached: StoryComment[] = []
  for (const comment of comments) {
    ;(present.has(comment.id) ? anchored : detached).push(comment)
  }
  return { anchored, detached }
}
