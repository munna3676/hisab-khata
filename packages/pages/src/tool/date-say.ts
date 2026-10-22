// Words and formats the date tools share (age, job age limit, Bangla and Hijri date, day count):
// "২৬ বছর ৭ মাস ৪ দিন", "১৫ মার্চ ২০২৭", "১ পৌষ ১৪৩৩". Each tool's COPY spreads DATE_COPY, so the
// words reach the island in one language like the rest of its copy.
import { GREGORIAN_MONTHS_BN, GREGORIAN_MONTHS_EN, WEEKDAYS_BN, WEEKDAYS_EN, type CalendarDate, type Period } from '@hisab/core/lib/dates-calendar'
import { formatDateIn, formatNumberIn, plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { Localized } from './text.ts'

export const DATE_COPY = {
  year: { bn: '{n} বছর', en: '{n} year' },
  years: { bn: '{n} বছর', en: '{n} years' },
  month: { bn: '{n} মাস', en: '{n} month' },
  months: { bn: '{n} মাস', en: '{n} months' },
  day: { bn: '{n} দিন', en: '{n} day' },
  days: { bn: '{n} দিন', en: '{n} days' },
  week: { bn: '{n} সপ্তাহ', en: '{n} week' },
  weeks: { bn: '{n} সপ্তাহ', en: '{n} weeks' },
  /** Names of the three date boxes for screen readers. draft */
  partDay: { bn: 'দিন', en: 'Day' },
  partMonth: { bn: 'মাস', en: 'Month' },
  partYear: { bn: 'বছর', en: 'Year' },
  close: { bn: 'বন্ধ করো', en: 'Close' },
} as const

export type DateCopy = Localized<typeof DATE_COPY>

const fillN = (text: string, n: string) => text.replace('{n}', n)

/** "৭ মাস", "1 month", with lakh grouping ("১,৩৮৭ সপ্তাহ"). */
export function countText(lang: Lang, one: string, many: string, n: number): string {
  return fillN(n === 1 ? one : many, formatNumberIn(lang, n))
}

/** "২৬ বছর ৭ মাস ৪ দিন": parts that are 0 are left out, all 0 is "০ দিন". */
export function periodText(lang: Lang, copy: DateCopy, p: Period): string {
  const parts = [
    p.years ? countText(lang, copy.year, copy.years, p.years) : '',
    p.months ? countText(lang, copy.month, copy.months, p.months) : '',
    p.days || (!p.years && !p.months) ? countText(lang, copy.day, copy.days, p.days) : '',
  ]
  return parts.filter(Boolean).join(' ')
}

/** "৪১ সপ্তাহ ৪ দিন" (the days left out when 0). */
export function weeksText(lang: Lang, copy: DateCopy, weeks: number, days: number): string {
  const w = countText(lang, copy.week, copy.weeks, weeks)
  return days ? `${w} ${countText(lang, copy.day, copy.days, days)}` : w
}

/** "১৫ মার্চ ২০২৭" / "15 March 2027". */
export const dateText = (lang: Lang, date: CalendarDate) => formatDateIn(lang, date)

export const gregorianMonths = (lang: Lang): readonly string[] => (lang === 'bn' ? GREGORIAN_MONTHS_BN : GREGORIAN_MONTHS_EN)
export const weekdayName = (lang: Lang, weekday: number) => (lang === 'bn' ? WEEKDAYS_BN : WEEKDAYS_EN)[weekday]!

/** "১ পৌষ ১৪৩৩" / "1 Poush 1433"; `months` from bangla-months.ts (kept apart so other date pages skip the Bangla calendar). */
export function banglaDateText(lang: Lang, date: CalendarDate, months: readonly string[]): string {
  return `${plainDigits(lang, date.day)} ${months[date.month - 1]} ${plainDigits(lang, date.year)}`
}
