import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { Banner } from './Banner'
import { EmptyState } from './EmptyState'
import { NotFound } from './NotFound'
import { Skeleton, SkeletonCard } from './Skeleton'

afterEach(cleanup)

describe('states', () => {
  it('offline banner is a status with the wifi-off icon on ink', () => {
    render(<Banner tone="offline">ইন্টারনেট নেই।</Banner>)
    const banner = screen.getByRole('status')
    expect(banner.className).toContain('bg-ink')
    expect(banner.querySelector('svg')).toBeTruthy()
  })

  it('stale banner is the warn callout', () => {
    render(<Banner tone="stale">এই রেট ৬০ দিনের বেশি পুরোনো।</Banner>)
    expect(screen.getByRole('status').className).toContain('bg-warn-bg')
  })

  it('empty state has a heading, text and action', () => {
    render(<EmptyState title="কিছু পাইনি" description="অন্য বানানে খুঁজে দেখো।" action={<button type="button">অনুরোধ</button>} headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'কিছু পাইনি' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'অনুরোধ' })).toBeTruthy()
  })

  it('404 in Bangla and English digits', () => {
    const { unmount } = render(<NotFound />)
    expect(screen.getByText('৪০৪')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'হোমে যাও' }).getAttribute('href')).toBe('/')
    unmount()
    render(<NotFound lang="en" />)
    expect(screen.getByText('404')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/en/')
  })

  it('skeleton bars are decorative inside a busy status', () => {
    render(<SkeletonCard />)
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(status.textContent).toBe('লোড হচ্ছে…')
    expect(status.querySelectorAll('[data-skeleton][aria-hidden="true"]')).toHaveLength(4)
    render(<Skeleton class="h-3 w-30" />)
  })
})
