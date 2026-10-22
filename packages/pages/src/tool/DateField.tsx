// The Figma "date input" (D1–D5: day | month | year boxes under a label): one button that opens
// the P5 date picker sheet (পিকার — তারিখ 59:16939). The sheet (DatePicker, BottomSheet) loads on
// the first tap, like PickerField's sheet, so it costs the page nothing up front. A Bangla date
// (D5-b) has no calendar sheet in Figma: BanglaDateSelect.tsx. Without JavaScript the boxes show
// the server-rendered date.
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import { plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { DatePickerSheetProps } from '@hisab/ui/overlay/DatePicker'
import type { ComponentType } from 'preact'
import { useState } from 'preact/hooks'

export interface DateFieldProps {
  id: string
  lang: Lang
  /** Label above the boxes ("জন্ম তারিখ"); also the sheet title. */
  label: string
  value: CalendarDate
  onChange: (date: CalendarDate) => void
  /** Month names, index 0 = the first month (January, or বৈশাখ for a Bangla date). */
  months: readonly string[]
  /** Today in Bangladesh, marked in the calendar. */
  today?: CalendarDate
  minYear?: number
  maxYear?: number
  /** Names of the three boxes for screen readers (selects) and the sheet's close button. */
  parts: { day: string; month: string; year: string; close: string }
}

export const BOX = 'flex h-13 min-w-0 items-center justify-center rounded-input border-[1.5px] border-line bg-subtle px-2 text-ink'
export const COLUMNS = 'grid min-w-0 grid-cols-[minmax(0,0.75fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-2'

/** A local-midnight Date for the picker (years below 100 kept as given). */
function toLocal({ year, month, day }: CalendarDate): Date {
  const d = new Date(2000, 0, 1)
  d.setFullYear(year, month - 1, day)
  return d
}

const fromLocal = (d: Date): CalendarDate => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })

export function DateField({ id, lang, label, value, onChange, months, today, minYear = 1900, maxYear = 2100, parts }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  // Each opening starts a fresh picker on the current date (the picker keeps its own draft).
  const [opened, setOpened] = useState(0)
  const [Sheet, setSheet] = useState<ComponentType<DatePickerSheetProps> | null>(null)
  const show = () => {
    setOpen(true)
    setOpened((n) => n + 1)
    if (!Sheet) import('@hisab/ui/overlay/DatePicker').then((m) => setSheet(() => m.DatePickerSheet), () => setOpen(false))
  }
  const month = months[value.month - 1] ?? ''
  return (
    <div class="flex min-w-0 flex-col gap-2" data-date-field={id}>
      {/* The button carries the label itself (sr-only), so its name starts with what it shows. */}
      <p class="type-label text-ink" aria-hidden="true">
        {label}
      </p>
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        class={`pressable ${COLUMNS} w-full rounded-input text-center`}
        onClick={show}
        data-date={`${value.year}-${value.month}-${value.day}`}
      >
        <span class="sr-only">{label}: </span>
        <span class={`${BOX} hk-nav-num text-[1.0625rem] font-semibold`}>{plainDigits(lang, value.day)}</span>{' '}
        <span class={`${BOX} type-body-medium`}>
          <span class="truncate">{month}</span>
        </span>{' '}
        <span class={`${BOX} hk-nav-num text-[1.0625rem] font-semibold`}>{plainDigits(lang, value.year)}</span>
      </button>
      {Sheet && (
        <Sheet
          key={opened}
          open={open}
          title={label}
          closeLabel={parts.close}
          lang={lang}
          defaultValue={toLocal(value)}
          today={today ? toLocal(today) : undefined}
          minYear={minYear}
          maxYear={maxYear}
          onConfirm={(date) => onChange(fromLocal(date))}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
