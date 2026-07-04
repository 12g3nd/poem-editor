/**
 * Monosyllabic articles, prepositions, conjunctions, and auxiliaries — CMU
 * marks virtually every one of these as stressed in isolation (its only
 * syllable is "primary stress" by convention), which is not informative in
 * a line of verse, where they're almost always unstressed. Scansion demotes
 * these; multi-syllable function words ("into", "under") keep their real
 * dictionary stress pattern, since those do carry genuine internal stress.
 */
const FUNCTION_WORDS = new Set([
  // articles
  'a', 'an', 'the',
  // prepositions
  'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'from', 'up', 'as', 'but',
  // conjunctions
  'and', 'or', 'nor', 'so', 'yet',
  // auxiliaries / other frequently-unstressed function words
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
  'has', 'have', 'had', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'that', 'than', 'if',
])

export function isFunctionWord(word: string): boolean {
  return FUNCTION_WORDS.has(word.toLowerCase())
}
