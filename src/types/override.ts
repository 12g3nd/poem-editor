/** A poet's one-time correction to a word's syllable count or stress pattern,
 * remembered from then on wherever that word appears. */
export interface WordOverride {
  word: string
  syllables?: number
  stressPattern?: string
}

export type OverrideIndex = Map<string, WordOverride>
