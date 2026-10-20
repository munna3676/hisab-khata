import type { AnchorHTMLAttributes, ComponentChildren } from 'preact'
import { Wallet } from '../icons/base'
import { cx } from '../lib/cx'
import { IconTile } from './IconTile'

export interface SectionCardProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'class' | 'title' | 'icon'> {
  href: string
  title: string
  /** One line of what is inside, e.g. "বিকাশ, নগদ, রকেট, উপায়". */
  subtitle?: string
  /** 22px icon for the tile; defaults to the wallet. */
  icon?: ComponentChildren
  titleAs?: 'h2' | 'h3' | 'h4' | 'span'
  class?: string
}

/**
 * Section entry on the home page (Figma "Section Card" 7:280): 12px radius, icon
 * tile, 15/21 SemiBold title and a 12/17 soft subtitle, stacked. Two per row on phones,
 * six per row on the desktop home. One link; lifts on hover, presses to .97.
 */
export function SectionCard({ href, title, subtitle, icon, titleAs: Title = 'h3', class: className, ...rest }: SectionCardProps) {
  return (
    <a
      href={href}
      class={cx(
        'lift pressable flex flex-col items-start gap-2.5 rounded-[12px] border border-line bg-sheet p-4 text-ink [--hover-tint-opacity:0]',
        className,
      )}
      data-section-card
      {...rest}
    >
      <IconTile>{icon ?? <Wallet size={22} />}</IconTile>
      <Title class="font-body text-[0.9375rem] leading-5.25 font-semibold text-ink">{title}</Title>
      {subtitle && <span class="font-body text-[0.75rem] leading-4.25 text-soft">{subtitle}</span>}
    </a>
  )
}
