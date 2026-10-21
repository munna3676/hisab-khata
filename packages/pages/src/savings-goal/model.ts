// Savings goal: inputs → what the calculator shows. All arithmetic is @hisab/core savings-goal.
import { calculateSavingsGoal } from '@hisab/core/savings-goal'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, num, plain, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { SavingsGoalCopy } from './copy.ts'
import { SAVINGS_GOAL_LIMITS, type SavingsGoalPurpose } from './params.ts'

export interface SavingsGoalPageInput {
  lang: Lang
  copy: SavingsGoalCopy
  target: number | null
  months: number | null
  rate: number | null
  goal: SavingsGoalPurpose
}

export interface SavingsGoalView {
  label: string
  value: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  shareText: string
}

export function savingsGoalOutcome({ lang, copy, target, months, rate, goal }: SavingsGoalPageInput): ToolOutcome<SavingsGoalView> {
  if (target === null || months === null || rate === null) return { kind: 'empty' }
  const fields = fieldIssues({ target, months, rate }, SAVINGS_GOAL_LIMITS, rangeSay(lang, copy.wholeMonths))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const r = calculateSavingsGoal({ target, months, annualRatePct: rate })
  const vars = { months: num(lang, months), target: taka(lang, target), monthly: taka(lang, r.monthlySaving) }
  const purpose = goal === 'none' ? undefined : copy.purposes[goal]
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.monthlySaving,
      sub: rate > 0 ? fill(lang, copy.resultSub, { rate: plain(lang, rate), without: taka(lang, r.monthlyWithoutReturn) }) : copy.resultSubNoReturn,
      summaryTitle: fill(lang, copy.summaryTitle, { months: num(lang, months) }),
      summary: [
        { key: 'deposit', label: copy.totalDeposit, value: taka(lang, r.totalDeposit) },
        { key: 'profit', label: copy.profit, value: taka(lang, r.profit) },
        { key: 'goal', label: copy.goal, value: taka(lang, target), total: true },
      ],
      shareText: purpose ? fill(lang, copy.shareTextFor, { ...vars, purpose }) : fill(lang, copy.shareText, vars),
    },
  }
}

export function savingsGoalReportItems(copy: SavingsGoalCopy): ReportErrorItem[] {
  return [{ value: 'monthly', label: copy.reportMonthly }]
}
