import { describe, it, expect } from 'vitest'
import { searchPoems, filterPoems, allTags } from '@/engines/libraryFilter'
import type { Poem } from '@/types/poem'

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

describe('searchPoems', () => {
  it('matches the title case-insensitively', () => {
    const poems = [poem({ title: 'Summer Day' }), poem({ title: 'Winter Night' })]
    expect(searchPoems(poems, 'summer')).toHaveLength(1)
  })

  it('matches the body', () => {
    const poems = [poem({ title: 'A', body: 'a field of gold' }), poem({ title: 'B', body: 'a wall of stone' })]
    expect(searchPoems(poems, 'gold')).toHaveLength(1)
  })

  it('returns everything for an empty query', () => {
    const poems = [poem(), poem()]
    expect(searchPoems(poems, '   ')).toHaveLength(2)
  })
})

describe('filterPoems', () => {
  const poems = [
    poem({ id: '1', status: 'idea', tags: ['nature'], collectionIds: ['c1'], favorite: true }),
    poem({ id: '2', status: 'done', tags: ['love'], collectionIds: ['c2'], favorite: false }),
    poem({ id: '3', status: 'done', tags: ['nature', 'love'], collectionIds: [], favorite: true }),
  ]

  it('filters by status', () => {
    expect(filterPoems(poems, { status: 'done' }).map((p) => p.id)).toEqual(['2', '3'])
  })

  it('filters by tag', () => {
    expect(filterPoems(poems, { tag: 'nature' }).map((p) => p.id)).toEqual(['1', '3'])
  })

  it('filters by collection', () => {
    expect(filterPoems(poems, { collectionId: 'c1' }).map((p) => p.id)).toEqual(['1'])
  })

  it('filters by favorite', () => {
    expect(filterPoems(poems, { favoriteOnly: true }).map((p) => p.id)).toEqual(['1', '3'])
  })

  it('combines multiple filters', () => {
    expect(filterPoems(poems, { status: 'done', tag: 'nature' }).map((p) => p.id)).toEqual(['3'])
  })

  it('combines search with other filters', () => {
    const withTitles = [
      poem({ id: '1', title: 'Ocean', status: 'done' }),
      poem({ id: '2', title: 'Ocean', status: 'idea' }),
    ]
    expect(filterPoems(withTitles, { searchQuery: 'ocean', status: 'done' }).map((p) => p.id)).toEqual(['1'])
  })
})

describe('allTags', () => {
  it('returns every distinct tag, alphabetically', () => {
    const poems = [poem({ tags: ['zebra', 'apple'] }), poem({ tags: ['apple', 'mango'] })]
    expect(allTags(poems)).toEqual(['apple', 'mango', 'zebra'])
  })

  it('returns an empty array when no poems have tags', () => {
    expect(allTags([poem(), poem()])).toEqual([])
  })
})
