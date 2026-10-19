/**
 * Rounds half away from zero to `decimals` places, correcting binary float
 * error first (1.005 → 1.01, not 1.00). Use for every amount shown to users.
 */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  const shifted = Number((Math.abs(value) * factor).toPrecision(15))
  return (Math.sign(value) * Math.round(shifted)) / factor
}

/** Sum that does not drift: rounds the running total to paisa each step. */
export function sumMoney(values: readonly number[]): number {
  return values.reduce((total, v) => round(total + v), 0)
}
