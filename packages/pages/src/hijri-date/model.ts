// Hijri date: inputs → what the calculator shows. All arithmetic is @hisab/core hijri-date (and
// bangla-date for the বাংলা row). The offset is data/dates/hijri-offset.json (Bangladesh moon
// sighting, -1 against Umm al-Qura) plus the chip the person picked.
import { toBanglaDate } from '@hisab/core/bangla-date'
import { HIJRI_MONTHS_BN, HIJRI_MONTHS_EN, calculateHijriDate, validateHijriDate } from '@hisab/core/hijri-date'
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import { plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { banglaMonths } from '../tool/bangla-months.ts'
import { banglaDateText, dateText } from '../tool/date-say.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill } from '../tool/say.ts'
import type { ToolOutcome } from '../tool/validation.ts'
import type { HijriCopy } from './copy.ts'

export interface HijriInput {
  lang: Lang
  copy: HijriCopy
  date: CalendarDate | null
  isToday: boolean
  /** data/dates/hijri-offset.json. */
  offset: number
  /** The chip: −1, 0 or +1 day on top. */
  adjust: number | null
}

export interface HijriView {
  label: string
  text: string
  sub: string
  title: string
  summary: SummaryRow[]
  shareText: string
}

export function hijriOutcome({ lang, copy, date, isToday, offset, adjust }: HijriInput): ToolOutcome<HijriView> {
  if (!date) return { kind: 'empty' }
  const input = { from: 'gregorian' as const, date, offsetDays: offset + (adjust ?? 0) }
  if (validateHijriDate(input)) return { kind: 'empty' }
  const h = calculateHijriDate(input).hijri
  const month = (lang === 'bn' ? HIJRI_MONTHS_BN : HIJRI_MONTHS_EN)[h.month - 1]!
  const vars = { day: plainDigits(lang, h.day), month, year: plainDigits(lang, h.year) }
  const hijri = fill(lang, copy.hijriDate, vars)
  const gregorian = dateText(lang, date)
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      text: fill(lang, copy.dayMonth, vars),
      sub: fill(lang, copy.sub, vars),
      title: isToday ? copy.todayTitle : copy.dayTitle,
      summary: [
        { key: 'gregorian', label: copy.gregorian, value: gregorian },
        { key: 'bangla', label: copy.bangla, value: banglaDateText(lang, toBanglaDate(date), banglaMonths(lang)) },
        { key: 'hijri', label: copy.hijri, value: hijri },
      ],
      shareText: fill(lang, copy.shareText, { date: gregorian, hijri }),
    },
  }
}

export const adjustLabel = (copy: HijriCopy, n: number) => (n < 0 ? copy.minusOne : n > 0 ? copy.plusOne : copy.asIs)

export function hijriReportItems(copy: HijriCopy): ReportErrorItem[] {
  return [
    { value: 'hijri', label: copy.reportHijri },
    { value: 'bangla', label: copy.reportBangla },
  ]
}
