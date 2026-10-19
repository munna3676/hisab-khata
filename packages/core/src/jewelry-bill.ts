import {
  DEFAULT_POINTS_PER_ROTI,
  VORI_GRAMS,
  goldWeightGrams,
  isValidGoldWeight,
  type GoldWeight,
} from './gold.ts'
import { cleanQuantity } from './lib/land-gold-edu-units.ts'
import { round } from './lib/money.ts'

/** Old jewellery the customer hands over in exchange. */
export interface OldGold {
  weight: GoldWeight
  /** Taka per ভরি for the old piece's karat; defaults to the new piece's rate. */
  pricePerVori?: number
  /** Cut in percent the shop takes from the old gold (BAJUS sets one for exchange, another for buying back; from data). */
  deductionPct: number
}

export interface JewelryBillInput {
  weight: GoldWeight
  /** Taka per ভরি of the karat (22K/21K/18K/সনাতন), from the day's BAJUS rates. */
  pricePerVori: number
  /** মজুরি in percent of the gold price (BAJUS sets a minimum; shops vary by design). */
  makingPct: number
  /** Flat মজুরি in taka per ভরি, for shops that charge by weight; 0 or left out for none. */
  makingPerVori?: number
  /** VAT in percent on gold + মজুরি; 0 or left out when the rate already includes VAT. */
  vatPct?: number
  /** VAT as fixed taka per ভরি, if the law charges it that way; 0 or left out for none. */
  vatPerVori?: number
  oldGold?: OldGold
  pointsPerRoti?: number
}

export interface JewelryBillResult {
  grams: number
  vori: number
  /** সোনার দাম: weight × rate. */
  goldPrice: number
  making: number
  vat: number
  /** মোট বিল: gold + মজুরি + VAT. */
  total: number
  /** Old gold at the rate, its cut, and what the shop credits. All 0 without old gold. */
  oldGoldValue: number
  oldGoldDeduction: number
  oldGoldCredit: number
  /** What the customer pays after the exchange; negative when the shop owes the customer. */
  payable: number
}

export type JewelryBillError = 'weight' | 'price' | 'making' | 'vat' | 'oldGold' | 'points'

function isPct(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && v <= 100)
}

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateJewelryBill(input: JewelryBillInput): JewelryBillError | null {
  const ppr = input.pointsPerRoti ?? DEFAULT_POINTS_PER_ROTI
  if (!(Number.isInteger(ppr) && ppr >= 1)) return 'points'
  if (!isValidGoldWeight(input.weight) || !(goldWeightGrams(input.weight, ppr) > 0)) return 'weight'
  if (!(input.pricePerVori > 0 && Number.isFinite(input.pricePerVori))) return 'price'
  if (!(input.makingPct >= 0 && input.makingPct <= 100) || !isAmount(input.makingPerVori)) return 'making'
  if (!isPct(input.vatPct) || !isAmount(input.vatPerVori)) return 'vat'
  const old = input.oldGold
  if (old && !(isValidGoldWeight(old.weight) && isAmount(old.pricePerVori) && old.deductionPct >= 0 && old.deductionPct <= 100)) {
    return 'oldGold'
  }
  return null
}

/**
 * The shop's bill: gold at the day's rate, মজুরি on the gold price, then VAT
 * on gold + মজুরি, the way BAJUS rates are applied. Old gold given in
 * exchange is valued at its rate less the shop's cut and taken off the bill.
 */
export function calculateJewelryBill(input: JewelryBillInput): JewelryBillResult {
  const ppr = input.pointsPerRoti ?? DEFAULT_POINTS_PER_ROTI
  const grams = goldWeightGrams(input.weight, ppr)
  const vori = grams / VORI_GRAMS

  const goldPrice = round(vori * input.pricePerVori)
  const making = round((goldPrice * input.makingPct) / 100 + vori * (input.makingPerVori ?? 0))
  const vat = round(((goldPrice + making) * (input.vatPct ?? 0)) / 100 + vori * (input.vatPerVori ?? 0))
  const total = round(goldPrice + making + vat)

  let oldGoldValue = 0
  let oldGoldDeduction = 0
  if (input.oldGold) {
    const oldVori = goldWeightGrams(input.oldGold.weight, ppr) / VORI_GRAMS
    oldGoldValue = round(oldVori * (input.oldGold.pricePerVori ?? input.pricePerVori))
    oldGoldDeduction = round((oldGoldValue * input.oldGold.deductionPct) / 100)
  }
  const oldGoldCredit = round(oldGoldValue - oldGoldDeduction)

  return {
    grams,
    vori: cleanQuantity(vori),
    goldPrice,
    making,
    vat,
    total,
    oldGoldValue,
    oldGoldDeduction,
    oldGoldCredit,
    payable: round(total - oldGoldCredit),
  }
}
