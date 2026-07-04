import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings'

const STORAGE_KEY = 'sonnet5-settings'

/** Loads saved settings from localStorage, falling back to defaults for
 * anything missing or if the stored value is corrupt — a device-local UI
 * preference, not poem data, so there's nothing destructive to protect
 * against here. */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
