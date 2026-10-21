import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/currency-converter?cur=USD&amount=500. Defaults: Figma F11 (১,০০০ SAR). */
export const CURRENCY_PARAMS = defineParams({
  /** The Figma "জনপ্রিয়" chips; MYR is shown but not on the bank's sheet yet (P8). */
  cur: { kind: 'enum', default: 'SAR', values: ['SAR', 'AED', 'USD', 'MYR', 'GBP', 'EUR'] as const },
  amount: { kind: 'number', default: 1000, min: 0, max: 100_000_000_000 },
})

export type CurrencyCode = 'SAR' | 'AED' | 'USD' | 'MYR' | 'GBP' | 'EUR'

/** Chips in Figma's order. */
export const POPULAR = ['SAR', 'AED', 'USD', 'MYR', 'GBP', 'EUR'] as const

export const CURRENCY_LIMITS = { amount: { min: 0 } } as const
