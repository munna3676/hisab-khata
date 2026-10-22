import { defineParams } from '../tool/url-state.ts'

/** The year range of the বাংলা তারিখ boxes (about 1900–2100 in Gregorian years). */
export const BANGLA_YEARS = { min: 1307, max: 1507 } as const

/**
 * The inputs in a share link: /tools/bangla-date?date=2027-02-21, or ?dir=to-en&bdate=1434-01-01
 * (বঙ্গাব্দ, month 1 = বৈশাখ). Defaults: Figma D3 (16 Dec 2026) and D5-b (১ বৈশাখ ১৪৩৪).
 */
export const BANGLA_DATE_PARAMS = defineParams({
  dir: { kind: 'enum', default: 'to-bn', values: ['to-bn', 'to-en'] as const },
  date: { kind: 'date', default: '2026-12-16', minYear: 1900, maxYear: 2100 },
  bdate: { kind: 'date', default: '1434-01-01', calendar: 'bangla', minYear: BANGLA_YEARS.min, maxYear: BANGLA_YEARS.max },
})

export type BanglaDir = 'to-bn' | 'to-en'
