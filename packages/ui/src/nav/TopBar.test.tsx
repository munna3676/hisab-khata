import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { DesktopHeader } from './DesktopHeader'
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

describe('DesktopHeader', () => {
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
