import type { ComponentChildren } from 'preact'
import { Callout } from '../base/Callout'
import { WifiOff } from '../icons/glyphs/WifiOff'
import { cx } from '../lib/cx'

export type BannerTone = 'offline' | 'stale'

export interface BannerProps {
  /** offline: ink bar with the wifi-off icon. stale: the warn Callout ("data purono"). */
  tone: BannerTone
  children: ComponentChildren
  /** Optional trailing control, e.g. a ghost "আবার চেষ্টা" button. */
  action?: ComponentChildren
  class?: string
}

/**
 * Banner (Figma 14 States: "অফলাইন ব্যানার" 18:1906 and "পুরোনো ডেটা সতর্কতা" 18:1913).
 * Offline: ink background, sheet-coloured Body/Small text, 20px wifi-off icon, 10px corners;
 * announced politely when it appears. Stale: the warn Callout, used when a Fact's checked
 * date is over 60 days old.
 */
export function Banner({ tone, children, action, class: className }: BannerProps) {
  if (tone === 'stale') {
    return (
      <Callout tone="warn" role="status" class={cx(action != null && 'items-center', className)} data-banner="stale">
        <span class="flex min-w-0 items-center gap-2">
          <span class="min-w-0 flex-1">{children}</span>
          {action}
        </span>
      </Callout>
    )
  }
  return (
    <div role="status" class={cx('flex min-w-0 items-center gap-2.5 rounded-card bg-ink px-3.5 py-3 text-sheet', className)} data-banner="offline">
      <WifiOff size={20} class="shrink-0" />
      <p class="min-w-0 flex-1 type-body-small">{children}</p>
      {action}
    </div>
  )
}
