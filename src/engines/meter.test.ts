import { describe, it, expect } from 'vitest'
import { detectMeter, findDeviations, meterName } from '@/engines/meter'

describe('detectMeter', () => {
  it('detects perfect iambic pentameter', () => {
    const result = detectMeter([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    expect(result?.foot).toBe('iamb')
    expect(result?.feet).toBe(5)
    expect(result?.confidence).toBe(1)
    expect(result?.name).toBe('Iambic Pentameter')
  })

  it('detects trochaic tetrameter', () => {
    const result = detectMeter([1, 0, 1, 0, 1, 0, 1, 0])
    expect(result?.foot).toBe('trochee')
    expect(result?.feet).toBe(4)
    expect(result?.confidence).toBe(1)
  })

  it('detects anapestic trimeter', () => {
    const result = detectMeter([0, 0, 1, 0, 0, 1, 0, 0, 1])
    expect(result?.foot).toBe('anapest')
    expect(result?.feet).toBe(3)
    expect(result?.confidence).toBe(1)
  })

  it('detects dactylic dimeter', () => {
    const result = detectMeter([1, 0, 0, 1, 0, 0])
    expect(result?.foot).toBe('dactyl')
    expect(result?.feet).toBe(2)
    expect(result?.confidence).toBe(1)
  })

  it('gives an irregular line lower confidence than a perfect one', () => {
    const perfect = detectMeter([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    // Opening trochaic inversion: first foot reversed, rest regular iambic.
    const irregular = detectMeter([1, 0, 0, 1, 0, 1, 0, 1, 0, 1])
    expect(irregular!.confidence).toBeLessThan(perfect!.confidence)
    expect(irregular!.foot).toBe('iamb')
    expect(irregular!.feet).toBe(5)
  })

  it('flags the specific deviating syllable positions against the best-fit meter', () => {
    // Only the very first syllable breaks the iambic pattern; everything
    // after it (including position 1, which is "1" in both actual and
    // ideal) lines up.
    const result = detectMeter([1, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    expect(result?.foot).toBe('iamb')
    expect(result?.deviations).toEqual([0])
  })

  it('penalizes a length mismatch against an otherwise-perfect pattern', () => {
    const full = detectMeter([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    const short = detectMeter([0, 1, 0, 1, 0, 1, 0, 1, 0]) // 9 syllables, catalectic
    expect(short!.confidence).toBeLessThan(full!.confidence)
    expect(short!.foot).toBe('iamb')
    expect(short!.feet).toBe(5)
  })

  it('returns null for an empty stress sequence', () => {
    expect(detectMeter([])).toBeNull()
  })
})

describe('findDeviations', () => {
  it('finds deviations against a specifically chosen target meter', () => {
    const stress: (0 | 1)[] = [1, 0, 0, 1, 0, 1, 0, 1, 0, 1]
    const deviations = findDeviations(stress, 'iamb', 5)
    expect(deviations).toEqual([0, 1])
  })

  it('returns no deviations for a perfect match against the target', () => {
    const stress: (0 | 1)[] = [1, 0, 1, 0, 1, 0, 1, 0]
    expect(findDeviations(stress, 'trochee', 4)).toEqual([])
  })
})

describe('meterName', () => {
  it('formats a human-readable meter name', () => {
    expect(meterName('iamb', 5)).toBe('Iambic Pentameter')
    expect(meterName('trochee', 4)).toBe('Trochaic Tetrameter')
    expect(meterName('anapest', 3)).toBe('Anapestic Trimeter')
    expect(meterName('dactyl', 1)).toBe('Dactylic Monometer')
  })
})
