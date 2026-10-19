import type { ComponentChildren, HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'

export type BadgeTone = 'good' | 'warn' | 'accent' | 'neutral'

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'class' | 'icon'> {
  /** Figma Type: Good (সাশ্রয়ী), Warn (লিমিট পার), Accent (নতুন), Neutral (শীঘ্রই). */
  tone?: BadgeTone
  /** Optional 14px leading icon. */
  icon?: ComponentChildren
  /** Fades and scales in on mount ('Best' and 'cheapest' badges). Just a fade under reduced motion. */
  appear?: boolean
  class?: string
  children: ComponentChildren
}

const TONE: Record<BadgeTone, string> = {
  good: 'bg-good text-on-accent',
  warn: 'bg-warn-bg text-warn',
  accent: 'bg-accent-tint text-accent',
  neutral: 'bg-subtle text-soft',
}

/** Badge (Figma 5:47): 26px pill, 13/18 semibold. Status text, not interactive. */
export function Badge({ tone = 'good', icon, appear = false, class: className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      class={cx(
        'inline-flex h-6.5 shrink-0 items-center gap-1 rounded-full px-2.5 font-body text-[0.8125rem]/[1.125rem] font-semibold whitespace-nowrap',
        TONE[tone],
        appear && 'hk-badge-in',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
