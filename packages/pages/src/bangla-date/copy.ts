// Bangla date converter copy (Figma D3 29:8406, D5-b 60:18179, D · D3 68:7265, D · D5-b 69:38230).
// Bangla verbatim from Figma except where marked "draft"; English is a faithful translation.
import { DATE_COPY } from '../tool/date-say.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DATE_COPY,
  dirLabel: { bn: 'কোন দিকে?', en: 'Which way?' },
  toBn: { bn: 'ইংরেজি → বাংলা', en: 'English → Bangla' },
  toEn: { bn: 'বাংলা → ইংরেজি', en: 'Bangla → English' },
  gregorianLabel: { bn: 'ইংরেজি তারিখ', en: 'English date' },
  banglaLabel: { bn: 'বাংলা তারিখ', en: 'Bangla date' },
  detailsTitle: { bn: 'বিস্তারিত', en: 'Details' },
  banglaMonth: { bn: 'বাংলা মাস', en: 'Bangla month' },
  gregorianMonth: { bn: 'ইংরেজি মাস', en: 'English month' },
  season: { bn: 'ঋতু', en: 'Season' },
  weekday: { bn: 'বার', en: 'Day' },
  hijri: { bn: 'হিজরি (আনুমানিক)', en: 'Hijri (approximate)' },
  seasons: {
    grishma: { bn: 'গ্রীষ্ম', en: 'Summer' },
    borsha: { bn: 'বর্ষা', en: 'Monsoon' },
    shorot: { bn: 'শরৎ', en: 'Autumn' },
    hemonto: { bn: 'হেমন্ত', en: 'Late autumn' },
    sheet: { bn: 'শীত', en: 'Winter' },
    boshonto: { bn: 'বসন্ত', en: 'Spring' },
  },
  /** "শীতকাল" in the result line. */
  seasonLong: {
    grishma: { bn: 'গ্রীষ্মকাল', en: 'Summer' },
    borsha: { bn: 'বর্ষাকাল', en: 'Monsoon' },
    shorot: { bn: 'শরৎকাল', en: 'Autumn' },
    hemonto: { bn: 'হেমন্তকাল', en: 'Late autumn' },
    sheet: { bn: 'শীতকাল', en: 'Winter' },
    boshonto: { bn: 'বসন্তকাল', en: 'Spring' },
  },
  /** English names of the special days in data/dates/special-days.json (the data has Bangla names). */
  specialDays: {
    'বিজয় দিবস': { bn: 'বিজয় দিবস', en: 'Victory Day' },
    'শহীদ দিবস': { bn: 'শহীদ দিবস', en: 'Shaheed Day' },
    'পহেলা বৈশাখ': { bn: 'পহেলা বৈশাখ', en: 'Pohela Boishakh' },
  },
  hijriDate: { bn: '{day} {month} {year}', en: '{day} {month} {year}' },
  callout: {
    bn: 'বাংলাদেশের সংশোধিত বাংলা ক্যালেন্ডার অনুযায়ী, যেখানে বৈশাখ থেকে আশ্বিন ৩১ দিনের।',
    en: 'By Bangladesh’s revised Bangla calendar, where Boishakh to Ashwin have 31 days.',
  },
  /** draft */
  noDayTitle: { bn: '{month} মাসে {n} দিন', en: '{month} has {n} days' },
  /** draft */
  noDayBody: { bn: 'সংশোধিত ক্যালেন্ডারে {year} সালের {month} মাস {n} দিনের, তাই এই তারিখ নেই।', en: 'In the revised calendar {month} {year} has {n} days, so this date does not exist.' },
  /** draft */
  noDayFix: { bn: '{n} {month} দিয়ে দেখাও', en: 'Show {n} {month}' },
  /** draft */
  shareText: { bn: '{from} = {to}', en: '{from} = {to}' },
  /** draft */
  reportDate: { bn: 'রূপান্তর করা তারিখ', en: 'Converted date' },
  /** draft */
  reportHijri: { bn: 'হিজরি তারিখ', en: 'Hijri date' },
} as const satisfies CopyTable

export type BanglaDateCopy = Localized<typeof COPY>
