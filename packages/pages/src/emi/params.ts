import { defineParams } from '../tool/url-state.ts'

/** The EMI inputs in a share link: /tools/emi?amount=800000&rate=11&months=60. Defaults: Figma F6. */
export const EMI_PARAMS = defineParams({
  amount: { kind: 'number', default: 500000, min: 0, max: 10_000_000_000 },
  rate: { kind: 'number', default: 12, min: 0, max: 100 },
  months: { kind: 'number', default: 36, min: 0, max: 1200 },
})

/** Term chips in months (Figma: ১ বছর, ২ বছর, ৩ বছর, ৫ বছর). */
export const TERM_CHIPS = [12, 24, 36, 60] as const

/** What the engine accepts (packages/core/src/emi.ts validateEmi). */
export const EMI_LIMITS = { amount: { min: 1 }, rate: { min: 0, max: 100 }, months: { min: 1, max: 600, integer: true } } as const
