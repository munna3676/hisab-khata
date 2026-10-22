// Bangla date: inputs → what the calculator shows. The calendar is @hisab/core bangla-date; the
// Hijri row is @hisab/core hijri-date with the Bangladesh offset from data/dates/hijri-offset.json.
import { banglaMonthLength, calculateBanglaDate, validateBanglaDate, type SpecialDay } from '@hisab/core/bangla-date'
import { HIJRI_MONTHS_BN, HIJRI_MONTHS_EN, calculateHijriDate, validateHijriDate } from '@hisab/core/hijri-date'
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import { plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { banglaMonths } from '../tool/bangla-months.ts'
import { banglaDateText, dateText, gregorianMonths, weekdayName } from '../tool/date-say.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill } from '../tool/say.ts'
import type { ToolOutcome } from '../tool/validation.ts'
import type { BanglaDateCopy } from './copy.ts'
import type { BanglaDir } from './params.ts'

export interface BanglaDateInput {
  lang: Lang
  copy: BanglaDateCopy
  dir: BanglaDir
  /** The Gregorian date (ইংরেজি → বাংলা). */
  date: CalendarDate | null
  /** The Bangla date (বাংলা → ইংরেজি): year বঙ্গাব্দ, month 1 = বৈশাখ. */
  bdate: CalendarDate | null
  specialDays: readonly SpecialDay[]
  /** Days added to Umm al-Qura for Bangladesh moon sighting (data: -1). */
  hijriOffset: number
}

export interface BanglaDateView {
  label: string
  text: string
  sub: string
  summary: SummaryRow[]
  shareText: string
}

/** "৭ রজব ১৪৪৮", or null outside the Hijri engine's years. */
export function hijriText(lang: Lang, copy: Pick<BanglaDateCopy, 'hijriDate'>, date: CalendarDate, offset: number): string | null {
  const input = { from: 'gregorian' as const, date, offsetDays: offset }
  if (validateHijriDate(input)) return null
  const h = calculateHijriDate(input).hijri
  const month = (lang === 'bn' ? HIJRI_MONTHS_BN : HIJRI_MONTHS_EN)[h.month - 1]!
  return fill(lang, copy.hijriDate, { day: plainDigits(lang, h.day), month, year: plainDigits(lang, h.year) })
}

export function banglaDateOutcome({ lang, copy, dir, date, bdate, specialDays, hijriOffset }: BanglaDateInput): ToolOutcome<BanglaDateView> {
  const toBn = dir === 'to-bn'
  const given = toBn ? date : bdate
  if (!given) return { kind: 'empty' }
  const input = { from: toBn ? ('gregorian' as const) : ('bangla' as const), date: given, specialDays }
  const problem = validateBanglaDate(input)
  if (problem === 'date' && !toBn && given.month >= 1 && given.month <= 12) {
    const n = banglaMonthLength(given.year, given.month)
    const month = banglaMonths(lang)[given.month - 1]!
    const vars = { month, n: plainDigits(lang, n), year: plainDigits(lang, given.year) }
    return {
      kind: 'error',
      error: { title: fill(lang, copy.noDayTitle, vars), body: fill(lang, copy.noDayBody, vars), fix: { label: fill(lang, copy.noDayFix, vars), field: 'bday', value: n } },
    }
  }
  if (problem) return { kind: 'empty' }
  const r = calculateBanglaDate(input)
  const special = r.specialDays.map((name) => (copy.specialDays as Record<string, string>)[name] ?? name)
  const weekday = weekdayName(lang, r.weekday)
  const sub = [weekday, copy.seasonLong[r.season], ...special].join(' · ')
  const bangla = banglaDateText(lang, r.bangla, banglaMonths(lang))
  const gregorian = dateText(lang, r.gregorian)
  const hijri = hijriText(lang, copy, r.gregorian, hijriOffset)
  const summary: SummaryRow[] = [
    toBn
      ? { key: 'month', label: copy.banglaMonth, value: banglaMonths(lang)[r.bangla.month - 1]! }
      : { key: 'month', label: copy.gregorianMonth, value: gregorianMonths(lang)[r.gregorian.month - 1]! },
    { key: 'season', label: copy.season, value: copy.seasons[r.season] },
    { key: 'weekday', label: copy.weekday, value: weekday },
  ]
  if (hijri) summary.push({ key: 'hijri', label: copy.hijri, value: hijri })
  return {
    kind: 'result',
    result: {
      label: toBn ? copy.banglaLabel : copy.gregorianLabel,
      text: toBn ? bangla : gregorian,
      sub,
      summary,
      shareText: fill(lang, copy.shareText, toBn ? { from: gregorian, to: bangla } : { from: bangla, to: gregorian }),
    },
  }
}

export function banglaDateReportItems(copy: BanglaDateCopy): ReportErrorItem[] {
  return [
    { value: 'date', label: copy.reportDate },
    { value: 'hijri', label: copy.reportHijri },
  ]
}
