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

  const exact = shares.map((w) => (units * w) / shareSum)
  // Float noise (9.999999999999998 for 10) must not cost a paisa. The tolerance is
  // relative, so a big total keeps its real fractions (toPrecision would drop them).
  const parts = exact.map((x) => {
    const whole = Math.round(x)
    return Math.abs(x - whole) <= Math.max(1e-9, x * 1e-14) ? whole : Math.floor(x)
  })
  let left = units - parts.reduce((sum, p) => sum + p, 0)
  const order = exact.map((x, i) => ({ i, frac: x - parts[i]! })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) parts[order[k]!.i]! += 1
  // Snapping can overshoot by a unit; take it back from the smallest fractions.
  for (let k = order.length - 1; left < 0; k = (k - 1 + order.length) % order.length, left++) parts[order[k]!.i]! -= 1
  return parts.map((p) => round(p / factor, decimals))
}
