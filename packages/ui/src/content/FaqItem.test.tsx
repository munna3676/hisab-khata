import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FaqItem } from './FaqItem'
import { FaqList } from './FaqList'

afterEach(cleanup)

const Q = 'বিকাশে ১০০০ টাকা ক্যাশ আউটে কত চার্জ?'
const A = 'প্রিয় এজেন্টে ১৩.৯৫ টাকা।'

const answerOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls') ?? '')!

describe('FaqItem', () => {
  it('is a button inside a heading that controls its answer', () => {
    render(<FaqItem question={Q} answer={A} headingLevel={4} />)
    const button = screen.getByRole('button', { name: Q })
    expect(button.parentElement?.tagName).toBe('H4')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    const panel = answerOf(button)
    expect(panel).toBeTruthy()
    expect(panel.textContent).toBe(A)
    // Closed: hidden until found (still in the HTML for search engines and find-in-page).
    expect(panel.hidden || panel.hasAttribute('hidden')).toBe(true)
    expect(button.className).toContain('min-h-touch')
  })

  it('toggles on click and reports the new state', () => {
    const onToggle = vi.fn()
    render(<FaqItem question={Q} answer={A} onToggle={onToggle} />)
    const button = screen.getByRole('button', { name: Q })
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(answerOf(button).hasAttribute('hidden')).toBe(false)
    expect(answerOf(button).hasAttribute('data-toggled')).toBe(true)
    expect(onToggle).toHaveBeenLastCalledWith(true)
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(onToggle).toHaveBeenLastCalledWith(false)
  })

  it('is operable from the keyboard: a native button in the tab order (Enter/Space click it)', () => {
    render(<FaqItem question={Q} answer={A} />)
    const button = screen.getByRole('button', { name: Q })
    expect(button.tabIndex).toBe(0)
    button.focus()
    expect(document.activeElement).toBe(button)
    // Browsers turn Enter/Space on a <button> into a click.
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('an answer open on load shows without the opening animation', () => {
    render(<FaqItem question={Q} answer={A} defaultOpen />)
    const button = screen.getByRole('button', { name: Q })
    expect(button.getAttribute('aria-expanded')).toBe('true')
    const panel = answerOf(button)
    expect(panel.hasAttribute('data-open')).toBe(true)
    expect(panel.hasAttribute('data-toggled')).toBe(false)
  })

  it('opens when find-in-page matches text in the closed answer (beforematch)', () => {
    render(<FaqItem question={Q} answer={A} />)
    const button = screen.getByRole('button', { name: Q })
    fireEvent(answerOf(button), new Event('beforematch'))
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('controlled: follows `open` and only asks to change', () => {
    const onToggle = vi.fn()
    render(<FaqItem question={Q} answer={A} open={false} onToggle={onToggle} />)
    const button = screen.getByRole('button', { name: Q })
    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledWith(true)
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('two items get different ids', () => {
    render(
      <div>
        <FaqItem question="এক" answer="১" />
        <FaqItem question="দুই" answer="২" />
      </div>,
    )
    const [a, b] = screen.getAllByRole('button')
    expect(a!.id).not.toBe(b!.id)
    expect(a!.getAttribute('aria-controls')).not.toBe(b!.getAttribute('aria-controls'))
  })
})

describe('FaqList', () => {
  const items = [
    { question: 'প্রশ্ন ১', answer: 'উত্তর ১' },
    { question: 'প্রশ্ন ২', answer: 'উত্তর ২' },
    { question: 'প্রশ্ন ৩', answer: 'উত্তর ৩' },
  ]

  it('single keeps one answer open', () => {
    render(<FaqList items={items} single defaultOpen={[0]} />)
    const [b1, b2] = screen.getAllByRole('button')
    expect(b1!.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(b2!)
    expect(b1!.getAttribute('aria-expanded')).toBe('false')
    expect(b2!.getAttribute('aria-expanded')).toBe('true')
  })

  it('without single several answers stay open', () => {
    render(<FaqList items={items} defaultOpen={[0]} />)
    const [b1, b2] = screen.getAllByRole('button')
    fireEvent.click(b2!)
    expect(b1!.getAttribute('aria-expanded')).toBe('true')
    expect(b2!.getAttribute('aria-expanded')).toBe('true')
  })

  it('emits FAQPage JSON-LD with the plain-text answers', () => {
    const { container } = render(<FaqList items={[{ ...items[0]!, content: <b>রিচ</b> }]} jsonLd />)
    const script = container.querySelector('script[type="application/ld+json"]')!
    const data = JSON.parse(script.textContent ?? '')
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity[0].name).toBe('প্রশ্ন ১')
    expect(data.mainEntity[0].acceptedAnswer.text).toBe('উত্তর ১')
    // The visible answer is the rich content.
    expect(screen.getByText('রিচ').tagName).toBe('B')
  })

  it('microdata marks the list, questions and answers', () => {
    const { container } = render(<FaqList items={items.slice(0, 1)} microdata />)
    expect(container.querySelector('[itemtype="https://schema.org/FAQPage"]')).toBeTruthy()
    expect(container.querySelector('[itemprop="mainEntity"][itemtype="https://schema.org/Question"]')).toBeTruthy()
    expect(container.querySelector('[itemprop="name"]')?.textContent).toBe('প্রশ্ন ১')
    expect(container.querySelector('[itemprop="acceptedAnswer"] [itemprop="text"]')?.textContent).toBe('উত্তর ১')
  })
})
