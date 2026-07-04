/** Average adult silent-reading speed, words per minute — used only for a
 * rough "~N min read" estimate, not for anything scored/validated. */
const WORDS_PER_MINUTE = 200

export function estimateReadingMinutes(wordCount: number): number {
  if (wordCount <= 0) return 0
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}

export function countCharacters(body: string): number {
  return body.length
}

/** Non-blank paragraphs — a run of text separated by one or more blank
 * lines, the prose analog of a poem's stanza. */
export function countParagraphs(body: string): number {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length
}
