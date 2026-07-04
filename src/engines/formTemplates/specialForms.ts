import type { FormTemplate } from '@/types/form'

export const acrostic: FormTemplate = {
  id: 'acrostic',
  name: 'Acrostic',
  description:
    "A poem whose line count matches a chosen word, where each line's first letter spells that word out top to bottom. Pick your word in the Form workbench tab to see the letter guide.",
  example: 'Paper holds what breath cannot\nOne word leaning on the next\nEvery silence made deliberate\nMeaning, saved for last',
  lineRules: [],
  stanzaLineCounts: [],
  isAcrostic: true,
}

export const freeVerse: FormTemplate = {
  id: 'free-verse',
  name: 'Free Verse',
  description:
    'No fixed line count, meter, or rhyme scheme — the poem sets its own rules. Marking a poem "free verse" is for organizing your library, not for validation; there is nothing here to check.',
  example: 'There is no rule today\nexcept the one the poem finds\nas it goes,\nline\nby\nuneven line.',
  lineRules: [],
  stanzaLineCounts: [],
}
