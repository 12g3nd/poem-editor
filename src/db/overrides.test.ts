import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { setOverride, getOverride, listOverrides, deleteOverride, loadOverrideIndex } from '@/db/overrides'

beforeEach(async () => {
  await db.wordOverrides.clear()
})

describe('word overrides', () => {
  it('stores and retrieves a syllable override', async () => {
    await setOverride('fire', { syllables: 1 })
    const override = await getOverride('fire')
    expect(override).toEqual({ word: 'fire', syllables: 1 })
  })

  it('normalizes the word to lowercase', async () => {
    await setOverride('Fire', { syllables: 1 })
    expect(await getOverride('FIRE')).toEqual({ word: 'fire', syllables: 1 })
  })

  it('merges a second override for the same word rather than replacing it', async () => {
    await setOverride('fire', { syllables: 1 })
    await setOverride('fire', { stressPattern: '1' })
    expect(await getOverride('fire')).toEqual({
      word: 'fire',
      syllables: 1,
      stressPattern: '1',
    })
  })

  it('returns null for a word with no override', async () => {
    expect(await getOverride('unseen')).toBeNull()
  })

  it('lists all stored overrides', async () => {
    await setOverride('fire', { syllables: 1 })
    await setOverride('hour', { syllables: 1 })
    const all = await listOverrides()
    expect(all).toHaveLength(2)
  })

  it('deletes an override', async () => {
    await setOverride('fire', { syllables: 1 })
    await deleteOverride('fire')
    expect(await getOverride('fire')).toBeNull()
  })

  it('builds an OverrideIndex map keyed by word', async () => {
    await setOverride('fire', { syllables: 1 })
    await setOverride('hour', { stressPattern: '1' })
    const index = await loadOverrideIndex()
    expect(index.get('fire')?.syllables).toBe(1)
    expect(index.get('hour')?.stressPattern).toBe('1')
    expect(index.size).toBe(2)
  })
})
