import { round } from './lib/money.ts'

/** One row of a bank's rate sheet (from data). */
export interface CurrencyRate {
  /** ISO 4217 code, e.g. 'SAR'. */
  code: string
  /** Taka the bank pays for `unit` units (TT/clean buying rate); used for foreign → taka. */
  buy: number
  /** Taka the bank charges for `unit` units (selling rate); used for taka → foreign. Defaults to buy. */
  sell?: number
  /** Units the rates are quoted for. Defaults to 1. */
  unit?: number
}

/** 'toBdt': a foreign amount in, taka out (the screen). 'fromBdt': taka in, foreign amount out. */
export type CurrencyDirection = 'toBdt' | 'fromBdt'

export interface CurrencyInput {
  /** Foreign units for 'toBdt', taka for 'fromBdt'. */
  amount: number
  code: string
  direction: CurrencyDirection
  rates: readonly CurrencyRate[]
  /** Margin in percent below the buying / above the selling rate (exchange house, card); 0 for none. */
  spreadPct?: number
  /** Flat fee in taka, taken from the taka side; 0 for none. */
  feeBdt?: number
}

export interface CurrencyResult {
  /** Taka for 'toBdt', foreign units for 'fromBdt'. */
  result: number
  /** Taka per 1 unit after the spread. */
  rate: number
  /** The taka side before the fee. */
  grossBdt: number
  fee: number
}

export interface CurrencyTableRow {
  code: string
  /** Taka per 1 unit after the spread. */
  rate: number
  /** Taka for the given amount of this currency. */
  bdt: number
}

export type CurrencyError = 'amount' | 'direction' | 'code' | 'rates' | 'spread' | 'fee'

/** A usable rate row: finite and above zero (Infinity or NaN would give Infinity or NaN taka). */
const positive = (n: number | undefined) => typeof n === 'number' && Number.isFinite(n) && n > 0

function isValidRate(rate: CurrencyRate): boolean {
  return positive(rate.buy) && (rate.sell === undefined || positive(rate.sell)) && (rate.unit === undefined || positive(rate.unit))
}

/** Taka per 1 unit, after the spread, for the side of the deal the bank is on. */
function effectiveRate(rate: CurrencyRate, direction: CurrencyDirection, spreadPct: number): number {
  const perUnit = (direction === 'toBdt' ? rate.buy : (rate.sell ?? rate.buy)) / (rate.unit ?? 1)
  return direction === 'toBdt' ? perUnit * (1 - spreadPct / 100) : perUnit * (1 + spreadPct / 100)
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateCurrency(input: CurrencyInput): CurrencyError | null {
  if (!(input.amount > 0)) return 'amount'
  if (!(input.direction === 'toBdt' || input.direction === 'fromBdt')) return 'direction'
  const rate = input.rates.find((r) => r.code === input.code)
  if (!rate) return 'code'
  if (!isValidRate(rate)) return 'rates'
  const spreadPct = input.spreadPct ?? 0
  if (!(spreadPct >= 0 && spreadPct < 100)) return 'spread'
  const fee = input.feeBdt ?? 0
  // The fee has to leave something to convert.
  const bdtSide = input.direction === 'toBdt' ? input.amount * effectiveRate(rate, 'toBdt', spreadPct) : input.amount
  if (!(fee >= 0 && fee < bdtSide)) return 'fee'
  return null
}

/** Converts between a foreign currency and taka using the rate sheet. */
export function calculateCurrency(input: CurrencyInput): CurrencyResult {
  const { amount, code, direction, rates, spreadPct = 0, feeBdt = 0 } = input
  const rate = effectiveRate(rates.find((r) => r.code === code)!, direction, spreadPct)
  const fee = round(feeBdt)
  if (direction === 'toBdt') {
    const grossBdt = round(amount * rate)
    return { result: round(grossBdt - fee), rate: round(rate, 4), grossBdt, fee }
  }
  return { result: round((amount - fee) / rate), rate: round(rate, 4), grossBdt: round(amount), fee }
}

/** The same foreign amount in taka for every currency on the sheet ("অন্য মুদ্রায় ১,০০০"). */
export function calculateCurrencyTable(amount: number, rates: readonly CurrencyRate[], spreadPct = 0): CurrencyTableRow[] {
  return rates.filter(isValidRate).map((r) => {
    const rate = effectiveRate(r, 'toBdt', spreadPct)
    return { code: r.code, rate: round(rate, 4), bdt: round(amount * rate) }
  })
}
