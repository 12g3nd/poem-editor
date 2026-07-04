import { getSchema } from '@tiptap/core'
import type { Extensions } from '@tiptap/core'
import type { Schema } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Comment } from '@/engines/richText/Comment'

/** Single source of truth for the story rich-text document shape. Used both
 * to configure the live editor (RichStoryEditor) and to build the headless
 * schema the pure serializers (projection/serialize/comments) run against, so
 * the two can never drift. */
export const storyExtensions: Extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Placeholder.configure({ placeholder: 'Once upon a time…' }),
  Comment,
]

let cachedSchema: Schema | null = null

export function getStorySchema(): Schema {
  if (!cachedSchema) cachedSchema = getSchema(storyExtensions)
  return cachedSchema
}
