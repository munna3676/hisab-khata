import type { ComponentChildren, JSX } from 'preact'
import { cx } from '../lib/cx'
import { Badge } from './Badge'

export type CompareRowState = 'default' | 'best' | 'warning'
/** MFS brand colours from the tokens (Figma: "change the brand dot fill per provider"). */
export type CompareBrand = 'bkash' | 'nagad' | 'rocket'

export interface CompareRowProps {
  /** Provider name, e.g. "বিকাশ". */
  provider: ComponentChildren
  /** How and at what rate, e.g. "যেকোনো এজেন্ট · ১৮.৫০/হাজার". */
  method?: ComponentChildren
  /** The charge, e.g. "৳৯২.৫০" (IBM Plex Mono). */
  charge: ComponentChildren
  /** Second line under the charge, e.g. "মোট ৳৫,০৯২.৫০". */
  total?: ComponentChildren
  /** Best = cheapest (green row, সাশ্রয়ী badge); Warning = over limit or below ATM minimum (warn badge). */
  state?: CompareRowState
  /** Badge text; defaults to সাশ্রয়ী (best) or লিমিট পার (warning). */
  badge?: ComponentChildren
  brand?: CompareBrand
  /** Any colour class for the dot when the provider has no brand token, e.g. "bg-blue". */
  dotClass?: string
  /** Makes the whole row a link (lift on hover, press scale). */
  href?: string
  /** Makes the whole row a button. */
  onClick?: (event: JSX.TargetedMouseEvent<HTMLElement>) => void
  class?: string
}

const DOT: Record<CompareBrand, string> = {
  bkash: 'bg-bkash',
  nagad: 'bg-nagad',
  rocket: 'bg-rocket',
}

/** Compare Row (Figma 5:138): one MFS method in the cash-out comparison. */
export function CompareRow({
  provider,
  method,
  charge,
  total,
  state = 'default',
  badge,
  brand,
  dotClass,
  href,
  onClick,
  class: className,
}: CompareRowProps) {
  const badgeText = badge ?? (state === 'best' ? 'সাশ্রয়ী' : state === 'warning' ? 'লিমিট পার' : null)
  const interactive = href !== undefined || onClick !== undefined
  const classes = cx(
    'flex w-full min-w-0 items-center gap-3 rounded-card border px-3.5 py-3 text-start',
    state === 'best' ? 'border-good bg-good-bg' : 'border-line bg-sheet',
    interactive && 'pressable lift no-underline',
    className,
  )
  const body = (
    <>
      <span aria-hidden="true" class={cx('size-2.5 shrink-0 rounded-full', dotClass ?? (brand ? DOT[brand] : 'bg-soft'))} />
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span class="type-label text-ink">{provider}</span>
          {badgeText != null && state !== 'default' && (
            <Badge tone={state === 'best' ? 'good' : 'warn'} appear>
              {badgeText}
            </Badge>
          )}
        </span>
        {method != null && <span class="font-body text-[0.8125rem]/[1.375rem] text-soft">{method}</span>}
      </span>
      <span class="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap">
        <span class="hk-num text-number-m font-semibold text-ink">{charge}</span>
        {total != null && <span class="font-body text-[0.75rem]/[1.125rem] text-soft">{total}</span>}
      </span>
    </>
  )

  if (href !== undefined) {
    return (
      <a href={href} class={classes} onClick={onClick}>
        {body}
      </a>
    )
  }
  if (onClick !== undefined) {
    return (
      <button type="button" class={classes} onClick={onClick}>
        {body}
      </button>
    )
  }
  return <div class={classes}>{body}</div>
}
