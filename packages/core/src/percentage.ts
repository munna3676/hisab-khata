import { round } from './lib/money.ts'

// ---- Price after discount (ডিসকাউন্ট) ----

export interface DiscountInput {
  /** Price before the discount (আসল দাম). */
  price: number
  /** Percent off, or taka off when `type` is "amount". */
  discount: number
  /** Defaults to "percent". */
  type?: 'percent' | 'amount'
}

export interface DiscountResult {
  /** What the buyer pays (দিতে হবে). */
  finalPrice: number
  /** Taka saved (বাঁচলো). */
  saved: number
  discountPct: number
}

export type DiscountError = 'price' | 'discount'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateDiscount(input: DiscountInput): DiscountError | null {
  if (!(input.price >= 0 && Number.isFinite(input.price))) return 'price'
  const max = input.type === 'amount' ? input.price : 100
  if (!(input.discount >= 0 && input.discount <= max)) return 'discount'
  return null
}

export function calculateDiscount(input: DiscountInput): DiscountResult {
  const saved = input.type === 'amount' ? input.discount : (input.price * input.discount) / 100
  const discountPct = input.type === 'amount' ? (input.price === 0 ? 0 : (saved / input.price) * 100) : input.discount
  return { finalPrice: round(input.price - saved), saved: round(saved), discountPct: round(discountPct) }
}

// ---- Discount percent from two prices, and the price before a discount ----

export interface DiscountPctInput {
  originalPrice: number
  finalPrice: number
}

export type DiscountPctError = 'originalPrice' | 'finalPrice'

export function validateDiscountPct(input: DiscountPctInput): DiscountPctError | null {
  if (!(input.originalPrice > 0 && Number.isFinite(input.originalPrice))) return 'originalPrice'
  if (!(input.finalPrice >= 0 && input.finalPrice <= input.originalPrice)) return 'finalPrice'
  return null
}

/** "৳২,৫০০ এর জিনিস ৳২,০০০ এ পেলাম, ছাড় কত %?" */
export function calculateDiscountPct(input: DiscountPctInput): DiscountResult {
  const saved = input.originalPrice - input.finalPrice
  const discountPct = (saved / input.originalPrice) * 100
  return { finalPrice: round(input.finalPrice), saved: round(saved), discountPct: round(discountPct) }
}

export interface OriginalPriceInput {
  /** Price paid after the discount. */
  finalPrice: number
  discountPct: number
}

export type OriginalPriceError = 'finalPrice' | 'discountPct'

export function validateOriginalPrice(input: OriginalPriceInput): OriginalPriceError | null {
  if (!(input.finalPrice >= 0 && Number.isFinite(input.finalPrice))) return 'finalPrice'
  if (!(input.discountPct >= 0 && input.discountPct < 100)) return 'discountPct'
  return null
}

/** Price before the discount: final ÷ (1 − discount%). */
export function calculateOriginalPrice(input: OriginalPriceInput): number {
  return round(input.finalPrice / (1 - input.discountPct / 100))
}

// ---- x% of y (শতাংশ হিসাব) and "x is what % of y" ----

export interface PercentOfInput {
  /** The number (সংখ্যা). */
  value: number
  /** The percent (শতাংশ). */
  pct: number
}

export type PercentOfError = 'value' | 'pct'

export function validatePercentOf(input: PercentOfInput): PercentOfError | null {
  if (!Number.isFinite(input.value)) return 'value'
  if (!Number.isFinite(input.pct)) return 'pct'
  return null
}

export function calculatePercentOf(input: PercentOfInput): number {
  return round((input.value * input.pct) / 100)
}

export interface WhatPercentInput {
  part: number
  whole: number
}

export type WhatPercentError = 'part' | 'whole'

export function validateWhatPercent(input: WhatPercentInput): WhatPercentError | null {
  if (!Number.isFinite(input.part)) return 'part'
  if (!(input.whole !== 0 && Number.isFinite(input.whole))) return 'whole'
  return null
}

export function calculateWhatPercent(input: WhatPercentInput): number {
  return round((input.part / input.whole) * 100)
}

// ---- Percent change (কত % বাড়লো/কমলো) ----

export interface PercentChangeInput {
  from: number
  to: number
}

export interface PercentChangeResult {
  /** to − from; negative when it went down. */
  change: number
  /** Change as a percent of `from`; negative when it went down. */
  changePct: number
  direction: 'up' | 'down' | 'same'
}

export type PercentChangeError = 'from' | 'to'

export function validatePercentChange(input: PercentChangeInput): PercentChangeError | null {
  if (!(input.from !== 0 && Number.isFinite(input.from))) return 'from'
  if (!Number.isFinite(input.to)) return 'to'
  return null
}

export function calculatePercentChange(input: PercentChangeInput): PercentChangeResult {
  const change = input.to - input.from
  // Divide by |from| so a loss that shrinks (−100 → −50) reads as going up.
  const changePct = (change / Math.abs(input.from)) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'same'
  return { change: round(change), changePct: round(changePct), direction }
}

// ---- Successive discounts (২০% এর পর আরও ১০%) ----

export interface SuccessiveDiscountInput {
  price: number
  /** Discounts in the order they are applied, each in percent. */
  discountsPct: number[]
}

export interface SuccessiveDiscountStep {
  discountPct: number
  saved: number
  priceAfter: number
}

export interface SuccessiveDiscountResult {
  finalPrice: number
  saved: number
  /** The single discount that gives the same final price: 20% then 10% is 28%, not 30%. */
  effectivePct: number
  steps: SuccessiveDiscountStep[]
}

export type SuccessiveDiscountError = 'price' | 'discounts'

export function validateSuccessiveDiscount(input: SuccessiveDiscountInput): SuccessiveDiscountError | null {
  if (!(input.price >= 0 && Number.isFinite(input.price))) return 'price'
  if (input.discountsPct.length === 0 || !input.discountsPct.every((d) => d >= 0 && d <= 100)) return 'discounts'
  return null
}

/**
 * Each step takes its percent off the price the shop printed after the step
 * before (rounded to the paisa), so every row reads priceBefore − saved = priceAfter.
 */
export function calculateSuccessiveDiscount(input: SuccessiveDiscountInput): SuccessiveDiscountResult {
  const steps: SuccessiveDiscountStep[] = []
  let price = round(input.price)
  let keep = 1
  for (const discountPct of input.discountsPct) {
    const saved = round((price * discountPct) / 100)
    price = round(price - saved)
    keep *= 1 - discountPct / 100
    steps.push({ discountPct, saved, priceAfter: price })
  }
  return {
    finalPrice: price,
    saved: round(input.price - price),
    effectivePct: round((1 - keep) * 100),
    steps,
  }
}
