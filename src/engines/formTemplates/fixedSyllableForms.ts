import type { FormTemplate } from '@/types/form'

function syllableTemplate(id: string, name: string, description: string, example: string, syllables: number[]): FormTemplate {
  return {
    id,
    name,
    description,
    example,
    lineRules: syllables.map((s) => ({ syllables: s })),
    stanzaLineCounts: [syllables.length],
  }
}

export const haiku = syllableTemplate(
  'haiku',
  'Haiku',
  'Three unrhymed lines of 5, 7, and 5 syllables — traditionally a single, unadorned image or moment, often with a seasonal reference.',
  'Morning fog lifting\nA heron stands in water\nWaiting, waiting still',
  [5, 7, 5],
)

export const tanka = syllableTemplate(
  'tanka',
  'Tanka',
  'Five unrhymed lines of 5, 7, 5, 7, and 7 syllables — a haiku extended with two closing lines that turn or comment on the image.',
  'Morning fog lifting\nA heron stands in water\nWaiting, waiting still\nI have learned to be patient\nWatching for what the day brings',
  [5, 7, 5, 7, 7],
)

export const cinquain = syllableTemplate(
  'cinquain',
  'Cinquain',
  'Five unrhymed lines of 2, 4, 6, 8, and 2 syllables (the American form popularized by Adelaide Crapsey), often building to a single sharp image or turn in the last line.',
  'Autumn\nLeaves let go, drift\nSoftly down to the earth\nA whole season surrendering\nTo rest',
  [2, 4, 6, 8, 2],
)
