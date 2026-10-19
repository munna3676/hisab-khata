import { round } from './lib/money.ts'

/**
 * Mobile data pack finder: the packs that fit a budget, a validity and the
 * chosen operators, with cost per GB and per day. The pack list is data
 * (data/data-packs.json), since operators change their packs every month.
 */

export interface DataPack {
  /** Stable id, e.g. "gp-30gb-30d-399". */
  id: string
  /** Operator id: gp, robi, banglalink, teletalk, airtel… */
  operator: string
  /** Price in taka as sold, VAT and SD included. */
  price: number
  /** Data in GB (0.5 for 500 MB). */
  dataGb: number
  /** Validity in days. */
  validityDays: number
  /** The pack's name on the operator's site or dial code, when it has one. */
  name?: string
}

export type DataPackSort = 'mostData' | 'cheapest' | 'perGb' | 'perDay'

export interface DataPackInput {
  packs: DataPack[]
  /** Operator ids to show, in the screen's chip order; all operators that have packs when left out or empty. */
  operators?: string[]
  /** Most the person will pay (বাজেট); no limit when left out. */
  budget?: number
  /** Exact validity from the chips (৩ দিন, ৭ দিন, ৩০ দিন). */
  validityDays?: number
  /** Or the least validity wanted. */
  minValidityDays?: number
  /** Least data wanted, in GB. */
  minDataGb?: number
  /** Row order; "mostData" (the screen's) when left out. */
  sort?: DataPackSort
}

export interface DataPackRow {
  pack: DataPack
  /** Taka per GB. */
  perGb: number
  /** Taka per day of validity. */
  perDay: number
  /** GB per day ("দিনে ১ GB"). */
  gbPerDay: number
}

export interface DataPackResult {
  /** Matching packs in the chosen order. */
  rows: DataPackRow[]
  /** The first row: most data for the budget by default (সবচেয়ে বেশি ডেটা). */
  best: DataPackRow | null
  /** Chosen operators with no pack in the list at all (the screen's "শীঘ্রই"). */
  operatorsWithoutData: string[]
  /** Chosen operators that have packs, but none that match the filters. */
  operatorsWithoutMatch: string[]
}

export type DataPackError = 'packs' | 'budget' | 'validity' | 'minData' | 'sort'

function isValidPack(p: DataPack): boolean {
  return (
    p.id !== '' &&
    p.operator !== '' &&
    p.price >= 0 &&
    Number.isFinite(p.price) &&
    p.dataGb > 0 &&
    Number.isFinite(p.dataGb) &&
    Number.isInteger(p.validityDays) &&
    p.validityDays >= 1
  )
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateDataPack(input: DataPackInput): DataPackError | null {
  if (!input.packs.every(isValidPack)) return 'packs'
  if (input.budget !== undefined && !(input.budget >= 0 && Number.isFinite(input.budget))) return 'budget'
  for (const days of [input.validityDays, input.minValidityDays]) {
    if (days !== undefined && !(Number.isInteger(days) && days >= 1)) return 'validity'
  }
  if (input.minDataGb !== undefined && !(input.minDataGb >= 0 && Number.isFinite(input.minDataGb))) return 'minData'
  if (input.sort !== undefined && !['mostData', 'cheapest', 'perGb', 'perDay'].includes(input.sort)) return 'sort'
  return null
}

const ORDER: Record<DataPackSort, (a: DataPackRow, b: DataPackRow) => number> = {
  // Most data first; for the same data the cheaper, then the longer pack.
  mostData: (a, b) => b.pack.dataGb - a.pack.dataGb || a.pack.price - b.pack.price || b.pack.validityDays - a.pack.validityDays,
  cheapest: (a, b) => a.pack.price - b.pack.price || b.pack.dataGb - a.pack.dataGb,
  perGb: (a, b) => a.perGb - b.perGb || b.pack.dataGb - a.pack.dataGb,
  perDay: (a, b) => a.perDay - b.perDay || b.pack.dataGb - a.pack.dataGb,
}

/** Packs that fit the filters, with their unit costs, best first. */
export function calculateDataPack(input: DataPackInput): DataPackResult {
  const listed = [...new Set(input.packs.map((p) => p.operator))]
  // A Set, so an operator chip sent twice is not reported twice.
  const chosen = [...new Set(input.operators && input.operators.length > 0 ? input.operators : listed)]

  const fits = (p: DataPack) =>
    chosen.includes(p.operator) &&
    (input.budget === undefined || p.price <= input.budget) &&
    (input.validityDays === undefined || p.validityDays === input.validityDays) &&
    (input.minValidityDays === undefined || p.validityDays >= input.minValidityDays) &&
    (input.minDataGb === undefined || p.dataGb >= input.minDataGb)

  const rows = input.packs.filter(fits).map(
    (pack): DataPackRow => ({
      pack,
      perGb: round(pack.price / pack.dataGb),
      perDay: round(pack.price / pack.validityDays),
      gbPerDay: round(pack.dataGb / pack.validityDays, 3),
    }),
  )
  rows.sort(ORDER[input.sort ?? 'mostData'])

  const matched = new Set(rows.map((r) => r.pack.operator))
  return {
    rows,
    best: rows[0] ?? null,
    operatorsWithoutData: chosen.filter((op) => !listed.includes(op)),
    operatorsWithoutMatch: chosen.filter((op) => listed.includes(op) && !matched.has(op)),
  }
}
