import type { CurrencyRateSheet } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { BreakdownTable, type BreakdownColumn } from '@hisab/ui/content/BreakdownTable'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ResultEmpty, ResultError, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { PickerField } from '../tool/PickerField.tsx'
import { fill } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { bankName, currencyCallout, currencyOptions, currencyOutcome, currencyReportItems, sheetDate, type TableRow } from './model.ts'
import { CURRENCY_PARAMS, POPULAR, type CurrencyCode } from './params.ts'

export interface CurrencyCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/finance/currency-rates.json value. */
  sheet: CurrencyRateSheet
  title: string
}

/**
 * The currency converter island (Figma F11 27:6940, P8 59:17540, D · F11 66:30468, D · P8
 * 70:21452): a currency and an amount → taka at the bank's TT buying rate, and the same amount
 * in the other currencies. ?cur=USD&amount=500
 */
export function CurrencyCalculator({ lang, text, sheet, title }: CurrencyCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(CURRENCY_PARAMS)
  const code = values.cur as CurrencyCode
  const outcome = useMemo(() => currencyOutcome({ lang, copy, sheet, code, amount: values.amount }), [lang, copy, sheet, code, values.amount])
  const options = useMemo(() => currencyOptions(lang, copy, sheet), [lang, copy, sheet])
  const fields = outcome.fields ?? {}
  const items = useMemo(() => currencyReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <PickerField
        id="currency-code"
        label={copy.currencyLabel}
        title={copy.currencyLabel}
        options={options}
        value={code}
        onChange={(v) => set('cur', v as CurrencyCode)}
        search={{ label: copy.searchLabel, placeholder: copy.searchPlaceholder, empty: (q) => fill(lang, copy.searchEmpty, { q }) }}
        footer={fill(lang, copy.sheetFooter, { bank: bankName(lang, copy, sheet), date: sheetDate(lang, sheet) })}
        closeLabel={copy.close}
      />
      <NumberField id="currency-amount" name="amount" lang={lang} label={copy.amountLabel} prefix={code} value={values.amount} min={0}
        error={fields.amount} messages={fieldMessages(lang)} onValueChange={(v) => set('amount', v)} />
      <LabeledChips
        title={copy.popular}
        label={copy.popular}
        options={POPULAR.map((c) => ({ value: c, label: c }))}
        value={code}
        onPick={(c) => set('cur', c)}
      />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const columns: BreakdownColumn<TableRow>[] = [
    { key: 'code', label: copy.colCurrency, format: 'text' },
    { key: 'bdt', label: copy.colTaka, format: 'number', decimals: 0 },
  ]
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} />}
      {result && (
        <>
          <ResultCard key={code} label={result.label} value={result.value} decimals={result.decimals} digits={lang} sub={result.sub} />
          <BreakdownTable<TableRow> title={result.tableTitle} titleAs="h2" columns={columns} rows={result.rows} digits={lang} />
        </>
      )}
      <ToolCallout data-tool-callout="">{currencyCallout(lang, copy, sheet)}</ToolCallout>
      <ToolActions lang={lang} toolId="currency-converter" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
