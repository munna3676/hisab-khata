import type { AnchorHTMLAttributes, ComponentChildren } from 'preact'
import { Guide, ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'
import { IconTile } from './IconTile'

const ChevronRight = ICON_SET['chevron-right']

export interface ListRowProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'class' | 'title' | 'icon'> {
  href: string
  title: string
  /** Kind and contents, e.g. "গাইড · ফি, কাগজপত্র, ধাপ". */
  subtitle?: string
  /** 20px icon for the 36px tile; defaults to the guide document. Pass null for a row without a tile. */
  icon?: ComponentChildren | null
  /** Hide the bottom rule (e.g. on the last row of a card). */
  last?: boolean
  class?: string
}

/**
 * Link row for lists of guides, tools and search results (Figma "List Row" 7:310):
 * 36px icon tile, Body/Medium title, 13/22 soft subtitle, chevron, bottom rule.
 * The row tints on hover (rounded tint, square row) and presses to .97; 72px with a subtitle.
 */
export function ListRow({ href, title, subtitle, icon, last = false, class: className, ...rest }: ListRowProps) {
  return (
    <a
      href={href}
      class={cx(
        'hk-list-row pressable flex min-h-touch items-center gap-3 py-3 text-ink',
        !last && 'border-b border-line',
        className,
      )}
      data-list-row
      {...rest}
    >
      {icon !== null && <IconTile size="sm">{icon ?? <Guide size={20} />}</IconTile>}
      <span class="flex min-w-0 flex-1 flex-col gap-px">
        <span class="type-body-medium text-ink">{title}</span>
        {subtitle && <span class="-mx-1 truncate px-1 font-body text-[0.8125rem] leading-5.5 text-soft">{subtitle}</span>}
      </span>
      <ChevronRight size={20} class="text-soft" />
    </a>
  )
}
