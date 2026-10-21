// Mobile data pack: inputs → what the calculator shows. All filtering and unit costs are @hisab/core data-pack.
import { calculateDataPack, type DataPack } from '@hisab/core/data-pack'
import type { Operator } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { decimal, fill, num, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { DataPackCopy } from './copy.ts'
import { DATA_PACK_LIMITS, type OperatorChoice } from './params.ts'

export interface DataPackInput {
  lang: Lang
  copy: DataPackCopy
  operators: readonly Operator[]
  packs: DataPack[]
  budget: number | null
  days: number | null
  op: OperatorChoice
}

export interface PackRow {
  operator: string
  data: string
  price: string
}

export interface DataPackView {
  label: string
  value: number
  decimals: number
  sub: string
  tableTitle: string
  rows: PackRow[]
  shareText: string
}

export const operatorName = (lang: Lang, operators: readonly Operator[], id: string) => {
  const op = operators.find((o) => o.id === id)
  return op ? op[lang] : id
}

export function dataPackOutcome({ lang, copy, operators, packs, budget, days, op }: DataPackInput): ToolOutcome<DataPackView> {
  if (budget === null || days === null) return { kind: 'empty' }
  const fields = fieldIssues({ budget, days }, DATA_PACK_LIMITS, rangeSay(lang, copy.wholeDays))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const chosen = op === 'all' ? operators.map((o) => o.id) : [op]
  const r = calculateDataPack({ packs, operators: chosen, budget, validityDays: days })
  const name = (id: string) => operatorName(lang, operators, id)
  const gb = (n: number) => fill(lang, copy.gb, { n: decimal(lang, n, 2) })
  if (!r.best) {
    const cheapest = calculateDataPack({ packs, operators: chosen, validityDays: days, sort: 'cheapest' }).best
    return {
      kind: 'error',
      error: {
        title: fill(lang, copy.emptyTitle, { days: num(lang, days) }),
        body: copy.emptyBody,
        fix: cheapest ? { label: fill(lang, copy.emptyFix, { price: taka(lang, cheapest.pack.price) }), field: 'budget', value: cheapest.pack.price } : undefined,
      },
    }
  }
  const best = r.best
  const rows: PackRow[] = r.rows.map((row) => ({ operator: name(row.pack.operator), data: gb(row.pack.dataGb), price: num(lang, row.pack.price) }))
  if (r.operatorsWithoutMatch.length)
    rows.push({ operator: r.operatorsWithoutMatch.map(name).join(copy.listSep), data: copy.noMatch, price: copy.dash })
  if (r.operatorsWithoutData.length) rows.push({ operator: r.operatorsWithoutData.map(name).join(copy.listSep), data: copy.soon, price: copy.dash })
  const b = taka(lang, budget)
  return {
    kind: 'result',
    result: {
      label: fill(lang, copy.resultLabel, { budget: b }),
      value: best.pack.dataGb,
      decimals: Number.isInteger(best.pack.dataGb) ? 0 : 2,
      sub: fill(lang, copy.resultSub, {
        op: name(best.pack.operator),
        price: taka(lang, best.pack.price),
        days: num(lang, best.pack.validityDays),
        perDay: decimal(lang, best.gbPerDay, 2),
      }),
      tableTitle: fill(lang, copy.tableTitle, { budget: b, days: num(lang, days) }),
      rows,
      shareText: fill(lang, copy.shareText, { budget: b, days: num(lang, days), op: name(best.pack.operator), data: gb(best.pack.dataGb), price: taka(lang, best.pack.price) }),
    },
  }
}

export function dataPackReportItems(copy: DataPackCopy): ReportErrorItem[] {
  return [
    { value: 'pack', label: copy.reportPack },
    { value: 'missing', label: copy.reportMissing },
  ]
}
