import { round } from './money.ts'

/**
 * Splits `total` in proportion to `weights` so the parts add up to `total`
 * exactly, to the paisa (or to the whole taka with `decimals` = 0). Uses the
 * largest-remainder method: everyone gets the rounded-down share, and the few
 * leftover paisa go to the biggest fractions (earlier rows win a tie).
 * When every weight is 0 the total is split equally.
 */
export function allocate(total: number, weights: readonly number[], decimals = 2): number[] {
  if (weights.length === 0) return []
  const factor = 10 ** decimals
  const units = Math.round(round(total, decimals) * factor)
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  const shares = weightSum > 0 ? weights : weights.map(() => 1)
  const shareSum = weightSum > 0 ? weightSum : weights.length

  // Snap to 12 significant digits so 0.1 + 0.2 style error cannot cost a paisa.
  const exact = shares.map((w) => Number(((units * w) / shareSum).toPrecision(12)))
  const parts = exact.map((x) => Math.floor(x))
  let left = units - parts.reduce((sum, p) => sum + p, 0)
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) parts[order[k]!.i]! += 1
  return parts.map((p) => round(p / factor, decimals))
}
