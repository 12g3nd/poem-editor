import { generateText, type JSONContent } from '@tiptap/core'
import { storyExtensions } from '@/engines/richText/extensions'
import { EMPTY_DOC } from '@/engines/richText/emptyDoc'

export { EMPTY_DOC }

/** The plain-text projection of a rich document — one blank line between
 * blocks so paragraph/word/reading stats and the line-based diff read it the
 * same way they read a plain story's body. */
export function docToPlainText(doc: JSONContent): string {
  return generateText(doc, storyExtensions, { blockSeparator: '\n\n' })
}
