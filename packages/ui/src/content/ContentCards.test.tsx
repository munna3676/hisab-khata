import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionBar } from './ActionBar'
import { AtAGlance } from './AtAGlance'
import { BankCard } from './BankCard'
import { RemittanceCard } from './RemittanceCard'
import { StepList } from './StepItem'

afterEach(cleanup)

const rates = [
  { label: 'সর্বোচ্চ FDR', value: '—%' },
  { label: 'DPS', value: '—%' },
  { label: 'পার্সোনাল লোন', value: '—%' },
  { label: 'চতুর্থ', value: '১%' },
]

describe('BankCard', () => {
  it('shows at most three rates and a details link named after the bank', () => {
    render(<BankCard name="ব্র্যাক ব্যাংক" initials="BB" rates={rates} href="/banks/brac" />)
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['সর্বোচ্চ FDR', 'DPS', 'পার্সোনাল লোন'])
    // Rate labels wrap instead of clipping Bangla text.
    expect(screen.getByText('পার্সোনাল লোন').className).not.toContain('truncate')
    const link = screen.getByRole('link', { name: /ব্র্যাক ব্যাংক: বিস্তারিত/ })
    expect(link.getAttribute('href')).toBe('/banks/brac')
    expect(link.className).toContain('min-h-touch')
    expect(screen.getByRole('article').className).toContain('lift')
  })

  it('the compare checkbox is native, 44px and stays in step when controlled', () => {
    const onCompareChange = vi.fn()
    render(<BankCard name="সোনালী" initials="SB" rates={[]} compareLabel="তুলনায় যোগ করো" compared={false} onCompareChange={onCompareChange} />)
    const box = screen.getByRole('checkbox', { name: 'তুলনায় যোগ করো' }) as HTMLInputElement
    expect(box.closest('label')!.className).toContain('min-h-touch')
    fireEvent.click(box)
    expect(onCompareChange).toHaveBeenCalledWith(true)
    expect(box.checked).toBe(false)
  })

  it('without href it is not a link and does not lift', () => {
    render(<BankCard name="ডাচ্-বাংলা" initials="DBBL" rates={rates} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('article').className).not.toContain('lift')
  })
})

describe('RemittanceCard', () => {
  it('best gets the badge, green border and a primary action named after the service', () => {
    render(<RemittanceCard service="সার্ভিস A" amount="৳৩২,৪৮০" fee="০" rate="৩২.৪৮" time="মিনিটে" best href="#a" />)
    expect(screen.getByText('সেরা')).toBeTruthy()
    expect(screen.getByRole('article').className).toContain('border-good')
    expect(screen.getByRole('link', { name: /সার্ভিস A: পাঠাও/ })).toBeTruthy()
  })

  it('has no button without href or onAction', () => {
    render(<RemittanceCard service="B" amount="১" fee="০" rate="১" time="১ দিন" />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('StepList', () => {
  it('is an ordered list numbered in Bangla digits from `start`', () => {
    render(<StepList start={9} steps={[{ title: 'এক' }, { title: 'দুই', description: 'বিস্তারিত' }]} titleAs="h4" />)
    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(list.getAttribute('start')).toBe('9')
    const items = screen.getAllByRole('listitem')
    expect(items.map((li) => li.querySelector('span')!.textContent)).toEqual(['৯', '১০'])
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2)
  })
})

describe('AtAGlance', () => {
  it('is a section named by its title with the facts as a description list', () => {
    render(<AtAGlance facts={[{ label: 'ফি', value: '১০০' }, { label: 'সাইট', value: 'nidw.gov.bd', href: 'https://nidw.gov.bd' }]} />)
    expect(screen.getByRole('region', { name: 'এক নজরে' })).toBeTruthy()
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['ফি', 'সাইট'])
    const link = screen.getByRole('link', { name: 'nidw.gov.bd' })
    expect(link.className).toContain('min-h-touch')
  })
})

describe('ActionBar', () => {
  it('is a named group of three 44px buttons that call their handlers', () => {
    const onShare = vi.fn()
    const onPdf = vi.fn()
    const onReport = vi.fn()
    render(<ActionBar onShare={onShare} onPdf={onPdf} onReport={onReport} />)
    expect(screen.getByRole('group', { name: 'ফলাফল শেয়ার, সেভ বা ভুল জানানো' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'শেয়ার' }))
    fireEvent.click(screen.getByRole('button', { name: 'PDF' }))
    fireEvent.click(screen.getByRole('button', { name: 'ভুল পেলেন?' }))
    expect([onShare, onPdf, onReport].map((f) => f.mock.calls.length)).toEqual([1, 1, 1])
  })

  it('hide drops actions and reportHref makes the report a link', () => {
    render(<ActionBar hide={['pdf']} reportHref="/report" />)
    expect(screen.queryByRole('button', { name: 'PDF' })).toBeNull()
    expect(screen.getByRole('link', { name: 'ভুল পেলেন?' }).getAttribute('href')).toBe('/report')
  })
})
