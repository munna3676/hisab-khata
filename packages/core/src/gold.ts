import { cleanQuantity, splitQuantity } from './lib/land-gold-edu-units.ts'
import { round } from './lib/money.ts'

/** Units for gold and silver. tola is the 180-grain তোলা; ounce is the troy ounce of world prices. */
export type GoldUnit = 'vori' | 'ana' | 'roti' | 'point' | 'gram' | 'tola' | 'ounce'

/** Every unit, in the order of the "সব এককে" table. */
export const GOLD_UNITS: readonly GoldUnit[] = ['vori', 'ana', 'roti', 'point', 'gram', 'tola', 'ounce']

/** 1 ভরি = 11.664 g = 16 আনা = 96 রতি (BAJUS price notices quote "প্রতি ভরি (১১.৬৬৪ গ্রাম)"). */
export const VORI_GRAMS = 11.664
const ANA_PER_VORI = 16
const ROTI_PER_ANA = 6
/** 1 তোলা = 180 grains = 11.6638038 g. In daily use a তোলা and a ভরি are the same weight. */
const TOLA_GRAMS = 11.6638038
/** 1 troy ounce = 31.1034768 g. */
const OUNCE_GRAMS = 31.1034768
/** পয়েন্ট in one রতি on most jewellers' scales; a shop that counts differently passes its own. */
export const DEFAULT_POINTS_PER_ROTI = 10

/** A weight as parts that add up: { vori: 2, ana: 4 }, or { gram: 26.244 }. */
export type GoldWeight = Partial<Record<GoldUnit, number>>

export interface GoldInput {
  weight: GoldWeight
  /** Taka for one ভরি of the chosen karat (22K/21K/18K/সনাতন, from the day's BAJUS rates); leave out for weight only. */
  pricePerVori?: number
  pointsPerRoti?: number
}

export interface GoldRow {
  unit: GoldUnit
  value: number
}

/** ভরি-আনা-রতি-পয়েন্ট as a jeweller writes it: whole ভরি, আনা, রতি, and the rest in পয়েন্ট. */
export interface GoldSplit {
  vori: number
  ana: number
  roti: number
  point: number
}

export interface GoldResult {
  grams: number
  values: Record<GoldUnit, number>
  /** values in GOLD_UNITS order, for the table. */
  rows: GoldRow[]
  split: GoldSplit
  /** Weight × price per ভরি; null without a price. */
  value: number | null
  pricePerGram: number | null
}

export type GoldError = 'weight' | 'price' | 'points'

/** Grams in one `unit`. */
export function goldUnitGrams(unit: GoldUnit, pointsPerRoti = DEFAULT_POINTS_PER_ROTI): number {
  const ana = VORI_GRAMS / ANA_PER_VORI
  const roti = ana / ROTI_PER_ANA
  const sizes: Record<GoldUnit, number> = {
    vori: VORI_GRAMS,
    ana,
    roti,
    point: roti / pointsPerRoti,
    gram: 1,
    tola: TOLA_GRAMS,
    ounce: OUNCE_GRAMS,
  }
  return sizes[unit]
}

/** Grams in a weight given as parts. */
export function goldWeightGrams(weight: GoldWeight, pointsPerRoti = DEFAULT_POINTS_PER_ROTI): number {
  return cleanQuantity(
    GOLD_UNITS.reduce((sum, unit) => sum + (weight[unit] ?? 0) * goldUnitGrams(unit, pointsPerRoti), 0),
  )
}

/** `value` of `from` expressed in `to`. */
export function convertGold(value: number, from: GoldUnit, to: GoldUnit, pointsPerRoti = DEFAULT_POINTS_PER_ROTI): number {
  return cleanQuantity((value * goldUnitGrams(from, pointsPerRoti)) / goldUnitGrams(to, pointsPerRoti))
}

/** True when every part is a known unit with a finite amount of at least 0. */
export function isValidGoldWeight(weight: GoldWeight): boolean {
  return Object.entries(weight).every(
    ([unit, v]) => GOLD_UNITS.includes(unit as GoldUnit) && v !== undefined && v >= 0 && Number.isFinite(v),
  )
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateGold(input: GoldInput): GoldError | null {
  if (!isValidGoldWeight(input.weight)) return 'weight'
  if (input.pricePerVori !== undefined && !(input.pricePerVori >= 0 && Number.isFinite(input.pricePerVori))) {
    return 'price'
  }
  const ppr = input.pointsPerRoti ?? DEFAULT_POINTS_PER_ROTI
  if (!(Number.isInteger(ppr) && ppr >= 1)) return 'points'
  return null
}

/** One weight in every unit, its ভরি-আনা-রতি-পয়েন্ট form, and its value at the given rate. */
export function calculateGold(input: GoldInput): GoldResult {
  const ppr = input.pointsPerRoti ?? DEFAULT_POINTS_PER_ROTI
  const grams = goldWeightGrams(input.weight, ppr)
  const rows = GOLD_UNITS.map((unit) => ({ unit, value: cleanQuantity(grams / goldUnitGrams(unit, ppr)) }))
  const values = Object.fromEntries(rows.map((r) => [r.unit, r.value])) as Record<GoldUnit, number>
  const [vori, ana, roti, point] = splitQuantity(
    grams,
    (['vori', 'ana', 'roti', 'point'] as const).map((u) => goldUnitGrams(u, ppr)),
  ) as [number, number, number, number]

  const price = input.pricePerVori
  return {
    grams,
    values,
    rows,
    split: { vori, ana, roti, point },
    value: price === undefined ? null : round(values.vori * price),
    pricePerGram: price === undefined ? null : round(price / VORI_GRAMS),
  }
}
