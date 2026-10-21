import type { SanchayapatraSchemeData } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { BreakdownTable, type BreakdownColumn } from '@hisab/ui/content/BreakdownTable'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, InputCard, ResultEmpty, ResultError, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { PickerField } from '../tool/PickerField.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { pickerFooter, rateRows, sanchayapatraOutcome, sanchayapatraReportItems, schemeOptions, type RateRow } from './model.ts'
import { SANCHAYAPATRA_PARAMS, SCHEME_CHIPS, type SchemeId } from './params.ts'

export interface SanchayapatraCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/finance/sanchayapatra.json. */
  schemes: SanchayapatraSchemeData[]
  title: string
}

/**
 * The Sanchayapatra island (Figma C7 29:7661, P7 59:17386, D · C7 68:6269, D · P7 70:21156): the
 * scheme (picker sheet or chips) and the amount → profit per payment, tax and take-home, with
 * the current rates. ?scheme=paribar&amount=500000
 */
export function SanchayapatraCalculator({ lang, text, schemes, title }: SanchayapatraCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(SANCHAYAPATRA_PARAMS)
  const scheme = values.scheme as SchemeId
  const outcome = useMemo(
    () => sanchayapatraOutcome({ lang, copy, schemes, scheme, amount: values.amount }),
    [lang, copy, schemes, scheme, values.amount],
  )
  const rows = useMemo(() => rateRows(lang, copy, schemes, scheme), [lang, copy, schemes, scheme])
  const options = useMemo(() => schemeOptions(lang, copy, schemes), [lang, copy, schemes])
  const fields = outcome.fields ?? {}
  const items = useMemo(() => sanchayapatraReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <div class="flex flex-col gap-3">
        <PickerField
          id="sp-scheme"
          label={copy.schemeLabel}
          title={copy.pickerTitle}
          options={options}
          value={scheme}
          onChange={(v) => set('scheme', v as SchemeId)}
          footer={pickerFooter(lang, copy, schemes)}
          closeLabel={copy.close}
        />
        <ChoiceChips
          label={copy.chipsLabel}
          options={SCHEME_CHIPS.map((id) => ({ value: id, label: copy.short[id] }))}
          value={scheme}
          onPick={(id) => set('scheme', id)}
        />
      </div>
      <NumberField id="sp-amount" name="amount" lang={lang} label={copy.amountLabel} prefix="৳" value={values.amount} min={0}
        error={fields.amount} messages={fieldMessages(lang)} onValueChange={(v) => set('amount', v)} />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const columns: BreakdownColumn<RateRow>[] = [
    { key: 'step', label: copy.colStep, format: 'text' },
    { key: 'rate', label: copy.colRate, format: 'text', align: 'end' },
  ]
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} onFix={(_field, value) => set('amount', value)} />}
      {result && <ResultCard key={scheme} label={result.label} value={result.value} decimals={result.decimals} digits={lang} sub={result.sub} />}
      <BreakdownTable<RateRow> title={copy.tableTitle} titleAs="h2" columns={columns} rows={rows} digits={lang} />
      <ToolCallout data-tool-callout="">{copy.callout}</ToolCallout>
      <ToolActions lang={lang} toolId="sanchayapatra" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
