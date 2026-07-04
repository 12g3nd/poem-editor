export function poemToPlainText(title: string, body: string): string {
  const heading = title.trim().length > 0 ? title : 'Untitled'
  return `${heading}\n\n${body}`
}

export function poemToMarkdown(title: string, body: string): string {
  const heading = title.trim().length > 0 ? title : 'Untitled'
  const mdBody = body
    .split('\n')
    .map((line) => (line.length > 0 ? `${line}  ` : line))
    .join('\n')
  return `# ${heading}\n\n${mdBody}`
}

export function slugifyFilename(title: string): string {
  const heading = title.trim().length > 0 ? title : 'untitled'
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
