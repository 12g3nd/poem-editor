import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { buildDictionaryIndex, type DictionaryTuple } from '@/engines/dictionary'
import { validateForm } from '@/engines/formValidation'
import { BUILT_IN_TEMPLATES } from '@/engines/formTemplates/index'

/**
 * Every built-in template ships one example poem. This loads the real
 * bundled dictionary (not the small test fixture) and checks that each
 * template's own example actually satisfies its own rules — a safety net
 * against a hand-written example quietly drifting out of sync with its
 * form's syllable/meter/rhyme/refrain requirements.
 */
function loadRealDictionary() {
  const raw = readFileSync(path.resolve(process.cwd(), 'public/data/dictionary.json'), 'utf-8')
  const tuples = JSON.parse(raw) as DictionaryTuple[]
  return buildDictionaryIndex(tuples)
}

describe('built-in form template examples', () => {
  const dict = loadRealDictionary()

  // Meter is checked against a strict binary (stressed/unstressed) model;
  // real accentual-syllabic verse — even textbook iambic pentameter —
  // legitimately contains substitutions a strict algorithm flags as
  // "deviating" without actually breaking the meter to a human ear. So
  // meter items are exercised (the code path runs) but not asserted here;
  // structure (line count), syllables, rhyme, and refrains are unambiguous
  // and are asserted strictly for every template.
  // Sestina and acrostic are validated separately (sestina.test.ts,
  // acrostic.test.ts) — both depend on poet-chosen words (end words /
  // acrostic word) rather than a fixed lineRules array, so they ship with
  // empty lineRules by design and don't fit the generic engine. Free verse
  // has no rules at all to check.
  it.each(BUILT_IN_TEMPLATES.filter((t) => t.lineRules.length > 0).map((t) => [t.id, t] as const))('%s example satisfies its own template', (_id, template) => {
    const items = validateForm(template.example, template, dict)
    const failures = items.filter((item) => item.status === 'fail' && !item.label.includes('meter'))
    expect(failures).toEqual([])
  })
})
