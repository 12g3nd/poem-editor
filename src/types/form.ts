import type { Foot } from '@/engines/meter'

export interface LineRule {
  syllables?: number
  meter?: { foot: Foot; feet: number }
  /** Rhyme-scheme letter (e.g. "A") — every line sharing a letter should
   * rhyme with every other line that has it. */
  rhymeLabel?: string
  /** 0-based index of an earlier line this line must repeat verbatim
   * (refrain forms: villanelle, triolet, pantoum). */
  refrainOf?: number
  /** 0-based index of an earlier line this line must share its *last word*
   * with — a lighter refrain than `refrainOf`, for forms whose repetition
   * is a closing word/radif rather than the whole line (ghazal, rondeau). */
  endWordMatches?: number
  /** 0-based index of an earlier line this line must share its *first word*
   * with — the rondeau's short refrain repeats the opening of line 1, not
   * the whole line. */
  startWordMatches?: number
}

export interface FormTemplate {
  id: string
  name: string
  description: string
  example: string
  /** One entry per non-blank content line, in order. Blank lines (stanza
   * breaks) are not indexed here — they're informational only, via
   * `stanzaLineCounts`. */
  lineRules: LineRule[]
  /** How many content lines are in each stanza, for display/stanza-break
   * hinting — not strictly validated (stanza breaks are a formatting nicety,
   * not core to most forms' definitions). */
  stanzaLineCounts: number[]
  isCustom?: boolean
  /** Flags a template that needs the sestina end-word planner UI instead of
   * (or alongside) the generic checklist. */
  isSestina?: boolean
  /** Flags a template that needs the acrostic letter-guide UI; its line
   * count is determined by the poet's chosen word, not fixed here. */
  isAcrostic?: boolean
}

export interface ChecklistItem {
  line: number
  label: string
  status: 'pass' | 'fail' | 'pending'
}
