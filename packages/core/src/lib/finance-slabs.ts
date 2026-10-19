/**
 * Slab tables for the finance engines: excise duty by balance, Sanchayapatra
 * rate and tax by holding. A row covers values up to and including `upTo`;
 * the last row has `upTo: null` and covers everything above. The whole
 * amount takes the row it falls in (these are not marginal slabs).
 */
export interface Slab {
  upTo: number | null
}

/** The row that holds `value`. Assumes a table that passed isValidSlabTable. */
export function findSlab<T extends Slab>(value: number, slabs: readonly T[]): T | undefined {
  return slabs.find((s) => s.upTo === null || value <= s.upTo)
}

/** True when limits rise strictly and only the last row is open-ended. */
export function isValidSlabTable(slabs: readonly Slab[]): boolean {
  if (slabs.length === 0 || slabs.at(-1)!.upTo !== null) return false
  let prev = -Infinity
  return slabs.slice(0, -1).every((s) => {
    if (s.upTo === null || !(s.upTo > prev)) return false
    prev = s.upTo
    return true
  })
}

export interface ExciseSlab extends Slab {
  /** Taka taken once a year when the year's highest balance falls in this row. */
  duty: number
}

export function isValidExciseTable(slabs: readonly ExciseSlab[]): boolean {
  return isValidSlabTable(slabs) && slabs.every((s) => s.duty >= 0)
}

/** Excise duty for one year of an account whose highest balance was `highestBalance`. */
export function exciseDuty(highestBalance: number, slabs: readonly ExciseSlab[]): number {
  return findSlab(highestBalance, slabs)?.duty ?? 0
}
