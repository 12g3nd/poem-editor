import type { FormTemplate } from '@/types/form'
import { haiku, tanka, cinquain } from '@/engines/formTemplates/fixedSyllableForms'
import {
  shakespeareanSonnet,
  petrarchanSonnet,
  limerick,
  blankVerse,
} from '@/engines/formTemplates/meterRhymeForms'
import { villanelle, triolet, pantoum } from '@/engines/formTemplates/refrainForms'
import { ghazal, rondeau, terzaRima, balladStanza } from '@/engines/formTemplates/otherRhymeForms'
import { sestina } from '@/engines/formTemplates/sestinaForm'
import { acrostic, freeVerse } from '@/engines/formTemplates/specialForms'

export const BUILT_IN_TEMPLATES: FormTemplate[] = [
  haiku,
  tanka,
  cinquain,
  shakespeareanSonnet,
  petrarchanSonnet,
  limerick,
  blankVerse,
  villanelle,
  triolet,
  pantoum,
  ghazal,
  rondeau,
  terzaRima,
  balladStanza,
  sestina,
  acrostic,
  freeVerse,
]

export const BUILT_IN_TEMPLATES_BY_ID: Record<string, FormTemplate> = Object.fromEntries(
  BUILT_IN_TEMPLATES.map((t) => [t.id, t]),
)
