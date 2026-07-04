import { describe, it, expect } from 'vitest'
import { analyzePoemMeter } from '@/engines/meterReport'
import { createFixtureDictionary } from '@/test/fixtures/dictionaryFixture'

const dict = createFixtureDictionary()

describe('analyzePoemMeter', () => {
  it('detects a perfectly regular iambic pentameter poem', () => {
    const line = 'to cat to cat to cat to cat to cat'
    const body = [line, line].join('\n')
    const report = analyzePoemMeter(body, dict)

    expect(report.lines).toHaveLength(2)
    expect(report.lines[0].detection?.name).toBe('Iambic Pentameter')
    expect(report.lines[0].detection?.confidence).toBe(1)
    expect(report.dominantMeter).toBe('Iambic Pentameter')
    expect(report.irregularLines).toEqual([])
  })

  it('leaves a blank stanza-break line with no detection', () => {
    const report = analyzePoemMeter('to cat to cat to cat to cat to cat\n\nto cat', dict)
    expect(report.lines[1]).toEqual({ lineIndex: 1, detection: null, openingInversion: false })
  })

  it('reports the dominant meter even when one line differs', () => {
    const regular = 'to cat to cat to cat to cat to cat'
    const different = 'cat to cat to cat to cat to cat to' // trochaic throughout
    const report = analyzePoemMeter([regular, regular, different].join('\n'), dict)
    expect(report.dominantMeter).toBe('Iambic Pentameter')
  })

  it('flags a line with low best-fit confidence as irregular', () => {
    const regular = 'to cat to cat to cat to cat to cat'
    // "cat cat cat cat cat cat cat cat cat cat" is all-stressed — a poor
    // fit for any of the four base feet.
    const allStressed = 'cat cat cat cat cat cat cat cat cat cat'
    const report = analyzePoemMeter([regular, allStressed].join('\n'), dict)
    expect(report.irregularLines).toEqual([1])
  })

  it('detects an opening trochaic inversion in an otherwise-iambic line', () => {
    // Stress sequence: 1,0, 0,1, 0,1, 0,1, 0,1 — first foot reversed.
    const line = 'cat to to cat to cat to cat to cat'
    const report = analyzePoemMeter(line, dict)
    expect(report.lines[0].detection?.foot).toBe('iamb')
    expect(report.lines[0].openingInversion).toBe(true)
  })

  it('does not flag opening inversion for a line that is not iambic at all', () => {
    const line = 'cat to cat to cat to cat to cat to' // consistently trochaic
    const report = analyzePoemMeter(line, dict)
    expect(report.lines[0].detection?.foot).toBe('trochee')
    expect(report.lines[0].openingInversion).toBe(false)
  })
})
