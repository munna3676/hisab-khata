import { useEffect, useState } from 'preact/hooks'
import { ICON_SET } from '../icons/base'
import { Sun } from '../icons/common'
import { cx } from '../lib/cx'
import { currentTheme, setThemeSetting, type Theme } from '../lib/settings'
import { HeaderIconButton } from './HeaderIconButton'

export interface ThemeToggleProps {
  /** Accessible name of the toggle; aria-pressed says whether dark mode is on. */
  label?: string
  class?: string
}

/**
 * Light/dark switch for the top bar and desktop header. The icon is chosen by
 * CSS (moon in light, sun in dark), so the server-rendered HTML is right before
 * hydration; once hydrated it follows <html data-theme> (including system changes).
 */
export function ThemeToggle({ label = 'ডার্ক মোড', class: className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setTheme(currentTheme())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <HeaderIconButton
      label={label}
      aria-pressed={theme === null ? undefined : theme === 'dark'}
      class={cx(className)}
      data-theme-toggle
      onClick={() => setThemeSetting(currentTheme() === 'dark' ? 'light' : 'dark')}
    >
      <ICON_SET.moon class="dark:hidden" />
      <Sun class="hidden dark:block" />
    </HeaderIconButton>
  )
}
