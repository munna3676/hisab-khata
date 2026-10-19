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

  it('slides the indicator with translate only, and hides it when no tab matches', () => {
    const { container, rerender } = render(<BottomNav active="saved" placement="static" />)
    const indicator = container.querySelector<HTMLElement>('[data-bottom-nav-indicator]')!
    expect(indicator.getAttribute('aria-hidden')).toBe('true')
    expect(indicator.style.translate).toBe('300% 0')
    expect(indicator.style.width).toBe('25%')
    expect(indicator.className).toContain('transition-[translate,opacity]')
    expect(indicator.className).toContain('duration-tab')

    rerender(<BottomNav active="search" placement="static" />)
    expect(indicator.style.translate).toBe('100% 0')

    rerender(<BottomNav active="tool-page" placement="static" />)
    expect(indicator.className).toContain('opacity-0')
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
