import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/sanchayapatra?scheme=three-month&amount=300000. Defaults: Figma C7. */
export const SANCHAYAPATRA_PARAMS = defineParams({
  /** Scheme ids of data/finance/sanchayapatra.json (a test checks they match). */
  scheme: { kind: 'enum', default: 'paribar', values: ['bangladesh-5y', 'three-month', 'paribar', 'pensioner'] as const },
  amount: { kind: 'number', default: 500000, min: 0, max: 100_000_000_000 },
})

export type SchemeId = 'bangladesh-5y' | 'three-month' | 'paribar' | 'pensioner'

/** The chips in Figma's order: ৫ বছর মেয়াদি, ৩ মাস অন্তর মুনাফা, পরিবার, পেনশনার. */
export const SCHEME_CHIPS = ['bangladesh-5y', 'three-month', 'paribar', 'pensioner'] as const
