import type { ComponentChildren } from 'preact'
import { cx } from '../lib/cx'

export interface IconTileProps {
  /** md = 40px tile with a 22px icon (Tool Card, Section Card); sm = 36px with a 20px icon (List Row). */
  size?: 'md' | 'sm'
  class?: string
  children: ComponentChildren
}

/** Figma "icon tile": accent-tint square, radius card, accent icon. Decorative; nudges on hover of its card. */
export function IconTile({ size = 'md', class: className, children }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      class={cx(
        'nudge grid shrink-0 place-items-center overflow-hidden rounded-card bg-accent-tint text-accent',
        size === 'md' ? 'size-10' : 'size-9',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Icon size that goes inside a tile of the given size (Figma: 22 in md, 20 in sm). */
export const tileIconSize = (size: 'md' | 'sm' = 'md') => (size === 'md' ? 22 : 20)
