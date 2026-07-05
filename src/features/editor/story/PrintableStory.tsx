import type { JSONContent } from '@tiptap/core'
import type { StoryFormat } from '@/types/story'
import { docToHtml } from '@/engines/richText/serialize'

interface PrintableStoryProps {
  title: string
  format: StoryFormat
  body: string
  content?: JSONContent
}

/** Off-screen print/PDF surface for stories. Rich stories render their
 * formatted HTML; plain stories keep the line-split rendering used by
 * PrintablePoem. Always plain black-on-white regardless of theme. */
export function PrintableStory({ title, format, body, content }: PrintableStoryProps) {
  const heading = title.trim().length > 0 ? title : 'Untitled'
  return (
    <div className="hidden print:block" style={{ color: '#1a1a1a', background: '#ffffff' }}>
      <h1 className="mb-10 text-center text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        {heading}
      </h1>
      <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '13pt', lineHeight: 1.6 }}>
        {format === 'rich' && content ? (
          <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: docToHtml(content) }} />
        ) : (
          body.split('\n').map((line, i) => <div key={i}>{line.length > 0 ? line : ' '}</div>)
        )}
      </div>
    </div>
  )
}
