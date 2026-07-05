import { forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor, JSONContent } from '@tiptap/core'
import { storyExtensions } from '@/engines/richText/extensions'
import { docToPlainText } from '@/engines/richText/projection'
import { normalizeWord } from '@/engines/normalize'
import type { StorySurfaceHandle } from '@/features/editor/story/storySurface'

export interface RichStoryHandle extends StorySurfaceHandle {
  editor: Editor | null
}

interface RichStoryEditorProps {
  content: JSONContent
  onChange: (content: JSONContent, plainText: string) => void
  onActiveWordChange: (word: string | null) => void
  fontFamily: string
  fontSize: number
  lineHeight: number
}

/** Reads the word surrounding the current selection head from the live
 * document, mirroring getWordAtPosition for the plain surface. */
function activeWordFromEditor(editor: Editor | null): string | null {
  if (!editor) return null
  const { state } = editor
  const { from } = state.selection
  const parentText = state.doc.textBetween(
    Math.max(0, from - 60),
    Math.min(state.doc.content.size, from + 60),
    '\n',
    ' ',
  )
  // Find the token in parentText that straddles the caret's local offset.
  const localCaret = Math.min(60, from)
  const before = parentText.slice(0, localCaret).match(/[\p{L}'-]+$/u)?.[0] ?? ''
  const after = parentText.slice(localCaret).match(/^[\p{L}'-]+/u)?.[0] ?? ''
  const raw = before + after
  const word = normalizeWord(raw)
  return word.length > 0 ? word : null
}

export const RichStoryEditor = forwardRef<RichStoryHandle, RichStoryEditorProps>(
  function RichStoryEditor({ content, onChange, onActiveWordChange, fontFamily, fontSize, lineHeight }, ref) {
    const editor = useEditor({
      extensions: storyExtensions,
      content,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const json = editor.getJSON()
        onChange(json, docToPlainText(json))
      },
      onSelectionUpdate: ({ editor }) => onActiveWordChange(activeWordFromEditor(editor)),
    })

    useImperativeHandle(
      ref,
      () => ({
        editor,
        getActiveWord: () => activeWordFromEditor(editor),
        insertText: (text: string) => editor?.chain().focus().insertContent(text).run(),
        getPlainText: () => (editor ? docToPlainText(editor.getJSON()) : ''),
      }),
      [editor],
    )

    return (
      <EditorContent
        editor={editor}
        className="mt-6 w-full"
        style={{ fontSize, lineHeight: `${lineHeight}px`, fontFamily, color: 'var(--color-ink)' }}
      />
    )
  },
)
