import { describe, it, expect } from 'vitest'
import {
  nextSestinaRotation,
  computeSestinaRotation,
  computeSestinaEnvoi,
  planSestina,
  validateSestina,
  SESTINA_TOTAL_LINES,
} from '@/engines/sestina'
import { sestina } from '@/engines/formTemplates/sestinaForm'

describe('nextSestinaRotation', () => {
  it('applies the standard retrogradatio cruciata permutation', () => {
    expect(nextSestinaRotation([1, 2, 3, 4, 5, 6])).toEqual([6, 1, 5, 2, 4, 3])
  })
})

describe('computeSestinaRotation', () => {
  it('produces the full standard 6-stanza rotation from the first stanza', () => {
    const stanzas = computeSestinaRotation(['1', '2', '3', '4', '5', '6'])
    expect(stanzas).toEqual([
      ['1', '2', '3', '4', '5', '6'],
      ['6', '1', '5', '2', '4', '3'],
      ['3', '6', '4', '1', '2', '5'],
      ['5', '3', '2', '6', '1', '4'],
      ['4', '5', '1', '3', '6', '2'],
      ['2', '4', '6', '5', '3', '1'],
    ])
  })
})

describe('computeSestinaEnvoi', () => {
  it('pairs each envoi line\'s end word and embedded word from the first stanza', () => {
    const envoi = computeSestinaEnvoi(['w1', 'w2', 'w3', 'w4', 'w5', 'w6'])
    expect(envoi).toEqual([
      { endWord: 'w2', embedWord: 'w5' },
      { endWord: 'w4', embedWord: 'w3' },
      { endWord: 'w6', embedWord: 'w1' },
    ])
  })
})

describe('planSestina', () => {
  it('produces one required end word per line across all 39 lines', () => {
    const plan = planSestina(['w1', 'w2', 'w3', 'w4', 'w5', 'w6'])
    expect(plan).toHaveLength(SESTINA_TOTAL_LINES)
    expect(plan[0]).toEqual({ lineIndex: 0, requiredEndWord: 'w1' })
    expect(plan[6]).toEqual({ lineIndex: 6, requiredEndWord: 'w6' }) // stanza 2 starts with w6
    expect(plan[36]).toEqual({ lineIndex: 36, requiredEndWord: 'w2' }) // envoi line 1
  })
})

const WORDS = ['ash', 'bell', 'coal', 'dusk', 'ember', 'frost']

function stanzaLines(words: string[]): string[] {
  return words.map((w) => `a line ending in ${w}`)
}

function buildValidSestina(): string {
  const rotation = computeSestinaRotation(WORDS)
  const envoi = computeSestinaEnvoi(WORDS)
  const stanzas = rotation.map((words) => stanzaLines(words).join('\n'))
  const envoiLines = envoi.map((e) => `line with ${e.embedWord} ending in ${e.endWord}`).join('\n')
  return [...stanzas, envoiLines].join('\n\n')
}

describe('validateSestina', () => {
  it('passes a poem following the standard rotation and envoi exactly', () => {
    const items = validateSestina(buildValidSestina())
    const failures = items.filter((i) => i.status === 'fail')
    expect(failures).toEqual([])
    expect(items[0].status).toBe('pass')
  })

  it('is pending when the first stanza is not yet finished', () => {
    const items = validateSestina('a line ending in ash\na line ending in bell')
    expect(items[0].status).toBe('pending')
  })

  it('derives the rotation from whatever the poet actually wrote in stanza one', () => {
    const customWords = ['one', 'two', 'three', 'four', 'five', 'six']
    const rotation = computeSestinaRotation(customWords)
    const body = rotation.map((words) => stanzaLines(words).join('\n')).join('\n\n')
    // Only the six stanzas, no envoi yet — still pending overall, but the
    // stanza rotation itself should all pass.
    const items = validateSestina(body)
    const stanzaFailures = items.filter((i) => i.status === 'fail')
    expect(stanzaFailures).toEqual([])
  })

  it('fails a line whose end word breaks the required rotation', () => {
    const rotation = computeSestinaRotation(WORDS)
    const stanzas = rotation.map((words) => stanzaLines(words).join('\n'))
    stanzas[1] = stanzas[1].replace('ash', 'wrongword') // corrupt stanza 2's 2nd line
    const envoi = computeSestinaEnvoi(WORDS)
    const envoiLines = envoi.map((e) => `line with ${e.embedWord} ending in ${e.endWord}`).join('\n')
    const body = [...stanzas, envoiLines].join('\n\n')

    const items = validateSestina(body)
    expect(items.filter((i) => i.status === 'fail').length).toBeGreaterThan(0)
  })

  it('checks the envoi requires both the end word and the embedded word', () => {
    const rotation = computeSestinaRotation(WORDS)
    const stanzas = rotation.map((words) => stanzaLines(words).join('\n'))
    // Envoi line missing its required embedded word.
    const body = [...stanzas, 'a line ending in bell\na line ending in dusk\na line ending in frost'].join('\n\n')
    const items = validateSestina(body)
    const embedFailures = items.filter((i) => i.status === 'fail' && i.label.includes('also contain'))
    expect(embedFailures.length).toBeGreaterThan(0)
  })
})

describe('sestina template example', () => {
  it('satisfies the rotation and envoi it claims to demonstrate', () => {
    const items = validateSestina(sestina.example)
    const failures = items.filter((i) => i.status === 'fail')
    expect(failures).toEqual([])
    expect(items[0].status).toBe('pass')
  })
})
