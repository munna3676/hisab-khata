import { defineParams } from '../tool/url-state.ts'

/** The DPS inputs in a share link: /tools/dps?deposit=3000&years=10&comp=quarterly. Defaults: Figma F7. */
export const DPS_PARAMS = defineParams({
  deposit: { kind: 'number', default: 5000, min: 0, max: 1_000_000_000 },
  rate: { kind: 'number', default: 9, min: 0, max: 100 },
  years: { kind: 'number', default: 5, min: 0, max: 100 },
  /** মাসিক (F7) or ত্রৈমাসিক (F7-b) চক্রবৃদ্ধি. */
  comp: { kind: 'enum', default: 'monthly', values: ['monthly', 'quarterly'] as const },
  /** Tax at source, %. The default is data/finance/interest-tax.json withTinPct (checked by a test). */
  tax: { kind: 'number', default: 10, min: 0, max: 100 },
})

export type DpsMode = 'monthly' | 'quarterly'

/** What the engine accepts (validateDps); the term is whole years here (months = years × 12). */
export const DPS_LIMITS = {
  deposit: { min: 1 },
  rate: { min: 0, max: 100 },
  years: { min: 1, max: 50, integer: true },
  tax: { min: 0, max: 100 },
} as const
