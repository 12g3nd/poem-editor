import type { DictionaryIndex } from '@/engines/dictionary'
import type { OverrideIndex } from '@/types/override'
import { scanLine, stressSequence } from '@/engines/scansion'
import { detectMeter, type MeterDetection } from '@/engines/meter'
import { splitLines } from '@/engines/lineStats'

export interface LineMeterInfo {
  lineIndex: number
  detection: MeterDetection | null
  /** The line's best-fit meter is iambic, but its first foot is reversed
   * (stressed-unstressed instead of unstressed-stressed) — the single most
   * common named substitution in English verse. */
  openingInversion: boolean
}

export interface PoemMeterReport {
  lines: LineMeterInfo[]
  /** The most frequently detected meter name among non-blank lines. */
  dominantMeter: string | null
  /** Indices of lines whose best-fit confidence falls below the "regular"
   * threshold — worth a poet's second look, not necessarily a mistake. */
  irregularLines: number[]
}

const IRREGULAR_CONFIDENCE_THRESHOLD = 0.8

export function analyzePoemMeter(body: string, dict: DictionaryIndex, overrides?: OverrideIndex): PoemMeterReport {
  const lines: LineMeterInfo[] = splitLines(body).map((line, lineIndex) => {
    if (line.trim().length === 0) {
      return { lineIndex, detection: null, openingInversion: false }
    }

    const stress = stressSequence(scanLine(line, dict, overrides))
    const detection = detectMeter(stress)
    const openingInversion = Boolean(
      detection && detection.foot === 'iamb' && stress.length >= 2 && stress[0] === 1 && stress[1] === 0,
    )

    return { lineIndex, detection, openingInversion }
  })

  const counts = new Map<string, number>()
  for (const line of lines) {
    if (line.detection) counts.set(line.detection.name, (counts.get(line.detection.name) ?? 0) + 1)
  }

  let dominantMeter: string | null = null
  let dominantCount = 0
  for (const [name, count] of counts) {
    if (count > dominantCount) {
      dominantMeter = name
      dominantCount = count
    }
  }

  const irregularLines = lines
    .filter((line) => line.detection && line.detection.confidence < IRREGULAR_CONFIDENCE_THRESHOLD)
    .map((line) => line.lineIndex)

  return { lines, dominantMeter, irregularLines }
}
