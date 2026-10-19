import type { HTMLAttributes } from 'preact'
import { Globe, ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'
import { HeaderIconButton } from './HeaderIconButton'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export interface TopBarLabels {
  search: string
  /** Name of the language link, in the target language (e.g. "English"). */
  language: string
  theme: string
}

export interface TopBarProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'style'> {
  /** Brand name next to the logo mark. */
  name?: string
  homeHref?: string
  /** Search page; the icon links there (the search sheet can intercept it). */
  searchHref?: string
  /** Same page in the other language. Omit to hide the language button. */
  languageHref?: string
  /** BCP 47 code of the other language, for hreflang and the link's lang. */
  languageCode?: string
  labels?: Partial<TopBarLabels>
  /** Hide the theme toggle (e.g. inside the app, where Settings owns it). */
  hideThemeToggle?: boolean
  /** view-transition-name so the bar stays still during page transitions; give it to one bar per page only. */
  transitionName?: string
  class?: string
}

const BN_LABELS: TopBarLabels = { search: 'খুঁজুন', language: 'English', theme: 'ডার্ক মোড' }

/**
 * Mobile top bar (Figma "Top Bar / Mobile" 7:51): 60px, sheet background, bottom
 * rule, logo on the left and 44px search / language / theme buttons on the right.
 * Pads for the notch with env(safe-area-inset-*). Used below lg; DesktopHeader takes over from lg.
 */
export function TopBar({
  name,
  homeHref = '/',
  searchHref = '/search/',
  languageHref,
  languageCode = 'en',
  labels,
  hideThemeToggle = false,
  transitionName,
  class: className,
  ...rest
}: TopBarProps) {
  const t = { ...BN_LABELS, ...labels }
  return (
    <header
      class={cx(
        'border-b border-line bg-sheet pt-[env(safe-area-inset-top)] pr-[max(var(--space-2),env(safe-area-inset-right))] pl-[max(var(--space-4),env(safe-area-inset-left))]',
        className,
      )}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      data-top-bar
      {...rest}
    >
      <div class="flex h-15 items-center gap-1">
        <Logo name={name} href={homeHref} />
        <span class="min-w-0 flex-1" />
        <HeaderIconButton href={searchHref} label={t.search}>
          <ICON_SET.search />
        </HeaderIconButton>
        {languageHref && (
          <HeaderIconButton href={languageHref} label={t.language} hreflang={languageCode} lang={languageCode}>
            <Globe />
          </HeaderIconButton>
        )}
        {!hideThemeToggle && <ThemeToggle label={t.theme} />}
      </div>
    </header>
  )
}
