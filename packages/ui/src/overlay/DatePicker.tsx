import type { ComponentChildren, JSX } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { Button } from '../base/Button'
import { IconButton } from '../base/IconButton'
import { useUid } from '../base/uid'
import { ChevronLeft, ChevronRight } from '../icons/common'
import { cx } from '../lib/cx'
import { BottomSheet, type SheetCloseReason, type SheetVariant } from './BottomSheet'
import {
  type CalendarDigits,
  type CalendarLang,
  type YMD,
  MONTHS,
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  daysInMonth,
  formatDigits,
  formatMonth,
  formatYMD,
  fromDate,
  monthGrid,
  sameYMD,
  toDate,
  weekday,
} from './calendar'

export interface DatePickerLabels {
  prevMonth: string
  nextMonth: string
  month: string
  year: string
  cancel: string
  /** Confirm button text for the chosen date ("১৫ মার্চ ২০০০ বেছে নাও"). */
  confirm: (formatted: string) => string
  /** Confirm button text while nothing is chosen. */
  pick: string
}

const LABELS: Record<CalendarLang, DatePickerLabels> = {
  bn: {
    prevMonth: 'আগের মাস',
    nextMonth: 'পরের মাস',
    month: 'মাস',
    year: 'বছর',
    cancel: 'বাতিল',
    confirm: (d) => `${d} বেছে নাও`,
    pick: 'একটা তারিখ বেছে নাও',
  },
  en: {
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    month: 'Month',
    year: 'Year',
    cancel: 'Cancel',
    confirm: (d) => `Choose ${d}`,
    pick: 'Pick a date',
  },
}

export interface DatePickerProps {
  /** Chosen date (controlled). */
  value?: Date | null
  defaultValue?: Date | null
  /** Every tap on a day (the draft). */
  onSelect?: (date: Date) => void
  /** The confirm button. */
  onConfirm?: (date: Date) => void
  onCancel?: () => void
  /** Month and weekday names and button texts. */
  lang?: CalendarLang
  /** Digits for days and years; defaults to the language's own. */
  digits?: CalendarDigits
  minYear?: number
  maxYear?: number
  /** First column as a Date#getDay number; 6 = Saturday (Bangladesh week, Figma). */
  weekStartsOn?: number
  /** Month shown when nothing is chosen, and the day marked as today. Defaults to now. */
  today?: Date
  labels?: Partial<DatePickerLabels>
  /** Hide the বাতিল / বেছে নাও row (e.g. inline use that saves on tap). */
  showActions?: boolean
  id?: string
  class?: string
}

const clampYear = (y: number, min: number, max: number) => Math.min(max, Math.max(min, y))

/**
 * DatePicker (Figma P5 পিকার — তারিখ 59:16939): month bar with ‹ ›, quick মাস / বছর selects
 * for jumping (year jump without paging), a Saturday-first month grid of 44px-tall day
 * cells (the 40px accent pill is the selected day), and বাতিল / "… বেছে নাও".
 * Bangla or English digits. Keyboard: the grid has one tab stop; arrows move by day and
 * week, Home/End to the week's ends, PageUp/PageDown by month (Shift: by year), Enter picks.
 */
export function DatePicker({
  value,
  defaultValue = null,
  onSelect,
  onConfirm,
  onCancel,
  lang = 'bn',
  digits = lang,
  minYear = 1900,
  maxYear = 2100,
  weekStartsOn = 6,
  today: todayProp,
  labels: labelsProp,
  showActions = true,
  id,
  class: className,
}: DatePickerProps) {
  const pickerId = useUid(id, 'date')
  const labels = { ...LABELS[lang], ...labelsProp }
  const today = fromDate(todayProp ?? new Date())
  const controlled = value !== undefined
  const [draftState, setDraft] = useState<YMD | null>(() => (defaultValue ? fromDate(defaultValue) : null))
  const draft = controlled ? (value ? fromDate(value) : null) : draftState
  const start = draft ?? { ...today, year: clampYear(today.year, minYear, maxYear) }
  const [view, setView] = useState({ year: start.year, month: start.month })
  const [focusDay, setFocusDay] = useState<YMD>(start)
  const gridRef = useRef<HTMLDivElement>(null)
  const moveFocus = useRef(false)

  // A new controlled value shows its month.
  const valueKey = draft ? `${draft.year}-${draft.month}-${draft.day}` : ''
  useEffect(() => {
    if (!draft) return
    setView({ year: draft.year, month: draft.month })
    setFocusDay(draft)
  }, [valueKey])

  // After keyboard moves, focus follows the roving tab stop. A layout effect, so focus has
  // moved before the next key arrives: with a later effect, a fast second key landed on the
  // old cell, whose focus then reset the day and the keystroke was lost.
  useLayoutEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  })

  const inRange = (d: YMD) => d.year >= minYear && d.year <= maxYear
  const showMonth = (year: number, month: number) => {
    const y = clampYear(year, minYear, maxYear)
    setView({ year: y, month })
    setFocusDay((f) => ({ year: y, month, day: Math.min(f.day, daysInMonth(y, month)) }))
  }
  const stepMonth = (delta: number) => {
    const next = addMonths({ ...view, day: 1 }, delta)
    if (inRange(next)) showMonth(next.year, next.month)
  }

  const pick = (d: YMD) => {
    if (!inRange(d)) return
    if (!controlled) setDraft(d)
    setFocusDay(d)
    onSelect?.(toDate(d))
  }

  const onGridKey = (event: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    const f = focusDay
    let next: YMD | null = null
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(f, -1)
        break
      case 'ArrowRight':
        next = addDays(f, 1)
        break
      case 'ArrowUp':
        next = addDays(f, -7)
        break
      case 'ArrowDown':
        next = addDays(f, 7)
        break
      case 'Home':
      case 'End': {
        const wd = (weekday(f) - weekStartsOn + 7) % 7
        next = addDays(f, event.key === 'Home' ? -wd : 6 - wd)
        break
      }
      case 'PageUp':
        next = addMonths(f, event.shiftKey ? -12 : -1)
        break
      case 'PageDown':
        next = addMonths(f, event.shiftKey ? 12 : 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        pick(f)
        return
      default:
        return
    }
    event.preventDefault()
    if (!next || !inRange(next)) return
    moveFocus.current = true
    setFocusDay(next)
    if (next.year !== view.year || next.month !== view.month) setView({ year: next.year, month: next.month })
  }

  const weeks = monthGrid(view.year, view.month, weekStartsOn)
  const order = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7)
  const titleId = `${pickerId}-title`
  const focusInView = focusDay.year === view.year && focusDay.month === view.month ? focusDay.day : 1
  const prevDisabled = !inRange(addMonths({ ...view, day: 1 }, -1))
  const nextDisabled = !inRange(addMonths({ ...view, day: 1 }, 1))
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  return (
    <div class={cx('grid min-w-0 gap-4', className)} data-date-picker>
      <div class="flex min-w-0 items-center gap-2">
        <IconButton label={labels.prevMonth} onClick={() => stepMonth(-1)} disabled={prevDisabled} class="-my-2.25 -ml-2.5">
          <ChevronLeft />
        </IconButton>
        <p id={titleId} class="min-w-0 flex-1 text-center type-h3 text-ink" aria-live="polite">
          {formatMonth(view.year, view.month, lang, digits)}
        </p>
        <IconButton label={labels.nextMonth} onClick={() => stepMonth(1)} disabled={nextDisabled} class="-my-2.25 -mr-2.5">
          <ChevronRight />
        </IconButton>
      </div>

      <div class="flex min-w-0 flex-wrap gap-2">
        <QuickSelect
          label={labels.month}
          display={MONTHS[lang][view.month]!}
          value={String(view.month)}
          onChange={(v) => showMonth(view.year, Number(v))}
          options={MONTHS[lang].map((name, i) => ({ value: String(i), label: name }))}
        />
        <QuickSelect
          label={labels.year}
          display={formatDigits(view.year, digits)}
          value={String(view.year)}
          onChange={(v) => showMonth(Number(v), view.month)}
          options={years.map((y) => ({ value: String(y), label: formatDigits(y, digits) }))}
        />
      </div>

      <div ref={gridRef} role="grid" aria-labelledby={titleId} class="flex min-w-0 flex-col" onKeyDown={onGridKey}>
        <div role="row" class="mb-0.5 grid grid-cols-7">
          {order.map((wd) => (
            <span key={wd} role="columnheader" aria-label={WEEKDAYS_LONG[lang][wd]} class="text-center type-body-small text-soft">
              <span aria-hidden="true">{WEEKDAYS_SHORT[lang][wd]}</span>
            </span>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} role="row" class="grid grid-cols-7">
            {week.map((day, i) => {
              if (day == null) return <span key={`e${i}`} role="gridcell" />
              const date = { year: view.year, month: view.month, day }
              const selected = sameYMD(date, draft)
              const isToday = sameYMD(date, today)
              return (
                <div
                  key={day}
                  role="gridcell"
                  tabIndex={day === focusInView ? 0 : -1}
                  aria-selected={selected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={formatYMD(date, lang, digits)}
                  data-day={day}
                  onClick={() => pick(date)}
                  onFocus={() => setFocusDay(date)}
                  class={cx(
                    'pressable grid h-11 min-w-0 cursor-pointer place-items-center rounded-full type-body-medium',
                    // The 40px pill sits 2px in from the 44px cell, like Figma's 40px day frames on a 44px pitch.
                    "before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-0.5 before:-z-10 before:rounded-full before:content-[''] after:inset-y-0.5",
                    'focus-visible:outline-hidden focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-accent',
                    selected ? 'text-on-accent before:bg-accent' : isToday ? 'text-accent before:inset-ring-[1.5px] before:inset-ring-line' : 'text-ink',
                  )}
                >
                  {formatDigits(day, digits)}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {showActions && (
        // Figma: two equal buttons; the confirm column grows past half only when the date needs it.
        <div class="grid min-w-0 grid-cols-[minmax(max-content,1fr)_minmax(max-content,1fr)] gap-3">
          <Button variant="secondary" block onClick={onCancel}>
            {labels.cancel}
          </Button>
          <Button block disabled={!draft} onClick={() => draft && onConfirm?.(toDate(draft))}>
            {draft ? labels.confirm(formatYMD(draft, lang, digits)) : labels.pick}
          </Button>
        </div>
      )}
    </div>
  )
}

interface QuickSelectProps {
  label: string
  display: ComponentChildren
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

/** "মাস: মার্চ ▾": a 38px subtle pill (Figma) over a native select with a 44px hit area. */
function QuickSelect({ label, display, value, options, onChange }: QuickSelectProps) {
  return (
    <label class="group pressable relative -my-0.75 inline-grid min-h-touch min-w-touch items-center rounded-input">
      <span
        aria-hidden="true"
        class="rounded-input bg-subtle px-3 py-2 type-body-small whitespace-nowrap text-ink group-has-[select:focus-visible]:outline-2 group-has-[select:focus-visible]:outline-offset-2 group-has-[select:focus-visible]:outline-accent"
      >
        {label}: {display} ▾
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event: JSX.TargetedEvent<HTMLSelectElement>) => onChange(event.currentTarget.value)}
        class="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export interface DatePickerSheetProps extends Omit<DatePickerProps, 'onCancel'> {
  open: boolean
  onClose: (reason: SheetCloseReason | 'cancel' | 'confirm') => void
  /** Figma: "জন্ম তারিখ". */
  title: string
  variant?: SheetVariant
  closeLabel?: string
}

/** DatePicker in a BottomSheet / Dialog: বাতিল closes, confirming reports the date and closes. */
export function DatePickerSheet({ open, onClose, title, variant, closeLabel, onConfirm, ...picker }: DatePickerSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} variant={variant} closeLabel={closeLabel}>
      <DatePicker
        {...picker}
        onCancel={() => onClose('cancel')}
        onConfirm={(date) => {
          onConfirm?.(date)
          onClose('confirm')
        }}
      />
    </BottomSheet>
  )
}

