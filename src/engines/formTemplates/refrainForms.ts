import type { FormTemplate, LineRule } from '@/types/form'

export const villanelle: FormTemplate = {
  id: 'villanelle',
  name: 'Villanelle',
  description:
    '19 lines: five tercets (ABA) and a closing quatrain (ABAA). Line 1 (the "A1" refrain) recurs as lines 6, 12, and 18; line 3 (the "A2" refrain) recurs as lines 9, 15, and 19 — the closing quatrain uses both.',
  example: [
    'The tide comes in and takes what it can find',
    'I used to stand for hours along the shore',
    'I did not choose to leave this all behind',
    '',
    'but something in the leaving eased my mind',
    'a door that I had waited to walk through before',
    'The tide comes in and takes what it can find',
    '',
    'the past keeps shifting, never quite defined',
    "the keys, the names, the ones we can't restore",
    'I did not choose to leave this all behind',
    '',
    'and yet I go on hoping to unwind',
    'a life that starts, somehow, from off the floor',
    'The tide comes in and takes what it can find',
    '',
    'a way to be less anxious, less confined',
    'to rooms and streets I recognize no more',
    'I did not choose to leave this all behind',
    '',
    'as if this restlessness was long designed',
    'it knocks, some nights, a stranger at the door',
    'The tide comes in and takes what it can find',
    'I did not choose to leave this all behind',
  ].join('\n'),
  lineRules: [
    { rhymeLabel: 'A' }, // 1: A1 source
    { rhymeLabel: 'B' }, // 2
    { rhymeLabel: 'A' }, // 3: A2 source
    { rhymeLabel: 'A' }, // 4
    { rhymeLabel: 'B' }, // 5
    { rhymeLabel: 'A', refrainOf: 0 }, // 6
    { rhymeLabel: 'A' }, // 7
    { rhymeLabel: 'B' }, // 8
    { rhymeLabel: 'A', refrainOf: 2 }, // 9
    { rhymeLabel: 'A' }, // 10
    { rhymeLabel: 'B' }, // 11
    { rhymeLabel: 'A', refrainOf: 0 }, // 12
    { rhymeLabel: 'A' }, // 13
    { rhymeLabel: 'B' }, // 14
    { rhymeLabel: 'A', refrainOf: 2 }, // 15
    { rhymeLabel: 'A' }, // 16
    { rhymeLabel: 'B' }, // 17
    { rhymeLabel: 'A', refrainOf: 0 }, // 18
    { rhymeLabel: 'A', refrainOf: 2 }, // 19
  ],
  stanzaLineCounts: [3, 3, 3, 3, 3, 4],
}

export const triolet: FormTemplate = {
  id: 'triolet',
  name: 'Triolet',
  description:
    '8 lines rhymed ABaAabAB, where capital letters are full-line refrains: line 1 recurs as lines 4 and 7; line 2 recurs as line 8.',
  example: [
    'I did not think the morning was so near',
    'and yet it came, as quiet as a name',
    'Each morning held a small, uncertain fear',
    'I did not think the morning was so near',
    'that faded once the mornings turned less clear',
    'but something in me answered just the same',
    'I did not think the morning was so near',
    'and yet it came, as quiet as a name',
  ].join('\n'),
  lineRules: [
    { rhymeLabel: 'A' }, // 1: refrain source
    { rhymeLabel: 'B' }, // 2: refrain source
    { rhymeLabel: 'A' }, // 3
    { rhymeLabel: 'A', refrainOf: 0 }, // 4
    { rhymeLabel: 'A' }, // 5
    { rhymeLabel: 'B' }, // 6
    { rhymeLabel: 'A', refrainOf: 0 }, // 7
    { rhymeLabel: 'B', refrainOf: 1 }, // 8
  ],
  stanzaLineCounts: [8],
}

function pantoumLineRules(): LineRule[] {
  return [
    { rhymeLabel: 'A' }, // 1
    { rhymeLabel: 'B' }, // 2
    { rhymeLabel: 'A' }, // 3
    { rhymeLabel: 'B' }, // 4
    { rhymeLabel: 'B', refrainOf: 1 }, // 5 = repeat of 2
    { rhymeLabel: 'C' }, // 6
    { rhymeLabel: 'B', refrainOf: 3 }, // 7 = repeat of 4
    { rhymeLabel: 'C' }, // 8
    { rhymeLabel: 'C', refrainOf: 5 }, // 9 = repeat of 6
    { rhymeLabel: 'D' }, // 10
    { rhymeLabel: 'C', refrainOf: 7 }, // 11 = repeat of 8
    { rhymeLabel: 'D' }, // 12
    { rhymeLabel: 'D', refrainOf: 9 }, // 13 = repeat of 10
    { rhymeLabel: 'A', refrainOf: 2 }, // 14 = repeat of 3 (closing)
    { rhymeLabel: 'D', refrainOf: 11 }, // 15 = repeat of 12
    { rhymeLabel: 'A', refrainOf: 0 }, // 16 = repeat of 1 (closing)
  ]
}

export const pantoum: FormTemplate = {
  id: 'pantoum',
  name: 'Pantoum',
  description:
    "A chain of quatrains where each stanza's 2nd and 4th lines return as the next stanza's 1st and 3rd. This template uses the common 4-stanza length; the closing stanza traditionally returns to the poem's 1st and 3rd lines to close the loop.",
  example: [
    'The house grows quiet, settling into night',
    "and something in me doesn't want to stay",
    'as if the dark could teach me how to write',
    'a truer sentence than I have all day',
    '',
    "and something in me doesn't want to stay",
    'I keep the lamp on longer than I should',
    'a truer sentence than I have all day',
    'as if more light could make the meaning good',
    '',
    'I keep the lamp on longer than I should',
    'and tell myself this waiting is the same',
    'as if more light could make the meaning good',
    'as any work that has no other name',
    '',
    'and tell myself this waiting is the same',
    'as if the dark could teach me how to write',
    'as any work that has no other name',
    'The house grows quiet, settling into night',
  ].join('\n'),
  lineRules: pantoumLineRules(),
  stanzaLineCounts: [4, 4, 4, 4],
}
