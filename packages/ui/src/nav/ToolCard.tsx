import type { AnchorHTMLAttributes, ComponentChildren } from 'preact'
import { Calculator, ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'
import { IconTile } from './IconTile'

const ChevronRight = ICON_SET['chevron-right']

export interface ToolCardProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'class' | 'title' | 'icon'> {
  href: string
  /** Category label above the title (accent, 12/16 SemiBold), e.g. "মোবাইল ব্যাংকিং". */
  tag?: string
  title: string
  description?: string
  /** Worked example in the number face (blue), e.g. "১,০০০ তুলতে রাখতে হবে ৳১,০১৩.৯৫". */
  example?: string
  /** 22px icon for the tile; defaults to the calculator. */
  icon?: ComponentChildren
  /** Element for the title, so card lists keep a sensible heading outline. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'span'
  class?: string
}

/**
 * Tool list item (Figma "Tool Card" 7:262): sheet card with the khata's red
 * margin rule on the left, an accent-tint icon tile, category, H3 title,
 * description, an optional example line and a chevron. The whole card is one
 * link: it lifts 2px with a shadow on hover (pointer devices), presses to .97.
 */
export function ToolCard({
  href,
  tag,
  title,
  description,
  example,
  icon,
  titleAs: Title = 'h3',
  class: className,
  ...rest
}: ToolCardProps) {
  return (
    <a
      href={href}
      class={cx(
        'lift pressable flex items-start gap-3.5 rounded-card border border-line bg-sheet py-4 pr-4 pl-6 text-ink [--hover-tint-opacity:0]',
        className,
      )}
      data-tool-card
      {...rest}
    >
      {/* Figma: 11px from the left edge, 13 from the top, 7 from the bottom; absolute insets start inside the 1px border. */}
      <span aria-hidden="true" class="absolute top-3 bottom-1.5 left-2.5 w-0.5 bg-margin opacity-55" />
      <IconTile>{icon ?? <Calculator size={22} />}</IconTile>
      <span class="flex min-w-0 flex-1 flex-col items-start gap-0.75">
        {tag && <span class="font-body text-[0.75rem] leading-4 font-semibold text-accent">{tag}</span>}
        <Title class="type-h3 text-ink">{title}</Title>
        {description && <span class="type-body-small text-soft">{description}</span>}
        {example && (
          <span class="hk-nav-num text-[0.8125rem] leading-5.5 font-medium text-blue" data-tool-card-example>
            {example}
          </span>
        )}
      </span>
      <ChevronRight size={20} class="text-soft" />
    </a>
  )
}
