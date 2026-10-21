import type { DataPack } from '@hisab/core/data-pack'
import type { Operator } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { BreakdownTable, type BreakdownColumn } from '@hisab/ui/content/BreakdownTable'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ResultEmpty, ResultError, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { fill, num } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { dataPackOutcome, dataPackReportItems, operatorName, type PackRow } from './model.ts'
import { DATA_PACK_PARAMS, OPERATOR_CHIPS, VALIDITY_CHIPS, type OperatorChoice } from './params.ts'

export interface DataPackCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/data-packs.json operators and packs (allPacks). */
  operators: Operator[]
  packs: DataPack[]
  title: string
}

/**
 * The mobile data pack island (Figma C8 29:7863, D · C8 68:6553): budget, validity and operator →
 * the pack with the most data, and every pack that fits. ?budget=400&days=30&op=gp
 */
export function DataPackCalculator({ lang, text, operators, packs, title }: DataPackCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(DATA_PACK_PARAMS)
  const op = values.op as OperatorChoice
  const outcome = useMemo(
    () => dataPackOutcome({ lang, copy, operators, packs, budget: values.budget, days: values.days, op }),
    [lang, copy, operators, packs, values.budget, values.days, op],
  )
  const fields = outcome.fields ?? {}
  const items = useMemo(() => dataPackReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <NumberField id="pack-budget" name="budget" lang={lang} label={copy.budgetLabel} prefix="৳" value={values.budget} min={0}
        error={fields.budget} messages={fieldMessages(lang)} onValueChange={(v) => set('budget', v)} />
      <LabeledChips
        title={copy.validityLabel}
        label={copy.validityLabel}
        options={VALIDITY_CHIPS.map((d) => ({ value: d, label: fill(lang, copy.days, { n: num(lang, d) }) }))}
        value={values.days}
        onPick={(d) => set('days', d)}
      />
      <LabeledChips
        title={copy.operatorLabel}
        label={copy.operatorLabel}
        options={OPERATOR_CHIPS.map((id) => ({ value: id, label: id === 'all' ? copy.all : operatorName(lang, operators, id) }))}
        value={op}
        onPick={(id) => set('op', id)}
      />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const columns: BreakdownColumn<PackRow>[] = [
    { key: 'operator', label: copy.colOperator, format: 'text' },
    { key: 'data', label: copy.colData, format: 'text', align: 'end' },
    { key: 'price', label: copy.colPrice, format: 'text', align: 'end' },
  ]
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} onFix={(_field, value) => set('budget', value)} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} format="number" suffix=" GB" decimals={result.decimals} digits={lang} sub={result.sub} />
          <BreakdownTable<PackRow> title={result.tableTitle} titleAs="h2" columns={columns} rows={result.rows} digits={lang} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="data-pack" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
