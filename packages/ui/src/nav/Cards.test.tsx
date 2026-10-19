import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { AnswerCard } from './AnswerCard'
import { Footer } from './Footer'
import { ListRow } from './ListRow'
import { Logo } from './Logo'
import { SectionCard } from './SectionCard'
import { ToolCard } from './ToolCard'

afterEach(cleanup)

describe('ToolCard', () => {
  it('is one link holding category, heading, description and example', () => {
    render(
      <ToolCard
        href="/tools/cash-out/"
        tag="মোবাইল ব্যাংকিং"
        title="ক্যাশ আউট চার্জ ক্যালকুলেটর"
        description="বিকাশ, নগদ, রকেটের ৭টা উপায় পাশাপাশি"
        example="১,০০০ তুলতে রাখতে হবে ৳১,০১৩.৯৫"
      />,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/tools/cash-out/')
    expect(link.className).toContain('lift')
    expect(link.className).toContain('pressable')
    expect(screen.getByRole('heading', { level: 3, name: 'ক্যাশ আউট চার্জ ক্যালকুলেটর' })).toBeTruthy()
    expect(link.textContent).toContain('১,০০০ তুলতে রাখতে হবে ৳১,০১৩.৯৫')
  })

  it('leaves out the example line and changes the heading level on request', () => {
    const { container } = render(<ToolCard href="#" title="EMI" titleAs="h4" />)
    expect(screen.getByRole('heading', { level: 4, name: 'EMI' })).toBeTruthy()
    expect(container.querySelector('.font-number')).toBeNull()
  })

  it('icons and the margin rule are hidden from assistive tech', () => {
    const { container } = render(<ToolCard href="#" title="EMI" />)
    for (const svg of container.querySelectorAll('svg')) expect(svg.closest('[aria-hidden="true"]')).toBeTruthy()
  })
})

describe('SectionCard', () => {
  it('is a lifting link with a heading and subtitle', () => {
    render(<SectionCard href="/mfs/" title="মোবাইল ব্যাংকিং" subtitle="বিকাশ, নগদ, রকেট, উপায়" />)
    const link = screen.getByRole('link', { name: /মোবাইল ব্যাংকিং/ })
    expect(link.className).toContain('lift')
    expect(screen.getByRole('heading', { name: 'মোবাইল ব্যাংকিং' })).toBeTruthy()
  })
})

describe('ListRow', () => {
  it('is a link at least 44px tall with a bottom rule unless last', () => {
    const { rerender } = render(<ListRow href="/guides/nid/" title="NID সংশোধন কিভাবে করবো" subtitle="গাইড · ফি, কাগজপত্র, ধাপ" />)
    let link = screen.getByRole('link')
    expect(link.className).toContain('min-h-touch')
    expect(link.className).toContain('border-b')
    rerender(<ListRow href="/guides/nid/" title="NID" last />)
    link = screen.getByRole('link')
    expect(link.className).not.toContain('border-b')
  })

  it('can drop the icon tile', () => {
    const { container } = render(<ListRow href="#" title="x" icon={null} />)
    expect(container.querySelectorAll('svg')).toHaveLength(1) // the chevron only
  })
})

describe('AnswerCard', () => {
  it('shows the question as a heading, the answer and a link to the full comparison', () => {
    render(
      <AnswerCard
        question="বিকাশে ৫,০০০ টাকা ক্যাশ আউট"
        answer="৳৬৯.৭৫"
        detail="প্রিয় এজেন্ট · অন্য এজেন্টে ৳৯২.৫০"
        href="/tools/cash-out/?amount=5000"
      />,
    )
    expect(screen.getByRole('heading', { name: 'বিকাশে ৫,০০০ টাকা ক্যাশ আউট' })).toBeTruthy()
    expect(screen.getByText('৳৬৯.৭৫')).toBeTruthy()
    const link = screen.getByRole('link', { name: 'পুরো তুলনা দেখো →' })
    expect(link.className).toContain('min-h-touch')
  })
})

describe('Logo and Footer', () => {
  it('the logo is text unless it has a link; the mark is decorative', () => {
    const { container, rerender } = render(<Logo />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(container.querySelector('[data-logo-mark]')!.getAttribute('aria-hidden')).toBe('true')
    rerender(<Logo href="/" name="Hisab Khata" />)
    expect(screen.getByRole('link', { name: 'Hisab Khata' }).className).toContain('min-h-touch')
  })

  it('the footer has a named links nav and the copyright', () => {
    render(<Footer />)
    const nav = screen.getByRole('navigation', { name: 'সাইটের তথ্য' })
    expect(nav.querySelectorAll('a')).toHaveLength(5)
    expect(screen.getByRole('contentinfo').textContent).toContain('© ২০২৬ হিসাব খাতা')
  })

  it('the footer layout is a container query by default and can be forced', () => {
    const auto = render(<Footer />).container.querySelector('footer')!
    expect(auto.className).toContain('@container')
    expect(auto.innerHTML).toContain('@4xl:flex-row')
    const desk = render(<Footer layout="desktop" />).container.querySelector('footer')!
    expect(desk.innerHTML).not.toContain('@4xl:flex-row')
    expect(desk.querySelector('.flex-row')).toBeTruthy()
  })
})
