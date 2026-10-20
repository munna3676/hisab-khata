import { cleanup, render, screen, within } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { BreakdownTable, type BreakdownColumn } from './BreakdownTable'

afterEach(cleanup)

interface Row {
  month: number
  emi: number
  interest: number
  balance?: number
  note?: string
}

const columns: BreakdownColumn<Row>[] = [
  { key: 'month', label: 'মাস', format: 'number' },
  { key: 'emi', label: 'কিস্তি', decimals: 2 },
  { key: 'interest', label: 'সুদ' },
  { key: 'balance', label: 'বাকি' },
  { key: 'note', label: 'নোট' },
]

const rows: Row[] = [
  { month: 1, emi: 44424.39, interest: 5000, balance: 460575.61, note: 'প্রথম' },
  { month: 12, emi: 44424.4, interest: 439.85, balance: 0 },
]

const cellText = (row: HTMLElement) => within(row).getAllByRole(/cell|rowheader/).map((c) => c.textContent)

describe('BreakdownTable', () => {
  it('formats taka and numbers with Bangla digits and lakh grouping', () => {
    render(<BreakdownTable title="মাসিক কিস্তির তালিকা" columns={columns} rows={rows} />)
    const [, first, last] = screen.getAllByRole('row')
    expect(cellText(first!)).toEqual(['১', '৳৪৪,৪২৪.৩৯', '৳৫,০০০', '৳৪,৬০,৫৭৫.৬১', 'প্রথম'])
    // decimals: 2 keeps trailing zeros; 0 is shown (not blank); missing values are blank.
    expect(cellText(last!)).toEqual(['১২', '৳৪৪,৪২৪.৪০', '৳৪৩৯.৮৫', '৳০', ''])
  })

  it('English digits', () => {
    render(<BreakdownTable title="EMI" columns={columns.slice(0, 2)} rows={rows.slice(0, 1)} digits="en" />)
    expect(cellText(screen.getAllByRole('row')[1]!)).toEqual(['1', '৳44,424.39'])
  })

  it('format text shows a number as given; a function key picks values', () => {
    const cols: BreakdownColumn<Row>[] = [
      { key: 'month', label: 'মাস', format: 'text' },
      { key: (r) => r.emi - r.interest, label: 'আসল', format: 'number', decimals: 0 },
    ]
    render(<BreakdownTable title="t" columns={cols} rows={rows.slice(0, 1)} />)
    expect(cellText(screen.getAllByRole('row')[1]!)).toEqual(['1', '৩৯,৪২৪'])
  })

  it('is a table named by its title, with column and row headers', () => {
    render(<BreakdownTable title="মাসিক কিস্তির তালিকা" titleAs="h2" columns={columns} rows={rows} />)
    const table = screen.getByRole('table', { name: 'মাসিক কিস্তির তালিকা' })
    expect(screen.getByRole('heading', { level: 2, name: 'মাসিক কিস্তির তালিকা' })).toBeTruthy()
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual(['মাস', 'কিস্তি', 'সুদ', 'বাকি', 'নোট'])
    expect(headers.every((h) => h.getAttribute('scope') === 'col')).toBe(true)
    const rowHeaders = within(table).getAllByRole('rowheader')
    expect(rowHeaders.every((h) => h.getAttribute('scope') === 'row')).toBe(true)
  })

  it('aligns numbers to the end and text to the start', () => {
    render(<BreakdownTable title="t" columns={columns} rows={rows} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers.slice(0, 4).every((h) => h.className.includes('text-end'))).toBe(true)
    expect(headers[4]!.className).toContain('text-start')
  })

  it('the scroll box is a named, focusable region', () => {
    render(<BreakdownTable title="তালিকা" columns={columns} rows={rows} maxHeight="20rem" />)
    const region = screen.getByRole('region', { name: 'তালিকা' })
    expect(region.tabIndex).toBe(0)
    expect(region.style.maxHeight).toBe('20rem')
    expect(screen.getByRole('table').hasAttribute('data-sticky-head')).toBe(true)
  })

  it('adds a total row in the footer with its label', () => {
    const { container } = render(
      <BreakdownTable
        title="t"
        columns={columns.slice(0, 3)}
        rows={rows}
        total={{ month: 0, emi: 533092.75, interest: 33092.75 }}
        totalLabel="মোট"
        note="শেষ কিস্তিতে মিলিয়ে নেওয়া"
      />,
    )
    const foot = container.querySelector('tfoot tr') as HTMLElement
    expect(cellText(foot)).toEqual(['মোট', '৳৫,৩৩,০৯২.৭৫', '৳৩৩,০৯২.৭৫'])
    expect(screen.getByText('শেষ কিস্তিতে মিলিয়ে নেওয়া')).toBeTruthy()
  })

  it('a hidden title still names the table', () => {
    render(<BreakdownTable title="লুকানো" titleHidden columns={columns} rows={rows} />)
    expect(screen.getByRole('table', { name: 'লুকানো' })).toBeTruthy()
    expect(screen.getByText('লুকানো').className).toContain('sr-only')
  })
})
