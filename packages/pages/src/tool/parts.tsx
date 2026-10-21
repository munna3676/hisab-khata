// Building blocks of the calculator page template (Figma 03 Calculator 13:404, D2 19:360 and the
// C1 frames). They are plain Preact and take everything as props, so the website renders them to
// HTML and the app shell mounts the same components.
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/t'
import { AdSlot } from '@hisab/ui/base/AdSlot'
import { Button } from '@hisab/ui/base/Button'
import { Callout } from '@hisab/ui/base/Callout'
import { Chip } from '@hisab/ui/base/Chip'
import { KVList, KVRow } from '@hisab/ui/base/KVRow'
import { SegmentedControl } from '@hisab/ui/base/SegmentedControl'
import { CompareRow, type CompareRowProps } from '@hisab/ui/base/CompareRow'
import { Calculator, Guide, Send, Wallet } from '@hisab/ui/icons/base'
import { cx } from '@hisab/ui/lib/cx'
import { ToolCard } from '@hisab/ui/nav/ToolCard'
import type { ComponentChildren } from 'preact'
import { ToolHeader } from './ToolHeader.tsx'
import type { RelatedTool, ToolPageContent } from './types.ts'
import type { ToolError } from './validation.ts'

/**
 * The calculator block: the input card and the results. Phones and tablets stack them (capped at
 * 640px and centred on tablets); once the block's own container is 840px wide (the desktop
 * column) the 380px input card sits left of the results, as in D2.
 */
export function CalculatorFrame({ inputs, results, class: className }: { inputs: ComponentChildren; results: ComponentChildren; class?: string }) {
  return (
    <div class={cx('@container', className)} data-calculator>
      <div class="mx-auto grid max-w-160 gap-6 @[840px]:max-w-none @[840px]:grid-cols-[380px_minmax(0,1fr)] @[840px]:items-start">
        <div class="min-w-0" data-calculator-inputs>
          {inputs}
        </div>
        <div class="flex min-w-0 flex-col gap-4" data-calculator-results aria-live="off">
          {results}
        </div>
      </div>
    </div>
  )
}

/** Figma "input card": a sheet card with 16px corners and 17px padding around the fields. */
export function InputCard({ children, class: className }: { children: ComponentChildren; class?: string }) {
  return <div class={cx('flex flex-col gap-6 rounded-card border border-line bg-sheet p-4 lg:p-4.5', className)}>{children}</div>
}

/** Nothing typed yet (or not a number): a quiet placeholder where the result will appear. */
export function ResultEmpty({ lang }: { lang: Lang }) {
  return (
    <div class="rounded-card border border-dashed border-rule bg-subtle px-5 py-8 text-center type-body text-soft" data-result-empty>
      {t(lang, 'result.emptyHint')}
    </div>
  )
}

/** C1-d "error state": what is wrong, how to fix it, and a one-tap fix. */
export function ResultError({ error, onFix }: { error: ToolError; onFix?: (field: string, value: number) => void }) {
  return (
    <div class="flex flex-col items-center gap-2 rounded-card bg-subtle px-4 py-6 text-center" role="alert" data-result-error>
      <h2 class="type-h3 text-ink">{error.title}</h2>
      <p class="type-body-small text-soft">{error.body}</p>
      {error.fix && (
        <Button variant="secondary" class="mt-2" onClick={() => onFix?.(error.fix!.field, error.fix!.value)} data-result-fix>
          {error.fix.label}
        </Button>
      )}
    </div>
  )
}

/** "সব উপায়, সস্তা থেকে দামি" heading with its column label, then Compare Rows. */
export function CompareList({
  title,
  column,
  rows,
}: {
  title: string
  column: string
  rows: (CompareRowProps & { key: string })[]
}) {
  return (
    <section aria-labelledby="compare-title" class="flex flex-col gap-2.5" data-compare>
      <div class="flex items-baseline justify-between gap-3">
        <h2 id="compare-title" class="type-h3 text-ink">
          {title}
        </h2>
        <span class="shrink-0 type-label text-soft" aria-hidden="true">
          {column}
        </span>
      </div>
      <ol class="flex flex-col gap-2" role="list">
        {rows.map(({ key, ...row }) => (
          <li key={key} data-compare-row={key}>
            <CompareRow {...row} />
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ToolCallout({ children, tone = 'warn', ...rest }: { children: ComponentChildren; tone?: 'info' | 'warn'; [key: `data-${string}`]: string }) {
  return (
    <Callout tone={tone} {...rest}>
      <p>{children}</p>
    </Callout>
  )
}

/** One line of a SummaryCard: label left, amount right; `total` draws the ink rule above it. */
export interface SummaryRow {
  key: string
  label: string
  value: string
  total?: boolean
}

/** Figma "card" with a title and KV Rows ("মোট হিসাব", "হিসাব", "কিভাবে হিসাব হলো"). */
export function SummaryCard({ title, rows, ...rest }: { title: string; rows: readonly SummaryRow[]; [key: `data-${string}`]: string }) {
  return (
    <section class="rounded-card border border-line bg-sheet px-4 pt-3.5 pb-2" aria-label={title} data-summary {...rest}>
      <h2 class="type-h3 text-ink">{title}</h2>
      <KVList class="mt-1.5">
        {rows.map((row) => (
          <KVRow key={row.key} label={row.label} value={row.value} total={row.total} />
        ))}
      </KVList>
    </section>
  )
}

/** Chips that pick one of a few values ("৩ বছর", "৫০%", "বিয়ে"): Figma Chip, selected = the current value. */
export function ChoiceChips<V extends string | number>({
  label,
  options,
  value,
  onPick,
  class: className,
}: {
  label: string
  options: readonly { value: V; label: string }[]
  value: V | null
  onPick: (value: V) => void
  class?: string
}) {
  return (
    <div role="group" aria-label={label} class={cx('flex flex-wrap gap-x-2', className)} data-choice-chips>
      {options.map((option) => (
        <Chip key={String(option.value)} numeric={false} selected={value === option.value} onClick={() => onPick(option.value)}>
          {option.label}
        </Chip>
      ))}
    </div>
  )
}

/** ChoiceChips under a visible label (Figma "VAT হার", "মেয়াদ", "অপারেটর", "করদাতার ধরন"). */
export function LabeledChips<V extends string | number>({ title, ...chips }: Parameters<typeof ChoiceChips<V>>[0] & { title: string }) {
  return (
    <div class="flex flex-col gap-2">
      <p class="type-label text-ink" aria-hidden="true">
        {title}
      </p>
      <ChoiceChips {...chips} />
    </div>
  )
}

/** A labelled Segmented Control (Figma: the label above a two-option switch). */
export function ModeSwitch<V extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string
  name: string
  value: V
  options: readonly { value: V; label: string }[]
  onChange: (value: V) => void
}) {
  return (
    <div class="flex flex-col gap-2">
      <p class="type-label text-ink" aria-hidden="true">
        {label}
      </p>
      <SegmentedControl label={label} name={name} value={value} options={options} onChange={onChange} />
    </div>
  )
}

/** Two fields side by side (Figma: rate and term on one row). */
export function FieldPair({ children }: { children: ComponentChildren }) {
  return <div class="grid grid-cols-2 gap-3 [&>*]:min-w-0">{children}</div>
}

/** The number field messages in the page language (validation.* keys, in TOOL_MESSAGE_KEYS). */
export function fieldMessages(lang: Lang) {
  return {
    invalid: t(lang, 'validation.numbersOnly'),
    min: (min: string) => t(lang, 'validation.min', { min }),
    max: (max: string) => t(lang, 'validation.max', { max }),
  }
}

/** Numbered tips or steps (Figma "article": "চার্জ কমানোর ৪টা উপায়"). */
export function ToolSteps({ lang, steps }: { lang: Lang; steps: NonNullable<ToolPageContent['steps']> }) {
  return (
    <section aria-labelledby="tool-steps-title" data-tool-steps>
      <h2 id="tool-steps-title" class="type-h2 text-ink">
        {steps.title}
      </h2>
      <ol class="mt-3 flex flex-col gap-3" role="list">
        {steps.items.map((step, i) => (
          <li key={i} class="flex flex-col gap-0.5">
            <h3 class="font-body text-[0.9375rem]/5 font-semibold text-ink">
              {t(lang, 'content.stepNumber', { n: i + 1 })} {step.title}
            </h3>
            {step.body && <p class="type-body text-soft">{step.body}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}

const RELATED_ICON = (tool: RelatedTool) =>
  tool.id.includes('send') ? Send : tool.id.startsWith('guide') ? Guide : tool.id.startsWith('mfs') ? Wallet : Calculator

/** "আরও টুল": related pages from the registry as Tool Cards. */
export function RelatedTools({ lang, tools }: { lang: Lang; tools: readonly RelatedTool[] }) {
  if (tools.length === 0) return null
  return (
    <section aria-labelledby="related-title" class="flex flex-col gap-2.5" data-related data-print-hide>
      <h2 id="related-title" class="type-h3 text-ink">
        {t(lang, 'action.moreTools')}
      </h2>
      <ul class="flex flex-col gap-2.5">
        {tools.map((tool) => {
          const Icon = RELATED_ICON(tool)
          return (
            <li key={tool.id} class="flex">
              <ToolCard class="w-full" href={tool.href} tag={tool.tag} title={tool.title} description={tool.description} icon={<Icon size={22} />} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * The page around the calculator: head, the calculator island (children), then the article
 * (steps, FAQ) beside a 300px rail (ad, related tools) on desktop; on phones the ad, the article
 * and the related tools follow the calculator in that order (Figma 13:404). The FAQ is passed in
 * (`faq`) because it needs hydration on the website; the app passes a live FaqList.
 */
export function ToolPage({
  content,
  children,
  faq,
}: {
  content: ToolPageContent
  children: ComponentChildren
  faq?: ComponentChildren
}) {
  const { lang } = content
  return (
    <div class="mx-auto w-full max-w-[calc(var(--container-content)+3rem)] px-6 pt-6 pb-10 lg:pt-10 lg:pb-14" data-tool-page={content.id}>
      <ToolHeader content={content} />
      <div class="mt-6 lg:mt-8">{children}</div>
      <div class="mt-6 grid gap-6 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-6">
        <div class="flex justify-center lg:col-start-2 lg:row-start-1" data-print-hide>
          <AdSlot size="mobile-banner" class="lg:hidden" label={t(lang, 'content.advertisement')} />
          <AdSlot size="mpu" class="hidden lg:flex" label={t(lang, 'content.advertisement')} />
        </div>
        <div class="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {content.steps && <ToolSteps lang={lang} steps={content.steps} />}
          {content.faq && (
            <section aria-labelledby="faq-title" data-tool-faq>
              <h2 id="faq-title" class="type-h2 text-ink">
                {content.faq.title}
              </h2>
              <div class="mt-1">{faq}</div>
            </section>
          )}
        </div>
        <div class="min-w-0 lg:col-start-2 lg:row-start-2">
          <RelatedTools lang={lang} tools={content.related} />
        </div>
      </div>
    </div>
  )
}
