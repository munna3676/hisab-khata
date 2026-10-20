import type { MfsChannel } from '@hisab/core/mfs-charge'
import type { Lang } from '@hisab/i18n/locale'
import { interpolate, t } from '@hisab/i18n/messages'
import { formatNumberIn } from '@hisab/i18n/format'
import { NumberField, QuickValues, SegmentedControl } from '@hisab/ui/base'
import { ResultCard } from '@hisab/ui/nav'
import { useMemo } from 'preact/hooks'
import { useSubtitle, useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, CompareList, InputCard, ResultEmpty, ResultError, ToolCallout } from '../tool/parts.tsx'
import { ToolActions } from '../tool/ToolActions.tsx'
import { COPY } from './copy.ts'
import { cashOutOutcome, reportItems } from './model.ts'
import { CASH_OUT_PARAMS, QUICK_AMOUNTS, QUOTA_CHANNEL, type CashOutMode } from './params.ts'

export interface CashOutCalculatorProps {
  lang: Lang
  /** The compared channels, from the validated data/mfs-charges.json (cashOutChannels). */
  channels: MfsChannel[]
  /** referenceByService.cashOut: the saving is measured against it. */
  referenceId?: string
  /** Page name, for the share sheet. */
  title: string
  /** The registry description, shown in "তুললে চার্জ কত" mode. */
  subtitle: string
}

/**
 * The Cash Out calculator island (Figma 03 Calculator — Cash Out 13:404, C1-b 58:15240, C1-c
 * 58:15542, C1-d 58:15873; desktop D2 19:360 and the D · C1 frames). Every keystroke updates the
 * result, the comparison and the URL (?mode=max&amount=5000&used=45000).
 */
export function CashOutCalculator({ lang, channels, referenceId, title, subtitle }: CashOutCalculatorProps) {
  const { values, set } = useUrlState(CASH_OUT_PARAMS)
  const mode = values.mode as CashOutMode
  const say = (text: Record<Lang, string>, vars?: Record<string, string>) => interpolate(lang, text[lang], vars)
  useSubtitle(mode === 'max' ? say(COPY.subtitleMax) : subtitle)

  const outcome = useMemo(
    () => cashOutOutcome({ lang, mode, amount: values.amount, used: values.used, channels, referenceId }),
    [lang, mode, values.amount, values.used, channels, referenceId],
  )
  const fields = outcome.kind === 'empty' ? {} : (outcome.fields ?? {})
  const items = useMemo(() => reportItems(lang, channels), [lang, channels])
  const quota = channels.find((c) => c.id === QUOTA_CHANNEL)?.quota?.monthlyAmount ?? 0
  const amountLabel = say(mode === 'max' ? COPY.balanceLabel : COPY.amountLabel)
  const amountMessages = {
    invalid: t(lang, 'validation.numbersOnly'),
    min: (min: string) => t(lang, 'validation.min', { min }),
    max: (max: string) => t(lang, 'validation.max', { max }),
  }

  const inputs = (
    <InputCard>
      <div class="flex flex-col gap-2">
        <p class="type-label text-ink" aria-hidden="true">
          {say(COPY.modeLabel)}
        </p>
        <SegmentedControl
          label={say(COPY.modeLabel)}
          name="mode"
          value={mode}
          options={[
            { value: 'charge', label: say(COPY.modeCharge) },
            { value: 'max', label: say(COPY.modeMax) },
          ]}
          onChange={(next) => set('mode', next)}
        />
      </div>
      <div class="flex flex-col gap-3">
        <NumberField
          id="cash-out-amount"
          name="amount"
          lang={lang}
          label={amountLabel}
          prefix="৳"
          value={values.amount}
          min={0}
          error={fields.amount}
          messages={amountMessages}
          onValueChange={(value) => set('amount', value)}
        />
        <QuickValues
          values={QUICK_AMOUNTS}
          value={values.amount}
          digits={lang}
          label={t(lang, 'field.quickValues')}
          onPick={(value) => set('amount', value)}
        />
      </div>
      <NumberField
        id="cash-out-used"
        name="used"
        lang={lang}
        label={say(COPY.usedLabel)}
        prefix="৳"
        value={values.used}
        min={0}
        helper={say(COPY.usedHelper, { quota: formatNumberIn(lang, quota) })}
        error={fields.used}
        messages={amountMessages}
        onValueChange={(value) => set('used', value)}
      />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} onFix={(_field, value) => set('amount', value)} />}
      {result?.topCallout && <ToolCallout data-quota-callout="">{result.topCallout}</ToolCallout>}
      {result && (
        <ResultCard
          key={result.mode}
          label={result.label}
          value={result.value}
          decimals={result.decimals}
          digits={lang}
          sub={result.sub.join(' · ')}
        />
      )}
      {result && (
        <CompareList
          title={result.compareTitle}
          column={result.compareColumn}
          rows={result.rows.map((row) => ({
            key: row.id,
            provider: row.provider,
            brand: row.brand,
            method: row.method,
            charge: row.value,
            total: row.sub,
            state: row.state,
            badge: row.badge,
          }))}
        />
      )}
      <ToolCallout data-tool-callout="">{say(mode === 'max' ? COPY.calloutMax : COPY.calloutCharge)}</ToolCallout>
      <ToolActions lang={lang} toolId="cash-out" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
