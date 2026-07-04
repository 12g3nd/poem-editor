interface FocusOverlayProps {
  /** Height in px of the dimmed band above the focused line. */
  topHeight: number
  /** Height in px of the dimmed band below the focused line. */
  bottomHeight: number
}

/** Vignette dimming for typewriter/focus mode: a translucent canvas-colored
 * scrim fades in above and below the current line, so attention gathers at
 * the center without needing per-line control over the underlying textarea
 * (which a plain <textarea> doesn't support). */
export function FocusOverlay({ topHeight, bottomHeight }: FocusOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: topHeight,
          background: 'linear-gradient(to bottom, rgba(241,240,238,0.88), rgba(241,240,238,0))',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: bottomHeight,
          background: 'linear-gradient(to top, rgba(241,240,238,0.88), rgba(241,240,238,0))',
        }}
      />
    </div>
  )
}
