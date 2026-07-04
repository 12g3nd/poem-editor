import { describe, it, expect } from 'vitest'
import { buildCustomTemplate } from '@/engines/customForm'
import { validateForm } from '@/engines/formValidation'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

describe('buildCustomTemplate', () => {
  it('builds line rules from a rhyme scheme string', () => {
    const template = buildCustomTemplate({ id: 'x', name: 'X', rhymeScheme: 'AABBA' })
    expect(template.lineRules).toEqual([
      { rhymeLabel: 'A' },
      { rhymeLabel: 'A' },
      { rhymeLabel: 'B' },
      { rhymeLabel: 'B' },
      { rhymeLabel: 'A' },
    ])
    expect(template.isCustom).toBe(true)
  })

  it('builds line rules from per-line syllable targets alone', () => {
    const template = buildCustomTemplate({ id: 'x', name: 'X', syllablesPerLine: [5, 7, 5] })
    expect(template.lineRules).toEqual([{ syllables: 5 }, { syllables: 7 }, { syllables: 5 }])
  })

  it('combines rhyme scheme and syllable targets on the same lines', () => {
    const template = buildCustomTemplate({
      id: 'x',
      name: 'X',
      rhymeScheme: 'AA',
      syllablesPerLine: [5, 5],
    })
    expect(template.lineRules).toEqual([
      { rhymeLabel: 'A', syllables: 5 },
      { rhymeLabel: 'A', syllables: 5 },
    ])
  })

  it('applies refrain pairs using 1-based line numbers', () => {
    const template = buildCustomTemplate({
      id: 'x',
      name: 'X',
      rhymeScheme: 'AAA',
      refrainPairs: { 3: 1 },
    })
    expect(template.lineRules[2]).toEqual({ rhymeLabel: 'A', refrainOf: 0 })
  })

  it('produces a template that validateForm can check directly', () => {
    const template = buildCustomTemplate({ id: 'x', name: 'X', syllablesPerLine: [1, 2] })
    const items = validateForm('cat\nfire', template, dict)
    expect(items.filter((i) => i.status === 'fail')).toEqual([])
  })
})
