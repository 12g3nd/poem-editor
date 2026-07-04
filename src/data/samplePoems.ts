/** Two public-domain poems seeded into an empty library so new users have
 * something to read, tag, and run through the form checker right away. */
export interface SamplePoem {
  title: string
  body: string
  formId?: string
}

export const SAMPLE_POEMS: SamplePoem[] = [
  {
    title: 'Sonnet 18',
    formId: 'shakespearean-sonnet',
    body: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance, or nature's changing course, untrimm'd;
But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st,
Nor shall death brag thou wander'st in his shade,
When in eternal lines to time thou grow'st;
So long as men can breathe, or eyes can see,
So long lives this, and this gives life to thee.`,
  },
  {
    title: 'Hope is the thing with feathers',
    body: `"Hope" is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -

And sweetest - in the Gale - is heard -
And sore must be the storm -
That could abash the little Bird
That kept so many warm -

I've heard it in the chillest land -
And on the strangest Sea -
Yet - never - in Extremity,
It asked a crumb - of me.`,
  },
]
