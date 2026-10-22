// Age calculator copy (Figma D1 29:8051, D · D1 68:6790, P5 পিকার 59:16939). Bangla verbatim from
// Figma except where marked "draft"; English is a faithful translation.
import { DATE_COPY } from '../tool/date-say.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DATE_COPY,
  birthLabel: { bn: 'জন্ম তারিখ', en: 'Date of birth' },
  onLabel: { bn: 'কোন তারিখে বয়স জানতে চাও', en: 'Age on which date' },
  /** draft: accessible name of the chip row */
  onChips: { bn: 'কোন তারিখে', en: 'On which date' },
  today: { bn: 'আজ', en: 'Today' },
  otherDate: { bn: 'অন্য তারিখ', en: 'Another date' },
  resultLabel: { bn: 'তোমার বয়স', en: 'Your age' },
  nextBirthday: { bn: 'পরের জন্মদিন {days} পর ({date})', en: 'Next birthday in {days} ({date})' },
  /** draft */
  birthdayToday: { bn: 'আজ জন্মদিন! {age} পূর্ণ হলো', en: 'Birthday today! {age} complete' },
  summaryTitle: { bn: 'অন্যভাবে', en: 'Other ways' },
  totalMonths: { bn: 'মোট মাস', en: 'Total months' },
  totalWeeks: { bn: 'মোট সপ্তাহ', en: 'Total weeks' },
  totalDays: { bn: 'মোট দিন', en: 'Total days' },
  /** draft */
  beforeBirthTitle: { bn: 'এই তারিখে তো জন্মই হয়নি', en: 'Not born yet on this date' },
  /** draft */
  beforeBirthBody: { bn: 'কোন তারিখে বয়স জানতে চাও, সেটা জন্ম তারিখের পরে দাও।', en: 'Pick a date after the date of birth.' },
  /** draft */
  beforeBirthFix: { bn: 'আজকের হিসাবে দেখাও', en: 'Show age today' },
  /** draft */
  shareText: { bn: '{date} তারিখে বয়স {age}।', en: 'Age on {date}: {age}.' },
  /** draft */
  reportAge: { bn: 'বয়স', en: 'Age' },
  /** draft */
  reportTotals: { bn: 'মোট মাস, সপ্তাহ বা দিন', en: 'Total months, weeks or days' },
  faqQ1: { bn: 'সরকারি চাকরির আবেদনে কোন তারিখে বয়স ধরা হয়?', en: 'On which date is age counted for a government job?' },
  faqA1: {
    bn: 'সাধারণত সার্কুলারে দেওয়া নির্দিষ্ট তারিখে। "চাকরির বয়সসীমা" টুলে সেই তারিখ বসাও।',
    en: 'Usually on a fixed date given in the circular. Enter that date in the “Job age limit” tool.',
  },
} as const satisfies CopyTable

export type AgeCopy = Localized<typeof COPY>
