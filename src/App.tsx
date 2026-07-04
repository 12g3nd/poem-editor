import { useEffect, useMemo } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { DictionaryProvider } from '@/engines/DictionaryContext'
import { SettingsProvider, useSettings } from '@/engines/SettingsContext'
import { CommandPaletteProvider, useCommandPaletteState, useRegisterCommands, type Command } from '@/engines/CommandPaletteContext'
import { seedLibraryIfNeeded } from '@/db/seedLibrary'
import { createPoem } from '@/db/poems'
import { createStory } from '@/db/stories'
import { LibraryPage } from '@/features/library/LibraryPage'
import { EditorPage } from '@/features/editor/EditorPage'
import { HistoryPage } from '@/features/editor/HistoryPage'
import { StoryEditorPage } from '@/features/editor/StoryEditorPage'
import { StoryHistoryPage } from '@/features/editor/StoryHistoryPage'
import { StatsPage } from '@/features/stats/StatsPage'
import { CommandPalette } from '@/features/commandPalette/CommandPalette'
import { ShortcutsHelp } from '@/features/commandPalette/ShortcutsHelp'

/** Registers the commands available from anywhere in the app — needs to sit
 * inside both the router (for navigation) and the command palette provider. */
function GlobalCommands() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { setShortcutsOpen } = useCommandPaletteState()

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'new-poem',
        label: 'New poem',
        run: () => {
          void createPoem().then((poem) => navigate(`/poem/${poem.id}`))
        },
      },
      {
        id: 'new-story',
        label: 'New story',
        run: () => {
          void createStory().then((story) => navigate(`/story/${story.id}`))
        },
      },
      { id: 'go-library', label: 'Go to Library', run: () => navigate('/') },
      { id: 'go-stats', label: 'Go to Stats', run: () => navigate('/stats') },
      {
        id: 'toggle-theme',
        label: settings.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
        run: () => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' }),
      },
      { id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: '?', run: () => setShortcutsOpen(true) },
    ],
    [navigate, settings.theme, updateSettings, setShortcutsOpen],
  )

  useRegisterCommands('global', commands)
  return null
}

export default function App() {
  useEffect(() => {
    void seedLibraryIfNeeded()
  }, [])

  return (
    <SettingsProvider>
      <DictionaryProvider>
        <CommandPaletteProvider>
          <BrowserRouter>
            <GlobalCommands />
            <CommandPalette />
            <ShortcutsHelp />
            <Routes>
              <Route path="/" element={<LibraryPage />} />
              <Route path="/poem/:id" element={<EditorPage />} />
              <Route path="/poem/:id/history" element={<HistoryPage />} />
              <Route path="/story/:id" element={<StoryEditorPage />} />
              <Route path="/story/:id/history" element={<StoryHistoryPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Routes>
          </BrowserRouter>
        </CommandPaletteProvider>
      </DictionaryProvider>
    </SettingsProvider>
  )
}
