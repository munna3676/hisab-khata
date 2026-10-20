import { formatNumber, formatTaka, type Digits } from '@hisab/core/lib/format'
import type { ComponentChildren, HTMLAttributes } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { cx } from '../lib/cx'
import { countUp as runCountUp } from '../lib/motion'

export interface ResultCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'value' | 'label'> {
  /** What the number is, e.g. "সবচেয়ে কম চার্জ: নগদ অ্যাপ". */
  label: ComponentChildren
  /** The one answer the user came for. */
  value: number
  /** taka: "৳৬৪.৯৫"; number: "৬৪.৯৫". */
  format?: 'taka' | 'number'
  /** Bangla (default) or English digits. */
  digits?: Digits
  /** Fixed decimals; default 0 for whole numbers, else 2 (as @hisab/core formats). */
  decimals?: number
  /** Unit after the number, set smaller in the body face, e.g. "/হাজার" or " বর্গফুট". */
  suffix?: string
  /** The line(s) under the number, e.g. "হাতে পাবে ৳৫,০০০ · ওয়ালেটে রাখতে হবে ৳৫,০৬৪.৯৫". */
  sub?: ComponentChildren
  /**
   * Count the number up with motion's animate() (450 ms, 300 in lite, none with
   * reduced motion): from 0 on mount, then from the shown value on every change.
   */
  countUp?: boolean
  /** Fade + rise 8px when the card mounts. */
  enter?: boolean
  class?: string
}

/**
 * A ledger line: 34px text inset (past the margin line) and a rule 1px above the
 * bottom of the line box, drawn over it so it adds no height (Figma rules at
 * y 43 and 99 of the 174px card).
 */
const RULED = "relative pr-5 pl-8.5 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-px after:h-px after:bg-rule after:content-['']"

/** Formats a value the way the card shows it. Exported for tests and share text. */
export function formatResult(value: number, { format = 'taka', digits = 'bn', decimals }: Pick<ResultCardProps, 'format' | 'digits' | 'decimals'> = {}) {
  const opts = { digits, decimals }
  return format === 'taka' ? formatTaka(value, opts) : formatNumber(value, opts)
}

/**
 * Main result of a calculator (Figma "Result Card" 7:290): a ruled ledger page
 * (12px radius, 174px for one label, number and two-line sub) with a red margin line, a soft label, the big accent number (number face,
 * 36/56 Bold) and a sub line. The server renders the final number; in the
 * browser it counts up and the card enters with fade + translateY(8px).
 * Screen readers read label, final value, sub in order, and hear the new
 * value once per change (aria-live polite), never the intermediate frames.
 * No ids are generated, so many cards can be server-rendered on one page.
 */
export function ResultCard({
  label,
  value,
  format = 'taka',
  digits = 'bn',
  decimals,
  suffix,
  sub,
  countUp = true,
  enter = true,
  class: className,
  ...rest
}: ResultCardProps) {
  const places = decimals ?? (Number.isInteger(value) ? 0 : 2)
  const fmt = (n: number) => formatResult(n, { format, digits, decimals: places })
  const [shown, setShown] = useState(value)
  const shownRef = useRef<number | null>(null)

  useEffect(() => {
    const from = shownRef.current ?? 0
    const update = (n: number) => {
      shownRef.current = n
      setShown(n)
    }
    if (!countUp) {
      update(value)
      return
    }
    const ctrl = new AbortController()
    void runCountUp(value, update, { from, signal: ctrl.signal })
    return () => ctrl.abort()
  }, [value, countUp])

  return (
    <div
      class={cx(
        '@container relative overflow-hidden rounded-[12px] border border-line bg-sheet py-4 [overflow-wrap:anywhere]',
        enter && 'animate-rise-in',
        className,
      )}
      data-result-card
      {...rest}
    >
      <p class={cx(RULED, 'font-body text-[0.875rem] leading-7 text-soft')}>{label}</p>
      <p
        aria-hidden="true"
        class={cx(RULED, 'hk-nav-num text-[1.75rem] leading-14 font-bold text-accent @xs:text-[2.25rem]')}
        data-result-value
      >
        {fmt(shown)}
        {suffix && <span class="font-body text-[1.125rem] font-semibold tracking-normal">{suffix}</span>}
      </p>
      <p class="sr-only" aria-live="polite" aria-atomic="true">
        {fmt(value) + (suffix ?? '')}
      </p>
      {sub && <div class="pr-5 pl-8.5 font-body text-[0.875rem] leading-7 text-ink">{sub}</div>}
      {/* Red margin line, 19px from the left edge (Figma), drawn over the rules like the design's layer order. */}
      <span aria-hidden="true" class="absolute inset-y-0 left-4.5 w-0.5 bg-margin opacity-70" data-result-margin />
    </div>
  )
}
