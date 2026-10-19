// The 30 Figma icons (Design System › Icons, node 3:2) exported from src/icons/base.tsx.
import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import * as allIcons from '../icons'
import { ICON_NAMES, ICON_SET, IconByName, isIconName } from '../icons/base'

afterEach(cleanup)

const FIGMA_NAMES = [
  'search', 'home', 'star', 'share', 'download', 'chevron-right', 'chevron-left', 'chevron-down', 'moon', 'globe',
  'check', 'alert', 'wallet', 'bank', 'send', 'calculator', 'calendar', 'land', 'guide', 'x', 'grid', 'bookmark',
  'info', 'flag', 'message', 'wifi-off', 'coin', 'clock', 'verified', 'filter', 'plus', 'menu',
]

describe('base icons', () => {
  it('ICON_SET has every Figma icon, in Figma order', () => {
    expect(ICON_NAMES).toEqual(FIGMA_NAMES)
  })

  it.each(FIGMA_NAMES)('%s draws on the 24px grid with a 1.75 currentColor stroke', (name) => {
    if (!isIconName(name)) throw new Error(name)
    const { container } = render(<IconByName name={name} size={20} class="text-good" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('width')).toBe('20')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('1.75')
    expect(svg.getAttribute('class')).toContain('text-good')
    expect(svg.querySelectorAll('path, circle, rect').length).toBeGreaterThan(0)
    expect(svg.innerHTML).not.toMatch(/#[0-9a-f]{3,6}/i)
  })

  it('new icons are exported by PascalCase name from @hisab/ui/icons', () => {
    for (const name of ['Home', 'Star', 'Share', 'Download', 'Globe', 'Wallet', 'Bank', 'Send', 'Calculator', 'Calendar', 'Land', 'Guide', 'Grid', 'Bookmark', 'Flag', 'Message', 'WifiOff', 'Coin', 'Clock', 'Verified', 'Filter', 'Menu']) {
      expect(typeof (allIcons as Record<string, unknown>)[name], name).toBe('function')
    }
    expect(Object.keys(ICON_SET)).toHaveLength(32)
  })
})
