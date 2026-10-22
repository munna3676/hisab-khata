import { PRICE_FROM_RATES } from '../gold/shared.ts'
import { defineParams } from '../tool/url-state.ts'

/**
 * The inputs in a share link: /tools/gold-converter?v=1&a=8&k=21, or &p=200000 for a typed price.
 * Defaults: Figma L3 (২ ভরি ৪ আনা, ২২ ক্যারেট at the day's BAJUS rate).
 */
export const GOLD_PARAMS = defineParams({
  v: { kind: 'number', default: 2, min: 0, max: 1_000_000_000 },
  a: { kind: 'number', default: 4, min: 0, max: 1_000_000_000 },
  r: { kind: 'number', default: 0, min: 0, max: 1_000_000_000 },
  k: { kind: 'enum', default: '22', values: ['18', '21', '22', '24'] as const },
  /** Taka per ভরি; the default (-1) means the day's BAJUS rate for k from data/gold/bajus-rates.json. */
  p: { kind: 'number', default: PRICE_FROM_RATES, min: 0, max: 1_000_000_000 },
})

/** The ক্যারেট chips (Figma: ১৮, ২১, ২২, ২৪). */
export const KARAT_CHIPS = ['18', '21', '22', '24'] as const
