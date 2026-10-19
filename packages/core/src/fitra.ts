import { round } from './lib/money.ts'

/** One item on the Islamic Foundation's yearly fitra list (from data). */
export interface FitraItem {
  /** e.g. 'atta', 'barley', 'dates', 'raisins', 'cheese'. */
  id: string
  /** Taka per person for the year. */
  perPerson: number
  /** The item's weight per person in kg (half a সা' of আটা, one সা' of the rest), for "বা সমপরিমাণ" lines. */
  kgPerPerson?: number
}

/** The year's announced rates. */
export interface FitraRates {
  year: number
  items: readonly FitraItem[]
}

export interface FitraInput {
  /** People the fitra is paid for, the payer included. */
  members: number
  /** id of the chosen item (আটা, খেজুর...). */
  itemId: string
  rates: FitraRates
}

export interface FitraRow {
  itemId: string
  perPerson: number
  /** The whole family at this item's rate. */
  total: number
}

export interface FitraResult {
  members: number
  itemId: string
  perPerson: number
  /** মোট ফিতরা. */
  total: number
  /** Total weight of the item in kg, when the rates give it. */
  kg: number | null
  /** The cheapest and dearest item (সর্বনিম্ন / সর্বোচ্চ হার). */
  min: FitraRow
  max: FitraRow
  /** Every item for this family, in the order of the rates. */
  table: FitraRow[]
}

export type FitraError = 'members' | 'item' | 'rates'

function isValidRates(rates: FitraRates): boolean {
  const ids = new Set(rates.items.map((i) => i.id))
  return (
    rates.items.length > 0 &&
    ids.size === rates.items.length &&
    rates.items.every(
      (i) =>
        i.perPerson >= 0 &&
        Number.isFinite(i.perPerson) &&
        (i.kgPerPerson === undefined || (i.kgPerPerson > 0 && Number.isFinite(i.kgPerPerson))),
    )
  )
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateFitra(input: FitraInput): FitraError | null {
  if (!(Number.isInteger(input.members) && input.members >= 1 && input.members <= 10000)) return 'members'
  if (!isValidRates(input.rates)) return 'rates'
  if (!input.rates.items.some((i) => i.id === input.itemId)) return 'item'
  return null
}

/** Members × the chosen item's rate, with every other item's total alongside. */
export function calculateFitra(input: FitraInput): FitraResult {
  const { members } = input
  const table = input.rates.items.map((i) => ({ itemId: i.id, perPerson: i.perPerson, total: round(i.perPerson * members) }))
  const item = input.rates.items.find((i) => i.id === input.itemId)!
  const chosen = table.find((r) => r.itemId === input.itemId)!
  const byRate = [...table].sort((a, b) => a.perPerson - b.perPerson)

  return {
    members,
    itemId: item.id,
    perPerson: item.perPerson,
    total: chosen.total,
    kg: item.kgPerPerson === undefined ? null : round(item.kgPerPerson * members, 3),
    min: byRate[0]!,
    max: byRate.at(-1)!,
    table,
  }
}
