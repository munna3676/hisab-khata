import type { ComponentChildren, HTMLAttributes } from 'preact'
import { ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'

export type CalloutTone = 'info' | 'warn'

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'class' | 'icon' | 'title'> {
  /** Info: subtle background, blue info icon. Warn: warn background, warn alert icon. */
  tone?: CalloutTone
  /** Optional bold first line. */
  title?: ComponentChildren
  /** Replaces the tone's icon. It sits in the 20px slot top-left; a 24px icon may overhang it by 4px, as in Figma. */
  icon?: ComponentChildren
  class?: string
  children: ComponentChildren
}

const TONE: Record<CalloutTone, { box: string; icon: string }> = {
  info: { box: 'bg-subtle', icon: 'text-blue' },
  warn: { box: 'bg-warn-bg', icon: 'text-warn' },
}

/**
 * Callout (Figma 5:162): a note beside a result, e.g. "রেট পরিবর্তন হতে পারে…".
 * Figma lays the icon out as a 20px slot at the top of the text, but its glyph keeps the
 * 24px icon scale and overhangs the slot by 4px to the right and bottom. The fixed 20px
 * slot below reproduces that (the 24px icon overflows it), so the text starts 30px in.
 */
export function Callout({ tone = 'info', title, icon, class: className, children, ...rest }: CalloutProps) {
  const Glyph = tone === 'warn' ? ICON_SET.alert : ICON_SET.info
  return (
    <div {...rest} role={rest.role ?? 'note'} class={cx('flex items-start gap-2.5 rounded-card px-3.5 py-3 text-ink', TONE[tone].box, className)}>
      <span class={cx('flex size-5 shrink-0 items-start', TONE[tone].icon)} data-callout-icon>
        {icon ?? <Glyph size={24} />}
      </span>
      <div class="min-w-0 flex-1 type-body-small">
        {title != null && <p class="type-label">{title}</p>}
        {children}
      </div>
    </div>
  )
}
