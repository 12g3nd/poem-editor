export interface AppSettings {
  theme: 'light' | 'dark'
  editorFont: 'serif' | 'sans'
  fontSize: number
  lineHeight: number
  /** Off by default — the app is fully offline-capable without this. When
   * on, the "Ask AI" workbench tab talks directly to a local Ollama
   * instance the user runs themselves; nothing is sent anywhere else. */
  aiEnabled: boolean
  ollamaEndpoint: string
  ollamaModel: string
  /** Off by default — the spec's one pre-approved exception to "no external
   * services": a free, keyless lookup against the Datamuse API to
   * supplement the bundled CMU dictionary / Moby Thesaurus. The app works
   * fully offline without it. */
  onlineExtrasEnabled: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  editorFont: 'serif',
  fontSize: 18,
  lineHeight: 32,
  aiEnabled: false,
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: '',
  onlineExtrasEnabled: false,
}

export const FONT_SIZE_RANGE = { min: 14, max: 24, step: 1 }
export const LINE_HEIGHT_RANGE = { min: 24, max: 44, step: 2 }
