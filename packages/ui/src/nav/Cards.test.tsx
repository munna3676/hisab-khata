import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { AnswerCard } from './AnswerCard'
import { Footer } from './Footer'
import { IconTile, tileIconSize } from './IconTile'
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
    expect(container.querySelector('[data-tool-card-example]')).toBeNull()
  })

  it('sets the example in the number face with the Bangla body fallback (13/22 Medium, blue)', () => {
    const { container } = render(<ToolCard href="#" title="EMI" example="৫ লাখ, ১২%, ৩ বছর → ৳১৬,৬০৭" />)
    const example = container.querySelector('[data-tool-card-example]')!
    // hk-nav-num = var(--font-number), var(--font-body): plain font-number left Bangla to a system font.
    expect(example.className).toContain('hk-nav-num')
    expect(example.className).not.toContain('font-number')
    expect(example.className).toContain('text-[0.8125rem] leading-5.5 font-medium text-blue')
  })

  it('draws the khata margin rule where Figma has it (11/13/7px from the outer edge)', () => {
    const { container } = render(<ToolCard href="#" title="EMI" />)
    const rule = container.querySelector('a > span[aria-hidden="true"]')!
    // Absolute insets start inside the 1px border: 10/12/6.
    expect(rule.className).toContain('left-2.5')
    expect(rule.className).toContain('top-3')
    expect(rule.className).toContain('bottom-1.5')
    expect(rule.className).toContain('bg-margin')
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
    expect(link.className).toContain('pressable')
    expect(link.className).toContain('rounded-[12px]')
    expect(screen.getByRole('heading', { name: 'মোবাইল ব্যাংকিং' })).toBeTruthy()
  })

  it('drops the subtitle when there is none and takes another icon', () => {
    const { container } = render(<SectionCard href="/banks/" title="ব্যাংক" icon={<svg data-test-icon />} titleAs="h4" />)
    expect(screen.getByRole('heading', { level: 4, name: 'ব্যাংক' })).toBeTruthy()
    expect(container.querySelector('[data-test-icon]')).toBeTruthy()
    expect(screen.getByRole('link').textContent).toBe('ব্যাংক')
  })
})

describe('IconTile', () => {
  it('is a decorative accent-tint square: 40px with a 22px icon, or 36px with 20px', () => {
    const { container, rerender } = render(<IconTile><svg /></IconTile>)
    let tile = container.firstElementChild!
    expect(tile.getAttribute('aria-hidden')).toBe('true')
    expect(tile.className).toContain('size-10')
    expect(tile.className).toContain('bg-accent-tint')
    expect(tile.className).toContain('nudge')
    expect(tileIconSize()).toBe(22)
    rerender(<IconTile size="sm"><svg /></IconTile>)
    tile = container.firstElementChild!
    expect(tile.className).toContain('size-9')
    expect(tileIconSize('sm')).toBe(20)
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

  it('truncates the subtitle with room for Bangla glyph overhang, and names the link by its text', () => {
    const { container } = render(<ListRow href="#" title="ই-পাসপোর্ট নবায়ন" subtitle="গাইড · ফি, সময়, অনলাইন আবেদন" />)
    const subtitle = screen.getByText('গাইড · ফি, সময়, অনলাইন আবেদন')
    expect(subtitle.className).toContain('truncate')
    expect(subtitle.className).toContain('-mx-1')
    expect(subtitle.className).toContain('px-1')
    expect(screen.getByRole('link').textContent).toBe('ই-পাসপোর্ট নবায়নগাইড · ফি, সময়, অনলাইন আবেদন')
    expect(container.querySelector('a')!.className).toContain('hk-list-row')
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
    // The 44px hit area keeps the design's 20px line.
    expect(link.className).toContain('-my-3')
    expect(screen.getByText('৳৬৯.৭৫').className).toContain('hk-nav-num')
    expect(screen.getByText('প্রিয় এজেন্ট · অন্য এজেন্টে ৳৯২.৫০').className).toContain('type-body-small')
  })

  it('is a 12px-radius accent card; without href there is no link', () => {
    const { container } = render(<AnswerCard question="১ শতাংশ কত বর্গফুট" answer="৪৩৫.৬" questionAs="h2" eyebrow="উত্তর" />)
    const card = container.querySelector('[data-answer-card]')!
    expect(card.className).toContain('rounded-[12px]')
    expect(card.className).toContain('border-accent bg-accent-tint')
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: '১ শতাংশ কত বর্গফুট' })).toBeTruthy()
    expect(card.textContent).toContain('উত্তর')
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
    // Without homeHref the logo is plain text.
    expect(screen.queryByRole('link', { name: 'হিসাব খাতা' })).toBeNull()
  })

  it('the footer logo link keeps the 32px logo row; the current page link is marked', () => {
    render(<Footer homeHref="/" links={[{ href: '/about/', label: 'আমাদের কথা', current: true }, { href: '/privacy/', label: 'প্রাইভেসি' }]} />)
    expect(screen.getByRole('link', { name: 'হিসাব খাতা' }).className).toContain('-my-1.5')
    expect(screen.getByRole('link', { name: 'আমাদের কথা' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'প্রাইভেসি' }).getAttribute('aria-current')).toBeNull()
    // Hit area fills Figma's 30px row pitch and half of the 16px gap: neighbouring links meet, never overlap.
    for (const name of ['আমাদের কথা', 'প্রাইভেসি']) {
      const cls = screen.getByRole('link', { name }).className
      expect(cls).toContain('before:h-7.5')
      expect(cls).toContain('before:-inset-x-2')
      expect(cls).toContain('before:-translate-y-1/2')
    }
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
