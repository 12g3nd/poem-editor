// Preprocesses the raw CMU Pronouncing Dictionary and Moby Thesaurus II source
// files (scripts/raw/) into compact static JSON assets bundled with the app
// (public/data/). Run with: node scripts/build-dictionary.mjs
//
// Sources (public domain / permissively licensed, fetched at dev time only —
// the shipped app never makes this request itself):
//   https://github.com/cmusphinx/cmudict (cmudict.dict)
//   https://www.gutenberg.org/ebooks/3202 (Moby Thesaurus II, mthesaur.txt)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAW_DIR = path.join(__dirname, 'raw')
const OUT_DIR = path.join(__dirname, '..', 'public', 'data')

const VOWEL_RE = /^[A-Z]+([0-2])$/

function stripStress(phoneme) {
  return phoneme.replace(/[0-2]$/, '')
}

/** Phonemes from the last primary-stressed vowel to the end (stress digits
 * stripped, since stress level doesn't change the sound of the phoneme).
 * Falls back to secondary stress, then the final vowel, per the spec. */
function computeRhymeKey(phonemes) {
  let idx = phonemes.findLastIndex((p) => /1$/.test(p))
  if (idx === -1) idx = phonemes.findLastIndex((p) => /2$/.test(p))
  if (idx === -1) idx = phonemes.findLastIndex((p) => VOWEL_RE.test(p))
  if (idx === -1) return null
  return phonemes.slice(idx).map(stripStress).join(' ')
}

function buildCmuDict() {
  const raw = readFileSync(path.join(RAW_DIR, 'cmudict.dict'), 'utf-8')
  const entries = new Map()

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';;;')) continue

    const parts = trimmed.split(/\s+/)
    const rawWord = parts[0].toLowerCase()
    const phonemes = parts.slice(1)

    // Alternate pronunciations are suffixed "word(2)", "word(3)", etc. The
    // unsuffixed entry is cmudict's primary (most common) pronunciation —
    // we keep only that one, per "prefer the most common" in the spec.
    if (/\(\d+\)$/.test(rawWord)) continue

    const stress = phonemes.filter((p) => VOWEL_RE.test(p)).map((p) => p.match(VOWEL_RE)[1]).join('')
    const rhymeKey = computeRhymeKey(phonemes)

    entries.set(rawWord, [rawWord, phonemes.join(' '), stress, rhymeKey ?? ''])
  }

  return Array.from(entries.values())
}

function buildThesaurus() {
  const raw = readFileSync(path.join(RAW_DIR, 'mthesaur.txt'), 'utf-8')
  const entries = new Map()

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const [headword, ...synonyms] = trimmed.split(',').map((w) => w.trim().toLowerCase())
    if (!headword || synonyms.length === 0) continue

    const existing = entries.get(headword)
    if (existing) {
      for (const syn of synonyms) existing.add(syn)
    } else {
      entries.set(headword, new Set(synonyms))
    }
  }

  return Array.from(entries.entries()).map(([word, syns]) => [word, Array.from(syns)])
}

mkdirSync(OUT_DIR, { recursive: true })

const dictionary = buildCmuDict()
writeFileSync(path.join(OUT_DIR, 'dictionary.json'), JSON.stringify(dictionary))
console.log(`dictionary.json: ${dictionary.length} words`)

const thesaurus = buildThesaurus()
writeFileSync(path.join(OUT_DIR, 'thesaurus.json'), JSON.stringify(thesaurus))
console.log(`thesaurus.json: ${thesaurus.length} headwords`)
