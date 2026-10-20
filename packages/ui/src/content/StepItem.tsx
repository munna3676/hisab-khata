import { toBanglaDigits } from '@hisab/core/lib/digits'
import type { ComponentChildren, HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'

export interface StepItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'class' | 'className' | 'title' | 'ref'> {
  /** Step number; a number is shown in Bangla digits ("১"), a string as given. */
  number: number | string
  /** e.g. "অনলাইনে আবেদন করো". */
  title: ComponentChildren
  /** One or two sentences under the title. */
  description?: ComponentChildren
  /** Heading level of the title (default h3, under the page's "ধাপে ধাপে" h2). */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  /** 'li' inside a StepList (default) or 'div' on its own. */
  as?: 'li' | 'div'
  class?: string
}

/**
 * Step Item (Figma 9:249): a 32px accent circle with the step number, a title and a
 * short description, with 16px below it. In a StepList the steps are 8px apart.
 */
export function StepItem({
  number,
  title,
  description,
  titleAs: Title = 'h3',
  as = 'li',
  class: className,
  ...rest
}: StepItemProps) {
  // 'li' and 'div' take the same attributes here; typed as 'li' for the spread.
  const Tag = as as 'li'
  const shown = typeof number === 'number' ? toBanglaDigits(number) : number
  return (
    <Tag {...rest} class={cx('flex min-w-0 items-start gap-3.5 pb-4', className)} data-step>
      <span class="grid size-8 shrink-0 place-items-center rounded-full bg-accent type-label text-on-accent">{shown}</span>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <Title class="font-body text-[1rem]/5 font-semibold text-ink">{title}</Title>
        {description && <div class="type-body-small text-soft">{description}</div>}
      </div>
    </Tag>
  )
}

export interface StepListItem {
  title: ComponentChildren
  description?: ComponentChildren
}

export interface StepListProps extends Omit<HTMLAttributes<HTMLOListElement>, 'class' | 'className'> {
  /** Steps in order; numbers are added (১, ২, ৩…). Or pass <StepItem> children instead. */
  steps?: readonly StepListItem[]
  /** Number the first step with this (default 1). */
  start?: number
  titleAs?: StepItemProps['titleAs']
  class?: string
  children?: ComponentChildren
}

/** Ordered list of Step Items, as on a guide's "ধাপে ধাপে" section (Guide 17:1577: 8px between steps, on top of each step's 16px). */
export function StepList({ steps, start = 1, titleAs, class: className, children, ...rest }: StepListProps) {
  return (
    // role="list" keeps list semantics in Safari, which drops them when list-style is none.
    <ol {...rest} role="list" start={start} class={cx('m-0 grid list-none gap-2 p-0', className)}>
      {steps
        ? steps.map((step, i) => (
            <StepItem key={i} number={start + i} title={step.title} description={step.description} titleAs={titleAs} />
          ))
        : children}
    </ol>
  )
}
