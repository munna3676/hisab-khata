// Day count copy (Figma D5 31:8462, D · D5 68:7759). Bangla verbatim from Figma except where
// marked "draft"; English is a faithful translation.
import { DATE_COPY } from '../tool/date-say.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DATE_COPY,
  startLabel: { bn: 'শুরুর তারিখ', en: 'Start date' },
  endLabel: { bn: 'শেষ তারিখ', en: 'End date' },
  includeLabel: { bn: 'শেষের দিনটাও গুনবো?', en: 'Count the last day too?' },
  no: { bn: 'না', en: 'No' },
  yes: { bn: 'হ্যাঁ', en: 'Yes' },
  resultLabel: { bn: 'মাঝে আছে', en: 'In between' },
  daysUnit: { bn: ' দিন', en: ' days' },
  dayUnit: { bn: ' দিন', en: ' day' },
  withEnd: { bn: 'শেষ দিন গুনলে {days}', en: '{days} counting the last day' },
  /** draft */
  withoutEnd: { bn: 'শেষ দিন বাদে {days}', en: '{days} without the last day' },
  /** draft */
  reversed: { bn: 'শেষ তারিখ আগে, উল্টো দিকে গোনা', en: 'End date is earlier, counted the other way' },
  summaryTitle: { bn: 'অন্যভাবে', en: 'Other ways' },
  monthsDays: { bn: 'মাস ও দিন', en: 'Months and days' },
  weeksLabel: { bn: 'সপ্তাহ', en: 'Weeks' },
  hours: { bn: 'ঘণ্টা', en: 'Hours' },
  /** draft */
  shareText: { bn: '{start} থেকে {end}: {days}', en: '{start} to {end}: {days}' },
  /** draft */
  reportDays: { bn: 'দিনের সংখ্যা', en: 'Number of days' },
  /** draft */
  reportOther: { bn: 'মাস, সপ্তাহ বা ঘণ্টা', en: 'Months, weeks or hours' },
} as const satisfies CopyTable

export type DayCountCopy = Localized<typeof COPY>
