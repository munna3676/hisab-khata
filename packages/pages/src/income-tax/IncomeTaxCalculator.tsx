import type { IncomeTaxRules } from '@hisab/core/income-tax'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { BreakdownTable, type BreakdownColumn } from '@hisab/ui/content/BreakdownTable'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ModeSwitch, ResultEmpty, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { incomeTaxCallout, incomeTaxOutcome, incomeTaxReportItems, type SlabRow } from './model.ts'
import { CATEGORY_CHIPS, INCOME_TAX_PARAMS, type IncomeTaxPageMode, type TaxpayerCategory } from './params.ts'

export interface IncomeTaxCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/income-tax-<year>.json. */
  rules: IncomeTaxRules
  title: string
}

/**
 * The income tax island (Figma C6 28:7708, C6-b 64:21554, D · C6 68:6010, D · C6-b 69:39942):
 * salaried or freelancer, yearly income, taxpayer type and investment → the estimated tax and
 * the slab table. ?mode=freelancer&income=900000&cat=general&inv=100000
 */
export function IncomeTaxCalculator({ lang, text, rules, title }: IncomeTaxCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(INCOME_TAX_PARAMS)
  const mode = values.mode as IncomeTaxPageMode
  const category = values.cat as TaxpayerCategory
  const outcome = useMemo(
    () => incomeTaxOutcome({ lang, copy, mode, income: values.income, category, investment: values.inv, rules }),
    [lang, copy, mode, values.income, category, values.inv, rules],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => incomeTaxReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <ModeSwitch
        label={copy.modeLabel}
        name="mode"
        value={mode}
        options={[
          { value: 'salaried', label: copy.salaried },
          { value: 'freelancer', label: copy.freelancer },
        ]}
        onChange={(next) => set('mode', next)}
      />
      <NumberField id="tax-income" name="income" lang={lang} label={mode === 'freelancer' ? copy.freelanceIncomeLabel : copy.incomeLabel}
        prefix="৳" value={values.income} min={0} error={fields.income} messages={messages} onValueChange={(v) => set('income', v)} />
      <LabeledChips
        title={copy.categoryLabel}
        label={copy.categoryLabel}
        options={CATEGORY_CHIPS.map((c) => ({ value: c, label: copy.categories[c] }))}
        value={category}
        onPick={(c) => set('cat', c)}
      />
      <NumberField id="tax-inv" name="inv" lang={lang} label={copy.investmentLabel} prefix="৳" value={values.inv} min={0}
        error={fields.inv} messages={messages} onValueChange={(v) => set('inv', v)} />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const columns: BreakdownColumn<SlabRow>[] = [
    { key: 'step', label: copy.colStep, format: 'text' },
    { key: 'rate', label: copy.colRate, format: 'text', align: 'end' },
    { key: 'tax', label: copy.colTax, format: 'number', decimals: 0 },
  ]
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard key={mode} label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <BreakdownTable<SlabRow> title={result.tableTitle} titleAs="h2" columns={columns} rows={result.rows} digits={lang} />
        </>
      )}
      <ToolCallout data-tool-callout="">{incomeTaxCallout(lang, copy, mode, rules)}</ToolCallout>
      <ToolActions lang={lang} toolId="income-tax" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
