import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TabBar, TabPanel, tabId, tabPanelId } from './TabBar'

afterEach(cleanup)

const ITEMS = [
  { value: 'cashout', label: 'ক্যাশ আউট' },
  { value: 'send', label: 'সেন্ড মানি' },
  { value: 'cashin', label: 'ক্যাশ ইন' },
  { value: 'billpay', label: 'বিল পে' },
  { value: 'limit', label: 'লিমিট' },
]

const tabs = () => screen.getAllByRole('tab')
const stops = () => tabs().filter((t) => t.tabIndex === 0)
const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k })

describe('TabBar (tabs)', () => {
  it('is a named tablist with one selected tab, the only one in the Tab order', () => {
    render(<TabBar label="চার্জের ধরন" items={ITEMS} defaultValue="cashin" />)
    expect(screen.getByRole('tablist').getAttribute('aria-label')).toBe('চার্জের ধরন')
    expect(tabs()).toHaveLength(5)
    const selected = tabs().filter((t) => t.getAttribute('aria-selected') === 'true')
    expect(selected.map((t) => t.textContent)).toEqual(['ক্যাশ ইন'])
    expect(stops()).toEqual(selected)
    for (const t of tabs()) expect(t.className).toContain('min-h-touch')
  })

  it('Right/Left move focus and selection with wrapping; Home/End jump', () => {
    const onChange = vi.fn()
    render(<TabBar label="ধরন" items={ITEMS} onChange={onChange} />)
    tabs()[0]!.focus()
    key('ArrowRight')
    expect(document.activeElement).toBe(tabs()[1])
    expect(tabs()[1]!.getAttribute('aria-selected')).toBe('true')
    expect(stops()).toEqual([tabs()[1]])
    expect(onChange).toHaveBeenLastCalledWith('send')
    key('ArrowLeft')
    key('ArrowLeft')
    expect(document.activeElement).toBe(tabs()[4])
    expect(onChange).toHaveBeenLastCalledWith('limit')
    key('ArrowRight')
    expect(document.activeElement).toBe(tabs()[0])
    key('End')
    expect(document.activeElement).toBe(tabs()[4])
    key('Home')
    expect(document.activeElement).toBe(tabs()[0])
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('true')
  })

  it('skips disabled tabs and never makes them the tab stop', () => {
    const items = ITEMS.map((t, i) => ({ ...t, disabled: i === 1 }))
    render(<TabBar label="ধরন" items={items} />)
    tabs()[0]!.focus()
    key('ArrowRight')
    expect(document.activeElement).toBe(tabs()[2])
    expect((tabs()[1] as HTMLButtonElement).disabled).toBe(true)
  })

  it('manual activation moves focus only; Enter/Space (click) selects', () => {
    render(<TabBar label="ধরন" items={ITEMS} activation="manual" />)
    tabs()[0]!.focus()
    key('ArrowRight')
    expect(document.activeElement).toBe(tabs()[1])
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('true')
    fireEvent.click(tabs()[1]!)
    expect(tabs()[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('ignores modified arrow keys', () => {
    render(<TabBar label="ধরন" items={ITEMS} />)
    tabs()[0]!.focus()
    fireEvent.keyDown(tabs()[0]!, { key: 'ArrowRight', altKey: true })
    expect(document.activeElement).toBe(tabs()[0])
  })

  it('keeps a tab stop when the value matches no tab', () => {
    render(<TabBar label="ধরন" items={ITEMS} value="nope" />)
    expect(stops()).toEqual([tabs()[0]])
  })

  it('wires tabs to panels with matching ids', () => {
    function Demo() {
      const [v, setV] = useState('cashout')
      return (
        <div>
          <TabBar id="t" label="ধরন" items={ITEMS.slice(0, 2)} value={v} onChange={setV} panels />
          {ITEMS.slice(0, 2).map((t) => (
            <TabPanel key={t.value} tabsId="t" value={t.value} selected={t.value === v}>
              {t.value} panel
            </TabPanel>
          ))}
        </div>
      )
    }
    render(<Demo />)
    const [a, b] = tabs()
    expect(a!.id).toBe(tabId('t', 'cashout'))
    expect(a!.getAttribute('aria-controls')).toBe(tabPanelId('t', 'cashout'))
    const panel = screen.getByRole('tabpanel')
    expect(panel.getAttribute('aria-labelledby')).toBe(a!.id)
    expect(panel.textContent).toBe('cashout panel')
    fireEvent.click(b!)
    expect(screen.getByRole('tabpanel').textContent).toBe('send panel')
  })

  it('ids are safe for values with spaces or Bangla', () => {
    expect(tabId('x', 'বিল পে')).toMatch(/^x-tab-[\w-]+$/)
  })
})

describe('TabBar (links)', () => {
  it('is a named nav of links with aria-current on the current page', () => {
    const items = ITEMS.slice(0, 3).map((t) => ({ ...t, href: `/mfs/${t.value}` }))
    render(<TabBar label="ব্যাংকের তথ্য" items={items} value="send" />)
    expect(screen.getByRole('navigation', { name: 'ব্যাংকের তথ্য' })).toBeTruthy()
    expect(screen.queryByRole('tablist')).toBeNull()
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('aria-current'))).toEqual([null, 'page', null])
    expect(links[0]!.getAttribute('href')).toBe('/mfs/cashout')
  })
})
