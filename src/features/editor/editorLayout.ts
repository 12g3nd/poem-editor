import { useSettings } from '@/engines/SettingsContext'

/** Shared pixel metrics so the gutter rows, rhyme column, overlays, and the
 * textarea's lines all stay in lockstep — every consumer reads these from
 * the same hook (backed by user settings) rather than a private copy, so a
 * font-size/line-height change can't desync just one of them. */
export function useEditorMetrics() {
  const { settings } = useSettings()
  return {
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    fontFamily: settings.editorFont === 'serif' ? 'var(--font-display)' : 'var(--font-sans)',
    /** Room above the very first line so a scansion mark on its first
     * syllable has somewhere to render without clipping against the
     * overlay's own top edge (see ScansionOverlay). Scales with line
     * height so it stays proportionally correct at any text size. */
    topPadding: Math.round(settings.lineHeight * 0.44),
  }
}
