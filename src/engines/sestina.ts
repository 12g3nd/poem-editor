import type { ChecklistItem } from '@/types/form'
import { contentLines } from '@/engines/formValidation'
import { lastWord, extractWords } from '@/engines/normalize'

export const SESTINA_STANZA_LINES = 6
export const SESTINA_STANZA_COUNT = 6
export const SESTINA_ENVOI_LINES = 3
export const SESTINA_TOTAL_LINES = SESTINA_STANZA_LINES * SESTINA_STANZA_COUNT + SESTINA_ENVOI_LINES

/**
 * The standard sestina rotation ("retrogradatio cruciata"): given a
 * stanza's end-word order (a,b,c,d,e,f), the next stanza's order takes
 * last, first, second-to-last, second, fourth, third.
 */
export function nextSestinaRotation<T>(order: T[]): T[] {
  const [a, b, c, d, e, f] = order
  return [f, a, e, b, d, c]
}

/** All 6 stanzas' required end-word orders, derived from the first
 * stanza's 6 end words. */
export function computeSestinaRotation(firstStanzaWords: string[]): string[][] {
  const stanzas: string[][] = [firstStanzaWords]
  for (let i = 1; i < SESTINA_STANZA_COUNT; i++) {
    stanzas.push(nextSestinaRotation(stanzas[i - 1]))
  }
  return stanzas
}

export interface EnvoiRequirement {
  endWord: string
  embedWord: string
}

/** The envoi's 3 lines each require one word at the end and one embedded
 * elsewhere — one standard convention pairs (word2 end / word5 embedded),
 * (word4 end / word3 embedded), (word6 end / word1 embedded), using the
 * first stanza's original word order. Sestina envoi conventions vary across
 * sources; this is one widely-cited pairing, not the only one. */
export function computeSestinaEnvoi(firstStanzaWords: string[]): EnvoiRequirement[] {
  const [w1, w2, w3, w4, w5, w6] = firstStanzaWords
  return [
    { endWord: w2, embedWord: w5 },
    { endWord: w4, embedWord: w3 },
    { endWord: w6, embedWord: w1 },
  ]
}

/** Everything the end-word planner UI needs: what the first stanza
 * established, and the required end word for every remaining line
 * (including the envoi), regardless of how much the poet has written. */
export function planSestina(firstStanzaWords: string[]): { lineIndex: number; requiredEndWord: string }[] {
  const rotation = computeSestinaRotation(firstStanzaWords)
  const envoi = computeSestinaEnvoi(firstStanzaWords)
  const plan: { lineIndex: number; requiredEndWord: string }[] = []

  rotation.forEach((stanzaWords, stanzaIndex) => {
    stanzaWords.forEach((word, lineInStanza) => {
      plan.push({ lineIndex: stanzaIndex * SESTINA_STANZA_LINES + lineInStanza, requiredEndWord: word })
    })
  })

  envoi.forEach((requirement, i) => {
    plan.push({ lineIndex: SESTINA_STANZA_LINES * SESTINA_STANZA_COUNT + i, requiredEndWord: requirement.endWord })
  })

  return plan
}

export function validateSestina(body: string): ChecklistItem[] {
  const lines = contentLines(body)
  const items: ChecklistItem[] = []

  items.push({
    line: 0,
    label: `${SESTINA_TOTAL_LINES} lines total (six 6-line stanzas + a 3-line envoi)`,
    status:
      lines.length < SESTINA_TOTAL_LINES
        ? 'pending'
        : lines.length === SESTINA_TOTAL_LINES
          ? 'pass'
          : 'fail',
  })

  if (lines.length < SESTINA_STANZA_LINES) {
    // The first stanza isn't finished, so no rotation can be derived yet.
    return items
  }

  const firstStanzaWords = lines.slice(0, SESTINA_STANZA_LINES).map((line) => lastWord(line) ?? '')
  const plan = planSestina(firstStanzaWords)
  const envoi = computeSestinaEnvoi(firstStanzaWords)

  for (let i = SESTINA_STANZA_LINES; i < SESTINA_STANZA_LINES * SESTINA_STANZA_COUNT; i++) {
    const { requiredEndWord } = plan[i]
    const actualLine: string | undefined = lines[i]
    const pending = actualLine === undefined
    const actualWord = pending ? '' : (lastWord(actualLine) ?? '')
    items.push({
      line: i + 1,
      label: `should end with "${requiredEndWord}"`,
      status: pending ? 'pending' : actualWord === requiredEndWord ? 'pass' : 'fail',
    })
  }

  for (let i = 0; i < SESTINA_ENVOI_LINES; i++) {
    const lineIndex = SESTINA_STANZA_LINES * SESTINA_STANZA_COUNT + i
    const actualLine: string | undefined = lines[lineIndex]
    const pending = actualLine === undefined
    const requirement = envoi[i]

    const actualEndWord = pending ? '' : (lastWord(actualLine) ?? '')
    items.push({
      line: lineIndex + 1,
      label: `envoi — should end with "${requirement.endWord}"`,
      status: pending ? 'pending' : actualEndWord === requirement.endWord ? 'pass' : 'fail',
    })

    const containsEmbed = pending ? false : extractWords(actualLine).includes(requirement.embedWord)
    items.push({
      line: lineIndex + 1,
      label: `envoi — should also contain "${requirement.embedWord}"`,
      status: pending ? 'pending' : containsEmbed ? 'pass' : 'fail',
    })
  }

  return items
}
