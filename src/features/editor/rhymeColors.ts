/** CSS variables, not hardcoded hex, so every rhyme color stays readable in
 * both themes — see the --color-rhyme-* tokens and their dark-mode
 * overrides in index.css. */
const PALETTE = [
  'var(--color-indigo)',
  'var(--color-berry)',
  'var(--color-verdigris)',
  'var(--color-rhyme-amber)',
  'var(--color-rhyme-plum)',
  'var(--color-rhyme-steel)',
  'var(--color-rhyme-bronze)',
  'var(--color-rhyme-moss)',
]

/** Maps a rhyme-scheme letter (A, B, A′, AA, ...) to a stable color, cycling
 * through the palette once there are more concurrent groups than colors. */
export function colorForRhymeLabel(label: string): string {
  if (!label) return 'transparent'
  const base = label.charCodeAt(0) - 65
  return PALETTE[((base % PALETTE.length) + PALETTE.length) % PALETTE.length]
}
