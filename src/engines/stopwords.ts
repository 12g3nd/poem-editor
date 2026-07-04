/**
 * Common English words excluded from "most-used words" stats — broader than
 * functionWords.ts (which only covers what scansion needs to demote), since
 * this also excludes pronouns and other high-frequency words that would
 * otherwise dominate any poem's word-frequency list without saying much
 * about it.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'so', 'yet', 'for', 'as', 'if', 'that', 'than',
  'in', 'on', 'at', 'to', 'of', 'by', 'with', 'from', 'up', 'down', 'out', 'off', 'over', 'under',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'doing', 'done',
  'has', 'have', 'had', 'having',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'this', 'these', 'those',
  'there', 'here', 'where', 'when', 'how', 'why', 'what', 'who', 'whom', 'which',
  'not', 'no', 'all', 'any', 'each', 'every', 'some', 'other', 'such',
  'just', 'only', 'own', 'same', 'too', 'very', 'more', 'most',
])

export function isStopword(word: string): boolean {
  return STOPWORDS.has(word.toLowerCase())
}
