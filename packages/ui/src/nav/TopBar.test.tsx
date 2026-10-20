import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { DesktopHeader } from './DesktopHeader'
import { HeaderIconButton } from './HeaderIconButton'
import { HeaderSearch } from './HeaderSearch'
import { ThemeToggle } from './ThemeToggle'
import { TopBar } from './TopBar'

afterEach(cleanup)

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.clear()
})

describe('TopBar', () => {
  it('has the logo link home and 44px icon buttons with accessible names', () => {
    render(<TopBar languageHref="/en/" />)
    expect(screen.getByRole('link', { name: 'হিসাব খাতা' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'খুঁজুন' }).getAttribute('href')).toBe('/search/')
    const lang = screen.getByRole('link', { name: 'English' })
    expect(lang.getAttribute('hreflang')).toBe('en')
    expect(lang.getAttribute('lang')).toBe('en')
    for (const el of [lang, screen.getByRole('button', { name: 'ডার্ক মোড' })]) expect(el.className).toContain('size-touch')
  })

  it('hides the language button without languageHref and the theme toggle on request', () => {
    render(<TopBar hideThemeToggle />)
    expect(screen.queryByRole('link', { name: 'English' })).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is 60px with its bottom rule (59px row + 1px border) and pads for the notch', () => {
    const { container } = render(<TopBar transitionName="top-bar" />)
    const header = container.querySelector('header')!
    expect(header.className).toContain('border-b')
    expect(header.className).toContain('pt-[env(safe-area-inset-top)]')
    expect(header.querySelector('div')!.className).toContain('h-14.75')
    expect(header.getAttribute('style')).toContain('view-transition-name: top-bar')
  })

  it('keeps the focus order of the design: logo, search, language, theme', () => {
    render(<TopBar languageHref="/en/" />)
    const focusables = [...document.querySelectorAll('header a, header button')].map((el) => el.getAttribute('aria-label') ?? el.textContent)
    expect(focusables).toEqual(['হিসাব খাতা', 'খুঁজুন', 'English', 'ডার্ক মোড'])
  })

  it('takes English labels', () => {
    render(<TopBar name="Hisab Khata" languageHref="/" languageCode="bn" labels={{ search: 'Search', language: 'বাংলা', theme: 'Dark mode' }} />)
    expect(screen.getByRole('link', { name: 'Hisab Khata' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'বাংলা' }).getAttribute('lang')).toBe('bn')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toBeTruthy()
  })
})

describe('ThemeToggle', () => {
  it('switches <html data-theme> and reports it through aria-pressed', async () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'ডার্ক মোড' })
    await waitFor(() => expect(button.getAttribute('aria-pressed')).toBe('false'))
    fireEvent.click(button)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('hk-theme')).toBe('dark')
    await waitFor(() => expect(button.getAttribute('aria-pressed')).toBe('true'))
    fireEvent.click(button)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('draws the moon in light and the sun in dark with CSS, so SSR is right before hydration', () => {
    const { container } = render(<ThemeToggle />)
    const [moon, sun] = [...container.querySelectorAll('svg')]
    expect(moon!.getAttribute('class')).toContain('dark:hidden')
    expect(sun!.getAttribute('class')).toContain('hidden dark:block')
  })
})

describe('HeaderIconButton', () => {
  it('is a link with href and a type=button button without, both 44px, pressable and named', () => {
    const { rerender } = render(
      <HeaderIconButton href="/search/" label="খুঁজুন">
        <svg />
      </HeaderIconButton>,
    )
    const link = screen.getByRole('link', { name: 'খুঁজুন' })
    expect(link.getAttribute('href')).toBe('/search/')
    expect(link.getAttribute('title')).toBe('খুঁজুন')
    expect(link.className).toContain('size-touch')
    expect(link.className).toContain('pressable')
    rerender(
      <HeaderIconButton label="মেনু" aria-expanded={false}>
        <svg />
      </HeaderIconButton>,
    )
    const button = screen.getByRole('button', { name: 'মেনু' })
    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.className).toContain('size-touch')
  })
})

describe('HeaderSearch', () => {
  it('is a 40px pill (Figma) whose field is a 44px touch target, with the ring on the pill', () => {
    render(<HeaderSearch defaultValue="EMI" />)
    const form = screen.getByRole('search')
    expect(form.className).toContain('h-10')
    expect(form.className).toContain('has-focus-visible:outline-2')
    const input = screen.getByRole('searchbox', { name: 'টুল বা গাইড খুঁজুন' }) as HTMLInputElement
    expect(input.className).toContain('h-11')
    expect(input.value).toBe('EMI')
    expect(input.getAttribute('enterkeyhint')).toBe('search')
    // The icon is decorative; the field has its own label.
    expect(form.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('DesktopHeader', () => {
  it('is 72px with its rule; its 44px icon buttons take 40px of layout like Figma', () => {
    const { container } = render(<DesktopHeader languageHref="/en/" />)
    expect(container.querySelector('header > div')!.className).toContain('h-17.75')
    const lang = screen.getByRole('link', { name: 'English' })
    expect(lang.className).toContain('size-touch')
    expect(lang.className).toContain('-mx-0.5')
    expect(screen.getByRole('button', { name: 'ডার্ক মোড' }).className).toContain('-mx-0.5')
  })

  it('omits the language link without languageHref and the theme toggle on request', () => {
    render(<DesktopHeader hideThemeToggle />)
    expect(screen.queryByRole('link', { name: 'English' })).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('lists the section links in a named nav and marks the current one', () => {
    render(
      <DesktopHeader
        links={[
          { href: '/mfs/', label: 'মোবাইল ব্যাংকিং', current: true },
          { href: '/banks/', label: 'ব্যাংক' },
        ]}
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'প্রধান বিভাগ' })
    const links = [...nav.querySelectorAll('a')]
    expect(links.map((a) => a.textContent)).toEqual(['মোবাইল ব্যাংকিং', 'ব্যাংক'])
    expect(links[0]!.getAttribute('aria-current')).toBe('page')
    expect(links[1]!.getAttribute('aria-current')).toBeNull()
    for (const a of links) expect(a.className).toContain('min-h-touch')
  })

  it('has a labelled search field that submits ?q= to the search page', () => {
    render(<DesktopHeader searchAction="/search/" />)
    const form = screen.getByRole('search')
    expect(form.getAttribute('action')).toBe('/search/')
    expect(form.getAttribute('method')).toBe('get')
    const input = screen.getByRole('searchbox', { name: 'টুল বা গাইড খুঁজুন' }) as HTMLInputElement
    expect(input.name).toBe('q')
    expect(input.placeholder).toBe('খোঁজো... যেমন: EMI')
  })

  it('defaults to the five Figma sections', () => {
    render(<DesktopHeader />)
    const nav = screen.getByRole('navigation')
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      'মোবাইল ব্যাংকিং',
      'ব্যাংক',
      'রেমিট্যান্স',
      'ক্যালকুলেটর',
      'সরকারি কাজ',
    ])
  })
})
