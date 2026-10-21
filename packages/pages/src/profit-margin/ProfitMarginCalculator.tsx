import type { Lang } from '@hisab/i18n/locale'
import { KVList, KVRow } from '@hisab/ui/base/KVRow'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, FieldPair, InputCard, ResultEmpty, SummaryCard, fieldMessages } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { profitOutcome, profitReportItems, targetPrice } from './model.ts'
import { PROFIT_PARAMS } from './params.ts'

export interface ProfitMarginCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  title: string
}

/**
 * The profit margin island (Figma C3 28:7145, D · C3 68:5225): profit, margin and markup from the
 * cost and selling price, and the price for a target margin. ?cost=800&price=1000&target=30
 */
export function ProfitMarginCalculator({ lang, text, title }: ProfitMarginCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(PROFIT_PARAMS)
  const outcome = useMemo(() => profitOutcome({ lang, copy, cost: values.cost, price: values.price }), [lang, copy, values.cost, values.price])
  const target = useMemo(() => targetPrice(lang, copy, values.cost, values.target), [lang, copy, values.cost, values.target])
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => profitReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <FieldPair>
        <NumberField id="profit-cost" name="cost" lang={lang} label={copy.costLabel} prefix="৳" value={values.cost} min={0}
          error={fields.cost} messages={messages} onValueChange={(v) => set('cost', v)} />
        <NumberField id="profit-price" name="price" lang={lang} label={copy.priceLabel} prefix="৳" value={values.price}
          error={fields.price} messages={messages} onValueChange={(v) => set('price', v)} />
      </FieldPair>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard key={result.label} label={result.label} value={result.value} decimals={result.decimals} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
        </>
      )}
      <section class="flex flex-col gap-3 rounded-card border border-line bg-sheet px-4 pt-3.5 pb-2" aria-labelledby="target-title" data-target>
        <h2 id="target-title" class="type-h3 text-ink">
          {copy.targetTitle}
        </h2>
        <NumberField id="profit-target" name="target" lang={lang} label={copy.targetLabel} prefix="%" value={values.target} min={0}
          formatOnBlur={false} error={target.error} messages={messages} onValueChange={(v) => set('target', v)} />
        <KVList aria-live="polite">
          <KVRow label={copy.sellAt} value={target.value} total />
        </KVList>
      </section>
      <ToolActions lang={lang} toolId="profit-margin" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
