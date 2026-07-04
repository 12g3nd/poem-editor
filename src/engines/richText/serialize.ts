import { generateHTML, type JSONContent } from '@tiptap/core'
import { storyExtensions } from '@/engines/richText/extensions'

export function docToHtml(doc: JSONContent): string {
  return generateHTML(doc, storyExtensions)
}

/** Applies a node's inline marks to already-rendered inner text. Order
 * matters little for these; links wrap outermost. */
function applyMarks(text: string, marks: JSONContent['marks']): string {
  let out = text
  for (const mark of marks ?? []) {
    if (mark.type === 'bold') out = `**${out}**`
    else if (mark.type === 'italic') out = `*${out}*`
    else if (mark.type === 'strike') out = `~~${out}~~`
    else if (mark.type === 'link') out = `[${out}](${mark.attrs?.href ?? ''})`
    // underline/highlight/color/comment have no Markdown equivalent — ignored
  }
  return out
}

function inlineToMarkdown(nodes: JSONContent[] | undefined): string {
  return (nodes ?? [])
    .map((node) => (node.type === 'text' ? applyMarks(node.text ?? '', node.marks) : ''))
    .join('')
}

function blockToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case 'heading':
      return `${'#'.repeat(node.attrs?.level ?? 1)} ${inlineToMarkdown(node.content)}`
    case 'paragraph':
      return inlineToMarkdown(node.content)
    case 'blockquote':
      return (node.content ?? []).map((c) => `> ${blockToMarkdown(c)}`).join('\n')
    case 'bulletList':
      return (node.content ?? [])
        .map((li) => `- ${inlineToMarkdown(li.content?.[0]?.content)}`)
        .join('\n')
    case 'orderedList':
      return (node.content ?? [])
        .map((li, i) => `${i + 1}. ${inlineToMarkdown(li.content?.[0]?.content)}`)
        .join('\n')
    case 'horizontalRule':
      return '---'
    default:
      return inlineToMarkdown(node.content)
  }
}

export function docToMarkdown(title: string, doc: JSONContent): string {
  const heading = title.trim().length > 0 ? title : 'Untitled'
  const body = (doc.content ?? []).map(blockToMarkdown).join('\n\n')
  return `# ${heading}\n\n${body}`.trimEnd()
}
