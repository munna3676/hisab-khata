// Salary breakdown page copy (Figma C5 28:7512, D · C5 68:5723). Bangla verbatim from Figma except
// where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  grossLabel: { bn: 'মোট মাসিক বেতন (Gross)', en: 'Monthly gross salary' },
  basicLabel: { bn: 'বেসিক', en: 'Basic' },
  rentLabel: { bn: 'বাড়িভাড়া', en: 'House rent' },
  structureHelp: {
    bn: 'বাড়িভাড়া আর মেডিকেল বেসিকের শতাংশ হিসেবে ধরা হয়েছে। নিজের অফারের কাঠামো বসাও।',
    en: 'House rent and medical are taken as a percentage of basic. Enter the structure in your offer.',
  },
  resultLabel: { bn: 'বেসিক বেতন', en: 'Basic salary' },
  resultSub: { bn: 'মোট {gross} এর {pct}%', en: '{pct}% of {gross} gross' },
  summaryTitle: { bn: 'ভাগ', en: 'Breakdown' },
  basicRow: { bn: 'বেসিক ({pct}%)', en: 'Basic ({pct}%)' },
  rentRow: { bn: 'বাড়িভাড়া (বেসিকের {pct}%)', en: 'House rent ({pct}% of basic)' },
  medicalRow: { bn: 'মেডিকেল (বেসিকের {pct}%)', en: 'Medical ({pct}% of basic)' },
  conveyanceRow: { bn: 'যাতায়াত', en: 'Conveyance' },
  otherRow: { bn: 'অন্যান্য ভাতা', en: 'Other allowance' }, // draft
  total: { bn: 'মোট', en: 'Total' },
  callout: {
    bn: 'এটা একটা প্রচলিত কাঠামো, বাধ্যতামূলক না। প্রতিষ্ঠান ভেদে ভাগ আলাদা হয়।',
    en: 'This is a common structure, not a rule. Each employer splits salary its own way.',
  },
  /** draft */
  structureTitle: { bn: 'ভাগগুলো মোট বেতনের চেয়ে বেশি', en: 'The parts add up to more than the gross' },
  /** draft */
  structureBody: {
    bn: 'বেসিক, বাড়িভাড়া আর মেডিকেল মিলে মোট বেতন ছাড়িয়ে যাচ্ছে। বেসিক বা বাড়িভাড়ার শতাংশ কমাও।',
    en: 'Basic, house rent and medical come to more than the gross. Lower the basic or house rent percentage.',
  },
  /** draft */
  structureFix: { bn: 'বাড়িভাড়া {pct}% দিয়ে হিসাব করো', en: 'Use {pct}% house rent' },
  /** draft */
  shareText: {
    bn: '{gross} বেতনে বেসিক {basic}, বাড়িভাড়া {rent}, মেডিকেল {medical}, যাতায়াত {conveyance}।',
    en: 'On a {gross} salary: basic {basic}, house rent {rent}, medical {medical}, conveyance {conveyance}.',
  },
  reportBasic: { bn: 'বেসিক বেতন', en: 'Basic salary' },
  reportParts: { bn: 'ভাতার ভাগ', en: 'Allowances' }, // draft
} as const satisfies CopyTable

export type SalaryCopy = Localized<typeof COPY>
