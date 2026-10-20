import { toBanglaDigits } from '@hisab/core/lib/digits'
import { GREGORIAN_MONTHS_BN, GREGORIAN_MONTHS_EN, parseIsoDate } from '@hisab/core/lib/dates-calendar'
import { Verified } from '../icons/base'
import { cx } from '../lib/cx'

export interface VerifiedLineProps {
  /** Date a person last confirmed the value at the source, YYYY-MM-DD (a Fact's `checked`). */
  checked: string
  /** Official page the value was read from (a Fact's `source`). */
  source: string
  /** Link text; defaults to the source's host without "www." (bkash.com). */
  sourceLabel?: string
  /**
   * Writes "সূত্র: " before the link (default true): "· সূত্র: bkash.com". Set false when the
   * link text says it all, as on the Figma Calculator screen: "· অফিসিয়াল সূত্র".
   */
  sourcePrefix?: boolean
  lang?: 'bn' | 'en'
  /** Open the source in a new tab (default true; the link says so to screen readers). */
  newTab?: boolean
  class?: string
}

const TEXT = {
  bn: { checked: 'যাচাই', source: 'সূত্র', newTab: '(নতুন ট্যাবে খোলে)' },
  en: { checked: 'Verified', source: 'Source', newTab: '(opens in a new tab)' },
} as const

/** "2026-10-19" → "১৯ অক্টোবর ২০২৬" (bn) or "19 October 2026" (en); other text is returned as is. */
export function formatCheckedDate(iso: string, lang: 'bn' | 'en' = 'bn'): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  if (lang === 'en') return `${date.day} ${GREGORIAN_MONTHS_EN[date.month - 1]} ${date.year}`
  return `${toBanglaDigits(date.day)} ${GREGORIAN_MONTHS_BN[date.month - 1]} ${toBanglaDigits(date.year)}`
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Verified Line (Figma 5:140): green shield, "যাচাই: <date> · সূত্র: <source link>" at 13/22 in soft.
 * As in Figma, the shield is an 18px slot centred on the first 22px line whose glyph keeps the
 * 24px icon scale and overhangs the slot to the right and bottom; the text starts 24px in.
 * The source link is underlined (Figma shows plain text): a link in running text in the same
 * colour needs a non-colour cue (WCAG 1.4.1, axe link-in-text-block).
 */
export function VerifiedLine({
  checked,
  source,
  sourceLabel,
  sourcePrefix = true,
  lang = 'bn',
  newTab = true,
  class: className,
}: VerifiedLineProps) {
  const t = TEXT[lang]
  return (
    <p class={cx('flex items-start gap-1.5 font-body text-[0.8125rem]/[1.375rem] text-soft', className)}>
      <span class="mt-0.5 flex size-4.5 shrink-0 items-start text-good" data-verified-icon>
        <Verified size={24} />
      </span>
      <span class="min-w-0">
        {t.checked}: <time dateTime={checked}>{formatCheckedDate(checked, lang)}</time> · {sourcePrefix && `${t.source}: `}
        <a
          href={source}
          class="break-words text-soft underline decoration-1 underline-offset-2"
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
        >
          {sourceLabel ?? hostOf(source)}
          {newTab && <span class="sr-only"> {t.newTab}</span>}
        </a>
      </span>
    </p>
  )
}
