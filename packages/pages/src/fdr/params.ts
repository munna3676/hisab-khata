import { defineParams } from '../tool/url-state.ts'

/** The FDR inputs in a share link: /tools/fdr?amount=200000&months=36&mode=renew. Defaults: Figma F8. */
export const FDR_PARAMS = defineParams({
  amount: { kind: 'number', default: 100000, min: 0, max: 10_000_000_000 },
  rate: { kind: 'number', default: 10, min: 0, max: 100 },
  months: { kind: 'number', default: 12, min: 0, max: 1200 },
  /** মুনাফা যোগ হয়: মেয়াদ শেষে (simple, F8) or প্রতি ৩ মাসে রিনিউ (renew, F8-b). */
  mode: { kind: 'enum', default: 'simple', values: ['simple', 'renew'] as const },
  /** Tax at source, %. The default is data/finance/interest-tax.json withTinPct (checked by a test). */
  tax: { kind: 'number', default: 10, min: 0, max: 100 },
})

export type FdrPageMode = 'simple' | 'renew'

/** Term chips in months (Figma: ৩ মাস, ৬ মাস, ১ বছর, ৩ বছর). */
export const TERM_CHIPS = [3, 6, 12, 36] as const

/** The renewal period of "প্রতি ৩ মাসে রিনিউ". */
export const RENEW_EVERY = 3

/** What the engine accepts (validateFdr). */
export const FDR_LIMITS = {
  amount: { min: 1 },
  rate: { min: 0, max: 100 },
  months: { min: 1, max: 600, integer: true },
  tax: { min: 0, max: 100 },
} as const
