import { formatNumber, formatTaka, type Digits } from '@hisab/core/lib/format'
import type { ComponentChildren } from 'preact'
import { cx } from '../lib/cx'
import { useContentUid } from './uid'

export type BreakdownFormat = 'taka' | 'number' | 'text'

export interface BreakdownColumn<R> {
  /** Field of the row to show, or a function that picks the value. */
  key: keyof R | ((row: R) => unknown)
  /** Column heading, e.g. "কিস্তি". */
  label: ComponentChildren
  /** taka: "৳১৬,৬০৭.১৮"; number: "১২"; text: as given (default: taka for numbers, text otherwise). */
  format?: BreakdownFormat
  /** Fixed decimals for taka/number (default: 0 for whole numbers, else 2). */
  decimals?: number
  /** Default: numbers right, text left. */
  align?: 'start' | 'end'
}

export interface BreakdownTableProps<R> {
  /** Table title, e.g. "মাসিক কিস্তির তালিকা". Names the table and its scroll region. */
  title: ComponentChildren
  /** Visually hides the title (the page already shows one); it still names the table. */
  titleHidden?: boolean
  /** Heading level of the title (default h3). */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  /** The first column is the row header (e.g. মাস / বছর) and stays put while the rest scrolls. */
  columns: readonly BreakdownColumn<R>[]
  rows: readonly R[]
  /** A total row in the footer (same columns; leave a field undefined for an empty cell). */
  total?: R
  /** Label for the total row's first cell, default "মোট". */
  totalLabel?: ComponentChildren
  /** Bangla (default) or English digits. */
  digits?: Digits
  /**
   * Caps the height (any CSS length, e.g. "24rem") so long schedules scroll inside the
   * box, with the header row sticking to the top. Unset: the table is as tall as it needs.
   */
  maxHeight?: string
  /** Small print under the table, e.g. the rounding note. */
  note?: ComponentChildren
  class?: string
}

function pick<R>(row: R, key: BreakdownColumn<R>['key']): unknown {
  return typeof key === 'function' ? key(row) : row[key]
}

function show(value: unknown, column: BreakdownColumn<unknown>, digits: Digits): ComponentChildren {
  if (value === undefined || value === null || value === '') return ''
  const format = column.format ?? (typeof value === 'number' ? 'taka' : 'text')
  if (typeof value === 'number' && format !== 'text') {
    const opts = { digits, decimals: column.decimals }
    return format === 'taka' ? formatTaka(value, opts) : formatNumber(value, opts)
  }
  return value as ComponentChildren
}

function isNumeric<R>(column: BreakdownColumn<R>, sample: R | undefined): boolean {
  if (column.align) return column.align === 'end'
  if (column.format) return column.format !== 'text'
  return sample !== undefined && typeof pick(sample, column.key) === 'number'
}

/**
 * Breakdown table for schedules (EMI month by month, DPS or FDR year by year). Ledger
 * look from the Figma KV rows: soft labels, IBM Plex Mono numbers, rule lines and a
 * 2px ink rule above the total. On a phone the table scrolls sideways inside its own
 * box (the page never does) with the first column and, with `maxHeight`, the header
 * row sticky. The scroll box is a named, focusable region so keyboards can scroll it.
 */
export function BreakdownTable<R>({
  title,
  titleHidden = false,
  titleAs: Title = 'h3',
  columns,
  rows,
  total,
  totalLabel = 'মোট',
  digits = 'bn',
  maxHeight,
  note,
  class: className,
}: BreakdownTableProps<R>) {
  const titleId = useContentUid(undefined, 'hkc-table')
  const sample = rows[0]
  const numeric = columns.map((c) => isNumeric(c, sample))
  const cell = (i: number) =>
    cx(
      'py-2 whitespace-nowrap',
      i === 0 ? 'pr-3 pl-4' : i === columns.length - 1 ? 'pr-4 pl-3' : 'px-3',
      numeric[i] ? 'text-end' : 'text-start',
    )

  return (
    <div class={cx('min-w-0 overflow-hidden rounded-card border border-line bg-sheet', className)} data-breakdown-table>
      <Title id={titleId} class={cx(titleHidden ? 'sr-only' : 'px-4 pt-3 pb-1 type-label text-ink')}>
        {title}
      </Title>
      <div
        role="region"
        aria-labelledby={titleId}
        tabIndex={0}
        class="overflow-auto overscroll-x-contain focus-visible:-outline-offset-2"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table
          aria-labelledby={titleId}
          class="hkc-table w-full min-w-max border-separate border-spacing-0"
          data-sticky-head={maxHeight ? '' : undefined}
        >
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th
                  key={i}
                  scope="col"
                  class={cx(cell(i), 'border-b border-line align-bottom font-body text-[0.75rem]/4 font-semibold text-soft')}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {columns.map((column, i) => {
                  const value = show(pick(row, column.key), column as BreakdownColumn<unknown>, digits)
                  const line = r < rows.length - 1 || !total ? 'border-b border-rule' : ''
                  return i === 0 ? (
                    <th key={i} scope="row" class={cx(cell(i), line, 'type-body-small font-normal text-ink')}>
                      {value}
                    </th>
                  ) : (
                    <td key={i} class={cx(cell(i), line, numeric[i] ? 'hkc-num text-number-m text-ink' : 'type-body-small text-ink')}>
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {total && (
            <tfoot>
              <tr>
                {columns.map((column, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" class={cx(cell(i), 'border-t-2 border-ink type-label text-ink')}>
                      {totalLabel}
                    </th>
                  ) : (
                    <td
                      key={i}
                      class={cx(cell(i), 'border-t-2 border-ink text-ink', numeric[i] ? 'hkc-num text-number-m font-bold' : 'type-label')}
                    >
                      {show(pick(total, column.key), column as BreakdownColumn<unknown>, digits)}
                    </td>
                  ),
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {note && <p class="border-t border-line px-4 py-2 type-body-small text-soft">{note}</p>}
    </div>
  )
}
