export type Foot = 'iamb' | 'trochee' | 'anapest' | 'dactyl'

export const FOOT_PATTERNS: Record<Foot, (0 | 1)[]> = {
  iamb: [0, 1],
  trochee: [1, 0],
  anapest: [0, 0, 1],
  dactyl: [1, 0, 0],
}

const FOOT_ADJECTIVE: Record<Foot, string> = {
  iamb: 'Iambic',
  trochee: 'Trochaic',
  anapest: 'Anapestic',
  dactyl: 'Dactylic',
}

const METER_LENGTH_NAME = ['Monometer', 'Dimeter', 'Trimeter', 'Tetrameter', 'Pentameter', 'Hexameter']
const MAX_FEET = 6

export function meterName(foot: Foot, feet: number): string {
  const lengthName = METER_LENGTH_NAME[feet - 1] ?? `${feet}-foot`
  return `${FOOT_ADJECTIVE[foot]} ${lengthName}`
}

export interface MeterDetection {
  foot: Foot
  feet: number
  name: string
  /** Fraction of syllable positions matching the ideal pattern, 0-1. */
  confidence: number
  /** Syllable indices where the actual stress differs from the ideal. */
  deviations: number[]
}

function buildIdealPattern(foot: Foot, feet: number): (0 | 1)[] {
  const pattern = FOOT_PATTERNS[foot]
  return Array.from({ length: pattern.length * feet }, (_, i) => pattern[i % pattern.length])
}

function scoreAgainst(stress: (0 | 1)[], ideal: (0 | 1)[]): { confidence: number; deviations: number[] } {
  const compareLength = Math.max(stress.length, ideal.length)
  const deviations: number[] = []
  let matches = 0

  for (let i = 0; i < compareLength; i++) {
    const actual = i < stress.length ? stress[i] : undefined
    const idealVal = i < ideal.length ? ideal[i] : undefined
    if (actual !== undefined && idealVal !== undefined) {
      if (actual === idealVal) matches++
      else deviations.push(i)
    }
    // A length mismatch (one side ran out) counts against confidence via
    // compareLength but isn't a specific syllable to flag as a deviation.
  }

  return { confidence: compareLength === 0 ? 1 : matches / compareLength, deviations }
}

/**
 * Finds the best-fit meter for a stress sequence: every (foot, foot-count)
 * combination up to hexameter is scored by how many syllable positions
 * match the ideal pattern (penalizing length mismatches too), and the
 * highest-scoring combination wins. Ties favor whichever foot/count was
 * tried first (iamb before trochee before anapest before dactyl, fewer feet
 * before more) — a reasonable default since iambic is by far the most
 * common meter in English verse.
 */
export function detectMeter(stress: (0 | 1)[]): MeterDetection | null {
  if (stress.length === 0) return null

  let best: MeterDetection | null = null

  for (const foot of Object.keys(FOOT_PATTERNS) as Foot[]) {
    for (let feet = 1; feet <= MAX_FEET; feet++) {
      const ideal = buildIdealPattern(foot, feet)
      const { confidence, deviations } = scoreAgainst(stress, ideal)
      if (!best || confidence > best.confidence) {
        best = { foot, feet, name: meterName(foot, feet), confidence, deviations }
      }
    }
  }

  return best
}

/** Deviating syllable indices for a specific *chosen* target meter, rather
 * than whatever best-fits automatically — what target-meter mode overlays. */
export function findDeviations(stress: (0 | 1)[], foot: Foot, feet: number): number[] {
  const ideal = buildIdealPattern(foot, feet)
  return scoreAgainst(stress, ideal).deviations
}
