// Income tax: inputs → what the calculator shows. All arithmetic is @hisab/core income-tax.
import { calculateIncomeTax, validateIncomeTax, type IncomeTaxRules } from '@hisab/core/income-tax'
import { plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { decimal, fill, num, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { IncomeTaxCopy } from './copy.ts'
import { INCOME_TAX_LIMITS, TAX_AREA, type IncomeTaxPageMode, type TaxpayerCategory } from './params.ts'

export interface IncomeTaxInput {
  lang: Lang
  copy: IncomeTaxCopy
  mode: IncomeTaxPageMode
  income: number | null
  category: TaxpayerCategory
  investment: number | null
  /** data/income-tax-<year>.json. */
  rules: IncomeTaxRules
}

export interface SlabRow {
  step: string
  rate: string
  tax: number
}

export interface IncomeTaxView {
  label: string
  value: number
  sub: string
  tableTitle: string
  rows: SlabRow[]
  shareText: string
}

export function incomeTaxOutcome({ lang, copy, mode, income, category, investment, rules }: IncomeTaxInput): ToolOutcome<IncomeTaxView> {
  if (income === null || investment === null) return { kind: 'empty' }
  const fields = fieldIssues({ income, inv: investment }, INCOME_TAX_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const base = { income, category, investment, area: TAX_AREA, rules }
  // The ordinary slabs (C6, and the main number on C6-b), then the freelancer exemption from data.
  const ordinary = { ...base, mode: 'salaried' as const }
  if (validateIncomeTax(ordinary)) return { kind: 'empty' }
  const r = calculateIncomeTax(ordinary)
  const free = taxFree(r)
  let sub: string
  if (mode === 'freelancer') {
    const exempt = calculateIncomeTax({ ...base, mode: 'freelancer', viaBankingChannel: true })
    sub = fill(lang, copy.resultSubFreelancer, { tax: taka(lang, exempt.tax) })
  } else {
    sub = free ? copy.resultSubFree : fill(lang, copy.resultSub, { gross: taka(lang, r.grossTax), rebate: taka(lang, r.rebate), minimum: taka(lang, r.minimumTax) })
  }
  return {
    kind: 'result',
    result: {
      label: mode === 'freelancer' ? copy.resultLabelFreelancer : copy.resultLabel,
      value: Math.round(r.tax),
      sub,
      tableTitle: fill(lang, copy.tableTitle, { who: copy.categories[category] }),
      rows: r.rows.map((row) => ({
        step: fill(lang, row.label === 'first' ? copy.first : copy.next, { amount: num(lang, row.amount, 0) }),
        rate: fill(lang, copy.pct, { n: decimal(lang, row.ratePct, 2) }),
        tax: row.tax,
      })),
      shareText: fill(lang, copy.shareText, { income: taka(lang, income), tax: taka(lang, r.tax), year: plainDigits(lang, rules.incomeYear) }),
    },
  }
}

const taxFree = (r: { taxableIncome: number; threshold: number }) => r.taxableIncome <= r.threshold

/** The callout under the table, with the limits and the year from data. */
export function incomeTaxCallout(lang: Lang, copy: IncomeTaxCopy, mode: IncomeTaxPageMode, rules: IncomeTaxRules): string {
  const year = plainDigits(lang, rules.incomeYear)
  if (mode === 'freelancer') return fill(lang, copy.calloutFreelancer, { year })
  const t = rules.thresholds
  return fill(lang, copy.calloutSalaried, { women: num(lang, t.womenOrSenior ?? 0), disabled: num(lang, t.disabled ?? 0), year })
}

export function incomeTaxReportItems(copy: IncomeTaxCopy): ReportErrorItem[] {
  return [
    { value: 'tax', label: copy.reportTax },
    { value: 'slabs', label: copy.reportSlabs },
    { value: 'rebate', label: copy.reportRebate },
  ]
}
