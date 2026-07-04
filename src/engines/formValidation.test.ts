import { describe, it, expect } from 'vitest'
import { validateForm, contentLines } from '@/engines/formValidation'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'
import type { FormTemplate } from '@/types/form'

const dict = createFixtureDictionary()

function template(overrides: Partial<FormTemplate> = {}): FormTemplate {
  return {
    id: 't',
    name: 'Test',
    description: '',
    example: '',
    lineRules: [],
    stanzaLineCounts: [],
    ...overrides,
  }
}

describe('contentLines', () => {
  it('excludes blank stanza-break lines', () => {
    expect(contentLines('one\ntwo\n\nthree')).toEqual(['one', 'two', 'three'])
  })
})

describe('validateForm — line count', () => {
  it('passes when the line count matches exactly', () => {
    const t = template({ lineRules: [{}, {}, {}] })
    const items = validateForm('a\nb\nc', t, dict)
    expect(items[0]).toEqual({ line: 0, label: '3 lines total', status: 'pass' })
  })

  it('is pending when the poet has not written enough lines yet', () => {
    const t = template({ lineRules: [{}, {}, {}] })
    const items = validateForm('a\nb', t, dict)
    expect(items[0].status).toBe('pending')
  })

  it('fails when the poem has grown past the form\'s line count', () => {
    const t = template({ lineRules: [{}, {}] })
    const items = validateForm('a\nb\nc', t, dict)
    expect(items[0].status).toBe('fail')
  })
})

describe('validateForm — syllables', () => {
  it('passes a line matching its syllable target', () => {
    const t = template({ lineRules: [{ syllables: 1 }, { syllables: 2 }] })
    const items = validateForm('cat\nfire', t, dict)
    expect(items.find((i) => i.line === 1)).toMatchObject({ label: '1 syllables', status: 'pass' })
    expect(items.find((i) => i.line === 2)).toMatchObject({ label: '2 syllables', status: 'pass' })
  })

  it('fails a line with the wrong syllable count', () => {
    const t = template({ lineRules: [{ syllables: 2 }] })
    const items = validateForm('cat', t, dict)
    expect(items.find((i) => i.line === 1)).toMatchObject({ status: 'fail' })
  })

  it('is pending for a line the poet has not written yet', () => {
    const t = template({ lineRules: [{ syllables: 1 }, { syllables: 1 }] })
    const items = validateForm('cat', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'pending' })
  })
})

describe('validateForm — meter', () => {
  it('passes a line matching the target meter exactly', () => {
    const t = template({ lineRules: [{ meter: { foot: 'iamb', feet: 2 } }] })
    const items = validateForm('to cat to cat', t, dict)
    expect(items.find((i) => i.line === 1)).toMatchObject({ status: 'pass' })
  })

  it('fails a line that deviates from the target meter', () => {
    const t = template({ lineRules: [{ meter: { foot: 'iamb', feet: 2 } }] })
    const items = validateForm('cat cat cat cat', t, dict)
    expect(items.find((i) => i.line === 1)).toMatchObject({ status: 'fail' })
  })
})

describe('validateForm — rhyme groups', () => {
  it('passes when lines sharing a rhyme label actually rhyme', () => {
    const t = template({ lineRules: [{ rhymeLabel: 'A' }, { rhymeLabel: 'B' }, { rhymeLabel: 'A' }] })
    const items = validateForm('a day\na moon\na way', t, dict)
    const line3 = items.find((i) => i.line === 3)
    expect(line3).toMatchObject({ status: 'pass' })
    expect(line3?.label).toContain('line 1')
    expect(line3?.label).toContain('day')
  })

  it('fails when lines sharing a rhyme label do not rhyme', () => {
    const t = template({ lineRules: [{ rhymeLabel: 'A' }, { rhymeLabel: 'A' }] })
    const items = validateForm('a day\na cat', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'fail' })
  })

  it('does not generate a rhyme item for the first (reference) line of a group', () => {
    const t = template({ lineRules: [{ rhymeLabel: 'A' }, { rhymeLabel: 'A' }] })
    const items = validateForm('a day\na way', t, dict)
    expect(items.filter((i) => i.line === 1)).toHaveLength(0)
  })

  it('does not generate a rhyme item for a label with only one line', () => {
    const t = template({ lineRules: [{ rhymeLabel: 'A' }, { rhymeLabel: 'B' }] })
    const items = validateForm('a day\na moon', t, dict)
    expect(items.filter((i) => i.label.includes('should rhyme'))).toHaveLength(0)
  })

  it('passes a refrain line against its own rhyme group (identical end word, not just a rhyme)', () => {
    // A verbatim refrain repeat shares the exact same end word as its
    // reference line — that must satisfy "should rhyme", even though the
    // rhyme engine itself treats identical words as not "rhyming".
    const t = template({ lineRules: [{ rhymeLabel: 'A' }, { rhymeLabel: 'A', refrainOf: 0 }] })
    const items = validateForm('a summer day\na summer day', t, dict)
    expect(items.find((i) => i.label.includes('should rhyme'))).toMatchObject({ status: 'pass' })
  })
})

describe('validateForm — refrains', () => {
  it('passes when a refrain line repeats its source line', () => {
    const t = template({ lineRules: [{}, {}, { refrainOf: 0 }] })
    const items = validateForm("Shall I compare thee\nThou art\nShall I compare thee", t, dict)
    expect(items.find((i) => i.line === 3)).toMatchObject({ status: 'pass' })
  })

  it('is case- and punctuation-insensitive when comparing refrain lines', () => {
    const t = template({ lineRules: [{}, { refrainOf: 0 }] })
    const items = validateForm("Shall I compare thee?\nshall i compare thee", t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'pass' })
  })

  it('fails when a refrain line diverges from its source', () => {
    const t = template({ lineRules: [{}, { refrainOf: 0 }] })
    const items = validateForm('Shall I compare thee\nSomething else entirely', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'fail' })
  })
})

describe('validateForm — end-word-only refrain (ghazal radif, rondeau refrain)', () => {
  it('passes when the closing word matches, even if the rest of the line differs', () => {
    const t = template({ lineRules: [{}, { endWordMatches: 0 }] })
    const items = validateForm('a night of fire\nsomething entirely different, fire', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'pass' })
  })

  it('fails when the closing word differs', () => {
    const t = template({ lineRules: [{}, { endWordMatches: 0 }] })
    const items = validateForm('a night of fire\na different closing day', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'fail' })
  })

  it('is pending when the poet has not reached that line yet', () => {
    const t = template({ lineRules: [{}, { endWordMatches: 0 }] })
    const items = validateForm('a night of fire', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'pending' })
  })
})

describe('validateForm — opening-word refrain (rondeau)', () => {
  it('passes when the opening word matches, regardless of the rest of the line', () => {
    const t = template({ lineRules: [{}, { startWordMatches: 0 }] })
    const items = validateForm('Autumn comes early this year\nAutumn, but softer than before', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'pass' })
  })

  it('fails when the opening word differs', () => {
    const t = template({ lineRules: [{}, { startWordMatches: 0 }] })
    const items = validateForm('Autumn comes early this year\nWinter follows soon enough', t, dict)
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'fail' })
  })
})
