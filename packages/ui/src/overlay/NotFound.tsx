import type { ComponentChildren } from 'preact'
import { toBanglaDigits } from '@hisab/core/lib/digits'
import { Button } from '../base/Button'
import { cx } from '../lib/cx'

type HeadingLevel = 1 | 2 | 3 | 4

export interface NotFoundProps {
  /** bn shows ৪০৪ and the Bangla texts; en shows 404 and English defaults. */
  lang?: 'bn' | 'en'
  title?: ComponentChildren
  description?: ComponentChildren
  /** Where the button goes (default "/", or "/en/" in English). */
  homeHref?: string
  homeLabel?: string
  /** 1 on the real 404 page; lower in the gallery. */
  headingLevel?: HeadingLevel
  /** Replaces the home button (e.g. two actions). */
  action?: ComponentChildren
  card?: boolean
  class?: string
}

const TEXT = {
  bn: { title: 'এই পাতাটা খাতায় নেই', description: 'লিংকটা পুরোনো হতে পারে। হোম থেকে খুঁজে দেখো।', home: 'হোমে যাও', href: '/' },
  en: { title: 'This page is not in the ledger', description: 'The link may be old. Try searching from the home page.', home: 'Go home', href: '/en/' },
}

/**
 * Not Found (Figma 14 States 18:1940, "৪০৪ পেজ"): the code in IBM Plex Mono Bold 48/60 accent,
 * Display/H3 title, Body/Small soft text and a primary "হোমে যাও" button, centred in a card.
 */
export function NotFound({
  lang = 'bn',
  title,
  description,
  homeHref,
  homeLabel,
  headingLevel = 1,
  action,
  card = true,
  class: className,
}: NotFoundProps) {
  const t = TEXT[lang]
  const Heading = `h${headingLevel}` as 'h1'
  return (
    <div
      class={cx('flex min-w-0 flex-col items-center gap-2 px-5 py-6 text-center', card && 'rounded-[12px] border border-line bg-sheet', className)}
      data-not-found
    >
      {/* Figma Number style at 48/60: no type token is this large, so size and leading are set here. */}
      <p class="hko-num text-[3rem] leading-15 font-bold text-accent" aria-hidden="true">
        {lang === 'bn' ? toBanglaDigits('404') : '404'}
      </p>
      <Heading class="type-h3 text-ink">
        <span class="sr-only">404: </span>
        {title ?? t.title}
      </Heading>
      <p class="max-w-75 type-body-small text-soft">{description ?? t.description}</p>
      {action ?? <Button href={homeHref ?? t.href}>{homeLabel ?? t.home}</Button>}
    </div>
  )
}
