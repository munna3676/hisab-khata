import type { HTMLAttributes } from 'preact'
import { Globe, ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'
import { HeaderIconButton } from './HeaderIconButton'
import { HeaderSearch } from './HeaderSearch'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export interface NavLink {
  href: string
  label: string
  /** Marks the section the page belongs to (aria-current="page"). */
  current?: boolean
}

export interface DesktopHeaderLabels {
  /** Accessible name of the section links' <nav>. */
  nav: string
  search: string
  searchPlaceholder: string
  /** Name of the language link, in the target language (e.g. "English"). */
  language: string
  theme: string
}

export interface DesktopHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'style'> {
  name?: string
  homeHref?: string
  /** Section links (Figma: মোবাইল ব্যাংকিং, ব্যাংক, রেমিট্যান্স, ক্যালকুলেটর, সরকারি কাজ). */
  links?: NavLink[]
  searchAction?: string
  languageHref?: string
  languageCode?: string
  labels?: Partial<DesktopHeaderLabels>
  hideThemeToggle?: boolean
  /** view-transition-name for page transitions; one header per page only. */
  transitionName?: string
  class?: string
}

export const DEFAULT_SECTION_LINKS: NavLink[] = [
  { href: '/mfs/', label: 'মোবাইল ব্যাংকিং' },
  { href: '/banks/', label: 'ব্যাংক' },
  { href: '/remittance/', label: 'রেমিট্যান্স' },
  { href: '/tools/', label: 'ক্যালকুলেটর' },
  { href: '/guides/', label: 'সরকারি কাজ' },
]

/** Figma's desktop icon buttons are 40px: the 44px hit area overlaps the gaps by 2px a side, so the layout spacing stays Figma's. */
const ICON_FIT = '-mx-0.5'

const BN_LABELS: DesktopHeaderLabels = {
  nav: 'প্রধান বিভাগ',
  search: 'টুল বা গাইড খুঁজুন',
  searchPlaceholder: 'খোঁজো... যেমন: EMI',
  language: 'English',
  theme: 'ডার্ক মোড',
}

/**
 * Desktop header (Figma "Header / Desktop" 7:195): 72px with its rule, sheet background, bottom
 * rule; logo, section links, compact search, language and theme on the 1080px
 * content column. Used from lg. Container queries keep it whole in narrower
 * places: under 48rem the search pill becomes an icon button, under 36rem
 * the section links are left to the bottom nav, and in between they scroll.
 */
export function DesktopHeader({
  name,
  homeHref = '/',
  links = DEFAULT_SECTION_LINKS,
  searchAction = '/search/',
  languageHref,
  languageCode = 'en',
  labels,
  hideThemeToggle = false,
  transitionName,
  class: className,
  ...rest
}: DesktopHeaderProps) {
  const t = { ...BN_LABELS, ...labels }
  return (
    <header
      class={cx('@container border-b border-line bg-sheet px-4 pt-[env(safe-area-inset-top)]', className)}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      data-desktop-header
      {...rest}
    >
      {/* 71px row + the 1px rule = Figma's 72px. */}
      <div class="mx-auto flex h-17.75 max-w-content items-center gap-2 @2xl:gap-4 @4xl:gap-6">
        <Logo name={name} href={homeHref} />
        <nav aria-label={t.nav} class="-mx-1 hidden min-w-0 flex-1 items-center gap-5 overflow-x-auto px-1 py-1 [scrollbar-width:none] @xl:flex">
          {links.map((link, i) => (
            <a
              key={`${i}-${link.label}`}
              href={link.href}
              aria-current={link.current ? 'page' : undefined}
              class="hk-nav-link pressable [--hover-tint-opacity:0] inline-flex min-h-touch shrink-0 items-center rounded-input font-body text-[0.9375rem] leading-6 font-medium whitespace-nowrap text-soft hover:text-ink aria-[current=page]:text-accent"
            >
              <span class="link-underline">{link.label}</span>
            </a>
          ))}
        </nav>
        <HeaderSearch action={searchAction} label={t.search} placeholder={t.searchPlaceholder} class="hidden w-50 shrink-0 @3xl:flex" />
        <HeaderIconButton href={searchAction} label={t.search} class={cx(ICON_FIT, 'ml-auto @xl:ml-0 @3xl:hidden')}>
          <ICON_SET.search />
        </HeaderIconButton>
        {languageHref && (
          <HeaderIconButton href={languageHref} label={t.language} hreflang={languageCode} lang={languageCode} class={ICON_FIT}>
            <Globe />
          </HeaderIconButton>
        )}
        {!hideThemeToggle && <ThemeToggle label={t.theme} class={ICON_FIT} />}
      </div>
    </header>
  )
}
