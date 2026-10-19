// Badge, KV Row, Compare Row, Verified Line, Callout and Ad Slot: the read-only base components.
import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
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
})
