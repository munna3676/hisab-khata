import type { ComponentChildren, HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'

export interface KVRowProps {
  /** What the number is, e.g. "মোট সুদ". */
  label: ComponentChildren
  /** The amount, e.g. "৳৯৭,৮৫৮" (format it with formatTaka). */
  value: ComponentChildren
  /** Figma Type=Total: 2px ink rule above, label and amount in ink and bold. */
  total?: boolean
  class?: string
}

/**
 * KV Row (Figma 5:105), the ledger line: label left, amount right in IBM Plex Mono.
 * Renders a <dt>/<dd> pair, so place rows inside <KVList> (a <dl>).
 */
export function KVRow({ label, value, total = false, class: className }: KVRowProps) {
  return (
    <div
      class={cx(
        'flex min-h-9 items-center gap-3',
        total ? 'border-t-2 border-ink text-ink' : 'border-b border-rule',
        className,
      )}
    >
      <dt class={cx('min-w-0 flex-1', total ? 'type-label' : 'type-body-small text-soft')}>{label}</dt>
      <dd class={cx('shrink-0 text-end whitespace-nowrap text-ink', total ? 'hk-num text-number-m font-bold' : 'hk-num text-number-m')}>{value}</dd>
    </div>
  )
}

export interface KVListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'className' | 'class'> {
  class?: string
  children: ComponentChildren
}

/** The <dl> that holds KV Rows (a breakdown or a result's ledger). */
export function KVList({ class: className, children, ...rest }: KVListProps) {
  return (
    <dl {...rest} class={cx('grid', className)}>
      {children}
    </dl>
  )
}
