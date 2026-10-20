import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BottomNav, DEFAULT_BOTTOM_NAV_ITEMS } from './BottomNav'

afterEach(cleanup)

describe('BottomNav', () => {
  it('is a named navigation landmark with the four Figma tabs', () => {
    render(<BottomNav active="home" placement="static" />)
    const nav = screen.getByRole('navigation', { name: 'প্রধান মেনু' })
    const links = screen.getAllByRole('link')
    expect(nav).toBeTruthy()
    expect(links.map((a) => a.textContent)).toEqual(['হোম', 'খোঁজো', 'সব টুল', 'সেভ'])
    expect(DEFAULT_BOTTOM_NAV_ITEMS.map((i) => i.id)).toEqual(['home', 'search', 'tools', 'saved'])
  })

  it('marks only the active tab with aria-current=page', () => {
    render(<BottomNav active="tools" placement="static" />)
    expect(screen.getByRole('link', { name: 'সব টুল' }).getAttribute('aria-current')).toBe('page')
    for (const name of ['হোম', 'খোঁজো', 'সেভ']) {
      expect(screen.getByRole('link', { name }).getAttribute('aria-current')).toBeNull()
    }
  })

  it('marks the active tab by colour only, as the Figma variants do (no indicator bar)', () => {
    const { container, rerender } = render(<BottomNav active="saved" placement="static" />)
    expect(container.querySelector('[data-bottom-nav-indicator]')).toBeNull()
    const tabs = [...container.querySelectorAll<HTMLAnchorElement>('[data-bottom-nav-item]')]
    expect(tabs).toHaveLength(4)
    for (const tab of tabs) {
      expect(tab.className).toContain('text-soft')
      expect(tab.className).toContain('aria-[current=page]:text-accent')
    }
    // Each tab is a 24px icon over a 12/16 SemiBold label.
    expect(tabs[0]!.querySelector('svg')!.getAttribute('width')).toBe('24')
    expect(tabs[0]!.querySelector('span')!.className).toContain('text-[0.75rem] leading-4 font-semibold')

    rerender(<BottomNav active="tool-page" placement="static" />)
    expect(container.querySelector('[aria-current]')).toBeNull()
  })

  it('is 72px like Figma: top rule, a 63px tab row and at least 8px (or the safe area) below', () => {
    const { container } = render(<BottomNav active="home" placement="static" />)
    const nav = container.querySelector('nav')!
    expect(nav.className).toContain('border-t')
    expect(nav.className).toContain('pb-[max(var(--space-2),env(safe-area-inset-bottom))]')
    expect(container.querySelector('ul')!.className).toContain('h-15.75')
  })

  it('draws the keyboard ring inside the tab, so the full-width bar does not cut it off', () => {
    render(<BottomNav active="home" placement="static" />)
    for (const link of screen.getAllByRole('link')) expect(link.className).toContain('focus-visible:-outline-offset-2')
  })

  it('takes custom tabs and a view-transition name', () => {
    const items = [
      { id: 'home', href: '/', label: 'Home', icon: DEFAULT_BOTTOM_NAV_ITEMS[0]!.icon },
      { id: 'more', href: '/more/', label: 'More', icon: DEFAULT_BOTTOM_NAV_ITEMS[2]!.icon },
    ]
    const { container } = render(<BottomNav items={items} active="more" label="Main menu" transitionName="bottom-nav" />)
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'More' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/', '/more/'])
    expect(container.querySelector('nav')!.getAttribute('style')).toContain('view-transition-name: bottom-nav')
  })

  it('lets a tap navigate normally when there is no onSelect', () => {
    render(<BottomNav active="home" placement="static" />)
    const link = screen.getByRole('link', { name: 'সেভ' })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('calls onSelect with the tab id before navigating', () => {
    const onSelect = vi.fn((_id: string, event: MouseEvent) => event.preventDefault())
    render(<BottomNav active="home" onSelect={onSelect} placement="static" />)
    fireEvent.click(screen.getByRole('link', { name: 'খোঁজো' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0]![0]).toBe('search')
  })

  it('pins itself to the viewport bottom and hides from lg by default, with safe-area padding', () => {
    const { container } = render(<BottomNav active="home" />)
    const nav = container.querySelector('nav')!
    expect(nav.className).toContain('fixed')
    expect(nav.className).toContain('lg:hidden')
    expect(nav.className).toContain('env(safe-area-inset-bottom)')
    const staticNav = render(<BottomNav active="home" placement="static" />).container.querySelector('nav')!
    expect(staticNav.className).not.toContain('fixed')
  })

  it('every tab is pressable', () => {
    render(<BottomNav active="home" placement="static" />)
    for (const link of screen.getAllByRole('link')) expect(link.className).toContain('pressable')
  })
})
