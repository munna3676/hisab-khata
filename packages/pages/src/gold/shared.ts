// What the gold tools (converter L3, jewellery bill L4) share: the ভরি-আনা-রতি weight fields' words,
// the day's BAJUS rate as the price default, and the rate line under the price field.
import { parseIsoDate } from '@hisab/core/lib/dates-calendar'
import type { BajusRates, Karat } from '@hisab/data/types'
import { formatDateIn, plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import { fill, taka } from '../tool/say.ts'

/**
 * The price param's default: "the day's BAJUS rate for the karat", so a link without a price
 * follows the data (and keeps doing so when the rates change) and only a typed price is stored.
 */
export const PRICE_FROM_RATES = -1

export const GOLD_WEIGHT_COPY = {
  weightLabel: { bn: 'ওজন', en: 'Weight' },
  vori: { bn: 'ভরি', en: 'bhori' },
  ana: { bn: 'আনা', en: 'ana' },
  roti: { bn: 'রতি', en: 'roti' },
  gram: { bn: 'গ্রাম', en: 'gram' },
} as const

export type KaratId = '18' | '21' | '22' | '24'

export const karatKey = (k: KaratId): Karat => `${k}K` as Karat

/** The day's rate for a karat, or null when the sheet has none. */
export const rateFor = (rates: BajusRates, k: KaratId): number | null => rates.gold[karatKey(k)] ?? null

/** The price in use: a typed one, else the day's rate (null when there is none). */
export const priceIn = (p: number | null, rate: number | null): number | null => (p === PRICE_FROM_RATES ? rate : p)

/** The rate sheet's date as the page writes dates ("১৩ অক্টোবর ২০২৬"). */
export function ratesDate(lang: Lang, rates: BajusRates): string {
  const d = parseIsoDate(rates.date)
  return d ? formatDateIn(lang, d) : rates.date
}

/** "বাজুস, ১৩ অক্টোবর ২০২৬: ২২ ক্যারেট ৳২,২৮,০৩১/ভরি" from the copy's template. */
export function rateLine(lang: Lang, template: string, rates: BajusRates, k: KaratId): string {
  const rate = rateFor(rates, k)
  return fill(lang, template, { date: ratesDate(lang, rates), karat: plainDigits(lang, k), rate: rate === null ? '—' : taka(lang, rate) })
}
