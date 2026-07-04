import { describe, it, expect } from 'vitest'
import { planAcrostic, validateAcrostic } from '@/engines/acrostic'
import { acrostic as acrosticTemplate } from '@/engines/formTemplates/specialForms'

describe('planAcrostic', () => {
  it('produces one requirement per letter, uppercased', () => {
    expect(planAcrostic('poem')).toEqual([
      { lineIndex: 0, requiredLetter: 'P' },
      { lineIndex: 1, requiredLetter: 'O' },
      { lineIndex: 2, requiredLetter: 'E' },
      { lineIndex: 3, requiredLetter: 'M' },
    ])
  })

  it('ignores non-letter characters (spaces, hyphens)', () => {
    expect(planAcrostic('so-so')).toHaveLength(4)
  })
})

describe('validateAcrostic', () => {
  it('passes when every line starts with the required letter', () => {
    const body = 'Poetry unfolds\nOne word at a time\nEvery line a door\nMeaning waits inside'
    const items = validateAcrostic(body, 'poem')
    expect(items.filter((i) => i.status === 'fail')).toEqual([])
    expect(items[0].status).toBe('pass')
  })

  it('fails a line whose first letter does not match', () => {
    const body = 'Poetry unfolds\nA word at a time\nEvery line a door\nMeaning waits inside'
    const items = validateAcrostic(body, 'poem')
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'fail' })
  })

  it('is case-insensitive when checking the leading letter', () => {
    const body = 'poetry unfolds\none word at a time\nevery line a door\nmeaning waits inside'
    const items = validateAcrostic(body, 'poem')
    expect(items.filter((i) => i.status === 'fail')).toEqual([])
  })

  it('ignores leading punctuation when finding the first letter', () => {
    const body = '"Poetry unfolds'
    const items = validateAcrostic(body, 'p')
    expect(items.find((i) => i.line === 1)).toMatchObject({ status: 'pass' })
  })

  it('is pending for lines the poet has not written yet', () => {
    const items = validateAcrostic('Poetry unfolds', 'poem')
    expect(items.find((i) => i.line === 2)).toMatchObject({ status: 'pending' })
  })

  it('reports the overall line count against the word length', () => {
    const items = validateAcrostic('one\ntwo\nthree\nfour', 'poem')
    expect(items[0]).toMatchObject({ status: 'pass' })
  })
})

describe('acrostic template example', () => {
  it('spells "POEM" and satisfies its own rules', () => {
    const items = validateAcrostic(acrosticTemplate.example, 'poem')
    const failures = items.filter((i) => i.status === 'fail')
    expect(failures).toEqual([])
    expect(items[0].status).toBe('pass')
  })
})
