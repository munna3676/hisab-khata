import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { Breadcrumb } from './Breadcrumb'

afterEach(cleanup)

const items = [
  { label: 'হোম', href: '/' },
  { label: 'মোবাইল ব্যাংকিং', href: '/mfs/' },
  { label: 'ক্যাশ আউট চার্জ', href: '/tools/cash-out/' },
]

describe('Breadcrumb', () => {
  it('renders an ordered list in a named nav, earlier steps as links', () => {
    render(<Breadcrumb items={items} />)
    const nav = screen.getByRole('navigation', { name: 'আপনি এখানে আছেন' })
    expect(nav.querySelector('ol')).toBeTruthy()
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/', '/mfs/'])
  })

  it('the last item is the current page, not a link', () => {
    render(<Breadcrumb items={items} />)
    const current = screen.getByText('ক্যাশ আউট চার্জ')
    expect(current.tagName).toBe('SPAN')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('separators are decorative', () => {
    const { container } = render(<Breadcrumb items={items} />)
    const seps = [...container.querySelectorAll('[aria-hidden="true"]')]
    expect(seps.map((s) => s.textContent)).toEqual(['›', '›'])
    expect(container.textContent).toBe('হোম›মোবাইল ব্যাংকিং›ক্যাশ আউট চার্জ')
  })

  it('earlier steps get a 44px-tall hit area without moving the line, and the hover colour', () => {
    render(<Breadcrumb items={items} />)
    for (const link of screen.getAllByRole('link')) {
      expect(link.className).toContain('before:-inset-y-2.75') // 22px line + 2 x 11px
      expect(link.className).toContain('link-underline')
      expect(link.className).toContain('hover:text-ink')
    }
  })

  it('an item without href stays text', () => {
    render(<Breadcrumb items={[{ label: 'হোম', href: '/' }, { label: 'গাইড' }, { label: 'NID' }]} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
