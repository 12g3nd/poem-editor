/**
 * Parses a rhyme scheme string like "ABAB CDCD EFEF GG" into one label per
 * content line — spaces are just visual stanza separators and don't count
 * as lines themselves. Used by every rhyme-scheme-based built-in template
 * and by the custom form builder, which accepts this exact notation.
 */
export function parseRhymeSchemeString(scheme: string): string[] {
  return scheme.replace(/\s+/g, '').split('')
}
