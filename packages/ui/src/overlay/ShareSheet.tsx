import type { ComponentChildren } from 'preact'
import { Download } from '../icons/glyphs/Download'
import { Message } from '../icons/glyphs/Message'
import { Share } from '../icons/glyphs/Share'
import { cx } from '../lib/cx'
import { Logo } from '../nav/Logo'

export interface ShareTarget {
  id: string
  label: string
  icon: ComponentChildren
}

/** Figma S1 targets, in order. Icons are Figma's: message, share, message, share, download. */
export const DEFAULT_SHARE_TARGETS: readonly ShareTarget[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: <Message /> },
  { id: 'facebook', label: 'Facebook', icon: <Share /> },
  { id: 'messenger', label: 'Messenger', icon: <Message /> },
  { id: 'copy-link', label: 'লিংক কপি', icon: <Share /> },
  { id: 'save-image', label: 'ছবি সেভ', icon: <Download /> },
]

export interface ShareTargetsProps {
  targets?: readonly ShareTarget[]
  onSelect?: (id: string) => void
  /** Name of the button group. */
  label?: string
  class?: string
}

/**
 * The row of share targets (Figma 25:4291): equal columns, each a 52px subtle circle with
 * the icon and a 12/22 soft label under it; the whole column is the button. Columns are 8px
 * apart, and a label may run 4px into the gap on each side (Figma's "Messenger" is 63px in
 * a 62px column), so it still fits on a 320px phone without truncating.
 */
export function ShareTargets({ targets = DEFAULT_SHARE_TARGETS, onSelect, label = 'যেখানে পাঠাবে', class: className }: ShareTargetsProps) {
  return (
    <div role="group" aria-label={label} class={cx('flex min-w-0 gap-2', className)}>
      {targets.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect?.(t.id)}
          class="group pressable flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-card"
          data-share-target={t.id}
        >
          <span aria-hidden="true" class="nudge grid size-13 place-items-center rounded-full bg-subtle text-ink">
            {t.icon}
          </span>
          {/* Figma 12/22: smaller than any type token, so the size is set here. */}
          <span class="max-w-[calc(100%+0.5rem)] truncate text-[0.75rem] leading-5.5 text-soft">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export interface ShareCardPreviewProps {
  /** "আমি এই মাসে বাঁচালাম" */
  caption: ComponentChildren
  /** "৳৪৭.৫০" */
  amount: ComponentChildren
  /** The sentence under the amount. */
  detail?: ComponentChildren
  site?: string
  cta?: string
  /** Accessible description of the image; defaults to caption + amount text. */
  label?: string
  class?: string
}

/**
 * Thumbnail of the share image (Figma "12 Share Card — Cash Out", 180×180 in the sheet;
 * exported at 1080×1080). It is laid out at 2× (360px, where every text matches a type
 * token) on a ruled-ledger page with the red margin, then scaled to .5.
 */
export function ShareCardPreview({ caption, amount, detail, site = 'hisabkhata.com', cta = 'তোমার হিসাবও করো →', label, class: className }: ShareCardPreviewProps) {
  const name = label ?? [caption, amount].filter((x) => typeof x === 'string').join(' ')
  return (
    <div class={cx('flex justify-center', className)}>
      <div role="img" aria-label={name || undefined} class="relative size-45 shrink-0">
        <div aria-hidden="true" class="hko-share-card absolute top-0 left-0 flex size-90 flex-col overflow-hidden rounded-[24px] border-4 border-line bg-sheet pt-7 pr-7 pb-6 pl-11">
          <Logo />
          <p class="mt-5.5 type-h3 text-soft">{caption}</p>
          {/* 28/42 at 1×: 56/84 here. Larger than every type token, so set here. */}
          <p class="hko-num text-[3.5rem] leading-21 font-bold whitespace-nowrap text-accent">{amount}</p>
          {detail != null && <p class="type-body text-ink">{detail}</p>}
          <span class="flex-1" />
          <p class="flex items-center gap-2">
            <span class="min-w-0 flex-1 type-label text-accent">{site}</span>
            <span class="type-body-small whitespace-nowrap text-soft">{cta}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export interface ShareSheetBodyProps {
  /** The image being shared (ShareCardPreview). */
  preview?: ComponentChildren
  targets?: readonly ShareTarget[]
  onSelect?: (id: string) => void
  class?: string
}

/** Body of Sheet — Share (Figma S1 25:4196): preview, then the targets row. Title and description come from the sheet. */
export function ShareSheetBody({ preview, targets, onSelect, class: className }: ShareSheetBodyProps) {
  return (
    <div class={cx('grid min-w-0 gap-4', className)} data-share-sheet>
      {preview}
      <ShareTargets targets={targets} onSelect={onSelect} />
    </div>
  )
}
