// Job age limit copy (Figma D2 29:8239, D · D2 68:7039). Bangla verbatim from Figma except where
// marked "draft"; English is a faithful translation.
import { DATE_COPY } from '../tool/date-say.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DATE_COPY,
  birthLabel: { bn: 'জন্ম তারিখ', en: 'Date of birth' },
  refLabel: { bn: 'সার্কুলারে বয়স গণনার তারিখ', en: 'Age reference date in the circular' },
  limitLabel: { bn: 'বয়সসীমা', en: 'Age limit' },
  eligibleLabel: { bn: 'আবেদন করা যাবে', en: 'You can apply' },
  eligible: { bn: 'যোগ্য ✓', en: 'Eligible ✓' },
  /** draft */
  notEligibleLabel: { bn: 'আবেদন করা যাবে না', en: 'You cannot apply' },
  /** draft */
  tooOld: { bn: 'সীমা পার ✗', en: 'Over the limit ✗' },
  /** draft */
  tooYoung: { bn: 'বয়স কম ✗', en: 'Too young ✗' },
  ageSub: { bn: 'ওই তারিখে বয়স {age} · সীমা {max}', en: 'Age on that date {age} · limit {max}' },
  /** draft */
  overSub: { bn: '{over} আগে সীমা পেরিয়েছে', en: 'Limit passed {over} earlier' },
  /** draft */
  waitSub: { bn: 'আরও {wait} পর আবেদন করা যাবে', en: 'You can apply in {wait}' },
  timeTitle: { bn: 'সময় কতদিন আছে', en: 'How much time is left' },
  completes: { bn: '{max} পূর্ণ হবে', en: '{max} completed on' },
  /** draft: the past tense of the row above */
  completed: { bn: '{max} পূর্ণ হয়েছে', en: '{max} completed on' },
  lastDayLabel: { bn: 'গণনার তারিখ এর আগে হলে আবেদন করা যাবে', en: 'You can apply if the reference date is on or before' },
  until: { bn: '{date} পর্যন্ত', en: '{date}' },
  callout: {
    bn: 'কিছু পদে বা বিশেষ ক্ষেত্রে বয়সসীমা আলাদা হয়। সার্কুলারের শর্ত অবশ্যই মিলিয়ে নাও।',
    en: 'Some posts and special cases have a different age limit. Always check the conditions in the circular.',
  },
  /** draft */
  refBeforeBirthTitle: { bn: 'গণনার তারিখটা জন্মের আগে', en: 'The reference date is before birth' },
  /** draft */
  refBeforeBirthBody: { bn: 'সার্কুলারে বয়স গণনার তারিখ জন্ম তারিখের পরে হতে হবে।', en: 'The circular’s reference date must be after the date of birth.' },
  /** draft */
  shareText: { bn: '{date} তারিখে বয়স {age}, সীমা {max}: {verdict}', en: 'Age on {date}: {age}, limit {max}: {verdict}' },
  /** draft */
  reportVerdict: { bn: 'আবেদন করা যাবে কিনা', en: 'Whether I can apply' },
  /** draft */
  reportDates: { bn: 'সময় কতদিন আছে', en: 'How much time is left' },
} as const satisfies CopyTable

export type JobAgeCopy = Localized<typeof COPY>
