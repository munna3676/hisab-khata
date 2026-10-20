import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addMonths, daysInMonth, formatYMD, monthGrid } from './calendar'
import { DatePicker } from './DatePicker'

afterEach(cleanup)

// fireEvent.change does not reach Preact's handler on these controlled selects in happy-dom; set and dispatch instead.
function choose(select: HTMLElement, value: string) {
  act(() => {
    ;(select as HTMLSelectElement).value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('calendar', () => {
  it('lays out March 2000 Saturday-first like Figma P5', () => {
    const weeks = monthGrid(2000, 2, 6)
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual([null, null, null, null, 1, 2, 3])
    expect(weeks[4]).toEqual([25, 26, 27, 28, 29, 30, 31])
  })

  it('knows month lengths and clamps month steps', () => {
    expect(daysInMonth(2000, 1)).toBe(29)
    expect(daysInMonth(1900, 1)).toBe(28)
    expect(addMonths({ year: 2001, month: 0, day: 31 }, 1)).toEqual({ year: 2001, month: 1, day: 28 })
    expect(formatYMD({ year: 2000, month: 2, day: 15 }, 'bn', 'bn')).toBe('১৫ মার্চ ২০০০')
    expect(formatYMD({ year: 2000, month: 2, day: 15 }, 'en', 'en')).toBe('15 March 2000')
  })
})

const MARCH_15 = new Date(2000, 2, 15)
const TODAY = new Date(2026, 9, 19)

describe('DatePicker', () => {
  it('shows the month in Bangla digits with the chosen day selected', () => {
    render(<DatePicker defaultValue={MARCH_15} today={TODAY} />)
    expect(screen.getByText('মার্চ ২০০০')).toBeTruthy()
    const day = screen.getByRole('gridcell', { name: '১৫ মার্চ ২০০০' })
    expect(day.getAttribute('aria-selected')).toBe('true')
    expect(day.tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: '১৫ মার্চ ২০০০ বেছে নাও' })).toBeTruthy()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'])
  })

  it('English digits and names', () => {
    render(<DatePicker lang="en" defaultValue={MARCH_15} today={TODAY} />)
    expect(screen.getByText('March 2000')).toBeTruthy()
    expect(screen.getByRole('gridcell', { name: '15 March 2000' }).textContent).toBe('15')
    expect(screen.getByRole('button', { name: 'Choose 15 March 2000' })).toBeTruthy()
  })

  it('Bangla names with English digits', () => {
    render(<DatePicker digits="en" defaultValue={MARCH_15} today={TODAY} />)
    expect(screen.getByText('মার্চ 2000')).toBeTruthy()
  })

  it('pages months with the chevrons and jumps years with the year select', () => {
    render(<DatePicker defaultValue={MARCH_15} today={TODAY} />)
    fireEvent.click(screen.getByRole('button', { name: 'পরের মাস' }))
    expect(screen.getByText('এপ্রিল ২০০০')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'আগের মাস' }))
    fireEvent.click(screen.getByRole('button', { name: 'আগের মাস' }))
    expect(screen.getByText('ফেব্রুয়ারি ২০০০')).toBeTruthy()
    choose(screen.getByRole('combobox', { name: 'বছর' }), '1995')
    expect(screen.getByText('ফেব্রুয়ারি ১৯৯৫')).toBeTruthy()
    choose(screen.getByRole('combobox', { name: 'মাস' }), '11')
    expect(screen.getByText('ডিসেম্বর ১৯৯৫')).toBeTruthy()
  })

  it('arrow keys move by day and week across months; Enter picks; confirm reports it', () => {
    const onConfirm = vi.fn()
    render(<DatePicker defaultValue={MARCH_15} today={TODAY} onConfirm={onConfirm} />)
    const grid = screen.getByRole('grid')
    screen.getByRole('gridcell', { name: '১৫ মার্চ ২০০০' }).focus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(document.activeElement?.getAttribute('aria-label')).toBe('১৬ মার্চ ২০০০')
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement?.getAttribute('aria-label')).toBe('২৩ মার্চ ২০০০')
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement?.getAttribute('aria-label')).toBe('৬ এপ্রিল ২০০০')
    expect(screen.getByText('এপ্রিল ২০০০')).toBeTruthy()
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    // 6 April 2000 is a Thursday; the week starts on Saturday 1 April.
    expect(document.activeElement?.getAttribute('aria-label')).toBe('১ এপ্রিল ২০০০')
    fireEvent.keyDown(document.activeElement!, { key: 'PageUp', shiftKey: true })
    expect(document.activeElement?.getAttribute('aria-label')).toBe('১ এপ্রিল ১৯৯৯')
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(grid.querySelector('[aria-selected="true"]')?.getAttribute('aria-label')).toBe('১ এপ্রিল ১৯৯৯')
    fireEvent.click(screen.getByRole('button', { name: '১ এপ্রিল ১৯৯৯ বেছে নাও' }))
    const picked = onConfirm.mock.calls[0]![0] as Date
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([1999, 3, 1])
  })

  it('confirm is disabled until a day is chosen; cancel calls back', () => {
    const onCancel = vi.fn()
    render(<DatePicker today={TODAY} onCancel={onCancel} />)
    expect((screen.getByRole('button', { name: 'একটা তারিখ বেছে নাও' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('gridcell', { name: '১৯ অক্টোবর ২০২৬' }).getAttribute('aria-current')).toBe('date')
    fireEvent.click(screen.getByRole('gridcell', { name: '২০ অক্টোবর ২০২৬' }))
    expect((screen.getByRole('button', { name: '২০ অক্টোবর ২০২৬ বেছে নাও' }) as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'বাতিল' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
