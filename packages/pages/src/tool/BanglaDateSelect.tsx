// The D5-b "বাংলা তারিখ" boxes (বঙ্গাব্দ): Figma has no calendar sheet for a Bangla date, so the
// day, month and year boxes are native selects, styled like DateField's boxes.
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import { plainDigits } from '@hisab/i18n/format'
import { BOX, COLUMNS, type DateFieldProps } from './DateField.tsx'

const NUMBER = 'hk-nav-num text-[1.0625rem] font-semibold'

export function BanglaDateSelect({ id, lang, label, value, onChange, months, minYear = 1300, maxYear = 1500, parts }: DateFieldProps) {
  const digits = (n: number) => plainDigits(lang, n)
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
  const boxes: [keyof CalendarDate, string, string, string[], number[]][] = [
    ['day', parts.day, digits(value.day), range(1, 31).map(digits), range(1, 31)],
    ['month', parts.month, months[value.month - 1] ?? '', [...months], range(1, 12)],
    ['year', parts.year, digits(value.year), range(minYear, maxYear).map(digits), range(minYear, maxYear)],
  ]
  return (
    <div class="flex min-w-0 flex-col gap-2" data-date-field={id}>
      <p id={`${id}-label`} class="type-label text-ink">
        {label}
      </p>
      <div role="group" aria-labelledby={`${id}-label`} class={COLUMNS}>
        {boxes.map(([key, name, shown, labels, nums]) => (
          <label key={key} class={`pressable relative ${BOX} ${key === 'month' ? 'type-body-medium' : NUMBER} focus-within:outline-2 focus-within:outline-accent`}>
            <span aria-hidden="true" class="truncate">
              {shown}
            </span>
            <select
              aria-label={name}
              id={key === 'day' ? id : undefined}
              value={String(value[key])}
              onChange={(e) => onChange({ ...value, [key]: Number(e.currentTarget.value) })}
              class="absolute inset-0 cursor-pointer opacity-0"
            >
              {nums.map((n, i) => (
                <option key={n} value={String(n)}>
                  {labels[i]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}
