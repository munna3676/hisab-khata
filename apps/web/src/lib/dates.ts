// Today's date line, small enough for the browser: the home page recomputes it on load, so a page
// built days ago still shows today (the build-time text is the no-JS fallback).
import { BANGLA_MONTHS_BN, BANGLA_MONTHS_EN, toBanglaDate } from '@hisab/core/bangla-date'
import { calendarDateAt, type CalendarDate } from '@hisab/core/lib/dates-calendar'
import { formatLongDateIn, plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'

/** "সোমবার, ১৯ অক্টোবর ২০২৬ · ৩ কার্তিক ১৪৩৩" (bn) or "Monday, 19 October 2026" (en, as A10). */
export function dateLine(lang: Lang, day: CalendarDate): string {
  const long = formatLongDateIn(lang, day)
  if (lang === 'en') return long
  const b = toBanglaDate(day)
  return `${long} · ${plainDigits('bn', b.day)} ${BANGLA_MONTHS_BN[b.month - 1]} ${plainDigits('bn', b.year)}`
}

/** "৩ কার্তিক ১৪৩৩" (bn) or "3 Kartik 1433" (en) for the আজকের খাতা row. */
export function banglaDateText(lang: Lang, day: CalendarDate): string {
  const b = toBanglaDate(day)
  const months = lang === 'bn' ? BANGLA_MONTHS_BN : BANGLA_MONTHS_EN
  return `${plainDigits(lang, b.day)} ${months[b.month - 1]} ${plainDigits(lang, b.year)}`
}

/** Today in Bangladesh (UTC+6). */
export const todayInDhaka = (now = new Date()) => calendarDateAt(now, 360)


/** The build day in Bangladesh as YYYY-MM-DD: the date tools' "today" until the browser knows the real day. */
export const buildDay = () => {
  const d = todayInDhaka()
  return `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}
