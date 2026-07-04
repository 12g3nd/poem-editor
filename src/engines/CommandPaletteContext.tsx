import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface Command {
  id: string
  label: string
  shortcut?: string
  run: () => void
}

interface RegistryActions {
  registerCommands: (scopeId: string, commands: Command[]) => void
  unregisterCommands: (scopeId: string) => void
}

interface PaletteState {
  open: boolean
  setOpen: (open: boolean) => void
  commands: Command[]
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
}

// Split into two contexts so that pages registering commands (which only
// need the stable registerCommands/unregisterCommands functions) don't
// re-render every time the palette's open state or command list changes —
// only the palette UI itself needs PaletteStateContext.
const RegistryActionsContext = createContext<RegistryActions>({
  registerCommands: () => {},
  unregisterCommands: () => {},
})

const PaletteStateContext = createContext<PaletteState>({
  open: false,
  setOpen: () => {},
  commands: [],
  shortcutsOpen: false,
  setShortcutsOpen: () => {},
})

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [registry, setRegistry] = useState<Map<string, Command[]>>(new Map())

  const registerCommands = useCallback((scopeId: string, commands: Command[]) => {
    setRegistry((prev) => {
      const next = new Map(prev)
      next.set(scopeId, commands)
      return next
    })
  }, [])

  const unregisterCommands = useCallback((scopeId: string) => {
    setRegistry((prev) => {
      if (!prev.has(scopeId)) return prev
      const next = new Map(prev)
      next.delete(scopeId)
      return next
    })
  }, [])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const actions = useMemo(() => ({ registerCommands, unregisterCommands }), [registerCommands, unregisterCommands])
  const commands = useMemo(() => Array.from(registry.values()).flat(), [registry])
  const state = useMemo<PaletteState>(
    () => ({ open, setOpen, commands, shortcutsOpen, setShortcutsOpen }),
    [open, commands, shortcutsOpen],
  )

  return (
    <RegistryActionsContext.Provider value={actions}>
      <PaletteStateContext.Provider value={state}>{children}</PaletteStateContext.Provider>
    </RegistryActionsContext.Provider>
  )
}

export function useCommandPaletteState(): PaletteState {
  return useContext(PaletteStateContext)
}

/** Registers a scoped set of commands (e.g. one page's toolbar actions) into
 * the global command palette for as long as the calling component stays
 * mounted, replacing that scope's commands whenever the array reference
 * changes. Pass a memoized `commands` array where practical — an
 * unmemoized inline array still works, it just re-registers every render. */
export function useRegisterCommands(scopeId: string, commands: Command[]): void {
  const { registerCommands, unregisterCommands } = useContext(RegistryActionsContext)
  useEffect(() => {
    registerCommands(scopeId, commands)
    return () => unregisterCommands(scopeId)
  }, [scopeId, commands, registerCommands, unregisterCommands])
}
