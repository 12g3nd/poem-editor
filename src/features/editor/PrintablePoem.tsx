interface PrintablePoemProps {
  title: string
  body: string
}

/** Rendered off-screen at all times; only visible via the print stylesheet
 * (see the `print:` utility classes here and `@media print` rules in
 * index.css). Keeps the PDF/print output independent of the editor's
 * on-screen overlays, dark mode, and scroll state. */
export function PrintablePoem({ title, body }: PrintablePoemProps) {
  const lines = body.split('\n')

  return (
    <div className="hidden print:block" style={{ color: '#1a1a1a', background: '#ffffff' }}>
      <h1
        className="mb-10 text-center text-2xl"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {title.trim().length > 0 ? title : 'Untitled'}
      </h1>
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '13pt',
          lineHeight: 1.6,
        }}
      >
        {lines.map((line, index) => (
          <div key={index}>{line.length > 0 ? line : ' '}</div>
        ))}
      </div>
    </div>
  )
}
