import { defineParams } from '../tool/url-state.ts'

/**
 * Two offers in a share link: a* is offer A, b* offer B (p = loan, r = rate %, y = years,
 * f = processing fee %): /tools/loan-compare?br=10.5&bf=1.5. Defaults: Figma F10.
 */
export const LOAN_COMPARE_PARAMS = defineParams({
  ap: { kind: 'number', default: 500000, min: 0, max: 10_000_000_000 },
  ar: { kind: 'number', default: 12, min: 0, max: 100 },
  ay: { kind: 'number', default: 3, min: 0, max: 100 },
  af: { kind: 'number', default: 1, min: 0, max: 100 },
  bp: { kind: 'number', default: 500000, min: 0, max: 10_000_000_000 },
  br: { kind: 'number', default: 11, min: 0, max: 100 },
  by: { kind: 'number', default: 3, min: 0, max: 100 },
  bf: { kind: 'number', default: 2, min: 0, max: 100 },
})

export const OFFERS = ['a', 'b'] as const
export type OfferKey = (typeof OFFERS)[number]

/** What the engine accepts per offer (validateLoanCompare); the term is whole years. */
export const OFFER_LIMITS = {
  p: { min: 1 },
  r: { min: 0, max: 100 },
  y: { min: 1, max: 50, integer: true },
  f: { min: 0, max: 100 },
} as const
