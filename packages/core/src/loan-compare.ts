import { calculateEmi, validateEmi } from './emi.ts'
import { round } from './lib/money.ts'

export interface LoanOffer {
  /** Loan amount in taka. */
  principal: number
  /** Yearly interest rate in percent. */
  annualRatePct: number
  /** Number of monthly instalments. */
  months: number
  /** Processing fee in percent of the loan, from the bank's schedule of charges. */
  processingFeePct: number
  /** Other one-time charges in taka (documentation, stamp, CIB); 0 when none. */
  otherFees?: number
}

export interface LoanCompareInput {
  /** Two or three offers, in the order shown (A, B, C). */
  offers: LoanOffer[]
}

export interface LoanOfferResult {
  emi: number
  totalInterest: number
  /** Processing fee + other fees. */
  fees: number
  /** What the loan costs beyond the principal: interest + fees. */
  totalCost: number
  /** Everything paid: principal + interest + fees. */
  totalPayment: number
}

/** Index of the offer with the lowest value, or null when that lowest value is shared. */
export interface LoanCompareLowest {
  emi: number | null
  totalInterest: number | null
  fees: number | null
  totalCost: number | null
}

export interface LoanCompareResult {
  offers: LoanOfferResult[]
  /** The offer with the lowest total cost, or null when two offers tie. */
  bestIndex: number | null
  /** How much less the best offer costs than the next cheapest; 0 on a tie. */
  saving: number
  /** Lowest offer per table row, for the highlighted cells. */
  lowest: LoanCompareLowest
}

/** 'offers' for a wrong count, else the field and the offer's index, e.g. 'rate.1'. */
export type LoanCompareError = 'offers' | `${'principal' | 'rate' | 'months' | 'fee'}.${number}`

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateLoanCompare(input: LoanCompareInput): LoanCompareError | null {
  if (!(input.offers.length >= 2 && input.offers.length <= 3)) return 'offers'
  for (const [i, offer] of input.offers.entries()) {
    const emiError = validateEmi(offer)
    if (emiError) return `${emiError}.${i}`
    if (!(offer.processingFeePct >= 0 && offer.processingFeePct <= 100)) return `fee.${i}`
    if (!((offer.otherFees ?? 0) >= 0)) return `fee.${i}`
  }
  return null
}

/** Picks the single lowest value; a shared lowest picks nothing. */
function lowestIndex(values: number[]): number | null {
  const min = Math.min(...values)
  const at = values.flatMap((v, i) => (v === min ? [i] : []))
  return at.length === 1 ? at[0]! : null
}

/** EMI, interest, fees and total cost of each offer, and which one costs least. */
export function calculateLoanCompare(input: LoanCompareInput): LoanCompareResult {
  const offers = input.offers.map((offer): LoanOfferResult => {
    const { emi, totalInterest } = calculateEmi(offer)
    const fees = round((offer.principal * offer.processingFeePct) / 100 + (offer.otherFees ?? 0))
    const totalCost = round(totalInterest + fees)
    return { emi, totalInterest, fees, totalCost, totalPayment: round(offer.principal + totalCost) }
  })

  const costs = offers.map((o) => o.totalCost)
  const bestIndex = lowestIndex(costs)
  const sorted = [...costs].sort((a, b) => a - b)
  return {
    offers,
    bestIndex,
    saving: bestIndex === null ? 0 : round(sorted[1]! - sorted[0]!),
    lowest: {
      emi: lowestIndex(offers.map((o) => o.emi)),
      totalInterest: lowestIndex(offers.map((o) => o.totalInterest)),
      fees: lowestIndex(offers.map((o) => o.fees)),
      totalCost: bestIndex,
    },
  }
}
