import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { filterOptions, matchRank, normalizeText, romanize, skeleton } from './filter'
import { Picker, PickerSheet, type PickerOption } from './Picker'

afterEach(cleanup)

const COUNTRIES: PickerOption[] = [
  { value: 'SA', label: 'সৌদি আরব', description: 'SAR · সৌদি রিয়াল', keywords: ['Saudi Arabia', 'KSA'] },
  { value: 'AE', label: 'সংযুক্ত আরব আমিরাত', description: 'AED · দিরহাম', keywords: ['UAE', 'Dubai'] },
  { value: 'MY', label: 'মালয়েশিয়া', description: 'MYR · রিংগিত', keywords: ['Malaysia'] },
  { value: 'US', label: 'যুক্তরাষ্ট্র', description: 'USD · ডলার', keywords: ['USA', 'America'] },
  { value: 'GB', label: 'যুক্তরাজ্য', description: 'GBP · পাউন্ড', keywords: ['UK', 'England'] },
  { value: 'IT', label: 'ইতালি', description: 'EUR · ইউরো', keywords: ['Italy'] },
]

const DISTRICTS: PickerOption[] = [
  { value: 'dhaka', label: 'ঢাকা', description: 'ঢাকা বিভাগ', group: 'division' },
  { value: 'chattogram', label: 'চট্টগ্রাম', description: 'চট্টগ্রাম বিভাগ', keywords: ['Chittagong'], group: 'division' },
  { value: 'rajshahi', label: 'রাজশাহী', description: 'রাজশাহী বিভাগ', group: 'division' },
  { value: 'gazipur', label: 'গাজীপুর', description: 'ঢাকা বিভাগ', group: 'other' },
  { value: 'cumilla', label: 'কুমিল্লা', description: 'চট্টগ্রাম বিভাগ', keywords: ['Comilla'], group: 'other' },
]

const values = (list: PickerOption[]) => list.map((o) => o.value)

describe('Bangla + Banglish filtering', () => {
  it('normalises digits, case, punctuation and the split nukta letters', () => {
    expect(normalizeText('  ১২৩ USD, ডলার ')).toBe('123 usd ডলার')
    expect(romanize('ঢাকা')).toBe('dhaka')
    expect(romanize('মালয়েশিয়া')).toContain('y')
    expect(skeleton('dhaka')).toBe('dk')
    expect(skeleton('ঢাকা')).toBe('dk')
    expect(skeleton('chattogram')).toBe(skeleton('চট্টগ্রাম'))
  })

  it('matches Bangla text, Banglish spellings and English keywords', () => {
    expect(values(filterOptions(DISTRICTS, 'ঢাকা'))).toEqual(['dhaka', 'gazipur'])
    expect(values(filterOptions(DISTRICTS, 'dhaka'))[0]).toBe('dhaka')
    expect(values(filterOptions(DISTRICTS, 'daka'))[0]).toBe('dhaka')
    expect(values(filterOptions(DISTRICTS, 'chottogram'))).toContain('chattogram')
    expect(values(filterOptions(DISTRICTS, 'Chittagong'))).toEqual(['chattogram'])
    expect(values(filterOptions(DISTRICTS, 'comilla'))).toEqual(['cumilla'])
    expect(values(filterOptions(COUNTRIES, 'saudi'))).toEqual(['SA'])
    expect(values(filterOptions(COUNTRIES, 'usd'))).toEqual(['US'])
    expect(values(filterOptions(COUNTRIES, 'malaysia'))).toEqual(['MY'])
    expect(values(filterOptions(COUNTRIES, 'xyzzy'))).toEqual([])
  })

  it('ranks label prefixes first and keeps the given order within a rank', () => {
    // যুক্তরাষ্ট্র and যুক্তরাজ্য start with it; সংযুক্ত আরব আমিরাত only contains it.
    expect(values(filterOptions(COUNTRIES, 'যুক্ত'))).toEqual(['US', 'GB', 'AE'])
    expect(matchRank(COUNTRIES[0]!, 'সৌদি')).toBe(0)
    expect(matchRank(COUNTRIES[0]!, 'রিয়াল')).toBe(1)
    // An empty query keeps everything.
    expect(filterOptions(COUNTRIES, '  ')).toHaveLength(COUNTRIES.length)
  })
})

function renderPicker(onChange = vi.fn(), value: string | null = 'SA') {
  render(<Picker label="দেশ" searchPlaceholder="দেশের নাম লেখো" options={COUNTRIES} value={value} onChange={onChange} />)
  const input = screen.getByRole('combobox') as HTMLInputElement
  return { input, onChange }
}

describe('Picker', () => {
  it('lists every option with the selected one ticked', () => {
    renderPicker()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(6)
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
    expect(options[0]!.querySelector('svg')).toBeTruthy()
    expect(options[1]!.getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('listbox', { name: 'দেশ' })).toBeTruthy()
  })

  it('filters as you type (Banglish)', () => {
    const { input } = renderPicker()
    fireEvent.input(input, { target: { value: 'italy' } })
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['ইতালিEUR · ইউরো'])
    fireEvent.input(input, { target: { value: 'নেই' } })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByRole('status').textContent).toContain('নেই')
  })

  it('arrow keys move the active option (wrapping) and Enter picks it', () => {
    const { input, onChange } = renderPicker(vi.fn(), null)
    const active = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()).toContain('সৌদি আরব')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()).toContain('সংযুক্ত আরব আমিরাত')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(active()).toContain('ইতালি')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()).toContain('সৌদি আরব')
    fireEvent.keyDown(input, { key: 'End', ctrlKey: true })
    expect(active()).toContain('ইতালি')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('IT', COUNTRIES[5])
  })

  it('after filtering, the best match is active so Enter picks it', () => {
    const { input, onChange } = renderPicker()
    fireEvent.input(input, { target: { value: 'uk' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('GB', COUNTRIES[4])
  })

  it('a click picks an option', () => {
    const { onChange } = renderPicker()
    fireEvent.click(screen.getByRole('option', { name: /মালয়েশিয়া/ }))
    expect(onChange).toHaveBeenCalledWith('MY', COUNTRIES[2])
  })

  it('groups options under labelled groups', () => {
    render(
      <Picker
        label="জেলা"
        options={DISTRICTS}
        groups={[
          { id: 'division', label: 'বিভাগীয় শহর' },
          { id: 'other', label: 'অন্য জেলা' },
        ]}
      />,
    )
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent)).toEqual([
      'বিভাগীয় শহর',
      'অন্য জেলা',
    ])
  })

  it('PickerSheet closes after a pick', () => {
    const onClose = vi.fn()
    const onChange = vi.fn()
    render(<PickerSheet open title="কোন দেশ থেকে পাঠাবে?" options={COUNTRIES} onClose={onClose} onChange={onChange} />)
    expect(screen.getByRole('dialog', { name: 'কোন দেশ থেকে পাঠাবে?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('option', { name: /ইতালি/ }))
    expect(onChange).toHaveBeenCalledWith('IT', COUNTRIES[5])
    expect(onClose).toHaveBeenCalledWith('select')
  })
})
