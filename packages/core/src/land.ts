import { cleanQuantity, splitQuantity } from './lib/land-gold-edu-units.ts'

/**
 * decimal is শতাংশ / শতক / ডেসিমাল. link is a square Gunter's link (বর্গলিংক)
 * of the survey records. katha, chotak, bigha, kani, gonda, kora and kranti
 * depend on the area's custom (LandConvention); the rest are fixed.
 */
export type LandUnit =
  | 'decimal'
  | 'sqft'
  | 'katha'
  | 'bigha'
  | 'acre'
  | 'sqm'
  | 'sqyard'
  | 'chotak'
  | 'kani'
  | 'gonda'
  | 'kora'
  | 'kranti'
  | 'link'
  | 'hectare'

/** Every unit, in the order of the "সব এককে" table. */
export const LAND_UNITS: readonly LandUnit[] = [
  'decimal',
  'sqft',
  'katha',
  'bigha',
  'acre',
  'sqm',
  'sqyard',
  'chotak',
  'kani',
  'gonda',
  'kora',
  'kranti',
  'link',
  'hectare',
]

/** How big the customary units are in one area. Comes from the region chips (data). */
export interface LandConvention {
  /** Square feet in one কাঠা: 720 in Dhaka and most of the country. */
  kathaSqft: number
  /** কাঠা in one বিঘা: 20. */
  kathaPerBigha: number
  /** Square feet in one কানি: 17,280 on the 8-হাত নল. */
  kaniSqft: number
}

/** 1 acre = 43,560 sq ft and 1 শতাংশ = 1/100 acre (Ministry of Land, "ভূমি পরিমাপের আদর্শ এককসমূহ"). */
const ACRE_SQFT = 43560
const DECIMAL_SQFT = ACRE_SQFT / 100
/** 1 ft = 0.3048 m exactly (international foot). */
const SQM_SQFT = 1 / 0.3048 ** 2
/** Gunter's link = 0.66 ft, so 1,000 square links make 1 শতাংশ. */
const LINK_SQFT = 0.66 ** 2
/** 16 ছটাক = 1 কাঠা; 20 গণ্ডা = 1 কানি, 4 কড়া = 1 গণ্ডা, 3 ক্রান্তি = 1 কড়া (Ministry of Land). */
const CHOTAK_PER_KATHA = 16
const GONDA_PER_KANI = 20
const KORA_PER_GONDA = 4
const KRANTI_PER_KORA = 3

/**
 * The Ministry of Land standard: 1 কাঠা = 720 sq ft (≈ 1.65 শতাংশ), 1 বিঘা =
 * 20 কাঠা = 14,400 sq ft (≈ 33 শতাংশ), and on the 8-হাত নল 1 কানি = 17,280
 * sq ft, 1 গণ্ডা = 864, 1 কড়া = 216, 1 ক্রান্তি = 72 sq ft.
 */
export const STANDARD_LAND_CONVENTION: LandConvention = { kathaSqft: 720, kathaPerBigha: 20, kaniSqft: 17280 }

/**
 * Regional কানি as commonly quoted; confirm with the local land office before
 * a deed. Chattogram and Cox's Bazar: 1 কানি = 40 শতক. Cumilla, Noakhali,
 * Feni, Lakshmipur: 1 কানি = 30 শতক. গণ্ডা, কড়া, ক্রান্তি scale with the কানি.
 */
export const LAND_CONVENTIONS: Readonly<Record<'standard' | 'chattogram' | 'cumilla', LandConvention>> = {
  standard: STANDARD_LAND_CONVENTION,
  chattogram: { ...STANDARD_LAND_CONVENTION, kaniSqft: 40 * DECIMAL_SQFT },
  cumilla: { ...STANDARD_LAND_CONVENTION, kaniSqft: 30 * DECIMAL_SQFT },
}

export interface LandInput {
  value: number
  unit: LandUnit
  /** Overrides for the standard convention, e.g. { kathaSqft: 726 } for "অন্য এলাকা". */
  convention?: Partial<LandConvention>
}

export interface LandRow {
  unit: LandUnit
  value: number
}

export interface LandResult {
  sqft: number
  /** The same area in every unit. */
  values: Record<LandUnit, number>
  /** values in LAND_UNITS order, for the table. */
  rows: LandRow[]
}

export type LandError = 'value' | 'unit' | 'convention'

/** The standard convention with the given overrides. */
export function landConvention(overrides?: Partial<LandConvention>): LandConvention {
  return { ...STANDARD_LAND_CONVENTION, ...overrides }
}

/** Square feet in one `unit`. */
export function landUnitSqft(unit: LandUnit, convention: LandConvention = STANDARD_LAND_CONVENTION): number {
  const gonda = convention.kaniSqft / GONDA_PER_KANI
  const sizes: Record<LandUnit, number> = {
    decimal: DECIMAL_SQFT,
    sqft: 1,
    katha: convention.kathaSqft,
    bigha: convention.kathaSqft * convention.kathaPerBigha,
    acre: ACRE_SQFT,
    sqm: SQM_SQFT,
    sqyard: 9,
    chotak: convention.kathaSqft / CHOTAK_PER_KATHA,
    kani: convention.kaniSqft,
    gonda,
    kora: gonda / KORA_PER_GONDA,
    kranti: gonda / KORA_PER_GONDA / KRANTI_PER_KORA,
    link: LINK_SQFT,
    hectare: SQM_SQFT * 10000,
  }
  return sizes[unit]
}

/** `value` of `from` expressed in `to`. */
export function convertLand(value: number, from: LandUnit, to: LandUnit, convention?: Partial<LandConvention>): number {
  const c = landConvention(convention)
  return cleanQuantity((value * landUnitSqft(from, c)) / landUnitSqft(to, c))
}

/**
 * The area as mixed units, largest first, e.g. ['bigha', 'katha', 'chotak'] →
 * [0, 6, 0.8] for 10 শতাংশ. The last unit takes the remainder.
 */
export function splitLand(
  value: number,
  unit: LandUnit,
  parts: readonly LandUnit[],
  convention?: Partial<LandConvention>,
): number[] {
  const c = landConvention(convention)
  return splitQuantity(
    value * landUnitSqft(unit, c),
    parts.map((p) => landUnitSqft(p, c)),
  )
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateLand(input: LandInput): LandError | null {
  if (!(input.value >= 0 && Number.isFinite(input.value))) return 'value'
  if (!LAND_UNITS.includes(input.unit)) return 'unit'
  if (!isValidConvention(landConvention(input.convention))) return 'convention'
  return null
}

export function isValidConvention(c: LandConvention): boolean {
  return [c.kathaSqft, c.kathaPerBigha, c.kaniSqft].every((v) => v > 0 && Number.isFinite(v))
}

/** One area in every unit at once. */
export function calculateLand(input: LandInput): LandResult {
  const c = landConvention(input.convention)
  const sqft = input.value * landUnitSqft(input.unit, c)
  const rows = LAND_UNITS.map((unit) => ({ unit, value: cleanQuantity(sqft / landUnitSqft(unit, c)) }))
  const values = Object.fromEntries(rows.map((r) => [r.unit, r.value])) as Record<LandUnit, number>
  return { sqft: cleanQuantity(sqft), values, rows }
}
