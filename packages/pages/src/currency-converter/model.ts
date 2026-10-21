// Currency converter: inputs → what the calculator shows. All arithmetic is @hisab/core currency.
import { calculateCurrency, calculateCurrencyTable, validateCurrency } from '@hisab/core/currency'
import type { CurrencyRateSheet } from '@hisab/data/types'
import { formatDateIn } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { ChoiceOption } from '../tool/ChoiceSheet.tsx'
import { decimal, fill, hasPaisa, money, num, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { CurrencyCopy } from './copy.ts'
import { CURRENCY_LIMITS, POPULAR } from './params.ts'

export interface CurrencyInput {
  lang: Lang
  copy: CurrencyCopy
  sheet: CurrencyRateSheet
  code: string
  amount: number | null
}

export interface TableRow {
  code: string
  bdt: number
}

export interface CurrencyView {
  label: string
  value: number
  decimals: number
  sub: string
  tableTitle: string
  rows: TableRow[]
  shareText: string
}

/** The bank's name in the page language (data has it in English). */
export function bankName(lang: Lang, copy: CurrencyCopy, sheet: CurrencyRateSheet): string {
  return (copy.banks as Record<string, string>)[sheet.bank] ?? sheet.bank
}

/** "১৮ অক্টোবর ২০২৬" from the sheet's YYYY-MM-DD. */
export function sheetDate(lang: Lang, sheet: CurrencyRateSheet): string {
  const [year, month, day] = sheet.asOf.split('-').map(Number)
  return formatDateIn(lang, { year: year!, month: month!, day: day! })
}

export function currencyName(lang: Lang, copy: CurrencyCopy, sheet: CurrencyRateSheet, code: string): string {
  const fromData = sheet.rates.find((r) => r.code === code)?.nameBn
  if (lang === 'bn' && fromData) return fromData
  return (copy.names as Record<string, string>)[code] ?? fromData ?? code
}

export function currencyOutcome({ lang, copy, sheet, code, amount }: CurrencyInput): ToolOutcome<CurrencyView> {
  if (amount === null) return { kind: 'empty' }
  const fields = fieldIssues({ amount }, CURRENCY_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length || amount === 0) return { kind: 'empty', fields }
  const input = { amount, code, direction: 'toBdt' as const, rates: sheet.rates }
  const problem = validateCurrency(input)
  if (problem === 'code' || problem === 'rates') {
    return { kind: 'error', error: { title: fill(lang, copy.noRateTitle, { code }), body: copy.notListed } }
  }
  if (problem) return { kind: 'empty' }
  const r = calculateCurrency(input)
  const bank = bankName(lang, copy, sheet)
  const date = sheetDate(lang, sheet)
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.result,
      decimals: hasPaisa(r.result) ? 2 : 0,
      sub: fill(lang, copy.resultSub, { bank, code, rate: taka(lang, r.rate, 2), date }),
      tableTitle: fill(lang, copy.tableTitle, { amount: num(lang, amount) }),
      rows: calculateCurrencyTable(amount, sheet.rates.filter((x) => x.code !== code)).map((x) => ({ code: x.code, bdt: x.bdt })),
      shareText: fill(lang, copy.shareText, { amount: decimal(lang, amount, 2), code, taka: money(lang, r.result), bank, date }),
    },
  }
}

/** P8's options: the popular currencies first, then the rest of the sheet; ones without a rate are disabled. */
export function currencyOptions(lang: Lang, copy: CurrencyCopy, sheet: CurrencyRateSheet): ChoiceOption[] {
  const codes = [...new Set<string>([...POPULAR, ...sheet.rates.map((r) => r.code)])]
  return codes.map((code) => {
    const row = sheet.rates.find((r) => r.code === code)
    const rate = row && validateCurrency({ amount: 1, code, direction: 'toBdt', rates: [row] }) === null ? calculateCurrency({ amount: 1, code, direction: 'toBdt', rates: [row] }).rate : null
    return {
      value: code,
      label: fill(lang, copy.option, { name: currencyName(lang, copy, sheet, code), code }),
      description: rate === null ? copy.notListed : fill(lang, copy.perUnit, { code, rate: taka(lang, rate, 2) }),
      disabled: rate === null,
      keywords: [code, (copy.names as Record<string, string>)[code] ?? code],
    }
  })
}

export function currencyCallout(lang: Lang, copy: CurrencyCopy, sheet: CurrencyRateSheet): string {
  return fill(lang, copy.callout, { bank: bankName(lang, copy, sheet) })
}

export function currencyReportItems(copy: CurrencyCopy): ReportErrorItem[] {
  return [
    { value: 'result', label: copy.reportResult },
    { value: 'rate', label: copy.reportRate },
    { value: 'table', label: copy.reportTable },
  ]
}
