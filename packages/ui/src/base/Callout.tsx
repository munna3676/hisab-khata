import type { ComponentChildren, HTMLAttributes } from 'preact'
import { ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'

export type CalloutTone = 'info' | 'warn'

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'class' | 'icon' | 'title'> {
  /** Info: subtle background, blue info icon. Warn: warn background, warn alert icon. */
  tone?: CalloutTone
  /** Optional bold first line. */
  title?: ComponentChildren
  /** Replaces the tone's 20px icon. */
  icon?: ComponentChildren
  class?: string
  children: ComponentChildren
}

const TONE: Record<CalloutTone, { box: string; icon: string }> = {
  info: { box: 'bg-subtle', icon: 'text-blue' },
  warn: { box: 'bg-warn-bg', icon: 'text-warn' },
}

/** Callout (Figma 5:162): a note beside a result, e.g. "রেট পরিবর্তন হতে পারে…". */
export function Callout({ tone = 'info', title, icon, class: className, children, ...rest }: CalloutProps) {
  const Glyph = tone === 'warn' ? ICON_SET.alert : ICON_SET.info
  return (
    <div {...rest} role={rest.role ?? 'note'} class={cx('flex items-start gap-2.5 rounded-card px-3.5 py-3 text-ink', TONE[tone].box, className)}>
      <span class={cx('mt-px flex shrink-0', TONE[tone].icon)}>{icon ?? <Glyph size={20} />}</span>
      <div class="min-w-0 flex-1 type-body-small">
        {title != null && <p class="type-label">{title}</p>}
        {children}
      </div>
    </div>
  )
}
