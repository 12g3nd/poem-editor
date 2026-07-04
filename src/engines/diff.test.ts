import { describe, it, expect } from 'vitest'
import { diffLines } from '@/engines/diff'

describe('diffLines', () => {
  it('marks everything the same for identical text', () => {
    const ops = diffLines('a\nb\nc', 'a\nb\nc')
    expect(ops).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: 'b' },
      { type: 'same', line: 'c' },
    ])
  })

  it('detects a pure addition', () => {
    const ops = diffLines('a\nb', 'a\nb\nc')
    expect(ops).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: 'b' },
      { type: 'added', line: 'c' },
    ])
  })

  it('detects a pure removal', () => {
    const ops = diffLines('a\nb\nc', 'a\nc')
    expect(ops).toEqual([
      { type: 'same', line: 'a' },
      { type: 'removed', line: 'b' },
      { type: 'same', line: 'c' },
    ])
  })

  it('detects a replacement as remove + add', () => {
    const ops = diffLines('a\nb\nc', 'a\nx\nc')
    expect(ops).toEqual([
      { type: 'same', line: 'a' },
      { type: 'removed', line: 'b' },
      { type: 'added', line: 'x' },
      { type: 'same', line: 'c' },
    ])
  })

  it('handles going from empty to non-empty', () => {
    const ops = diffLines('', 'a\nb')
    expect(ops).toEqual([
      { type: 'removed', line: '' },
      { type: 'added', line: 'a' },
      { type: 'added', line: 'b' },
    ])
  })

  it('handles going from non-empty to empty', () => {
    const ops = diffLines('a\nb', '')
    expect(ops).toEqual([
      { type: 'removed', line: 'a' },
      { type: 'removed', line: 'b' },
      { type: 'added', line: '' },
    ])
  })

  it('handles two empty texts', () => {
    expect(diffLines('', '')).toEqual([{ type: 'same', line: '' }])
  })

  it('preserves blank lines (stanza breaks) as real lines in the diff', () => {
    const ops = diffLines('a\n\nb', 'a\n\nc')
    expect(ops).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: '' },
      { type: 'removed', line: 'b' },
      { type: 'added', line: 'c' },
    ])
  })

  it('handles a fully rewritten poem with no shared lines', () => {
    const ops = diffLines('one\ntwo', 'three\nfour')
    const removed = ops.filter((op) => op.type === 'removed').map((op) => op.line)
    const added = ops.filter((op) => op.type === 'added').map((op) => op.line)
    expect(removed).toEqual(['one', 'two'])
    expect(added).toEqual(['three', 'four'])
  })
})
