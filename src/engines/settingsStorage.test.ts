import { describe, it, expect, beforeEach } from 'vitest'
import { loadSettings, saveSettings } from '@/engines/settingsStorage'
import { DEFAULT_SETTINGS } from '@/types/settings'

beforeEach(() => {
  localStorage.clear()
})

describe('loadSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('returns saved settings after saveSettings', () => {
    const settings = { ...DEFAULT_SETTINGS, theme: 'dark' as const, editorFont: 'sans' as const, fontSize: 20, lineHeight: 36 }
    saveSettings(settings)
    expect(loadSettings()).toEqual(settings)
  })

  it('fills in missing fields from a partially-saved older shape', () => {
    localStorage.setItem('sonnet5-settings', JSON.stringify({ theme: 'dark' }))
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' })
  })

  it('falls back to defaults for corrupt stored data', () => {
    localStorage.setItem('sonnet5-settings', 'not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
