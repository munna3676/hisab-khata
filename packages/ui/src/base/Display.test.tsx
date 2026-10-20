// Badge, KV Row, Compare Row, Verified Line, Callout and Ad Slot: the read-only base components.
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdSlot } from './AdSlot'
import { Badge } from './Badge'
import { Callout } from './Callout'
import { CompareRow } from './CompareRow'
import { KVList, KVRow } from './KVRow'
import { formatCheckedDate, VerifiedLine } from './VerifiedLine'

afterEach(cleanup)

describe('Badge', () => {
  it.each([
    ['good', 'bg-good'],
    ['warn', 'bg-warn-bg'],
    ['accent', 'bg-accent-tint'],
    ['neutral', 'bg-subtle'],
  ] as const)('%s uses %s', (tone, cls) => {
    render(<Badge tone={tone}>লেবেল {tone}</Badge>)
    expect(screen.getByText(`লেবেল ${tone}`).className).toContain(cls)
  })

  it('is a 26px nowrap pill by default; wrap lets a long badge shrink and wrap instead of overflowing', () => {
    render(
      <>
        <Badge>সাশ্রয়ী</Badge>
        <Badge tone="warn" wrap>
          এটিএম ন্যূনতম ৳৫০০
        </Badge>
      </>,
    )
    const pill = screen.getByText('সাশ্রয়ী').className
    expect(pill).toContain('h-6.5')
    expect(pill).toContain('whitespace-nowrap')
    expect(pill).toContain('shrink-0')
    const long = screen.getByText('এটিএম ন্যূনতম ৳৫০০').className
    expect(long).toContain('min-h-6.5')
    expect(long).toContain('max-w-full')
    expect(long).not.toContain('whitespace-nowrap')
    expect(long).not.toContain('shrink-0')
  })

  it('appear adds the entrance animation', () => {
    render(<Badge appear>সাশ্রয়ী</Badge>)
    expect(screen.getByText('সাশ্রয়ী').className).toContain('hk-badge-in')
  })
})

describe('KVRow', () => {
  it('renders dt/dd pairs inside a dl, total with the ink rule', () => {
    const { container } = render(
      <KVList>
        <KVRow label="মোট সুদ" value="৳৯৭,৮৫৮" />
        <KVRow label="মোট পরিশোধ" value="৳৫,৯৭,৮৫৮" total />
      </KVList>,
    )
    const dl = container.querySelector('dl')!
    expect([...dl.querySelectorAll('dt')].map((n) => n.textContent)).toEqual(['মোট সুদ', 'মোট পরিশোধ'])
    expect([...dl.querySelectorAll('dd')].map((n) => n.textContent)).toEqual(['৳৯৭,৮৫৮', '৳৫,৯৭,৮৫৮'])
    const [row, total] = [...dl.children] as HTMLElement[]
    expect(row!.className).toContain('border-rule')
    expect(total!.className).toContain('border-t-2')
    expect(total!.querySelector('dd')!.className).toContain('font-bold')
  })
})

describe('CompareRow', () => {
  it('default: brand dot, provider, method, charge and total; no badge', () => {
    const { container } = render(
      <CompareRow provider="বিকাশ" method="যেকোনো এজেন্ট · ১৮.৫০/হাজার" charge="৳৯২.৫০" total="মোট ৳৫,০৯২.৫০" brand="bkash" />,
    )
    expect(container.querySelector('.bg-bkash')).toBeTruthy()
    expect(screen.getByText('৳৯২.৫০')).toBeTruthy()
    expect(screen.queryByText('সাশ্রয়ী')).toBeNull()
  })

  it('best: green row with the সাশ্রয়ী badge; warning: the লিমিট পার badge', () => {
    const { container } = render(
      <>
        <CompareRow provider="নগদ" charge="৳৬৪.৯৫" state="best" brand="nagad" />
        <CompareRow provider="রকেট" charge="৳৯২.৫০" state="warning" brand="rocket" />
      </>,
    )
    expect(screen.getByText('সাশ্রয়ী')).toBeTruthy()
    expect(screen.getByText('লিমিট পার')).toBeTruthy()
    expect(container.firstElementChild!.className).toContain('bg-good-bg')
  })

  it('its badge may wrap, so a long custom badge never runs into the charge column', () => {
    render(<CompareRow provider="রকেট" charge="৳৪৫.০০" state="warning" badge="এটিএম ন্যূনতম ৳৫০০" />)
    const badge = screen.getByText('এটিএম ন্যূনতম ৳৫০০')
    expect(badge.className).toContain('max-w-full')
    expect(badge.className).toContain('hk-badge-in')
    expect(screen.queryByText('লিমিট পার')).toBeNull()
  })

  it('with onClick the whole row is one button', () => {
    const onClick = vi.fn()
    render(<CompareRow provider="নগদ" charge="৳৬৪.৯৫" onClick={onClick} />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.className).toContain('pressable')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('with href the whole row is a link that lifts', () => {
    render(<CompareRow provider="বিকাশ" charge="৳৯২.৫০" href="/mfs/bkash/cash-out" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/mfs/bkash/cash-out')
    expect(link.className).toContain('lift')
    expect(link.className).toContain('pressable')
  })
})

describe('VerifiedLine', () => {
  it('formats the checked date in Bangla or English', () => {
    expect(formatCheckedDate('2026-10-19')).toBe('১৯ অক্টোবর ২০২৬')
    expect(formatCheckedDate('2026-10-19', 'en')).toBe('19 October 2026')
    expect(formatCheckedDate('not a date')).toBe('not a date')
  })

  it('shows the date as <time> and the source host as a link', () => {
    const { container } = render(<VerifiedLine checked="2026-10-19" source="https://www.bkash.com/charges" />)
    expect(container.querySelector('time')!.getAttribute('datetime')).toBe('2026-10-19')
    const link = screen.getByRole('link', { name: /bkash\.com/ })
    expect(link.getAttribute('href')).toBe('https://www.bkash.com/charges')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(container.textContent).toContain('যাচাই: ১৯ অক্টোবর ২০২৬ · সূত্র: bkash.com')
  })

  it('says the link opens a new tab (screen readers only) and is underlined, not colour-only', () => {
    render(<VerifiedLine checked="2026-10-19" source="https://www.bkash.com/" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.querySelector('.sr-only')!.textContent).toContain('নতুন ট্যাবে খোলে')
    expect(link.className).toContain('underline')
  })

  it('English labels; newTab=false opens in place', () => {
    const { container } = render(<VerifiedLine checked="2026-10-19" source="https://nbr.gov.bd/x" lang="en" newTab={false} sourceLabel="NBR" />)
    expect(container.textContent).toBe('Verified: 19 October 2026 · Source: NBR')
    const link = screen.getByRole('link', { name: 'NBR' })
    expect(link.hasAttribute('target')).toBe(false)
    expect(link.hasAttribute('rel')).toBe(false)
  })

  it('sourcePrefix=false lets the link text stand alone (Figma Calculator: "· অফিসিয়াল সূত্র")', () => {
    const { container } = render(<VerifiedLine checked="2026-10-19" source="https://www.bkash.com/" sourceLabel="অফিসিয়াল সূত্র" sourcePrefix={false} newTab={false} />)
    expect(container.textContent).toBe('যাচাই: ১৯ অক্টোবর ২০২৬ · অফিসিয়াল সূত্র')
    expect(screen.getByRole('link', { name: 'অফিসিয়াল সূত্র' })).toBeTruthy()
  })

  it('draws the shield as Figma does: an 18px slot holding the 24px glyph, in good green', () => {
    const { container } = render(<VerifiedLine checked="2026-10-19" source="https://www.bkash.com/" />)
    const slot = container.querySelector<HTMLElement>('[data-verified-icon]')!
    expect(slot.className).toContain('size-4.5')
    expect(slot.className).toContain('text-good')
    expect(slot.querySelector('svg')!.getAttribute('width')).toBe('24')
  })
})

describe('Callout', () => {
  it('is a note; info is subtle with a blue icon, warn uses the warn colours', () => {
    render(
      <>
        <Callout>রেট পরিবর্তন হতে পারে</Callout>
        <Callout tone="warn">চার্জ আলাদা কাটে</Callout>
      </>,
    )
    const [info, warn] = screen.getAllByRole('note')
    expect(info!.className).toContain('bg-subtle')
    expect(info!.querySelector('.text-blue svg')).toBeTruthy()
    expect(warn!.className).toContain('bg-warn-bg')
    expect(warn!.querySelector('.text-warn svg')).toBeTruthy()
  })

  it('lays the icon out as Figma does: a 20px slot holding the 24px glyph, top-aligned (no offset)', () => {
    render(<Callout>নোট</Callout>)
    const slot = screen.getByRole('note').querySelector<HTMLElement>('[data-callout-icon]')!
    expect(slot.className).toContain('size-5')
    expect(slot.className).not.toMatch(/\bmt-/)
    const svg = slot.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('takes a title line and a custom icon', () => {
    render(
      <Callout title="হিসাবটা কীভাবে হলো" icon={<span data-testid="own-icon" />}>
        প্রতি হাজারে ১৮.৫০ টাকা
      </Callout>,
    )
    const note = screen.getByRole('note')
    expect(screen.getByText('হিসাবটা কীভাবে হলো').className).toContain('type-label')
    expect(note.querySelector('[data-testid="own-icon"]')).toBeTruthy()
    expect(note.querySelectorAll('svg')).toHaveLength(0)
  })

  it('keeps a role the caller passes (e.g. status for a live note)', () => {
    render(<Callout role="status">আপডেট হয়েছে</Callout>)
    expect(screen.getByRole('status').textContent).toBe('আপডেট হয়েছে')
  })
})

describe('AdSlot', () => {
  it.each([
    ['mobile-banner', 'h-[100px]'],
    ['mpu', 'w-[300px]'],
    ['leaderboard', 'w-[728px]'],
  ] as const)('%s reserves its fixed size', (size, cls) => {
    const { container } = render(<AdSlot size={size} showSize />)
    const slot = container.querySelector(`[data-ad-slot="${size}"]`)!
    expect(slot.className).toContain(cls)
    expect(slot.textContent).toContain('বিজ্ঞাপন · ')
  })

  it('sizes are px, not rem: an ad creative does not grow with the large-font setting', () => {
    const { container } = render(<AdSlot size="mpu" />)
    const slot = container.querySelector<HTMLElement>('[data-ad-slot]')!
    expect(slot.className).toMatch(/h-\[250px\]/)
    expect(slot.className).not.toMatch(/\bh-62\.5\b/)
  })

  it('responsive names both sizes, each shown only at its breakpoint', () => {
    const { container } = render(<AdSlot size="responsive" showSize />)
    expect(container.querySelector('.md\\:hidden')!.textContent).toContain('Mobile Banner')
    expect(container.querySelector('.md\\:inline')!.textContent).toContain('Leaderboard')
  })

  it('the ad replaces the placeholder, and the slot keeps its size', () => {
    const { container } = render(
      <AdSlot size="mobile-banner">
        <ins data-testid="ad" />
      </AdSlot>,
    )
    expect(screen.getByTestId('ad')).toBeTruthy()
    expect(container.textContent).not.toContain('বিজ্ঞাপন')
    expect(container.querySelector('[data-ad-slot]')!.className).toContain('h-[100px]')
  })
})
