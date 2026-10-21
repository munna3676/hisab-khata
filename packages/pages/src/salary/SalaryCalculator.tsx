import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, FieldPair, InputCard, ResultEmpty, ResultError, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { salaryOutcome, salaryReportItems, type SalaryRest } from './model.ts'
import { SALARY_PARAMS } from './params.ts'

export interface SalaryCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** Medical % and conveyance from data/finance/salary-presets.json (salaryRest). */
  preset: SalaryRest
  title: string
}

/**
 * The salary breakdown island (Figma C5 28:7512, D · C5 68:5723): gross salary, basic % and house
 * rent % → basic, house rent, medical and conveyance. ?gross=50000&basic=60&rent=50
 */
export function SalaryCalculator({ lang, text, preset, title }: SalaryCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(SALARY_PARAMS)
  const outcome = useMemo(
    () => salaryOutcome({ lang, copy, gross: values.gross, basic: values.basic, rent: values.rent, preset }),
    [lang, copy, values.gross, values.basic, values.rent, preset],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => salaryReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <NumberField id="salary-gross" name="gross" lang={lang} label={copy.grossLabel} prefix="৳" value={values.gross} min={1}
        error={fields.gross} messages={messages} onValueChange={(v) => set('gross', v)} />
      <div class="flex flex-col gap-3">
        <FieldPair>
          <NumberField id="salary-basic" name="basic" lang={lang} label={copy.basicLabel} prefix="%" value={values.basic} min={1} max={100}
            formatOnBlur={false} error={fields.basic} messages={messages} onValueChange={(v) => set('basic', v)} />
          <NumberField id="salary-rent" name="rent" lang={lang} label={copy.rentLabel} prefix="%" value={values.rent} min={0} max={100}
            formatOnBlur={false} error={fields.rent} messages={messages} onValueChange={(v) => set('rent', v)} />
        </FieldPair>
        <p class="type-body-small text-soft">{copy.structureHelp}</p>
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} onFix={(_field, value) => set('rent', value)} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} decimals={result.decimals} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="salary" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
