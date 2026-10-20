import type { ComponentChildren } from 'preact'
import { Search } from '../icons/common'
import { cx } from '../lib/cx'

type HeadingLevel = 2 | 3 | 4

export interface EmptyStateProps {
  /** 26px icon in the 56px subtle circle (default: search). */
  icon?: ComponentChildren
  /** Display/H3, e.g. "\"প্রাইজবন্ড ড্র\" নিয়ে কিছু পাইনি". */
  title: ComponentChildren
  description?: ComponentChildren
  /** Usually one secondary Button ("নতুন টুলের অনুরোধ"). */
  action?: ComponentChildren
  headingLevel?: HeadingLevel
  /** false = no card border/background (inside another card or sheet). */
  card?: boolean
  class?: string
}

/**
 * Empty State (Figma 14 States 18:1921, "খোঁজে কিছু পাওয়া যায়নি"): a centred card with a
 * 56px subtle icon circle, Display/H3 title, Body/Small soft text and an optional action.
 */
export function EmptyState({ icon, title, description, action, headingLevel = 2, card = true, class: className }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h2'
  return (
    <div
      class={cx(
        'flex min-w-0 flex-col items-center gap-2.5 px-5 py-6 text-center',
        card && 'rounded-[12px] border border-line bg-sheet',
        className,
      )}
      data-empty-state
    >
      <span aria-hidden="true" class="grid size-14 shrink-0 place-items-center rounded-full bg-subtle text-ink">
        {icon ?? <Search size={26} />}
      </span>
      <Heading class="type-h3 text-ink">{title}</Heading>
      {description != null && <p class="max-w-75 type-body-small text-soft">{description}</p>}
      {action}
    </div>
  )
}
