// Hijri date copy (Figma D4 29:8587, D · D4 68:7511). Bangla verbatim from Figma except where
// marked "draft"; English is a faithful translation.
import { DATE_COPY } from '../tool/date-say.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DATE_COPY,
  dateLabel: { bn: 'ইংরেজি তারিখ', en: 'English date' },
  adjustLabel: { bn: 'চাঁদ দেখা অনুযায়ী ঠিক করো', en: 'Adjust for moon sighting' },
  minusOne: { bn: '−১ দিন', en: '−1 day' },
  asIs: { bn: 'যেমন আছে', en: 'As is' },
  plusOne: { bn: '+১ দিন', en: '+1 day' },
  resultLabel: { bn: 'হিজরি তারিখ (আনুমানিক)', en: 'Hijri date (approximate)' },
  dayMonth: { bn: '{day} {month}', en: '{day} {month}' },
  sub: { bn: '{year} হিজরি · চাঁদ দেখার উপর ±১ দিন হতে পারে', en: '{year} AH · may differ by ±1 day with moon sighting' },
  todayTitle: { bn: 'আজ', en: 'Today' },
  /** draft: the card title for a date that is not today */
  dayTitle: { bn: 'এই দিন', en: 'This day' },
  gregorian: { bn: 'ইংরেজি', en: 'English' },
  bangla: { bn: 'বাংলা', en: 'Bangla' },
  hijri: { bn: 'হিজরি', en: 'Hijri' },
  hijriDate: { bn: '{day} {month} {year}', en: '{day} {month} {year}' },
  callout: {
    bn: 'বাংলাদেশে ইসলামিক ফাউন্ডেশনের চাঁদ দেখা কমিটির ঘোষণা অনুযায়ী তারিখ বদলাতে পারে।',
    en: 'In Bangladesh the date can change with the Islamic Foundation moon-sighting committee’s announcement.',
  },
  /** draft */
  shareText: { bn: '{date} = {hijri} (আনুমানিক)', en: '{date} = {hijri} (approximate)' },
  /** draft */
  reportHijri: { bn: 'হিজরি তারিখ', en: 'Hijri date' },
  /** draft */
  reportBangla: { bn: 'বাংলা তারিখ', en: 'Bangla date' },
} as const satisfies CopyTable

export type HijriCopy = Localized<typeof COPY>
