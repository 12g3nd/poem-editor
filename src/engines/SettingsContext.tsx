import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadSettings, saveSettings } from '@/engines/settingsStorage'
import type { AppSettings } from '@/types/settings'

interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (changes: Partial<AppSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings])

  function updateSettings(changes: Partial<AppSettings>) {
    setSettings((prev) => ({ ...prev, ...changes }))
  }

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within a SettingsProvider')
  return context
}
