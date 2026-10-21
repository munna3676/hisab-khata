import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, FieldPair, InputCard, ResultEmpty, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { savingsGoalOutcome, savingsGoalReportItems } from './model.ts'
import { SAVINGS_GOAL_PARAMS, type SavingsGoalPurpose } from './params.ts'

export interface SavingsGoalCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** The "কিসের জন্য" chips, from data/finance/savings-goal-presets.json. */
  purposes: Exclude<SavingsGoalPurpose, 'none'>[]
  title: string
}

/**
 * "সঞ্চয় লক্ষ্য" (Figma C4 28:7332, D · C4 68:5478): goal amount, months and expected return →
 * what to save each month. The purpose chip only labels the plan (share text); tapping the
 * chosen one again clears it. ?target=500000&months=24&rate=6&goal=wedding
 */
export function SavingsGoalCalculator({ lang, text, purposes, title }: SavingsGoalCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(SAVINGS_GOAL_PARAMS)
  const goal = values.goal as SavingsGoalPurpose
  const outcome = useMemo(
    () => savingsGoalOutcome({ lang, copy, target: values.target, months: values.months, rate: values.rate, goal }),
    [lang, copy, values.target, values.months, values.rate, goal],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => savingsGoalReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <NumberField id="goal-target" name="target" lang={lang} label={copy.targetLabel} prefix="৳" value={values.target} min={1}
        error={fields.target} messages={messages} onValueChange={(v) => set('target', v)} />
      <FieldPair>
        <NumberField id="goal-months" name="months" lang={lang} label={copy.monthsLabel} prefix={copy.monthUnit} value={values.months} min={1} max={600}
          error={fields.months} messages={messages} onValueChange={(v) => set('months', v)} />
        <NumberField id="goal-rate" name="rate" lang={lang} label={copy.rateLabel} prefix="%" value={values.rate} min={0} max={100}
          formatOnBlur={false} error={fields.rate} messages={messages} onValueChange={(v) => set('rate', v)} />
      </FieldPair>
      <div class="flex flex-col gap-1">
        <p class="type-label text-ink" aria-hidden="true">
          {copy.purposeLabel}
        </p>
        <ChoiceChips
          label={copy.purposeLabel}
          options={purposes.map((id) => ({ value: id, label: copy.purposes[id] }))}
          value={goal === 'none' ? null : goal}
          onPick={(id) => set('goal', id === goal ? 'none' : id)}
        />
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="savings-goal" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
