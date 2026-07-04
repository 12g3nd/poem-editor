import type { FormTemplate } from '@/types/form'
import { parseRhymeSchemeString } from '@/engines/rhymeSchemeString'

const IAMBIC_PENTAMETER = { foot: 'iamb', feet: 5 } as const

function schemeTemplate(
  id: string,
  name: string,
  description: string,
  example: string,
  scheme: string,
  stanzaLineCounts: number[],
  meter?: { foot: 'iamb' | 'trochee' | 'anapest' | 'dactyl'; feet: number },
): FormTemplate {
  const labels = parseRhymeSchemeString(scheme)
  return {
    id,
    name,
    description,
    example,
    lineRules: labels.map((rhymeLabel) => (meter ? { rhymeLabel, meter } : { rhymeLabel })),
    stanzaLineCounts,
  }
}

export const shakespeareanSonnet = schemeTemplate(
  'shakespearean-sonnet',
  'Shakespearean Sonnet',
  '14 lines of iambic pentameter: three quatrains rhymed ABAB CDCD EFEF, closing with a couplet (GG) that turns or resolves the poem.',
  [
    "The candle holds its steady, patient light",
    'against the slow retreat of fading day.',
    'It will not let the room grow dark tonight,',
    'it holds the hours that keep slipping away.',
    'I write to keep some fragment of the heart,',
    'the small, plain truths that no one else may know,',
    'to hold together what the years take apart,',
    'to watch a single, ordinary thing grow.',
    'The page remembers what escapes the mind,',
    'a promise ink can somehow always keep,',
    'a voice that time will not be quick to find,',
    "still speaking softly while the world's asleep.",
    'So take this humble sonnet as it\'s true:',
    'these lines are only ink, and yet — for you.',
  ].join('\n'),
  'ABAB CDCD EFEF GG',
  [4, 4, 4, 2],
  IAMBIC_PENTAMETER,
)

export const petrarchanSonnet = schemeTemplate(
  'petrarchan-sonnet',
  'Petrarchan Sonnet',
  '14 lines of iambic pentameter: an octave rhymed ABBAABBA that poses a question or tension, followed by a sestet (commonly CDECDE, though the exact sestet pattern varies) that answers or turns it.',
  [
    'The garden keeps its silence, carved in stone',
    'a faith I did not choose but came to believe',
    'and where the quiet asks for nothing, grieve',
    'is somehow lighter, standing here alone',
    'The years have shaped a quiet all my own',
    'a language even silence seems to weave',
    "the kind of hope that doesn't ask to leave",
    'but settles in the hollow, fully grown',
    'I did not think to feel this way again',
    'as if the world remembered one old song',
    'and hummed it low, in no particular way',
    'returning gently, asking only when',
    "I'd let this borrowed feeling stay this long",
    'before I told the truth, and named the day',
  ].join('\n'),
  'ABBAABBA CDECDE',
  [8, 6],
  IAMBIC_PENTAMETER,
)

export const limerick: FormTemplate = {
  id: 'limerick',
  name: 'Limerick',
  description:
    "Five lines, rhymed AABBA. Lines 1, 2, and 5 are longer (traditionally anapestic trimeter); lines 3 and 4 are shorter (anapestic dimeter) — almost always comic.",
  example: [
    "There once was a poet who'd write",
    'by candle and lantern light',
    "She'd pour her strong tea",
    'and mutter, "I see!"',
    'Then scribble till morning grew bright',
  ].join('\n'),
  lineRules: [
    { rhymeLabel: 'A', meter: { foot: 'anapest', feet: 3 } },
    { rhymeLabel: 'A', meter: { foot: 'anapest', feet: 3 } },
    { rhymeLabel: 'B', meter: { foot: 'anapest', feet: 2 } },
    { rhymeLabel: 'B', meter: { foot: 'anapest', feet: 2 } },
    { rhymeLabel: 'A', meter: { foot: 'anapest', feet: 3 } },
  ],
  stanzaLineCounts: [5],
}

export const blankVerse: FormTemplate = {
  id: 'blank-verse',
  name: 'Blank Verse',
  description:
    'Unrhymed iambic pentameter. No rhyme scheme at all — the meter alone carries the form, leaving the line free to follow ordinary speech.',
  example: [
    'The morning comes the way it always does,',
    'unhurried, gray, uncertain at the edge.',
    'The kettle clicks and settles into steam.',
    'The window holds a version of the yard.',
    'Nothing here has asked to be admired,',
    'and yet admiring costs the day so little.',
    'I take my coffee to the narrow porch',
    'and watch the light decide where it will fall.',
    'This is not much, and yet it is enough',
    'to call it, for a moment, something whole.',
  ].join('\n'),
  lineRules: Array.from({ length: 10 }, () => ({ meter: IAMBIC_PENTAMETER })),
  stanzaLineCounts: [10],
}
