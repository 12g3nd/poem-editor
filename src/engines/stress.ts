import type { DictionaryIndex } from '@/engines/dictionary'
import type { OverrideIndex } from '@/types/override'

/**
 * Raw per-word stress pattern (e.g. "010"), independent of surrounding
 * context. This is deliberately naive — line-level prosody (demoting
 * function words CMU marks as stressed, detecting meter and substitutions)
 * is a Phase 5 concern layered on top of this, not part of the word-level
 * engine.
 *
 * Returns null when the word is unknown and can't be decomposed: guessing at
 * stress for an invented word is unreliable enough that "unknown" is more
 * honest than a fabricated pattern. A manual override is the fix.
 */
export function getStressPattern(
  word: string,
  dict: DictionaryIndex,
  overrides?: OverrideIndex,
): string | null {
  const normalized = word.toLowerCase()

  const override = overrides?.get(normalized)?.stressPattern
  if (override !== undefined) return override

  const entry = dict.get(normalized)
  if (entry) return entry.stress

  if (normalized.includes('-')) {
    const parts = normalized.split('-').filter((part) => part.length > 0)
    if (parts.length > 1) {
      const patterns = parts.map((part) => getStressPattern(part, dict, overrides))
      if (patterns.every((pattern): pattern is string => pattern !== null)) {
        return patterns.join('')
      }
    }
  }

  return null
}
