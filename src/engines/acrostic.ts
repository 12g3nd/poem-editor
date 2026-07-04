import type { ChecklistItem } from '@/types/form'
import { firstWord } from '@/engines/normalize'
import { contentLines } from '@/engines/formValidation'

export interface AcrosticRequirement {
  lineIndex: number
  requiredLetter: string
}

/** One requirement per letter of the chosen word — what the vertical
 * letter-guide UI renders alongside the editor. */
export function planAcrostic(word: string): AcrosticRequirement[] {
  return word
    .split('')
    .filter((ch) => /[a-zA-Z]/.test(ch))
    .map((ch, lineIndex) => ({ lineIndex, requiredLetter: ch.toUpperCase() }))
}

export function validateAcrostic(body: string, word: string): ChecklistItem[] {
  const requirements = planAcrostic(word)
  const lines = contentLines(body)
  const items: ChecklistItem[] = []

  items.push({
    line: 0,
    label: `${requirements.length} lines total (spelling "${requirements.map((r) => r.requiredLetter).join('')}")`,
    status:
      lines.length < requirements.length ? 'pending' : lines.length === requirements.length ? 'pass' : 'fail',
  })

  requirements.forEach((req, index) => {
    const actualLine: string | undefined = lines[index]
    const pending = actualLine === undefined
    const actualLetter = pending ? '' : (firstWord(actualLine)?.[0] ?? '').toUpperCase()
    items.push({
      line: index + 1,
      label: `should start with "${req.requiredLetter}"`,
      status: pending ? 'pending' : actualLetter === req.requiredLetter ? 'pass' : 'fail',
    })
  })

  return items
}
