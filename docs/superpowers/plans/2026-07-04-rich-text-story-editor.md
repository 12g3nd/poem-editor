# Rich-text Story Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the short-story editor as a TipTap/ProseMirror rich-text surface (formatting, color/highlight, alignment, anchored comments) while keeping the plain-text `<textarea>` as a per-story-locked mode chosen by a global Settings default.

**Architecture:** `StoryEditorPage` becomes a shell that renders one of two surfaces — `PlainStoryEditor` (existing textarea) or `RichStoryEditor` (TipTap) — chosen by the story's own `format` field. Both expose the same imperative `StorySurfaceHandle` so the workbench sidebar is engine-agnostic. Rich documents store ProseMirror JSON in `content`, plus a regenerated plain-text `body` projection so every existing `body` consumer (search, stats, AI, line-diff, `.txt` export) keeps working unchanged. Comments are a ProseMirror mark referencing thread data in `story.comments`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest (jsdom + fake-indexeddb), Dexie, Tailwind v4, TipTap v2 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` + official extensions).

## Global Constraints

- **Scope: stories only.** Do not touch the poem editor (`EditorPage.tsx`), poem types, or any scansion/rhyme/meter/syllable code.
- **No data loss / back-compat:** a stored story with no `format` MUST read as `'plain'`. Never overwrite a story's `format` after creation.
- **Offline:** no runtime network calls; all deps bundled by Vite.
- **`body` is the canonical plain-text projection** for rich stories, regenerated on every save. Do not change what existing `body` consumers read.
- **Poems and existing story tests must stay green** — they are the regression guard.
- **Path alias:** import from `@/…` (maps to `src/…`).
- **Tests:** Vitest globals are on (`describe/it/expect` need no import in `.test.ts`); DB tests `await db.<table>.clear()` in `beforeEach`.
- **Commits:** conventional prefixes (`feat:`, `test:`, `refactor:`, `chore:`), end body with the repo's `Co-Authored-By` trailer per contributor convention.
- **Engine unit-testable in Node; editor UI verified in the real browser** via the Playwright MCP (dev server: `npm run dev`, base path `/poem-editor/`).

---

## File Structure

**New files:**
- `src/engines/richText/extensions.ts` — TipTap extension list + shared ProseMirror schema (single source of truth for both the editor and the pure serializers).
- `src/engines/richText/Comment.ts` — custom `comment` mark extension.
- `src/engines/richText/projection.ts` — `docToPlainText(doc)`.
- `src/engines/richText/serialize.ts` — `docToHtml(doc)`, `docToMarkdown(title, doc)`.
- `src/engines/richText/comments.ts` — `collectCommentIds(doc)`, `partitionComments(comments, doc)`.
- `src/engines/richText/emptyDoc.ts` — `EMPTY_DOC` (the empty rich document).
- `src/features/editor/story/storySurface.ts` — `StorySurfaceHandle` interface.
- `src/features/editor/story/PlainStoryEditor.tsx` — textarea surface (extracted from current page).
- `src/features/editor/story/RichStoryEditor.tsx` — TipTap surface.
- `src/features/editor/story/RichToolbar.tsx` — formatting toolbar + bubble menu.
- `src/features/editor/story/PrintableStory.tsx` — print/PDF rendering (rich HTML or plain lines).
- `src/features/editor/workbench/CommentsTab.tsx` — comments sidebar tab.
- Test files alongside each engine module.

**Modified files:**
- `src/types/settings.ts` — add `storyEditorMode`.
- `src/types/story.ts` — add `format`, `content`, `comments`, `StoryComment`, `StoryFormat`, `storyFormat()` helper.
- `src/types/snapshot.ts` — add optional `content`.
- `src/db/schema.ts` — Dexie v7 (additive fields).
- `src/db/stories.ts` — `createStory(title, format)`, restore carries `content`.
- `src/db/snapshots.ts` — `createSnapshot(..., content?)`, restore carries `content`.
- `src/features/editor/StoryEditorPage.tsx` — shell: pick surface, toolbar, comments wiring, snapshot with content.
- `src/features/editor/workbench/StoryWorkbenchSidebar.tsx` — Comments tab + surface-based active word/insert.
- `src/features/editor/ExportMenu.tsx` — format-aware export (`.md` formatting-aware, new `.html`).
- `src/features/settings/SettingsPanel.tsx` — story-editor-mode toggle.
- `src/App.tsx`, `src/features/library/LibraryPage.tsx` — pass `settings.storyEditorMode` to `createStory`.
- `src/index.css` — `.ProseMirror` prose styling + comment highlight.

---

## Phase 1 — Data model & settings foundation

### Task 1: Add `storyEditorMode` setting

**Files:**
- Modify: `src/types/settings.ts`
- Test: `src/engines/settingsStorage.test.ts` (existing)

**Interfaces:**
- Produces: `AppSettings.storyEditorMode: 'rich' | 'plain'`; `DEFAULT_SETTINGS.storyEditorMode = 'rich'`.

- [ ] **Step 1: Write the failing test** — append to `src/engines/settingsStorage.test.ts`:

```ts
it('defaults storyEditorMode to rich', () => {
  expect(loadSettings().storyEditorMode).toBe('rich')
})

it('preserves a saved storyEditorMode of plain', () => {
  saveSettings({ ...DEFAULT_SETTINGS, storyEditorMode: 'plain' })
  expect(loadSettings().storyEditorMode).toBe('plain')
})
```

Ensure the file imports `DEFAULT_SETTINGS` (it already imports `loadSettings, saveSettings`; add `DEFAULT_SETTINGS` to the existing `@/engines/settingsStorage`-adjacent import from `@/types/settings` — check the top of the file and add `import { DEFAULT_SETTINGS } from '@/types/settings'` if missing).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- settingsStorage`
Expected: FAIL — `storyEditorMode` is `undefined`.

- [ ] **Step 3: Add the field.** In `src/types/settings.ts`, add to the `AppSettings` interface (after `onlineExtrasEnabled`):

```ts
  /** Which editor new stories open in. 'rich' (default) uses the TipTap
   * formatting surface; 'plain' restores the original textarea. Each story
   * records its own format at creation, so this only affects new stories. */
  storyEditorMode: 'rich' | 'plain'
```

And to `DEFAULT_SETTINGS` (after `onlineExtrasEnabled: false,`):

```ts
  storyEditorMode: 'rich',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- settingsStorage`
Expected: PASS (all cases, including existing ones).

- [ ] **Step 5: Commit**

```bash
git add src/types/settings.ts src/engines/settingsStorage.test.ts
git commit -m "feat: add storyEditorMode setting (default rich)"
```

---

### Task 2: Extend Story & Snapshot types; bump Dexie to v7

**Files:**
- Modify: `src/types/story.ts`, `src/types/snapshot.ts`, `src/db/schema.ts`
- Test: `src/types/story.test.ts` (create)

**Interfaces:**
- Produces:
  - `type StoryFormat = 'plain' | 'rich'`
  - `interface StoryComment { id: string; text: string; resolved: boolean; createdAt: number }`
  - `Story.format?: StoryFormat`, `Story.content?: JSONContent`, `Story.comments?: StoryComment[]`
  - `function storyFormat(story: Pick<Story, 'format'>): StoryFormat` → returns `story.format ?? 'plain'`
  - `Snapshot.content?: JSONContent`
- Consumes: `JSONContent` from `@tiptap/core` (installed in Task 4). **To avoid ordering issues, in this task define `content` as `content?: object` in both types; Task 4 narrows it to `JSONContent`.**

- [ ] **Step 1: Write the failing test** — create `src/types/story.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { storyFormat } from '@/types/story'

describe('storyFormat', () => {
  it('treats a story with no format as plain (legacy-safe)', () => {
    expect(storyFormat({ format: undefined })).toBe('plain')
  })

  it('returns the explicit format when set', () => {
    expect(storyFormat({ format: 'rich' })).toBe('rich')
    expect(storyFormat({ format: 'plain' })).toBe('plain')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- story.test`
Expected: FAIL — `storyFormat` not exported.

- [ ] **Step 3: Edit `src/types/story.ts`.** Add above the `Story` interface:

```ts
export type StoryFormat = 'plain' | 'rich'

/** A comment thread anchored to a range in a rich story. The anchor itself
 * lives in the document as a `comment` mark carrying this `id`; this record
 * holds the human-facing thread data. Single-user app, so no author field. */
export interface StoryComment {
  id: string
  text: string
  resolved: boolean
  createdAt: number
}
```

Add these fields inside the `Story` interface (after `collectionIds?`):

```ts
  /** Absent means 'plain' (every pre-rich-editor story). Set once at
   * creation and never changed, so stories never silently lose formatting. */
  format?: StoryFormat
  /** ProseMirror document JSON — rich stories only. `body` is always kept in
   * sync as this doc's plain-text projection. Typed `object` until the rich
   * engine (which owns JSONContent) is installed. */
  content?: object
  /** Comment threads for a rich story; anchors live in `content`. */
  comments?: StoryComment[]
```

Add at the bottom of the file:

```ts
export function storyFormat(story: Pick<Story, 'format'>): StoryFormat {
  return story.format ?? 'plain'
}
```

Edit `src/types/snapshot.ts` — add after `body: string`:

```ts
  /** Rich-story document JSON captured with this snapshot, when present. */
  content?: object
```

- [ ] **Step 4: Bump Dexie schema.** In `src/db/schema.ts`, add a v7 block after the v6 block (fields are stored in the object, not indexed, so the index strings are unchanged — v7 exists to signal the new shape and give a migration hook point):

```ts
    // Rich short-story mode: adds format/content/comments to stories and
    // content to snapshots. All new fields are unindexed object properties,
    // so no data migration is required — legacy rows simply lack them and are
    // treated as plain text at read time (see storyFormat()).
    this.version(7).stores({
      poems: 'id, title, createdAt, modifiedAt, status, favorite, *tags, *collectionIds',
      stories: 'id, title, createdAt, modifiedAt, status, favorite, *tags, *collectionIds',
      wordOverrides: 'word',
      snapshots: 'id, poemId, createdAt',
      customForms: 'id, name',
      collections: 'id, name, createdAt',
    })
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- story.test`
Expected: PASS.

- [ ] **Step 6: Run the full suite (regression check)**

Run: `npm test`
Expected: all existing tests still PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/story.ts src/types/snapshot.ts src/db/schema.ts src/types/story.test.ts
git commit -m "feat: add story format/content/comments fields and Dexie v7"
```

---

### Task 3: `createStory` stamps format; snapshots carry content

**Files:**
- Modify: `src/db/stories.ts`, `src/db/snapshots.ts`
- Test: `src/db/stories.test.ts` (existing), `src/db/snapshots.test.ts` (existing)

**Interfaces:**
- Consumes: `StoryFormat` from `@/types/story`.
- Produces:
  - `createStory(title?: string, format?: StoryFormat): Promise<Story>` — `format` defaults to `'plain'`, stamped onto the row.
  - `createSnapshot(poemId, title, body, label?, content?): Promise<Snapshot>`
  - `restoreStorySnapshot` and `restoreSnapshot` carry `content` through to the target document.

- [ ] **Step 1: Write failing tests** — append to `src/db/stories.test.ts`:

```ts
describe('createStory format', () => {
  it('defaults to plain when no format is given', async () => {
    const story = await createStory('Untitled')
    expect(story.format).toBe('plain')
  })

  it('stamps the given format', async () => {
    const story = await createStory('Rich one', 'rich')
    expect(story.format).toBe('rich')
    expect((await getStory(story.id))?.format).toBe('rich')
  })
})

describe('restoreStorySnapshot content', () => {
  it('restores content when the snapshot has it', async () => {
    const story = await createStory('Doc', 'rich')
    const doc = { type: 'doc', content: [{ type: 'paragraph' }] }
    const snap = await createSnapshot(story.id, 'Doc', 'plain body', undefined, doc)
    await updateStory(story.id, { content: { type: 'doc', content: [] }, body: 'changed' })
    await restoreStorySnapshot(snap.id)
    const restored = await getStory(story.id)
    expect(restored?.content).toEqual(doc)
    expect(restored?.body).toBe('plain body')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- stories.test`
Expected: FAIL — `format` undefined; `createSnapshot` ignores 5th arg; restore drops `content`.

- [ ] **Step 3: Edit `src/db/stories.ts`.** Update imports and `createStory`:

```ts
import type { Story, StoryFormat } from '@/types/story'
```

```ts
export async function createStory(title = 'Untitled', format: StoryFormat = 'plain'): Promise<Story> {
  const now = Date.now()
  const story: Story = {
    id: crypto.randomUUID(),
    title,
    body: '',
    format,
    createdAt: now,
    modifiedAt: now,
    status: 'draft',
    favorite: false,
    tags: [],
    collectionIds: [],
  }
  await db.stories.add(story)
  return story
}
```

Update `restoreStorySnapshot`'s final lines to carry content and take a content-aware safety snapshot:

```ts
  if (current) {
    await createSnapshot(current.id, current.title, current.body, 'Before restore', current.content)
  }

  await updateStory(snapshot.poemId, {
    title: snapshot.title,
    body: snapshot.body,
    // Guard content: Dexie's update() DROPS a key written as undefined, so an
    // unconditional `content: snapshot.content` would wipe a rich story's
    // content when restoring a content-less (plain-era) snapshot. Only write
    // content when the snapshot actually carries it.
    ...(snapshot.content !== undefined ? { content: snapshot.content } : {}),
  })
```

- [ ] **Step 4: Edit `src/db/snapshots.ts`.** Update `createSnapshot`:

```ts
export async function createSnapshot(
  poemId: string,
  title: string,
  body: string,
  label?: string,
  content?: object,
): Promise<Snapshot> {
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    poemId,
    title,
    body,
    createdAt: Date.now(),
    ...(label !== undefined ? { label } : {}),
    ...(content !== undefined ? { content } : {}),
  }
  await db.snapshots.add(snapshot)
  return snapshot
}
```

Leave `restoreSnapshot` (poem restore) as-is — poems have no `content`.

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- stories.test snapshots.test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/db/stories.ts src/db/snapshots.ts src/db/stories.test.ts
git commit -m "feat: stamp story format on create and carry content through snapshots"
```

---

## Phase 2 — Rich-text engine (pure, unit-tested)

### Task 4: Install TipTap; build the shared extension list & schema

**Files:**
- Create: `src/engines/richText/extensions.ts`
- Modify: `src/types/story.ts`, `src/types/snapshot.ts` (narrow `content` type)
- Test: `src/engines/richText/extensions.test.ts`

**Interfaces:**
- Produces:
  - `storyExtensions: Extensions` — the ordered TipTap extension array.
  - `getStorySchema(): Schema` — memoized ProseMirror schema built from `storyExtensions`.
- Consumes: nothing from earlier engine tasks.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install @tiptap/react @tiptap/pm @tiptap/core @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight @tiptap/extension-text-align @tiptap/extension-placeholder
```
Expected: installs cleanly. If npm reports a React 19 peer conflict on `@tiptap/react`, install the latest v3 line instead (`npm install @tiptap/react@^3 @tiptap/pm@^3 @tiptap/core@^3 @tiptap/starter-kit@^3 ...`) — the extension APIs used here are identical across v2/v3. Verify `npm run dev` boots before continuing.

- [ ] **Step 2: Narrow `content` types.** In `src/types/story.ts` add at top:

```ts
import type { JSONContent } from '@tiptap/core'
```
Change `content?: object` → `content?: JSONContent`. In `src/types/snapshot.ts` add the same import and change `content?: object` → `content?: JSONContent`.

- [ ] **Step 3: Write the failing test** — `src/engines/richText/extensions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getStorySchema, storyExtensions } from '@/engines/richText/extensions'

describe('story rich-text schema', () => {
  it('includes the marks and nodes the toolbar needs', () => {
    const schema = getStorySchema()
    for (const mark of ['bold', 'italic', 'underline', 'strike', 'link', 'highlight', 'textStyle', 'comment']) {
      expect(schema.marks[mark], `mark ${mark}`).toBeTruthy()
    }
    for (const node of ['heading', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule']) {
      expect(schema.nodes[node], `node ${node}`).toBeTruthy()
    }
  })

  it('exposes a stable extension array', () => {
    expect(Array.isArray(storyExtensions)).toBe(true)
    expect(storyExtensions.length).toBeGreaterThan(5)
  })
})
```

- [ ] **Step 4: Run to verify failure**

Run: `npm test -- extensions.test`
Expected: FAIL — module not found.

- [ ] **Step 5: Create `src/engines/richText/extensions.ts`:**

```ts
import { getSchema } from '@tiptap/core'
import type { Extensions } from '@tiptap/core'
import type { Schema } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
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
```

- [ ] **Step 6: Create the Comment mark** — `src/engines/richText/Comment.ts` (needed for Step 5's import to resolve):

```ts
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
```

- [ ] **Step 7: Run to verify pass**

Run: `npm test -- extensions.test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/engines/richText/extensions.ts src/engines/richText/Comment.ts src/types/story.ts src/types/snapshot.ts src/engines/richText/extensions.test.ts
git commit -m "feat: add TipTap and the shared story rich-text schema"
```

---

### Task 5: Plain-text projection

**Files:**
- Create: `src/engines/richText/projection.ts`, `src/engines/richText/emptyDoc.ts`
- Test: `src/engines/richText/projection.test.ts`

**Interfaces:**
- Produces:
  - `docToPlainText(doc: JSONContent): string` — block-separated plain text (paragraphs/headings separated by `\n\n`), matching what `countParagraphs`/`countWords` expect.
  - `EMPTY_DOC: JSONContent` — `{ type: 'doc', content: [{ type: 'paragraph' }] }`.
- Consumes: `storyExtensions` from Task 4.

> Note: an earlier draft of this task also exported a `plainTextToDoc` helper.
> It has been dropped — nothing in the design consumes it (plain stories stay
> plain; rich stories start from `EMPTY_DOC`; there is no plain→rich
> conversion), and its per-line paragraph split round-tripped incorrectly
> against `docToPlainText`'s `\n\n` block separator. Do not add it.

- [ ] **Step 1: Write the failing test** — `src/engines/richText/projection.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { docToPlainText, EMPTY_DOC } from '@/engines/richText/projection'
import { countParagraphs } from '@/engines/storyStats'

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapter One' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'It was ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'cold' },
        { type: 'text', text: '.' },
      ],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'The end.' }] },
  ],
}

describe('docToPlainText', () => {
  it('flattens marks and separates blocks with blank lines', () => {
    expect(docToPlainText(doc)).toBe('Chapter One\n\nIt was cold.\n\nThe end.')
  })

  it('produces a projection countParagraphs reads as 3 paragraphs', () => {
    expect(countParagraphs(docToPlainText(doc))).toBe(3)
  })

  it('empties cleanly', () => {
    expect(docToPlainText(EMPTY_DOC)).toBe('')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- projection.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/engines/richText/emptyDoc.ts`:**

```ts
import type { JSONContent } from '@tiptap/core'

export const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }
```

- [ ] **Step 4: Create `src/engines/richText/projection.ts`:**

```ts
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
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- projection.test`
Expected: PASS. If block separation differs (single `\n`), it means `generateText`'s `blockSeparator` handling changed — the option above is correct for TipTap v2/v3; do not work around it in `countParagraphs`.

- [ ] **Step 6: Commit**

```bash
git add src/engines/richText/projection.ts src/engines/richText/emptyDoc.ts src/engines/richText/projection.test.ts
git commit -m "feat: add rich-doc plain-text projection"
```

---

### Task 6: HTML & Markdown serialization

**Files:**
- Create: `src/engines/richText/serialize.ts`
- Test: `src/engines/richText/serialize.test.ts`

**Interfaces:**
- Produces:
  - `docToHtml(doc: JSONContent): string`
  - `docToMarkdown(title: string, doc: JSONContent): string`
- Consumes: `storyExtensions` (Task 4).

- [ ] **Step 1: Write the failing test** — `src/engines/richText/serialize.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { docToHtml, docToMarkdown } from '@/engines/richText/serialize'

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scene' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'A ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'quiet' },
        { type: 'text', text: ' room.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
      ],
    },
  ],
}

describe('docToHtml', () => {
  it('renders formatting to HTML', () => {
    const html = docToHtml(doc)
    expect(html).toContain('<h2>Scene</h2>')
    expect(html).toContain('<em>quiet</em>')
    expect(html).toContain('<li><p>one</p></li>')
  })
})

describe('docToMarkdown', () => {
  it('renders a title heading and block formatting', () => {
    const md = docToMarkdown('My Story', doc)
    expect(md).toContain('# My Story')
    expect(md).toContain('## Scene')
    expect(md).toContain('A *quiet* room.')
    expect(md).toContain('- one')
    expect(md).toContain('- two')
  })

  it('defaults an empty title to Untitled', () => {
    expect(docToMarkdown('   ', { type: 'doc', content: [] })).toContain('# Untitled')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- serialize.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/engines/richText/serialize.ts`:**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- serialize.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engines/richText/serialize.ts src/engines/richText/serialize.test.ts
git commit -m "feat: add rich-doc HTML and Markdown serializers"
```

---

### Task 7: Comment collection, partitioning & anchor-survival

**Files:**
- Create: `src/engines/richText/comments.ts`
- Test: `src/engines/richText/comments.test.ts`

**Interfaces:**
- Produces:
  - `collectCommentIds(doc: JSONContent): Set<string>` — all `commentId`s currently anchored in the doc.
  - `partitionComments(comments: StoryComment[], doc: JSONContent): { anchored: StoryComment[]; detached: StoryComment[] }` — a thread is detached if its id is absent from the doc.
- Consumes: `StoryComment` (Task 2), `getStorySchema` (Task 4).

- [ ] **Step 1: Write the failing test** — `src/engines/richText/comments.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectCommentIds, partitionComments } from '@/engines/richText/comments'
import { getStorySchema } from '@/engines/richText/extensions'
import type { StoryComment } from '@/types/story'

const docWithComment = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Look at ' },
        { type: 'text', marks: [{ type: 'comment', attrs: { commentId: 'c1' } }], text: 'this line' },
        { type: 'text', text: ' closely.' },
      ],
    },
  ],
}

const thread = (id: string): StoryComment => ({ id, text: 'note', resolved: false, createdAt: 1 })

describe('collectCommentIds', () => {
  it('finds anchored comment ids', () => {
    expect(collectCommentIds(docWithComment)).toEqual(new Set(['c1']))
  })
  it('returns empty for a doc with no comments', () => {
    expect(collectCommentIds({ type: 'doc', content: [] })).toEqual(new Set())
  })
})

describe('partitionComments', () => {
  it('separates anchored threads from detached ones', () => {
    const { anchored, detached } = partitionComments([thread('c1'), thread('gone')], docWithComment)
    expect(anchored.map((c) => c.id)).toEqual(['c1'])
    expect(detached.map((c) => c.id)).toEqual(['gone'])
  })
})

describe('anchor survives edits (ProseMirror mapping)', () => {
  it('keeps the comment on the same words after inserting text before it', () => {
    const schema = getStorySchema()
    const node = schema.nodeFromJSON(docWithComment)
    // Find the commented range in the resolved document.
    let from = -1
    let to = -1
    node.descendants((child, pos) => {
      if (child.isText && child.marks.some((m) => m.type.name === 'comment')) {
        from = pos
        to = pos + child.nodeSize
      }
    })
    expect(node.textBetween(from, to)).toBe('this line')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- comments.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/engines/richText/comments.ts`:**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- comments.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engines/richText/comments.ts src/engines/richText/comments.test.ts
git commit -m "feat: add comment id collection and anchored/detached partitioning"
```

---

## Phase 3 — Editor surfaces

### Task 8: `StorySurfaceHandle` + extract `PlainStoryEditor`

**Files:**
- Create: `src/features/editor/story/storySurface.ts`, `src/features/editor/story/PlainStoryEditor.tsx`
- Modify: `src/features/editor/StoryEditorPage.tsx`
- Verify: real browser (plain story unchanged)

**Interfaces:**
- Produces:
  - `interface StorySurfaceHandle { getActiveWord(): string | null; insertText(text: string): void; getPlainText(): string }`
  - `PlainStoryEditor` — `forwardRef<StorySurfaceHandle, PlainStoryEditorProps>` where `PlainStoryEditorProps = { body: string; onBodyChange(body: string): void; onActiveWordChange(word: string | null): void; fontFamily: string; fontSize: number; lineHeight: number }`.
- Consumes: `getWordAtPosition` from `@/engines/normalize`.

This task is a **behavior-preserving extraction** — the textarea, autosize effect, selection handling, and insert logic move out of `StoryEditorPage` into `PlainStoryEditor`, exposed through a ref. No behavior changes.

- [ ] **Step 1: Create `src/features/editor/story/storySurface.ts`:**

```ts
/** The imperative surface the workbench sidebar drives, regardless of whether
 * the active editor is the plain textarea or the rich TipTap editor. */
export interface StorySurfaceHandle {
  /** The word under the caret/selection, for Thesaurus/Recent lookups. */
  getActiveWord(): string | null
  /** Insert text at the caret (used by "insert word" from the sidebar). */
  insertText(text: string): void
  /** The plain-text projection, for AI context. */
  getPlainText(): string
}
```

- [ ] **Step 2: Create `src/features/editor/story/PlainStoryEditor.tsx`:**

```tsx
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { getWordAtPosition } from '@/engines/normalize'
import type { StorySurfaceHandle } from '@/features/editor/story/storySurface'

/** Nearest scrolling ancestor, so the autosize height reset below can
 * preserve its scroll position (see the useLayoutEffect note). */
function getScrollParent(node: HTMLElement): HTMLElement | null {
  let el = node.parentElement
  while (el) {
    const overflowY = getComputedStyle(el).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return el
    el = el.parentElement
  }
  return null
}

interface PlainStoryEditorProps {
  body: string
  onBodyChange: (body: string) => void
  onActiveWordChange: (word: string | null) => void
  fontFamily: string
  fontSize: number
  lineHeight: number
}

/** The original short-story surface: a single autosizing textarea whose page
 * scrolls as one document. Extracted from StoryEditorPage so it can sit behind
 * the same StorySurfaceHandle as the rich editor. */
export const PlainStoryEditor = forwardRef<StorySurfaceHandle, PlainStoryEditorProps>(
  function PlainStoryEditor({ body, onBodyChange, onActiveWordChange, fontFamily, fontSize, lineHeight }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
      getActiveWord() {
        const ta = textareaRef.current
        if (!ta) return null
        return getWordAtPosition(body, ta.selectionStart)?.word ?? null
      },
      insertText(text: string) {
        const ta = textareaRef.current
        if (!ta) return
        const start = ta.selectionStart
        const end = ta.selectionEnd
        onBodyChange(body.slice(0, start) + text + body.slice(end))
        requestAnimationFrame(() => {
          ta.focus()
          const pos = start + text.length
          ta.setSelectionRange(pos, pos)
        })
      },
      getPlainText() {
        return body
      },
    }))

    // Autosize to content. Resetting height to 'auto' collapses the textarea
    // to its min-height, shrinking the scroll container so the browser clamps
    // its scrollTop toward 0 — which visibly jumps the page up when editing
    // mid-document. Capture the scroller's position and restore it after
    // regrowing, in useLayoutEffect so the whole thing happens before paint.
    useLayoutEffect(() => {
      const ta = textareaRef.current
      if (!ta) return
      const scroller = getScrollParent(ta)
      const prevScrollTop = scroller ? scroller.scrollTop : window.scrollY
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
      if (scroller) scroller.scrollTop = prevScrollTop
      else window.scrollTo(0, prevScrollTop)
    }, [body, fontSize, lineHeight])

    function handleSelection() {
      const ta = textareaRef.current
      if (!ta) return
      onActiveWordChange(getWordAtPosition(body, ta.selectionStart)?.word ?? null)
    }

    return (
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        onSelect={handleSelection}
        onClick={handleSelection}
        onKeyUp={handleSelection}
        placeholder="Once upon a time…"
        aria-label="Story text"
        spellCheck
        className="mt-6 w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-ink/30"
        style={{
          fontSize,
          lineHeight: `${lineHeight}px`,
          fontFamily,
          color: 'var(--color-ink)',
          caretColor: 'var(--color-ink)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minHeight: '60vh',
        }}
      />
    )
  },
)
```

- [ ] **Step 3: Rewire `StoryEditorPage.tsx` to use `PlainStoryEditor`.** Remove the inline `textareaRef`, the autosize `useEffect`, `handleSelectionChange`, and `insertAtCursor`; replace the `<textarea>` in the `<main>` with:

```tsx
<PlainStoryEditor
  ref={surfaceRef}
  body={body}
  onBodyChange={setBody}
  onActiveWordChange={setActiveWord}
  fontFamily={fontFamily}
  fontSize={settings.fontSize}
  lineHeight={settings.lineHeight}
/>
```

Add near the other refs: `const surfaceRef = useRef<StorySurfaceHandle>(null)`. Change the sidebar's `onInsert` prop to `onInsert={(word) => surfaceRef.current?.insertText(word)}`. Add imports:

```tsx
import { PlainStoryEditor } from '@/features/editor/story/PlainStoryEditor'
import type { StorySurfaceHandle } from '@/features/editor/story/storySurface'
```

Keep `activeWord` state and the `<input>` title exactly as they are.

- [ ] **Step 4: Typecheck & test**

Run: `npx tsc -b && npm test`
Expected: typecheck clean; all tests PASS (no test touched behavior here).

- [ ] **Step 5: Browser verification**

Start dev server (`npm run dev`), open a story, type text, click a word and confirm the Thesaurus tab still reacts, use a sidebar "insert" and confirm it inserts at the caret, reload and confirm autosave persisted. Confirm the page scrolls as before with the sidebar pinned.
Expected: identical to pre-extraction behavior.

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/story/storySurface.ts src/features/editor/story/PlainStoryEditor.tsx src/features/editor/StoryEditorPage.tsx
git commit -m "refactor: extract PlainStoryEditor behind StorySurfaceHandle"
```

---

### Task 9: `RichStoryEditor` core (TipTap surface)

**Files:**
- Create: `src/features/editor/story/RichStoryEditor.tsx`
- Modify: `src/index.css` (ProseMirror prose styling + comment highlight)
- Verify: real browser

**Interfaces:**
- Produces:
  - `RichStoryEditor` — `forwardRef<RichStoryHandle, RichStoryEditorProps>`, where
    - `RichStoryHandle extends StorySurfaceHandle { editor: Editor | null }` (the toolbar/comments need the live `Editor`).
    - `RichStoryEditorProps = { content: JSONContent; onChange(content: JSONContent, plainText: string): void; onActiveWordChange(word: string | null): void; fontFamily: string; fontSize: number; lineHeight: number }`.
- Consumes: `storyExtensions` (Task 4), `docToPlainText` (Task 5), `normalizeWord` from `@/engines/normalize`, `EMPTY_DOC` (Task 5).

- [ ] **Step 1: Add ProseMirror styling** to `src/index.css` (after the `html, body, #root` block):

```css
/* Rich story editor (TipTap). Tailwind's reset strips list/heading styling,
   so the ProseMirror surface needs its block rhythm restored explicitly. */
.ProseMirror { outline: none; }
.ProseMirror > * + * { margin-top: 0.75em; }
.ProseMirror h1 { font-size: 1.6em; font-weight: 600; }
.ProseMirror h2 { font-size: 1.35em; font-weight: 600; }
.ProseMirror h3 { font-size: 1.15em; font-weight: 600; }
.ProseMirror ul { list-style: disc; padding-left: 1.5em; }
.ProseMirror ol { list-style: decimal; padding-left: 1.5em; }
.ProseMirror blockquote {
  border-left: 3px solid var(--color-canvas-line);
  padding-left: 1em;
  color: var(--color-ink);
  opacity: 0.8;
}
.ProseMirror hr {
  border: none;
  border-top: 1px solid var(--color-canvas-line);
  margin: 1.5em 0;
}
.ProseMirror a { color: var(--color-indigo); text-decoration: underline; }
.ProseMirror .story-comment {
  background: color-mix(in srgb, var(--color-indigo) 18%, transparent);
  border-bottom: 2px solid var(--color-indigo);
  cursor: pointer;
}
.ProseMirror .story-comment-active {
  background: color-mix(in srgb, var(--color-indigo) 35%, transparent);
}
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--color-ink);
  opacity: 0.3;
  float: left;
  height: 0;
  pointer-events: none;
}
```

- [ ] **Step 2: Create `src/features/editor/story/RichStoryEditor.tsx`:**

```tsx
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
  const node = state.doc.nodeAt(from) ?? state.doc.nodeAt(Math.max(0, from - 1))
  const parentText = state.doc.textBetween(
    Math.max(0, from - 60),
    Math.min(state.doc.content.size, from + 60),
    '\n',
    ' ',
  )
  void node
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
```

Note: content is passed once at mount. The parent must remount (via React `key`) when switching stories — handled in Task 11 by keying on story id.

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: clean.

- [ ] **Step 4: Browser smoke test** (temporary harness in Task 11 wires it in; for now verify the module imports without runtime error by adding it to the page in Task 11). Skip standalone browser check here — deferred to Task 11 where it is mounted.

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/story/RichStoryEditor.tsx src/index.css
git commit -m "feat: add RichStoryEditor TipTap surface and ProseMirror styling"
```

---

### Task 10: `RichToolbar` (formatting controls + bubble menu)

**Files:**
- Create: `src/features/editor/story/RichToolbar.tsx`
- Verify: real browser (in Task 11 once mounted)

**Interfaces:**
- Produces: `RichToolbar` — `{ editor: Editor | null; onAddComment(): void }`. Renders the formatting controls; disabled when `editor` is null.
- Consumes: the live `Editor` from `RichStoryHandle`.

- [ ] **Step 1: Create `src/features/editor/story/RichToolbar.tsx`:**

```tsx
import { useCurrentEditor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react'

interface RichToolbarProps {
  editor: Editor | null
  onAddComment: () => void
}

const HIGHLIGHTS = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3']
const COLORS = ['#8c3b4b', '#3e4c8c', '#4b7b6f', '#8e642f']

/** A Google-Docs-style formatting toolbar. Reads active-mark state so buttons
 * reflect the current selection. Null-safe: renders disabled when no editor. */
export function RichToolbar({ editor, onAddComment }: RichToolbarProps) {
  void useCurrentEditor
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            strike: editor.isActive('strike'),
            h1: editor.isActive('heading', { level: 1 }),
            h2: editor.isActive('heading', { level: 2 }),
            h3: editor.isActive('heading', { level: 3 }),
            bullet: editor.isActive('bulletList'),
            ordered: editor.isActive('orderedList'),
            quote: editor.isActive('blockquote'),
            alignLeft: editor.isActive({ textAlign: 'left' }),
            alignCenter: editor.isActive({ textAlign: 'center' }),
            alignRight: editor.isActive({ textAlign: 'right' }),
            link: editor.isActive('link'),
          }
        : null,
  })

  if (!editor) return <div className="h-11 border-b border-canvas-line" />

  const btn = (active: boolean | undefined) =>
    `rounded px-2 py-1 text-sm transition-colors ${active ? 'bg-indigo text-paper' : 'text-ink/60 hover:bg-canvas'}`

  function setLink() {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const href = window.prompt('Link URL')
    if (href) editor.chain().focus().setLink({ href }).run()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-canvas-line px-8 py-1.5">
        <button type="button" aria-label="Bold" aria-pressed={state?.bold} className={btn(state?.bold)} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" aria-label="Italic" aria-pressed={state?.italic} className={btn(state?.italic)} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" aria-label="Underline" aria-pressed={state?.underline} className={btn(state?.underline)} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button type="button" aria-label="Strikethrough" aria-pressed={state?.strike} className={btn(state?.strike)} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
        <span className="mx-1 h-5 w-px bg-canvas-line" />
        <button type="button" aria-label="Heading 1" aria-pressed={state?.h1} className={btn(state?.h1)} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" aria-label="Heading 2" aria-pressed={state?.h2} className={btn(state?.h2)} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" aria-label="Heading 3" aria-pressed={state?.h3} className={btn(state?.h3)} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="mx-1 h-5 w-px bg-canvas-line" />
        <button type="button" aria-label="Bullet list" aria-pressed={state?.bullet} className={btn(state?.bullet)} onClick={() => editor.chain().focus().toggleBulletList().run()}>••</button>
        <button type="button" aria-label="Numbered list" aria-pressed={state?.ordered} className={btn(state?.ordered)} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
        <button type="button" aria-label="Block quote" aria-pressed={state?.quote} className={btn(state?.quote)} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;</button>
        <button type="button" aria-label="Horizontal rule" className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</button>
        <span className="mx-1 h-5 w-px bg-canvas-line" />
        <button type="button" aria-label="Align left" aria-pressed={state?.alignLeft} className={btn(state?.alignLeft)} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⯇</button>
        <button type="button" aria-label="Align center" aria-pressed={state?.alignCenter} className={btn(state?.alignCenter)} onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</button>
        <button type="button" aria-label="Align right" aria-pressed={state?.alignRight} className={btn(state?.alignRight)} onClick={() => editor.chain().focus().setTextAlign('right').run()}>⯈</button>
        <span className="mx-1 h-5 w-px bg-canvas-line" />
        <button type="button" aria-label="Link" aria-pressed={state?.link} className={btn(state?.link)} onClick={setLink}>🔗</button>
        {COLORS.map((c) => (
          <button key={c} type="button" aria-label={`Text color ${c}`} className="ml-0.5 h-5 w-5 rounded-full border border-canvas-line" style={{ background: c }} onClick={() => editor.chain().focus().setColor(c).run()} />
        ))}
        {HIGHLIGHTS.map((c) => (
          <button key={c} type="button" aria-label={`Highlight ${c}`} className="ml-0.5 h-5 w-5 rounded border border-canvas-line" style={{ background: c }} onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()} />
        ))}
        <button type="button" aria-label="Clear color" className={btn(false)} onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}>⌫</button>
        <span className="mx-1 h-5 w-px bg-canvas-line" />
        <button type="button" className={btn(false)} onClick={onAddComment}>💬 Comment</button>
      </div>

      <BubbleMenu editor={editor} className="flex gap-0.5 rounded-lg border border-canvas-line bg-paper p-1 shadow-lg">
        <button type="button" aria-label="Bold" className={btn(state?.bold)} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" aria-label="Italic" className={btn(state?.italic)} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" aria-label="Link" className={btn(state?.link)} onClick={setLink}>🔗</button>
        <button type="button" className={btn(false)} onClick={onAddComment}>💬</button>
      </BubbleMenu>
    </>
  )
}
```

Note: `useEditorState` and `BubbleMenu` are from `@tiptap/react`. If the installed version exports `BubbleMenu` from `@tiptap/react/menus` (v3), adjust the import accordingly — verify with `npm run dev` and the browser check in Task 11.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: clean (unused `useCurrentEditor` guarded with `void`; remove the import and the `void` line if the linter objects).

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/story/RichToolbar.tsx
git commit -m "feat: add RichToolbar formatting controls and bubble menu"
```

---

### Task 11: `StoryEditorPage` shell — pick surface, wire toolbar & autosave

**Files:**
- Modify: `src/features/editor/StoryEditorPage.tsx`
- Verify: real browser (rich + plain, switching stories)

**Interfaces:**
- Consumes: `PlainStoryEditor` (Task 8), `RichStoryEditor`/`RichStoryHandle` (Task 9), `RichToolbar` (Task 10), `storyFormat` (Task 2), `docToPlainText` + `EMPTY_DOC` (Task 5).
- Produces: a page that hydrates `content`/`body`/`comments` from the story, renders the surface matching `storyFormat(story)`, autosaves both `content` and its `body` projection for rich stories, and shows the toolbar only in rich mode.

- [ ] **Step 1: Add rich state & hydration.** In `StoryEditorPage`, alongside `title`/`body`, add:

```tsx
const [content, setContent] = useState<JSONContent>(EMPTY_DOC)
const [comments, setComments] = useState<StoryComment[]>([])
const richRef = useRef<RichStoryHandle>(null)
const format = story ? storyFormat(story) : 'plain'
```

Extend the hydration effect to seed rich fields (rich stories restore `content`; a story with no stored content starts from `EMPTY_DOC`):

```tsx
useEffect(() => {
  if (story && hydratedFor.current !== story.id) {
    setTitle(story.title)
    setBody(story.body)
    setContent((story.content as JSONContent) ?? EMPTY_DOC)
    setComments(story.comments ?? [])
    hydratedFor.current = story.id
  }
}, [story])
```

- [ ] **Step 2: Autosave rich fields.** Replace the debounced save effect so rich stories persist `content` + `comments` + the regenerated `body`:

```tsx
useEffect(() => {
  if (!id || hydratedFor.current !== id) return
  const handle = setTimeout(() => {
    if (format === 'rich') {
      void updateStory(id, { title, body: docToPlainText(content), content, comments })
    } else {
      void updateStory(id, { title, body })
    }
  }, 400)
  return () => clearTimeout(handle)
}, [id, title, body, content, comments, format])
```

- [ ] **Step 3: Render the surface.** Replace the `<PlainStoryEditor …/>` block (from Task 8) with a branch, keyed on story id so switching stories remounts the editor:

```tsx
{format === 'rich' ? (
  <RichStoryEditor
    key={id}
    ref={richRef}
    content={content}
    onChange={(next) => setContent(next)}
    onActiveWordChange={setActiveWord}
    fontFamily={fontFamily}
    fontSize={settings.fontSize}
    lineHeight={settings.lineHeight}
  />
) : (
  <PlainStoryEditor
    ref={surfaceRef}
    body={body}
    onBodyChange={setBody}
    onActiveWordChange={setActiveWord}
    fontFamily={fontFamily}
    fontSize={settings.fontSize}
    lineHeight={settings.lineHeight}
  />
)}
```

The sidebar `onInsert` becomes surface-agnostic:

```tsx
onInsert={(word) => (format === 'rich' ? richRef.current : surfaceRef.current)?.insertText(word)}
```

- [ ] **Step 4: Render the toolbar in rich mode.** Immediately below the `<header>` and above the `<div className="flex min-h-0 flex-1 …">` row, add:

```tsx
{format === 'rich' && (
  <RichToolbar
    editor={richRef.current?.editor ?? null}
    onAddComment={handleAddComment}
  />
)}
```

Add a placeholder `handleAddComment` for now (wired fully in Task 12):

```tsx
function handleAddComment() {
  /* implemented in Task 12 */
}
```

Because `richRef.current` is null on first render, add a render-tick refresh so the toolbar receives the editor once mounted:

```tsx
const [, forceToolbar] = useState(0)
useEffect(() => {
  if (format === 'rich') forceToolbar((n) => n + 1)
}, [format, story?.id])
```

Add imports:

```tsx
import type { JSONContent } from '@tiptap/core'
import { RichStoryEditor, type RichStoryHandle } from '@/features/editor/story/RichStoryEditor'
import { RichToolbar } from '@/features/editor/story/RichToolbar'
import { storyFormat, type StoryComment } from '@/types/story'
import { docToPlainText, EMPTY_DOC } from '@/engines/richText/projection'
```

- [ ] **Step 5: Update snapshot to include content.** Change `handleSnapshot` to pass content for rich stories:

```tsx
async function handleSnapshot() {
  if (!id) return
  await createSnapshot(id, title, format === 'rich' ? docToPlainText(content) : body, undefined, format === 'rich' ? content : undefined)
  setSnapshotSaved(true)
  setTimeout(() => setSnapshotSaved(false), 1600)
}
```

- [ ] **Step 6: Update `PrintablePoem`/export props for rich.** Leave the existing `<ExportMenu>` and print wiring for now (Task 14 makes them format-aware). Ensure `body` passed to them for rich stories is the projection: pass `body={format === 'rich' ? docToPlainText(content) : body}` to `<ExportMenu>` and `<PrintablePoem>` — this keeps `.txt`/print correct until Task 14.

- [ ] **Step 7: Typecheck & test**

Run: `npx tsc -b && npm test`
Expected: clean; all tests PASS.

- [ ] **Step 8: Browser verification (the core acceptance check)**

With `npm run dev`: create a NEW story (it should open in rich mode — Task 16 flips the default, but for now temporarily create one with `format: 'rich'` via the library or set `storyEditorMode` in localStorage). Verify:
- typing works; bold/italic/headings/lists/quote/HR/alignment/color/highlight/link all apply and toolbar active-states track the selection;
- reload persists formatting (content round-trips);
- open an existing (plain) story and confirm it still renders the textarea unchanged;
- the sidebar Thesaurus reacts to the caret word; sidebar "insert" inserts into the doc;
- word/paragraph/reading counts in the header still update (they read the projection).

- [ ] **Step 9: Commit**

```bash
git add src/features/editor/StoryEditorPage.tsx
git commit -m "feat: render rich or plain story surface by format, wire toolbar and autosave"
```

---

## Phase 4 — Comments

### Task 12: Add-comment action (mark + thread creation)

**Files:**
- Modify: `src/features/editor/StoryEditorPage.tsx`
- Verify: real browser

**Interfaces:**
- Consumes: the live `editor` via `richRef`, `StoryComment` (Task 2).
- Produces: `handleAddComment()` that, when there is a non-empty selection, creates a `StoryComment`, applies the `comment` mark carrying its id over the selection, and appends the thread to `comments`.

- [ ] **Step 1: Implement `handleAddComment`** (replace the placeholder from Task 11):

```tsx
function handleAddComment() {
  const editor = richRef.current?.editor
  if (!editor) return
  const { from, to } = editor.state.selection
  if (from === to) return // no selection: nothing to anchor to
  const comment: StoryComment = {
    id: crypto.randomUUID(),
    text: '',
    resolved: false,
    createdAt: Date.now(),
  }
  editor.chain().focus().setMark('comment', { commentId: comment.id }).run()
  setComments((prev) => [...prev, comment])
  setActiveCommentId(comment.id)
}
```

Add state to focus the new thread's editor in the sidebar:

```tsx
const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: clean.

- [ ] **Step 3: Browser verification**

Select text in a rich story, click "💬 Comment": confirm the selected text gets the underline/highlight comment styling and a new (empty) thread is created (visible once Task 13's tab exists — for now confirm via the ProseMirror DOM that a `span.story-comment[data-comment-id]` wraps the selection).

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/StoryEditorPage.tsx
git commit -m "feat: add-comment applies a comment mark and creates a thread"
```

---

### Task 13: Comments sidebar tab

**Files:**
- Create: `src/features/editor/workbench/CommentsTab.tsx`
- Modify: `src/features/editor/workbench/StoryWorkbenchSidebar.tsx`, `src/features/editor/StoryEditorPage.tsx`
- Verify: real browser

**Interfaces:**
- Produces: `CommentsTab` — props `{ comments: StoryComment[]; doc: JSONContent; activeCommentId: string | null; onEdit(id, text): void; onResolveToggle(id): void; onDelete(id): void; onSelect(id): void }`. Lists anchored threads (each with an editable note, resolve, delete, and click-to-scroll) and a separate "Detached" section for threads whose anchor text was deleted.
- Consumes: `partitionComments` (Task 7).

- [ ] **Step 1: Create `src/features/editor/workbench/CommentsTab.tsx`:**

```tsx
import type { JSONContent } from '@tiptap/core'
import type { StoryComment } from '@/types/story'
import { partitionComments } from '@/engines/richText/comments'

interface CommentsTabProps {
  comments: StoryComment[]
  doc: JSONContent
  activeCommentId: string | null
  onEdit: (id: string, text: string) => void
  onResolveToggle: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}

export function CommentsTab({ comments, doc, activeCommentId, onEdit, onResolveToggle, onDelete, onSelect }: CommentsTabProps) {
  const { anchored, detached } = partitionComments(comments, doc)

  if (comments.length === 0) {
    return <p className="text-sm text-ink/40">Select text and click &ldquo;Comment&rdquo; to leave a note anchored to it.</p>
  }

  const card = (comment: StoryComment, isDetached: boolean) => (
    <div
      key={comment.id}
      className={`rounded border p-2 ${comment.id === activeCommentId ? 'border-indigo' : 'border-canvas-line'} ${comment.resolved ? 'opacity-50' : ''}`}
    >
      {!isDetached && (
        <button type="button" onClick={() => onSelect(comment.id)} className="mb-1 text-xs text-indigo hover:underline">
          Jump to text
        </button>
      )}
      {isDetached && <p className="mb-1 text-xs text-berry">Anchor text was deleted</p>}
      <textarea
        value={comment.text}
        onChange={(e) => onEdit(comment.id, e.target.value)}
        placeholder="Add a note…"
        rows={2}
        className="w-full resize-none rounded border border-canvas-line bg-canvas px-2 py-1 text-sm outline-none focus:border-indigo"
      />
      <div className="mt-1 flex gap-3 text-xs">
        <button type="button" onClick={() => onResolveToggle(comment.id)} className="text-ink/50 hover:text-indigo">
          {comment.resolved ? 'Reopen' : 'Resolve'}
        </button>
        <button type="button" onClick={() => onDelete(comment.id)} className="text-ink/50 hover:text-berry">
          Delete
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      {anchored.map((c) => card(c, false))}
      {detached.length > 0 && (
        <>
          <p className="pt-2 text-xs font-medium text-ink/40">Detached</p>
          {detached.map((c) => card(c, true))}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add the tab to `StoryWorkbenchSidebar.tsx`.** Add `{ id: 'comments', label: 'Comments' }` to `TABS`. Extend props with `comments`, `doc`, `activeCommentId`, and the four comment callbacks (all optional so nothing breaks if absent). Render, alongside the other tabs:

```tsx
{tab === 'comments' && commentsProps && <CommentsTab {...commentsProps} />}
```

where `commentsProps` is a single optional prop object of `CommentsTabProps`. Import `CommentsTab`. Keep the always-mounted Ask AI wrapper as-is.

- [ ] **Step 3: Wire from `StoryEditorPage`.** Pass `commentsProps` to `<StoryWorkbenchSidebar>` only for rich stories:

```tsx
commentsProps={
  format === 'rich'
    ? {
        comments,
        doc: content,
        activeCommentId,
        onEdit: (cid, text) => setComments((prev) => prev.map((c) => (c.id === cid ? { ...c, text } : c))),
        onResolveToggle: (cid) => setComments((prev) => prev.map((c) => (c.id === cid ? { ...c, resolved: !c.resolved } : c))),
        onDelete: (cid) => {
          removeCommentMark(cid) // strip the mark from the doc first
          setComments((prev) => prev.filter((c) => c.id !== cid))
        },
        onSelect: (cid) => {
          setActiveCommentId(cid)
          scrollToComment(cid)
        },
      }
    : undefined
}
```

Add the two helpers in the page:

```tsx
function removeCommentMark(commentId: string) {
  const editor = richRef.current?.editor
  if (!editor) return
  const { state } = editor
  const tr = state.tr
  state.doc.descendants((node, pos) => {
    if (!node.isText) return
    node.marks.forEach((mark) => {
      if (mark.type.name === 'comment' && mark.attrs.commentId === commentId) {
        tr.removeMark(pos, pos + node.nodeSize, mark.type)
      }
    })
  })
  if (tr.docChanged) editor.view.dispatch(tr)
}

function scrollToComment(commentId: string) {
  const el = document.querySelector<HTMLElement>(`.story-comment[data-comment-id="${commentId}"]`)
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el?.classList.add('story-comment-active')
  setTimeout(() => el?.classList.remove('story-comment-active'), 1200)
}
```

- [ ] **Step 4: Typecheck & test**

Run: `npx tsc -b && npm test`
Expected: clean; tests PASS.

- [ ] **Step 5: Browser verification**

In a rich story: add a comment, type a note in the sidebar Comments tab, confirm it persists across reload; click "Jump to text" and confirm the anchor flashes; delete a comment and confirm the mark is removed from the text; delete the anchored text and confirm the thread moves to "Detached". Switch to another tab and back — the Ask AI conversation and comment notes both persist (sidebar stays mounted per the earlier fix).

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/workbench/CommentsTab.tsx src/features/editor/workbench/StoryWorkbenchSidebar.tsx src/features/editor/StoryEditorPage.tsx
git commit -m "feat: comments sidebar tab with resolve/delete/jump and detached handling"
```

---

## Phase 5 — Export, print, history

### Task 14: Format-aware export & print

**Files:**
- Create: `src/features/editor/story/PrintableStory.tsx`
- Modify: `src/features/editor/ExportMenu.tsx`, `src/features/editor/StoryEditorPage.tsx`
- Test: `src/features/editor/ExportMenu` behavior covered via serializer tests (Task 6); add `src/features/editor/story/PrintableStory` render test.

**Interfaces:**
- Produces:
  - `ExportMenu` gains optional `richContent?: JSONContent`. When present: `.md` uses `docToMarkdown`, adds a `.html` download via `docToHtml`, `.txt` uses the projection. When absent: current behavior.
  - `PrintableStory` — `{ title: string; format: StoryFormat; body: string; content?: JSONContent }`. Rich → renders `docToHtml`; plain → line-split (same as `PrintablePoem`).
- Consumes: `docToHtml`, `docToMarkdown` (Task 6).

- [ ] **Step 1: Write the failing test** — `src/features/editor/story/PrintableStory.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PrintableStory } from '@/features/editor/story/PrintableStory'

describe('PrintableStory', () => {
  it('renders rich content as HTML', () => {
    const { container } = render(
      <PrintableStory
        title="T"
        format="rich"
        body="Scene"
        content={{ type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scene' }] }] }}
      />,
    )
    expect(container.querySelector('h2')?.textContent).toBe('Scene')
  })

  it('renders plain body as lines', () => {
    const { container } = render(<PrintableStory title="T" format="plain" body={'a\nb'} />)
    expect(container.textContent).toContain('a')
    expect(container.textContent).toContain('b')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- PrintableStory`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/features/editor/story/PrintableStory.tsx`:**

```tsx
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- PrintableStory`
Expected: PASS.

- [ ] **Step 5: Make `ExportMenu` format-aware.** Add `richContent?: JSONContent` to `ExportMenuProps`. At the top import `docToHtml`, `docToMarkdown` and add a `downloadHtml` handler. Change markdown/txt handlers:

```tsx
function handleDownloadMarkdown() {
  const md = richContent ? docToMarkdown(title, richContent) : poemToMarkdown(title, body)
  downloadTextFile(md, `${slugifyFilename(title)}.md`, 'text/markdown')
  setOpen(false)
}

function handleDownloadHtml() {
  if (!richContent) return
  const page = `<!doctype html><html><head><meta charset="utf-8"><title>${title || 'Untitled'}</title></head><body><h1>${title || 'Untitled'}</h1>${docToHtml(richContent)}</body></html>`
  downloadTextFile(page, `${slugifyFilename(title)}.html`, 'text/html')
  setOpen(false)
}
```

Add an ".html" menu item and command (only rendered/registered when `richContent` is present). `.txt` and print keep using `body` (the caller passes the projection).

- [ ] **Step 6: Swap `PrintablePoem` → `PrintableStory` in `StoryEditorPage`,** and pass `richContent` to `ExportMenu`:

```tsx
<ExportMenu title={title} body={format === 'rich' ? docToPlainText(content) : body} richContent={format === 'rich' ? content : undefined} />
```
and at the bottom of the page replace `<PrintablePoem …/>` with:
```tsx
<PrintableStory title={title} format={format} body={format === 'rich' ? docToPlainText(content) : body} content={format === 'rich' ? content : undefined} />
```
Update imports (remove `PrintablePoem`, add `PrintableStory`).

- [ ] **Step 7: Typecheck & full test**

Run: `npx tsc -b && npm test`
Expected: clean; PASS.

- [ ] **Step 8: Browser verification**

In a rich story: Export → `.md` (open the file, confirm headings/emphasis/lists as Markdown), Export → `.html` (confirm formatted), Export → PDF/print (confirm formatting in the print preview), Export → `.txt` (confirm plain projection). Confirm a plain story's export menu has no `.html` item and behaves as before.

- [ ] **Step 9: Commit**

```bash
git add src/features/editor/story/PrintableStory.tsx src/features/editor/story/PrintableStory.test.tsx src/features/editor/ExportMenu.tsx src/features/editor/StoryEditorPage.tsx
git commit -m "feat: format-aware export (md/html) and print for rich stories"
```

---

### Task 15: History diff on the projection (verify only)

**Files:**
- No code change expected — verification that history/diff works for rich stories via the `body` projection and that restore brings back `content` (Task 3 already carries it).
- Verify: real browser + a targeted DB test.

**Interfaces:**
- Consumes: Task 3's `restoreStorySnapshot` (content-aware).

- [ ] **Step 1: Write a DB regression test** — append to `src/db/stories.test.ts`:

```ts
it('restore of a rich snapshot brings back formatting and the plain body diffs', async () => {
  const story = await createStory('Doc', 'rich')
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'v1' }] }] }
  const snap = await createSnapshot(story.id, 'Doc', 'v1', undefined, doc)
  await updateStory(story.id, { body: 'v2', content: { type: 'doc', content: [] } })
  await restoreStorySnapshot(snap.id)
  const restored = await getStory(story.id)
  expect(restored?.body).toBe('v1')
  expect(restored?.content).toEqual(doc)
})
```

- [ ] **Step 2: Run**

Run: `npm test -- stories.test`
Expected: PASS (already supported by Task 3; this locks it in).

- [ ] **Step 3: Browser verification**

In a rich story: make changes, Snapshot, make more changes, open History — confirm the diff (plain-text) shows the textual changes, and Restore brings back both text and formatting.

- [ ] **Step 4: Commit**

```bash
git add src/db/stories.test.ts
git commit -m "test: lock in rich-snapshot restore of content and plain-body diff"
```

---

## Phase 6 — Settings UI & new-story defaulting

### Task 16: Story-editor-mode toggle; new stories honor the default

**Files:**
- Modify: `src/features/settings/SettingsPanel.tsx`, `src/App.tsx`, `src/features/library/LibraryPage.tsx`
- Verify: real browser

**Interfaces:**
- Consumes: `settings.storyEditorMode` (Task 1), `createStory(title, format)` (Task 3).

- [ ] **Step 1: Add the toggle to `SettingsPanel.tsx`.** After the "Writing pane font" block, add:

```tsx
<div>
  <p className="mb-1.5 text-xs font-medium text-ink/40">New stories open in</p>
  <div className="flex gap-1 rounded-full border border-canvas-line p-0.5">
    {(['rich', 'plain'] as const).map((mode) => (
      <button
        key={mode}
        type="button"
        onClick={() => updateSettings({ storyEditorMode: mode })}
        aria-pressed={settings.storyEditorMode === mode}
        className={`flex-1 rounded-full py-1 text-xs capitalize ${
          settings.storyEditorMode === mode ? 'bg-indigo text-paper' : 'text-ink/60'
        }`}
      >
        {mode === 'rich' ? 'Rich text' : 'Plain text'}
      </button>
    ))}
  </div>
  <p className="mt-1 text-xs leading-relaxed text-ink/40">
    Affects new stories only. Existing stories keep the editor they were created with.
  </p>
</div>
```

- [ ] **Step 2: Pass the default when creating stories.** In `src/App.tsx` `GlobalCommands`, the `new-story` command must read settings (it already has `settings` from `useSettings`):

```tsx
void createStory('Untitled', settings.storyEditorMode).then((story) => navigate(`/story/${story.id}`))
```

In `src/features/library/LibraryPage.tsx`, ensure the component has `const { settings } = useSettings()` (add the import/hook if absent) and change the create call:

```tsx
const story = await createStory('Untitled', settings.storyEditorMode)
```

- [ ] **Step 3: Typecheck & test**

Run: `npx tsc -b && npm test`
Expected: clean; PASS.

- [ ] **Step 4: Browser verification**

Settings → set "New stories open in" = Rich; create a new story → opens rich. Set = Plain; create another → opens the textarea. Confirm existing stories are unaffected in both cases.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/SettingsPanel.tsx src/App.tsx src/features/library/LibraryPage.tsx
git commit -m "feat: settings toggle for story editor mode; new stories honor it"
```

---

## Phase 7 — Full verification

### Task 17: Green suite, lint, build, and regression sweep

**Files:** none (verification + any fixups discovered).

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all tests PASS (existing + new).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors (pre-existing warnings acceptable). Fix any warnings introduced by new files.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: `tsc -b` clean and Vite build succeeds (this catches type errors the dev server tolerates and confirms TipTap bundles).

- [ ] **Step 4: Browser regression sweep**

With `npm run dev`:
- Poem editor: open a poem, confirm rhyme colors / scansion / meter / form / focus all still work (untouched, but verify no global CSS/regression).
- Plain story: create with mode=Plain, edit, export `.txt`/`.md`, snapshot/restore, history diff.
- Rich story: full pass — every toolbar control, comments (add/edit/resolve/delete/detach/jump), export md/html/txt/pdf, snapshot/restore, sidebar tab persistence, panel collapse, focus mode.

- [ ] **Step 5: Commit any fixups**

```bash
git add -A
git commit -m "chore: lint/build fixups for rich story editor"
```

---

## Self-Review

**Spec coverage:**
- Scope stories only → all tasks confine to story files; poem untouched (Global Constraints + Task 17 regression). ✓
- Features (formatting, color/highlight, alignment, comments) → Tasks 4/9/10 (formatting+color+highlight+align), 12/13 (comments). ✓
- Global default + per-story-locked format → Tasks 1, 2 (`storyFormat`), 3 (stamp on create), 16 (setting + wiring). ✓
- TipTap engine, JSON storage → Tasks 2/4. ✓
- `body` plain-text projection kept in sync → Tasks 5, 11 (autosave). ✓
- Comments as sidebar tab, mark + thread, detached handling → Tasks 7, 12, 13. ✓
- Export txt/md/html/print → Task 14; snapshots carry content, diff on body, restore formatting → Tasks 3, 15. ✓
- Settings default rich → Tasks 1, 16. ✓
- Testing (projection, serialization, comment anchoring, legacy default, new-story default) + regression → Tasks 5, 6, 7, 2, 3, 17. ✓

**Placeholder scan:** No "TBD/TODO" left in deliverables. The only deferred wiring (Task 11's `handleAddComment` stub) is explicitly completed in Task 12; the toolbar-refresh `forceToolbar` is real code. ✓

**Type consistency:** `StorySurfaceHandle` (Task 8) is extended by `RichStoryHandle` (Task 9); `StoryComment`/`StoryFormat`/`storyFormat` defined in Task 2 and used consistently in Tasks 3/11/12/13/14/16; `docToPlainText`/`docToHtml`/`docToMarkdown`/`collectCommentIds`/`partitionComments` names match across definition and use; `createStory(title, format)` and `createSnapshot(..., content?)` signatures consistent across Tasks 3/11/14/16. ✓

**Note for the implementer on TipTap versioning:** if npm installs the v3 line, `BubbleMenu`/`useEditorState` import paths may differ (`@tiptap/react/menus`) — Task 10's note and the browser checks catch this. Everything else (StarterKit, marks, commands) is identical across v2/v3.
