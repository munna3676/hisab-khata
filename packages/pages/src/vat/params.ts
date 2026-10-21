import { defineParams } from '../tool/url-state.ts'

/**
 * The VAT inputs in a share link: /tools/vat?mode=remove&amount=1150&rate=7.5. Defaults: Figma C1
 * (৳১,০০০ at 15%). The rate default is data/commerce/vat-rates.json defaultPct (checked by a test).
 */
export const VAT_PARAMS = defineParams({
  /** VAT যোগ করো (C1) or VAT বাদ দাও (C4-b). */
  mode: { kind: 'enum', default: 'add', values: ['add', 'remove'] as const },
  amount: { kind: 'number', default: 1000, min: 0, max: 100_000_000_000 },
  rate: { kind: 'number', default: 15, min: 0, max: 100 },
})

export type VatMode = 'add' | 'remove'

/** What validateVat accepts. */
export const VAT_LIMITS = { amount: { min: 0 }, rate: { min: 0, max: 100 } } as const

/** The worked example in the callout: ৳১,০০০ before VAT (Figma "যেমন ১,১৫০ ÷ ১.১৫ = ১,০০০ টাকা"). */
export const CALLOUT_BASE = 1000
