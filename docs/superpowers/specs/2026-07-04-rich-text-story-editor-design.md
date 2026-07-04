# Rich-text story editor (TipTap), with plain text kept as a mode

**Date:** 2026-07-04
**Status:** Approved design — ready for implementation planning

## Summary

Rewrite the **short-story editor** as a rich-text surface powered by
TipTap/ProseMirror, supporting bold/italic/underline/strikethrough, headings,
lists, block quote, horizontal rule, links, text color & highlight, paragraph
alignment, and Docs-style comments anchored to text. The existing plain-text
`<textarea>` experience is preserved as a selectable mode. Poems are entirely
out of scope and unchanged.

## Goals

- A full manuscript-grade rich editor for stories: essential prose formatting,
  color/highlight, paragraph alignment, and comments.
- Keep the old plain-text editor available as a "simple" option from Settings.
- No data loss for existing stories; no regressions to the poem editor.
- Fully offline at runtime (dependencies bundled by Vite; no network calls).

## Non-goals (v1)

- No rich text for **poems** — the scansion/rhyme/meter overlays depend on a
  plain-text line model and stay as they are.
- No formatting-aware diff in version history (diff remains line-based on the
  plain-text projection). Restoring a snapshot still restores formatting.
- No real-time collaboration, no multi-author identity on comments
  (single-user app).
- No inline images, tables, footnotes, or track-changes/suggesting mode.

## Decisions (resolved during brainstorming)

1. **Scope:** stories only. Poems untouched.
2. **Features:** essential prose formatting + color/highlight + comments +
   alignment (all four groups).
3. **Mode model:** a global Settings *default* determines the editor used for
   **newly created** stories; each story permanently records its own `format`,
   so existing/plain stories stay plain and rich stories stay rich. No live
   global re-render, no silent downgrade.
4. **Engine:** TipTap (on ProseMirror). Chosen primarily because ProseMirror's
   position mapping keeps comment anchors correct across edits, and its
   StarterKit + official extensions cover the whole formatting toolkit.
5. **New stories default to `rich`** (this is "completing the rewrite");
   choosing Plain in Settings restores the old behavior for new stories.
6. **Comments live as a sidebar tab** in the story workbench, not floating
   margin pins.
7. **`body` remains the canonical plain-text projection** for every rich
   story, regenerated on save; formatting lives beside it in `content`.

## Architecture

The story editor page becomes a thin shell that renders one of two surfaces
based on the story's own `format` field:

- `PlainStoryEditor` — the current `<textarea>` surface, extracted as-is.
- `RichStoryEditor` — new TipTap-based surface.

Both implement a shared imperative interface, exposed via a ref to the page, so
the workbench sidebar is agnostic to which surface is active:

```ts
interface StorySurface {
  getActiveWord(): string | null   // Thesaurus/Recent lookups
  insertText(text: string): void   // "insert word" from the sidebar
  getPlainText(): string           // AI context, stats, search projection
}
```

- `getActiveWord` — from the textarea selection (plain) or the ProseMirror
  selection's surrounding word (rich).
- `insertText` — textarea splice (plain) or a TipTap insert command (rich).
- `getPlainText` — the textarea value (plain) or the doc's text projection
  (rich).

The page owns title, autosave, focus mode, snapshot, and the workbench
sidebar; the surface owns only the editing model.

## Data model & back-compatibility

`Story` gains three optional fields:

```ts
interface Story {
  // ...existing fields...
  format?: 'plain' | 'rich'      // absent  => 'plain' (legacy-safe)
  content?: ProseMirrorJSON      // rich only: the ProseMirror document JSON
  comments?: StoryComment[]      // rich only: comment thread data
}

interface StoryComment {
  id: string          // referenced by the comment mark in `content`
  text: string        // the note body
  resolved: boolean
  createdAt: number
}
```

- **`body` is always kept in sync** as the plain-text rendering of the doc,
  regenerated from `content` on every save. Consumers that read `body` today —
  library search, `countWords`/`countParagraphs`/`estimateReadingMinutes`, AI
  context, line-based diff, `.txt` export — continue to work unchanged.
- **Dexie schema → version 7**, adding only the new fields. No index changes,
  no data migration: a stored story with no `format` is treated as `'plain'`
  at read time.
- New stories are created with `format` set from `settings.storyEditorMode`.

## Editor UI (rich mode)

- **Toolbar row** beneath the existing editor header, visible only in rich
  mode: bold · italic · underline · strikethrough · headings (H1–H3 dropdown) ·
  bullet list · numbered list · block quote · horizontal rule · link · text
  color · highlight · alignment (left/center/right/justify) · add comment.
  Buttons reflect the active selection's marks/nodes.
- **Bubble menu** on selection for quick bold/italic/link/comment.
- Uses the existing viewport-pinned scroll layout (the earlier fix): header +
  toolbar stay fixed, the document scrolls in the main column, the workbench
  sidebar stays pinned.
- TipTap extensions: StarterKit (bold, italic, strike, headings, lists,
  blockquote, HR, history) + Underline, Link, TextStyle+Color, Highlight,
  TextAlign, Placeholder, and a custom Comment mark.

## Comments

- A comment is a ProseMirror **mark** carrying a `commentId`, applied to the
  selected range. ProseMirror position mapping keeps the anchor correct as
  surrounding text changes.
- Thread data (`id`, `text`, `resolved`, `createdAt`) is stored in
  `story.comments`; the mark in `content` references the thread by `id`.
- **A new "Comments" tab** is added to the story workbench sidebar
  (Thesaurus / Recent / Spark / Ask AI → + Comments). It lists threads;
  clicking a thread scrolls to and briefly highlights its anchored range.
  Resolve/delete actions live on each thread.
- If a comment's anchored text is fully deleted, the mark disappears; the
  thread is shown in the sidebar as **detached** (not silently lost), with the
  option to delete it.

## Export / print

Selected by the story's `format`:

- **.txt** — plain-text projection (`body`), unchanged for both modes.
- **.md** — formatting-aware Markdown for rich stories (headings, emphasis,
  lists, blockquote, links, HR); plain stories unchanged.
- **.html** — new: self-contained HTML of the rendered document (rich stories).
- **PDF / print** — `PrintablePoem` gets a rich branch that renders the doc's
  HTML instead of splitting `body` on `\n`. Plain stories keep the current
  line-split rendering.

## Snapshots / version history

- Snapshots additionally capture `content` when the story is rich.
- History **diff remains line-based on the plain `body`** (formatting not shown
  in the diff — v1 scope).
- **Restoring** a snapshot restores `content` (and thus formatting) when
  present, alongside `title`/`body`.

## Settings

- New field `storyEditorMode: 'rich' | 'plain'` in `AppSettings`, default
  `'rich'`, surfaced in `SettingsPanel`.
- It controls the `format` stamped onto **newly created** stories only;
  existing stories keep their locked `format`.

## Testing

- **Unit:**
  - plain-text projection derived from a ProseMirror doc
  - Markdown and HTML serialization of a rich doc
  - comment anchor survival across edits: insertion/deletion before, inside,
    and after a commented range; full deletion → detached thread
  - legacy story with no `format` reads as `'plain'`
  - new story picks up `settings.storyEditorMode`
- **Regression:** existing poem-editor tests and story-editor tests stay green;
  plain-mode story editing behaves exactly as before.

## Risks & mitigations

- **Bundle size / dependency-light ethos:** TipTap adds ~100–150KB gzipped.
  Accepted trade-off for correctness of comments and formatting; still offline.
- **contenteditable edge cases (paste, IME, undo):** delegated to
  ProseMirror/TipTap rather than hand-rolled.
- **Sidebar coupling:** isolated behind the `StorySurface` interface so the
  Thesaurus/Recent/Spark/Ask AI tabs need no per-engine branching.
