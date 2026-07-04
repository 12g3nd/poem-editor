import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import { saveCustomForm, listCustomForms, getCustomForm, deleteCustomForm } from '@/db/customForms'

beforeEach(async () => {
  await db.customForms.clear()
})

describe('custom forms storage', () => {
  it('saves a custom form built from the given input', async () => {
    const form = await saveCustomForm({ name: 'My Form', rhymeScheme: 'AABB' })
    expect(form.name).toBe('My Form')
    expect(form.isCustom).toBe(true)
    expect(form.lineRules).toHaveLength(4)
    expect(form.id).toBeTruthy()
  })

  it('lists saved custom forms', async () => {
    await saveCustomForm({ name: 'Form A', syllablesPerLine: [5] })
    await saveCustomForm({ name: 'Form B', syllablesPerLine: [7] })
    const forms = await listCustomForms()
    expect(forms.map((f) => f.name).sort()).toEqual(['Form A', 'Form B'])
  })

  it('retrieves a single custom form by id', async () => {
    const saved = await saveCustomForm({ name: 'Form A', syllablesPerLine: [5] })
    const fetched = await getCustomForm(saved.id)
    expect(fetched).toEqual(saved)
  })

  it('returns null for a missing custom form', async () => {
    expect(await getCustomForm('does-not-exist')).toBeNull()
  })

  it('deletes a custom form', async () => {
    const saved = await saveCustomForm({ name: 'Form A', syllablesPerLine: [5] })
    await deleteCustomForm(saved.id)
    expect(await getCustomForm(saved.id)).toBeNull()
  })
})
