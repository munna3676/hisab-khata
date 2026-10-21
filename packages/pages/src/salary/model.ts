// Salary breakdown: inputs → what the calculator shows. Arithmetic is @hisab/core salary.
import { calculateSalary, validateSalary, type SalaryStructure } from '@hisab/core/salary'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { SummaryRow } from '../tool/parts.tsx'
import { decimal, fill, hasPaisa, money } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { SalaryCopy } from './copy.ts'
import { SALARY_LIMITS } from './params.ts'

/** The part of the data preset the page does not ask for: medical % of basic and conveyance. */
export type SalaryRest = Pick<SalaryStructure, 'medicalPctOfBasic' | 'conveyance'>

export interface SalaryInput {
  lang: Lang
  copy: SalaryCopy
  gross: number | null
  basic: number | null
  rent: number | null
  preset: SalaryRest
}

export interface SalaryView {
  label: string
  value: number
  decimals: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  shareText: string
}

export function salaryOutcome({ lang, copy, gross, basic, rent, preset }: SalaryInput): ToolOutcome<SalaryView> {
  if (gross === null || basic === null || rent === null) return { kind: 'empty' }
  const fields = fieldIssues({ gross, basic, rent }, SALARY_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const structure = { basicPctOfGross: basic, houseRentPctOfBasic: rent, ...preset }
  const input = { from: 'gross' as const, amount: gross, structure }
  if (validateSalary(input) === 'structure') {
    // The largest whole house-rent % that still fits (none when basic and medical alone are too much).
    const room = Math.floor((100 * (100 - basic)) / basic - preset.medicalPctOfBasic)
    const fix = room >= 0 && room < rent ? { label: fill(lang, copy.structureFix, { pct: decimal(lang, room) }), field: 'rent', value: room } : undefined
    return { kind: 'error', error: { title: copy.structureTitle, body: copy.structureBody, fix }, fields: { rent: copy.structureTitle } }
  }
  const r = calculateSalary(input)
  const m = (v: number) => money(lang, v)
  const pct = (v: number) => decimal(lang, v, 2)
  const summary: SummaryRow[] = [
    { key: 'basic', label: fill(lang, copy.basicRow, { pct: pct(basic) }), value: m(r.basic) },
    { key: 'rent', label: fill(lang, copy.rentRow, { pct: pct(rent) }), value: m(r.houseRent) },
    { key: 'medical', label: fill(lang, copy.medicalRow, { pct: pct(preset.medicalPctOfBasic) }), value: m(r.medical) },
    { key: 'conveyance', label: copy.conveyanceRow, value: m(r.conveyance) },
  ]
  if (r.otherAllowance > 0) summary.push({ key: 'other', label: copy.otherRow, value: m(r.otherAllowance) })
  summary.push({ key: 'total', label: copy.total, value: m(r.gross), total: true })
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.basic,
      decimals: hasPaisa(r.basic) ? 2 : 0,
      sub: fill(lang, copy.resultSub, { gross: m(r.gross), pct: pct(basic) }),
      summaryTitle: copy.summaryTitle,
      summary,
      shareText: fill(lang, copy.shareText, { gross: m(r.gross), basic: m(r.basic), rent: m(r.houseRent), medical: m(r.medical), conveyance: m(r.conveyance) }),
    },
  }
}

export function salaryReportItems(copy: SalaryCopy): ReportErrorItem[] {
  return [
    { value: 'basic', label: copy.reportBasic },
    { value: 'parts', label: copy.reportParts },
  ]
}
