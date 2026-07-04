import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { listPoems } from '@/db/poems'
import { seedLibraryIfNeeded } from '@/db/seedLibrary'

beforeEach(async () => {
  await db.poems.clear()
  localStorage.clear()
})

describe('seedLibraryIfNeeded', () => {
  it('adds the sample poems to an empty library', async () => {
    await seedLibraryIfNeeded()
    const poems = await listPoems()
    expect(poems).toHaveLength(2)
    expect(poems.map((p) => p.title).sort()).toEqual(['Hope is the thing with feathers', 'Sonnet 18'])
  })

  it('does not seed again on a second call', async () => {
    await seedLibraryIfNeeded()
    await seedLibraryIfNeeded()
    const poems = await listPoems()
    expect(poems).toHaveLength(2)
  })

  it('does not seed if the library already has poems', async () => {
    localStorage.clear()
    await db.poems.add({
      id: 'existing',
      title: 'My poem',
      body: '',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      status: 'draft',
      favorite: false,
      tags: [],
      collectionIds: [],
    })

    await seedLibraryIfNeeded()
    const poems = await listPoems()
    expect(poems).toHaveLength(1)
  })

  it('does not re-seed after the flag is set, even if the library becomes empty', async () => {
    await seedLibraryIfNeeded()
    await db.poems.clear()
    await seedLibraryIfNeeded()
    const poems = await listPoems()
    expect(poems).toHaveLength(0)
  })
})
