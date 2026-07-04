import { db } from '@/db/schema'
import type { FormTemplate } from '@/types/form'
import type { CustomFormInput } from '@/engines/customForm'
import { buildCustomTemplate } from '@/engines/customForm'

export async function saveCustomForm(input: Omit<CustomFormInput, 'id'>): Promise<FormTemplate> {
  const template = buildCustomTemplate({ ...input, id: crypto.randomUUID() })
  await db.customForms.add(template)
  return template
}

export function listCustomForms(): Promise<FormTemplate[]> {
  return db.customForms.toArray()
}

export async function getCustomForm(id: string): Promise<FormTemplate | null> {
  const form = await db.customForms.get(id)
  return form ?? null
}

export async function deleteCustomForm(id: string): Promise<void> {
  await db.customForms.delete(id)
}
