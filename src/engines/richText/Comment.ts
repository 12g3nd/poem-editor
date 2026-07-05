import { Mark, mergeAttributes } from '@tiptap/core'

/** A comment anchor. Rendered as a highlighted span carrying its thread id;
 * the thread's text/resolved state live in story.comments (keyed by id).
 * `inclusive: false` so typing at the very edge of a comment does not
 * silently extend it. */
export const Comment = Mark.create({
  name: 'comment',
  inclusive: false,
  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-comment-id'),
        renderHTML: (attrs) =>
          attrs.commentId ? { 'data-comment-id': attrs.commentId } : {},
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'story-comment' }), 0]
  },
})
