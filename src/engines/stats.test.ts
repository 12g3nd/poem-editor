import { describe, it, expect } from 'vitest'
import {
  countByStatus,
  countByForm,
  totalWords,
  mostUsedWords,
  collectActivityTimestamps,
  computeActivityHeatmap,
  currentStreak,
} from '@/engines/stats'
import type { Poem } from '@/types/poem'
import type { Snapshot } from '@/types/snapshot'

function poem(overrides: Partial<Poem> = {}): Poem {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    body: '',
    createdAt: 0,
    modifiedAt: 0,
    ...overrides,
  }
}

describe('countByStatus', () => {
  it('counts poems per status, defaulting missing status to draft', () => {
    const poems = [poem({ status: 'idea' }), poem({ status: 'done' }), poem({ status: undefined })]
    expect(countByStatus(poems)).toEqual({ idea: 1, draft: 1, revising: 0, done: 1 })
  })
})

describe('countByForm', () => {
  it('groups untracked poems under "none"', () => {
    const poems = [poem({ formId: 'haiku' }), poem({ formId: 'haiku' }), poem({ formId: null })]
    const counts = countByForm(poems)
    expect(counts.get('haiku')).toBe(2)
    expect(counts.get('none')).toBe(1)
  })
})

describe('totalWords', () => {
  it('sums word counts across every poem', () => {
    const poems = [poem({ body: 'one two three' }), poem({ body: 'four five' })]
    expect(totalWords(poems)).toBe(5)
  })
})

describe('mostUsedWords', () => {
  it('excludes stopwords and ranks by frequency', () => {
    const poems = [poem({ body: 'the light and the light and the dark' })]
    const result = mostUsedWords(poems)
    expect(result[0]).toEqual({ word: 'light', count: 2 })
    expect(result.find((w) => w.word === 'the')).toBeUndefined()
    expect(result.find((w) => w.word === 'and')).toBeUndefined()
  })

  it('breaks ties alphabetically', () => {
    const poems = [poem({ body: 'zebra apple' })]
    const result = mostUsedWords(poems)
    expect(result.map((w) => w.word)).toEqual(['apple', 'zebra'])
  })

  it('respects the limit', () => {
    const poems = [poem({ body: 'alpha beta gamma delta' })]
    expect(mostUsedWords(poems, 2)).toHaveLength(2)
  })
})

describe('collectActivityTimestamps', () => {
  it('includes each poem\'s created/modified days and every snapshot\'s day', () => {
    const poems = [poem({ createdAt: 1, modifiedAt: 2 })]
    const snapshots: Snapshot[] = [{ id: 's1', poemId: 'p1', title: 't', body: 'b', createdAt: 3 }]
    expect(collectActivityTimestamps(poems, snapshots).sort()).toEqual([1, 2, 3])
  })
})

describe('computeActivityHeatmap', () => {
  it('counts events per calendar day', () => {
    const day = new Date('2026-01-15T10:00:00Z').getTime()
    const sameDayLater = new Date('2026-01-15T20:00:00Z').getTime()
    const nextDay = new Date('2026-01-16T10:00:00Z').getTime()
    const heatmap = computeActivityHeatmap([day, sameDayLater, nextDay])
    expect(heatmap.get('2026-01-15')).toBe(2)
    expect(heatmap.get('2026-01-16')).toBe(1)
  })
})

describe('currentStreak', () => {
  it('counts consecutive days of activity ending today', () => {
    const today = new Date('2026-01-15T12:00:00Z')
    const heatmap = computeActivityHeatmap([
      new Date('2026-01-13T12:00:00Z').getTime(),
      new Date('2026-01-14T12:00:00Z').getTime(),
      new Date('2026-01-15T12:00:00Z').getTime(),
    ])
    expect(currentStreak(heatmap, today)).toBe(3)
  })

  it('does not break the streak just because today has no activity yet', () => {
    const today = new Date('2026-01-15T12:00:00Z')
    const heatmap = computeActivityHeatmap([
      new Date('2026-01-13T12:00:00Z').getTime(),
      new Date('2026-01-14T12:00:00Z').getTime(),
    ])
    expect(currentStreak(heatmap, today)).toBe(2)
  })

  it('is broken by a missing day', () => {
    const today = new Date('2026-01-15T12:00:00Z')
    const heatmap = computeActivityHeatmap([
      new Date('2026-01-10T12:00:00Z').getTime(),
      new Date('2026-01-15T12:00:00Z').getTime(),
    ])
    expect(currentStreak(heatmap, today)).toBe(1)
  })

  it('returns 0 for an empty heatmap', () => {
    expect(currentStreak(new Map(), new Date('2026-01-15T12:00:00Z'))).toBe(0)
  })
})
