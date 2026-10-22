import { PRICE_FROM_RATES } from '../gold/shared.ts'
import { defineParams } from '../tool/url-state.ts'

/**
 * The inputs in a share link: /tools/jewelry-bill?v=2&a=4&mk=8, or &p=220000 for a typed rate.
 * Defaults: Figma L4 (১ ভরি, the day's 22K BAJUS rate, মজুরি ৬%, VAT ৫%).
 */
export const JEWELRY_PARAMS = defineParams({
  v: { kind: 'number', default: 1, min: 0, max: 1_000_000_000 },
  a: { kind: 'number', default: 0, min: 0, max: 1_000_000_000 },
  r: { kind: 'number', default: 0, min: 0, max: 1_000_000_000 },
  /** Taka per ভরি; the default (-1) means the day's 22K rate from data/gold/bajus-rates.json. */
  p: { kind: 'number', default: PRICE_FROM_RATES, min: 0, max: 1_000_000_000 },
  /** মজুরি %; the default is data/gold/jewellery-rules.json minMakingPct (a test checks it). */
  mk: { kind: 'number', default: 6, min: 0, max: 1000 },
  /** VAT %; the default is data/gold/jewellery-rules.json vatPct (a test checks it). */
  vat: { kind: 'number', default: 5, min: 0, max: 1000 },
})

/** The karat the bill uses (Figma L4: "২২ ক্যারেট"). */
export const BILL_KARAT = '22' as const

/** What the engine accepts (packages/core/src/jewelry-bill.ts validateJewelryBill). */
export const JEWELRY_LIMITS = { mk: { min: 0, max: 100 }, vat: { min: 0, max: 100 } } as const
