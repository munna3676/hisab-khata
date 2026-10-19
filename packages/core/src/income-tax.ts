import { round } from './lib/money.ts'

/**
 * Bangladesh individual income tax for one income year under the Income Tax
 * Act 2023 as amended by each year's Finance Act: tax-free limit by taxpayer
 * category, marginal slabs, the investment rebate (section 78), minimum tax
 * by area, and the freelancing / IT-enabled services exemption. Every number
 * comes from data/income-tax-<year>.json.
 */

/** One band above the tax-free limit ("পরের ৩,০০,০০০ টাকায় ১০%"). */
export interface IncomeTaxSlab {
  /** Width of the band in taka; null for the last, open band. */
  width: number | null
  ratePct: number
}

export interface IncomeTaxRules {
  /** Income year the rules are for, e.g. "2026-27" (shown as "স্ল্যাব: FY ২০২৬-২৭"). */
  incomeYear: string
  /** Tax-free income by taxpayer category id: general, womenOrSenior, disabled, freedomFighter, thirdGender… */
  thresholds: Record<string, number>
  /** Extra tax-free income for each disabled child or dependant of the taxpayer. */
  disabledDependentExtra?: number
  /** Bands after the tax-free part, in order; only the last has width null. */
  slabs: IncomeTaxSlab[]
  /** Rebate = least of incomePct of taxable income, investmentPct of eligible investment, and cap. */
  rebate: { incomePct: number; investmentPct: number; cap: number }
  /** Minimum tax by area id (e.g. dhakaCtgCity, otherCity, rest), paid when income passes the tax-free limit. */
  minimumTax: Record<string, number>
  /**
   * Freelancing / IT-enabled services income: the share that is tax-free and
   * an optional cap. Leave out in a year with no exemption.
   */
  freelance?: { exemptPct: number; exemptCap: number | null; bankingChannelOnly?: boolean }
}

/** তুমি কে? চাকরিজীবী or ফ্রিল্যান্সার. */
export type IncomeTaxMode = 'salaried' | 'freelancer'

export interface IncomeTaxInput {
  mode: IncomeTaxMode
  /** The year's total taxable income in taka (বছরের মোট করযোগ্য আয়), freelance income included. */
  income: number
  /** Of `income`, the part from freelancing or IT-enabled services. In freelancer mode it is all of `income` when left out. */
  freelanceIncome?: number
  /** Freelance income came in through a bank or other legal channel; true when left out. */
  viaBankingChannel?: boolean
  /** Key into rules.thresholds (করদাতার ধরন). */
  category: string
  /** Eligible investment and donation this year in taka (বিনিয়োগ), for the rebate. */
  investment: number
  /** Key into rules.minimumTax. */
  area: string
  /** Disabled children or dependants, each raising the tax-free limit. */
  disabledDependents?: number
  rules: IncomeTaxRules
}

export interface IncomeTaxRow {
  /** "first" for the tax-free part (প্রথম ৪,০০,০০০), "next" for each band after it (পরের ৩,০০,০০০). */
  label: 'first' | 'next'
  /** Income taxed in this row, in taka. */
  amount: number
  ratePct: number
  tax: number
}

export interface IncomeTaxResult {
  /** Freelance income taken out as tax-free. */
  exemptIncome: number
  taxableIncome: number
  /** The tax-free limit that applied. */
  threshold: number
  /** The slab table (স্ল্যাব অনুযায়ী). */
  rows: IncomeTaxRow[]
  /** Tax from the slabs (স্ল্যাবে). */
  grossTax: number
  /** Investment rebate (বিনিয়োগ রিবেট). */
  rebate: number
  /** The area's minimum tax (ন্যূনতম কর), shown even when it is not what decides the tax. */
  minimumTax: number
  /** True when the minimum was paid because the slab tax less rebate came to less. */
  minimumApplied: boolean
  /** Tax to pay (আনুমানিক কর). */
  tax: number
  /** tax ÷ total income, in percent. */
  effectiveRatePct: number
  /** Investment that would earn the largest rebate this income allows. */
  investmentForFullRebate: number
}

export type IncomeTaxError =
  | 'mode'
  | 'income'
  | 'freelanceIncome'
  | 'category'
  | 'investment'
  | 'area'
  | 'dependents'
  | 'rules'

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

/** True when the rules from data can be calculated. */
export function isValidIncomeTaxRules(r: IncomeTaxRules): boolean {
  const { slabs, rebate } = r
  if (slabs.length === 0 || slabs.at(-1)!.width !== null) return false
  const bandsOk = slabs.every(
    (s, i) => (i === slabs.length - 1 || (s.width !== null && s.width > 0)) && s.ratePct >= 0 && s.ratePct <= 100,
  )
  if (!bandsOk) return false
  const pctOk = (p: number) => p >= 0 && p <= 100
  if (!(pctOk(rebate.incomePct) && pctOk(rebate.investmentPct) && isAmount(rebate.cap))) return false
  if (!Object.values(r.thresholds).every(isAmount) || !Object.values(r.minimumTax).every(isAmount)) return false
  if (!isAmount(r.disabledDependentExtra)) return false
  return !r.freelance || (pctOk(r.freelance.exemptPct) && (r.freelance.exemptCap === null || isAmount(r.freelance.exemptCap)))
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateIncomeTax(input: IncomeTaxInput): IncomeTaxError | null {
  if (input.mode !== 'salaried' && input.mode !== 'freelancer') return 'mode'
  if (!(input.income >= 0 && Number.isFinite(input.income))) return 'income'
  if (!isAmount(input.freelanceIncome) || (input.freelanceIncome ?? 0) > input.income) return 'freelanceIncome'
  // Object.hasOwn, so "toString" is not taken for a category or an area.
  if (!Object.hasOwn(input.rules.thresholds, input.category)) return 'category'
  if (!(input.investment >= 0 && Number.isFinite(input.investment))) return 'investment'
  if (!Object.hasOwn(input.rules.minimumTax, input.area)) return 'area'
  const d = input.disabledDependents
  if (d !== undefined && !(Number.isInteger(d) && d >= 0 && d <= 20)) return 'dependents'
  if (!isValidIncomeTaxRules(input.rules)) return 'rules'
  return null
}

/** Slab tax, investment rebate and minimum tax for the year. */
export function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const { rules } = input

  // Freelance / ITES income the rules make tax-free.
  const freelance = input.freelanceIncome ?? (input.mode === 'freelancer' ? input.income : 0)
  const f = rules.freelance
  const exemptAllowed = f !== undefined && (!f.bankingChannelOnly || input.viaBankingChannel !== false)
  const exemptIncome = exemptAllowed ? round(Math.min((freelance * f.exemptPct) / 100, f.exemptCap ?? Infinity)) : 0
  const taxableIncome = round(input.income - exemptIncome)

  const threshold = rules.thresholds[input.category]! + (input.disabledDependents ?? 0) * (rules.disabledDependentExtra ?? 0)

  const rows: IncomeTaxRow[] = [{ label: 'first', amount: Math.min(taxableIncome, threshold), ratePct: 0, tax: 0 }]
  let rest = taxableIncome - threshold
  let rawTax = 0
  for (const slab of rules.slabs) {
    if (rest <= 0) break
    const amount = Math.min(rest, slab.width ?? Infinity)
    const tax = (amount * slab.ratePct) / 100
    rows.push({ label: 'next', amount: round(amount), ratePct: slab.ratePct, tax: round(tax) })
    rawTax += tax
    rest -= amount
  }
  const grossTax = round(rawTax)

  const { incomePct, investmentPct, cap } = rules.rebate
  const rebateLimit = Math.min((taxableIncome * incomePct) / 100, cap, grossTax)
  const rebate = round(Math.min((input.investment * investmentPct) / 100, rebateLimit))
  // round() first, so float noise (2,500.05 ÷ 15% = 16,667.000…02) does not add a taka.
  const investmentForFullRebate = investmentPct > 0 ? Math.ceil(round((rebateLimit * 100) / investmentPct, 6)) : 0

  const minimumTax = rules.minimumTax[input.area]!
  const aboveLimit = taxableIncome > threshold
  const net = round(grossTax - rebate)
  const minimumApplied = aboveLimit && net < minimumTax
  const tax = !aboveLimit ? 0 : minimumApplied ? minimumTax : net

  return {
    exemptIncome,
    taxableIncome,
    threshold,
    rows,
    grossTax,
    rebate,
    minimumTax,
    minimumApplied,
    tax,
    effectiveRatePct: input.income > 0 ? round((tax / input.income) * 100) : 0,
    investmentForFullRebate,
  }
}
