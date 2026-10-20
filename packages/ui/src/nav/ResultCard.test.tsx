import { cleanup, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { formatResult, ResultCard } from './ResultCard'

afterEach(cleanup)

const valueText = (container: Element) => container.querySelector('[data-result-value]')!.textContent

afterEach(() => {
  delete document.documentElement.dataset.motion
})

describe('ResultCard', () => {
  it('formats with @hisab/core: taka, Bangla digits, lakh grouping, 2 decimals for fractions', () => {
    expect(formatResult(64.95)).toBe('৳৬৪.৯৫')
    expect(formatResult(123456.5)).toBe('৳১,২৩,৪৫৬.৫০')
    expect(formatResult(5000, { digits: 'en' })).toBe('৳5,000')
    expect(formatResult(12.5, { format: 'number', decimals: 1 })).toBe('১২.৫')
  })

  it('reads label, final value and sub in order; the animated number is hidden from screen readers', () => {
    document.documentElement.dataset.motion = 'reduce'
    const { container } = render(<ResultCard label="সবচেয়ে কম চার্জ: নগদ অ্যাপ" value={64.95} sub="হাতে পাবে ৳৫,০০০" />)
    const group = container.firstElementChild as HTMLElement
    expect(screen.getByText('সবচেয়ে কম চার্জ: নগদ অ্যাপ')).toBeTruthy()
    expect(group.querySelector('[id]')).toBeNull()
    const live = group.querySelector('[aria-live="polite"]')!
    expect(live.textContent).toBe('৳৬৪.৯৫')
    expect(group.querySelector('[data-result-value]')!.getAttribute('aria-hidden')).toBe('true')
    expect(group.textContent).toContain('হাতে পাবে ৳৫,০০০')
  })

  it('jumps straight to the value with reduced motion', async () => {
    document.documentElement.dataset.motion = 'reduce'
    const { container } = render(<ResultCard label="চার্জ" value={92.5} />)
    await waitFor(() => expect(valueText(container)).toBe('৳৯২.৫০'))
  })

  it('counts up with motion and lands exactly on the value', async () => {
    document.documentElement.dataset.motion = 'full'
    const { container } = render(<ResultCard label="চার্জ" value={1013.95} digits="en" />)
    await waitFor(() => expect(valueText(container)).toBe('৳1,013.95'), { timeout: 3000 })
  })

  it('counts from the shown value when the value changes, and keeps the suffix', async () => {
    document.documentElement.dataset.motion = 'reduce'
    const { container, rerender } = render(<ResultCard label="রেট" value={13.95} suffix="/হাজার" />)
    await waitFor(() => expect(valueText(container)).toBe('৳১৩.৯৫/হাজার'))
    rerender(<ResultCard label="রেট" value={18.5} suffix="/হাজার" />)
    await waitFor(() => expect(valueText(container)).toBe('৳১৮.৫০/হাজার'))
  })

  it('is a 12px-radius ledger page: rules drawn over the line boxes (no extra height), margin line on top', () => {
    const { container } = render(<ResultCard label="চার্জ" value={64.95} sub="হাতে পাবে ৳৫,০০০" countUp={false} />)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('rounded-[12px]')
    const [label, value] = [...card.querySelectorAll('p')]
    for (const line of [label!, value!]) {
      // A pseudo-element rule 1px above the bottom of the line, never a border that adds 1px.
      expect(line.className).toContain('after:bottom-px')
      expect(line.className).toContain('after:bg-rule')
      expect(line.className).not.toContain('border-b')
      expect(line.className).toContain('pl-8.5')
    }
    // Figma: 28px label line, 56px number line in the number face with the Bangla fallback.
    expect(label!.className).toContain('leading-7')
    expect(value!.className).toContain('leading-14')
    expect(value!.className).toContain('hk-nav-num')
    // The margin line comes last so it paints over the rules, 19px from the outer edge.
    const margin = card.lastElementChild!
    expect(margin.hasAttribute('data-result-margin')).toBe(true)
    expect(margin.getAttribute('aria-hidden')).toBe('true')
    expect(margin.className).toContain('left-4.5')
  })

  it('without countUp shows the value at once; enters with rise-in unless disabled', () => {
    const { container } = render(<ResultCard label="মোট" value={5064.95} countUp={false} enter={false} />)
    expect(valueText(container)).toBe('৳৫,০৬৪.৯৫')
    expect(container.firstElementChild!.className).not.toContain('animate-rise-in')
    const entered = render(<ResultCard label="মোট" value={1} countUp={false} />).container
    expect(entered.firstElementChild!.className).toContain('animate-rise-in')
  })
})
