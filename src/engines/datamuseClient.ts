export class DatamuseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatamuseError'
  }
}

interface DatamuseWord {
  word: string
}

async function fetchDatamuse(query: string): Promise<string[]> {
  let response: Response
  try {
    response = await fetch(`https://api.datamuse.com/words?${query}`)
  } catch {
    throw new DatamuseError("Couldn't reach Datamuse — check your internet connection.")
  }
  if (!response.ok) {
    throw new DatamuseError(`Datamuse responded with an error (HTTP ${response.status}).`)
  }
  try {
    const data = (await response.json()) as DatamuseWord[]
    return data.map((entry) => entry.word)
  } catch {
    throw new DatamuseError('Datamuse returned a response this app could not understand.')
  }
}

/** Perfect + near rhymes from Datamuse's own rhyme index, merged and
 * deduplicated — a keyless, free supplement to the bundled CMU dictionary
 * for words it doesn't cover, or words coined/used since. */
export async function fetchDatamuseRhymes(word: string): Promise<string[]> {
  const [perfect, near] = await Promise.all([
    fetchDatamuse(`rel_rhy=${encodeURIComponent(word)}&max=25`),
    fetchDatamuse(`rel_nry=${encodeURIComponent(word)}&max=25`),
  ])
  return Array.from(new Set([...perfect, ...near]))
}

/** Words with a related meaning ("means like") — Datamuse's nearest analog
 * to a thesaurus lookup. */
export function fetchDatamuseSimilarMeaning(word: string): Promise<string[]> {
  return fetchDatamuse(`ml=${encodeURIComponent(word)}&max=25`)
}
