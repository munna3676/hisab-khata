import type { ComponentChildren } from 'preact'
import { cx } from '../lib/cx'

/**
 * mobile-banner: full width x 100 (Figma 342x100; AdSense 320x100 fits from 360px up)
 * mpu: 300x250 · leaderboard: 728x90 (md and up only)
 * responsive: mobile banner below md (768), leaderboard from md.
 */
export type AdSlotSize = 'mobile-banner' | 'mpu' | 'leaderboard' | 'responsive'

export interface AdSlotProps {
  size?: AdSlotSize
  /** Placeholder text until an ad fills the slot (default "বিজ্ঞাপন"). */
  label?: string
  /** Shows the size name next to the label, as the Figma placeholder does (dev and gallery). */
  showSize?: boolean
  /** The ad itself, injected after idle or first interaction; until then the slot is a placeholder. */
  children?: ComponentChildren
  class?: string
}

const BOX: Record<AdSlotSize, string> = {
  'mobile-banner': 'h-[100px] w-full',
  mpu: 'h-[250px] w-[300px] max-w-full',
  leaderboard: 'h-[90px] w-[728px] max-w-full',
  responsive: 'h-[100px] w-full md:h-[90px] md:w-[728px] md:max-w-full',
}

const NAME: Record<AdSlotSize, string> = {
  'mobile-banner': 'Mobile Banner',
  mpu: 'MPU',
  leaderboard: 'Leaderboard',
  responsive: 'Responsive',
}

/**
 * Ad Slot (Figma 5:170): a reserved, fixed-size box so a late ad never shifts the page
 * (CLS). Never place it above a result (docs/decisions/0001-stack.md, Ads).
 */
export function AdSlot({ size = 'mobile-banner', label = 'বিজ্ঞাপন', showSize = false, children, class: className }: AdSlotProps) {
  return (
    <div
      data-ad-slot={size}
      class={cx(
        'relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-input border border-dashed border-rule bg-subtle [contain:layout_paint]',
        BOX[size],
        className,
      )}
    >
      {children ?? (
        <p class="px-2 text-center font-body text-[0.75rem]/[1.375rem] text-soft">
          {label}
          {showSize &&
            (size === 'responsive' ? (
              <>
                <span class="md:hidden"> · {NAME['mobile-banner']}</span>
                <span class="hidden md:inline"> · {NAME.leaderboard}</span>
              </>
            ) : (
              <span> · {NAME[size]}</span>
            ))}
        </p>
      )}
    </div>
  )
}
