import type { ComponentChildren, HTMLAttributes, JSX } from 'preact'
import { Badge } from '../base/Badge'
import { Button } from '../base/Button'
import { cx } from '../lib/cx'

export interface RemittanceCardLabels {
  /** Default "পরিবার পাবে". */
  amount: string
  /** Default "ফি". */
  fee: string
  /** Default "রেট". */
  rate: string
  /** Default "সময়". */
  time: string
  /** Badge on the best service, default "সেরা". */
  best: string
  /** Action button, default "পাঠাও" (an arrow is added). */
  action: string
}

const DEFAULT_LABELS: RemittanceCardLabels = {
  amount: 'পরিবার পাবে',
  fee: 'ফি',
  rate: 'রেট',
  time: 'সময়',
  best: 'সেরা',
  action: 'পাঠাও',
}

export interface RemittanceCardProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'className' | 'title'> {
  /** Service name, e.g. "সার্ভিস A". */
  service: string
  /** What the family receives, formatted, e.g. "৳৩২,৪৮০". */
  amount: ComponentChildren
  /** Formatted fee, e.g. "৫ SAR" or "০". */
  fee: ComponentChildren
  /** Formatted exchange rate, e.g. "৩২.৪৮". */
  rate: ComponentChildren
  /** Delivery time, e.g. "১ দিন" or "মিনিটে". */
  time: ComponentChildren
  /** Figma State=Best: green 2px border, green amount, "সেরা" badge and a primary button. */
  best?: boolean
  /** Where the action goes (the service's site or app). Without href and onAction there is no button. */
  href?: string
  onAction?: (event: JSX.TargetedMouseEvent<HTMLElement>) => void
  /** Small print under the button, e.g. "indicative rate · শেষ আপডেট আজ ১০:০০". */
  note?: ComponentChildren
  labels?: Partial<RemittanceCardLabels>
  /** Heading level of the service name inside a list (default h3). */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  class?: string
}

/**
 * Remittance Card (Figma 9:247, State Default | Best): one service in the remittance
 * comparison. The best card gets a 2px green border (264px tall in Figma against the
 * default 256px: the badge row is 26px), a green amount, a "সেরা" badge that fades and
 * scales in, and the primary button. Numbers in Figma are layout samples, not rates.
 */
export function RemittanceCard({
  service,
  amount,
  fee,
  rate,
  time,
  best = false,
  href,
  onAction,
  note,
  labels,
  titleAs: Title = 'h3',
  class: className,
  ...rest
}: RemittanceCardProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const meta: [string, ComponentChildren][] = [
    [l.fee, fee],
    [l.rate, rate],
    [l.time, time],
  ]
  const hasAction = typeof href === 'string' || !!onAction
  const actionContent = (
    <>
      <span class="sr-only">{service}: </span>
      {l.action}
      <span aria-hidden="true"> →</span>
    </>
  )

  return (
    <article
      {...rest}
      class={cx(
        'flex min-w-0 flex-col items-start gap-3 rounded-[12px] bg-sheet p-4 text-ink',
        best ? 'border-2 border-good' : 'border border-line',
        className,
      )}
      data-remittance-card
      data-best={best ? '' : undefined}
    >
      <div class="flex min-w-0 max-w-full items-center gap-2">
        <Title class="truncate font-body text-[1rem]/5 font-semibold text-ink">{service}</Title>
        {best && (
          <Badge tone="good" appear>
            {l.best}
          </Badge>
        )}
      </div>

      <div class="flex min-w-0 max-w-full flex-col">
        <p class="type-body-small text-soft">{l.amount}</p>
        <p class={cx('hkc-num text-[1.625rem]/8.5 font-bold break-all', best ? 'text-good' : 'text-ink')}>{amount}</p>
      </div>

      <dl class="flex w-full min-w-0 gap-2">
        {meta.map(([label, value]) => (
          <div key={label} class="flex min-w-0 flex-1 flex-col">
            <dt class="truncate font-body text-[0.75rem]/4 text-soft">{label}</dt>
            <dd class="hkc-num truncate text-number-m text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {hasAction &&
        (typeof href === 'string' ? (
          <Button variant={best ? 'primary' : 'secondary'} href={href} onClick={onAction}>
            {actionContent}
          </Button>
        ) : (
          <Button variant={best ? 'primary' : 'secondary'} onClick={onAction}>
            {actionContent}
          </Button>
        ))}

      {note && <p class="font-body text-[0.75rem]/4 text-soft">{note}</p>}
    </article>
  )
}
