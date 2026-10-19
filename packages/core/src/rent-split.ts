import { allocate } from './lib/commerce-allocate.ts'
import { round } from './lib/money.ts'

/**
 * equal: everyone pays the same (সমান ভাগ).
 * size: by room floor area (রুম অনুযায়ী, বর্গফুট).
 * weight: by a multiplier per room, e.g. big room 1.2×.
 * room-rent: rooms with their own rent pay it; the rest share what is left equally.
 */
export type RentSplitMode = 'equal' | 'size' | 'weight' | 'room-rent'

export interface RentRoom {
  /** e.g. "রুম ১ (বড়, বারান্দা সহ)". Passed through to the result. */
  name: string
  /** Floor area in square feet, for "size". */
  sizeSqft?: number
  /** Share multiplier for "weight": 1.2 for the big room, 1 for the others. */
  weight?: number
  /** This room's own rent, for "room-rent". */
  rent?: number
  /** People living in the room; defaults to 1. */
  people?: number
}

export interface RentSplitInput {
  /** মাসিক ভাড়া. */
  rent: number
  /** Gas, water, internet and electricity together (বিল). */
  utilities: number
  mode: RentSplitMode
  /** How many people, for "equal" (কতজন). */
  people?: number
  /** The rooms, for every mode but "equal". */
  rooms?: RentRoom[]
  /** "per-person" (বিল সমান ভাগ, the default) or "like-rent" (same ratio as the rent). */
  utilitySplit?: 'per-person' | 'like-rent'
  /** Split to the whole taka instead of the paisa; parts still add up exactly. */
  wholeTaka?: boolean
}

export interface RentSplitRow {
  /** The room's name, or null for a person in "equal" mode (the UI shows "সদস্য ১"). */
  name: string | null
  people: number
  rent: number
  utilities: number
  /** rent + utilities (মোট). */
  total: number
  /** total ÷ people; same as total for a one-person row. */
  perPerson: number
}

export interface RentSplitResult {
  rows: RentSplitRow[]
  /** Index of the row that pays the most (রুম ১ দেবে সবচেয়ে বেশি); the first one on a tie. */
  highest: number
  /** Everyone in the flat. */
  people: number
}

export type RentSplitError = 'rent' | 'utilities' | 'people' | 'rooms' | 'size' | 'weight' | 'roomRent'

const isMoney = (v: number | undefined) => v !== undefined && v >= 0 && Number.isFinite(v)
const isHeadcount = (v: number | undefined) => v !== undefined && Number.isInteger(v) && v >= 1 && v <= 100

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateRentSplit(input: RentSplitInput): RentSplitError | null {
  if (!isMoney(input.rent)) return 'rent'
  if (!isMoney(input.utilities)) return 'utilities'
  if (input.mode === 'equal') return isHeadcount(input.people) ? null : 'people'

  const rooms = input.rooms ?? []
  if (rooms.length === 0 || rooms.length > 50) return 'rooms'
  if (!rooms.every((r) => r.people === undefined || isHeadcount(r.people))) return 'people'
  const inRange = (v: number | undefined, max: number) => v !== undefined && v > 0 && v <= max
  if (input.mode === 'size' && !rooms.every((r) => inRange(r.sizeSqft, 1e6))) return 'size'
  if (input.mode === 'weight' && !rooms.every((r) => inRange(r.weight, 100))) return 'weight'
  if (input.mode === 'room-rent') {
    if (!rooms.every((r) => r.rent === undefined || isMoney(r.rent))) return 'roomRent'
    const fixed = rooms.reduce((sum, r) => sum + (r.rent ?? 0), 0)
    const open = rooms.some((r) => r.rent === undefined)
    // Fixed rents may not add up to more than the rent, nor (with no room left to take the rest) to less.
    if (round(fixed) > round(input.rent) || (!open && round(fixed) !== round(input.rent))) return 'roomRent'
  }
  return null
}

/** Splits the rent by the chosen mode and the utilities per person (or like the rent), to the paisa. */
export function calculateRentSplit(input: RentSplitInput): RentSplitResult {
  const decimals = input.wholeTaka ? 0 : 2
  const rooms: RentRoom[] =
    input.mode === 'equal' ? Array.from({ length: input.people! }, () => ({ name: '', people: 1 })) : input.rooms!
  const people = rooms.map((r) => r.people ?? 1)

  let rents: number[]
  if (input.mode === 'size') rents = allocate(input.rent, rooms.map((r) => r.sizeSqft!), decimals)
  else if (input.mode === 'weight') rents = allocate(input.rent, rooms.map((r) => r.weight!), decimals)
  else if (input.mode === 'room-rent') {
    const fixed = rooms.reduce((sum, r) => sum + (r.rent ?? 0), 0)
    const shares = allocate(Math.max(0, input.rent - fixed), rooms.map((r) => (r.rent === undefined ? 1 : 0)), decimals)
    rents = rooms.map((r, i) => (r.rent === undefined ? shares[i]! : round(r.rent)))
  } else rents = allocate(input.rent, people, decimals)

  const utilities = allocate(input.utilities, input.utilitySplit === 'like-rent' ? rents : people, decimals)

  const rows = rooms.map((room, i): RentSplitRow => {
    const total = round(rents[i]! + utilities[i]!)
    return {
      name: input.mode === 'equal' ? null : room.name,
      people: people[i]!,
      rent: rents[i]!,
      utilities: utilities[i]!,
      total,
      perPerson: round(total / people[i]!),
    }
  })
  const highest = rows.reduce((best, row, i) => (row.total > rows[best]!.total ? i : best), 0)
  return { rows, highest, people: people.reduce((sum, p) => sum + p, 0) }
}
