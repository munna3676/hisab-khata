import type { ComponentChildren } from 'preact'
import { cx } from '../lib/cx'

export interface SkeletonProps {
  /** Size with spacing classes, e.g. "h-3 w-30". */
  class?: string
}

/**
 * One placeholder bar: subtle fill, 6px corners, and a shimmer, which is a gradient on
 * ::after moved with `translate` (overlay.css). No shimmer under data-motion lite/reduce
 * or prefers-reduced-motion. Decorative: wrap bars in SkeletonGroup for the a11y status.
 */
export function Skeleton({ class: className }: SkeletonProps) {
  return <span aria-hidden="true" class={cx('hko-skeleton block max-w-full rounded-[6px] bg-subtle', className)} data-skeleton />
}

export interface SkeletonGroupProps {
  /** Read by screen readers while loading. */
  label?: string
  /** Card look of Figma's "loading skeleton" (sheet, line border, 12px corners). */
  card?: boolean
  class?: string
  children?: ComponentChildren
}

/** A loading region: role=status + aria-busy with a hidden label, holding Skeleton bars. */
export function SkeletonGroup({ label = 'লোড হচ্ছে…', card = false, class: className, children }: SkeletonGroupProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      class={cx('flex min-w-0 flex-col items-start gap-2.5', card && 'rounded-[12px] border border-line bg-sheet px-4 py-5', className)}
    >
      <span class="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** Figma 18:1954 "loading skeleton": 120×12, 220×40, 300×12 and 260×12 bars in a card. */
export function SkeletonCard({ label, class: className }: { label?: string; class?: string }) {
  return (
    <SkeletonGroup label={label} card class={className}>
      <Skeleton class="h-3 w-30" />
      <Skeleton class="h-10 w-55" />
      <Skeleton class="h-3 w-75" />
      <Skeleton class="h-3 w-65" />
    </SkeletonGroup>
  )
}
