import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/loan-eligibility?income=80000&emi=0&dbr=40. Defaults: Figma F9. */
export const LOAN_ELIGIBILITY_PARAMS = defineParams({
  income: { kind: 'number', default: 60000, min: 0, max: 1_000_000_000 },
  emi: { kind: 'number', default: 5000, min: 0, max: 1_000_000_000 },
  rate: { kind: 'number', default: 12, min: 0, max: 100 },
  years: { kind: 'number', default: 5, min: 0, max: 100 },
  /** Share of income instalments may take, %. Chips come from data/finance/loan-dbr.json. */
  dbr: { kind: 'number', default: 50, min: 0, max: 100 },
})

/** What the engine accepts (validateLoanEligibility); the term is whole years. */
export const LOAN_ELIGIBILITY_LIMITS = {
  income: { min: 1 },
  emi: { min: 0 },
  rate: { min: 0, max: 100 },
  years: { min: 1, max: 50, integer: true },
  dbr: { min: 1, max: 100 },
} as const
