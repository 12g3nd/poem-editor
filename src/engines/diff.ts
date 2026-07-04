export interface DiffOp {
  type: 'same' | 'added' | 'removed'
  line: string
}

/**
 * Line-based diff via the classic LCS (longest common subsequence) table.
 * O(m*n) — fine for poem-length text, not intended for large documents.
 */
export function diffLines(oldText: string, newText: string): DiffOp[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const m = oldLines.length
  const n = newLines.length

  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] =
        oldLines[i] === newLines[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      ops.push({ type: 'same', line: oldLines[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: 'removed', line: oldLines[i] })
      i++
    } else {
      ops.push({ type: 'added', line: newLines[j] })
      j++
    }
  }
  while (i < m) {
    ops.push({ type: 'removed', line: oldLines[i] })
    i++
  }
  while (j < n) {
    ops.push({ type: 'added', line: newLines[j] })
    j++
  }

  return ops
}
