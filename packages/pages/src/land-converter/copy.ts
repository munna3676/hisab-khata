// Land converter copy (Figma L1 31:8623, P3 পিকার 59:16558, D · L1 68:8014, D · P3 70:19840).
// Bangla verbatim from Figma except where marked "draft"; English is a faithful translation.
import { LAND_UNIT_COPY } from '../land/units.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...LAND_UNIT_COPY,
  amountLabel: { bn: 'পরিমাণ', en: 'Amount' },
  unitLabel: { bn: 'একক', en: 'Unit' },
  areaLabel: { bn: 'কাঠার মাপ (এলাকা)', en: 'Katha size (area)' },
  /** English for the data labels (data/land/conventions.json has Bangla ones). */
  areaChip: {
    standard: { bn: 'ঢাকা · ৭২০ বর্গফুট', en: 'Dhaka · 720 sq ft' },
    chattogram: { bn: 'চট্টগ্রাম (কানি ৪০ শতক)', en: 'Chattogram (kani 40 decimal)' },
    cumilla: { bn: 'কুমিল্লা-নোয়াখালী (কানি ৩০ শতক)', en: 'Cumilla-Noakhali (kani 30 decimal)' },
  },
  otherArea: { bn: 'অন্য এলাকা', en: 'Other area' },
  /** draft */
  otherAreaLabel: { bn: 'কোন এলাকা?', en: 'Which area?' },
  /** draft */
  customChip: { bn: 'নিজে লিখব', en: 'Type my own' },
  /** draft */
  kathaSqftLabel: { bn: '১ কাঠা কত বর্গফুট', en: 'Sq ft in 1 katha' },
  sqftUnit: { bn: 'বর্গফুট', en: 'sq ft' },
  /** "(ঢাকা মাপে)" in the result line; drafts except standard. */
  areaShort: {
    standard: { bn: 'ঢাকা মাপে', en: 'Dhaka size' },
    chattogram: { bn: 'চট্টগ্রাম মাপে', en: 'Chattogram size' },
    cumilla: { bn: 'কুমিল্লা-নোয়াখালী মাপে', en: 'Cumilla-Noakhali size' },
    custom: { bn: '{sqft} বর্গফুটের কাঠায়', en: '{sqft} sq ft katha' },
  },
  resultLabel: { bn: '{n} {unit} =', en: '{n} {unit} =' },
  resultSub: { bn: '{katha} কাঠা ({area}) · {acre} একর', en: '{katha} katha ({area}) · {acre} acre' },
  tableTitle: { bn: 'সব এককে', en: 'In every unit' },
  colUnit: { bn: 'একক', en: 'Unit' },
  colValue: { bn: 'পরিমাণ', en: 'Amount' },
  /** Table row names (Figma: "শতাংশ / ডেসিমাল"). */
  rowName: {
    decimal: { bn: 'শতাংশ / ডেসিমাল', en: 'Decimal / shotangsho' },
    sqft: { bn: 'বর্গফুট', en: 'Square feet' },
    katha: { bn: 'কাঠা', en: 'Katha' },
    bigha: { bn: 'বিঘা', en: 'Bigha' },
    acre: { bn: 'একর', en: 'Acre' },
    sqm: { bn: 'বর্গমিটার', en: 'Square metres' },
  },
  callout: {
    bn: '১ শতাংশ = {decimal} বর্গফুট, ১ একর = {acre} শতাংশ। কাঠা আর বিঘার মাপ জায়গাভেদে আলাদা, তাই দলিলের মাপ মিলিয়ে নাও।',
    en: '1 decimal = {decimal} sq ft, 1 acre = {acre} decimal. Katha and bigha sizes differ from place to place, so check against your deed.',
  },
  faqKathaQ: { bn: '১ কাঠা সমান কত শতাংশ?', en: 'How many decimal is 1 katha?' },
  faqKathaA: { bn: 'ঢাকার প্রচলিত মাপে ১ কাঠা = {sqft} বর্গফুট = প্রায় {decimal} শতাংশ।', en: 'In the usual Dhaka size, 1 katha = {sqft} sq ft = about {decimal} decimal.' },
  faqBighaQ: { bn: '১ বিঘা সমান কত কাঠা?', en: 'How many katha is 1 bigha?' },
  /** draft: closed in Figma */
  faqBighaA: {
    bn: 'প্রচলিত মাপে ১ বিঘা = {katha} কাঠা = {sqft} বর্গফুট, প্রায় {decimal} শতাংশ। কিছু এলাকায় বিঘার মাপ আলাদা, দলিলে মিলিয়ে নাও।',
    en: 'In the usual size, 1 bigha = {katha} katha = {sqft} sq ft, about {decimal} decimal. Some areas use another bigha; check your deed.',
  },
  /** draft */
  kathaError: { bn: 'কাঠার মাপ শূন্যের বেশি লেখো', en: 'Enter a katha size above zero' },
  /** draft */
  shareText: { bn: '{n} {unit} = {sqft} বর্গফুট = {katha} কাঠা ({area})', en: '{n} {unit} = {sqft} sq ft = {katha} katha ({area})' },
  /** draft */
  reportResult: { bn: 'বর্গফুটের হিসাব', en: 'Square feet result' },
  /** draft */
  reportTable: { bn: 'সব এককের তালিকা', en: 'The unit table' },
  close: { bn: 'বন্ধ করো', en: 'Close' },
} as const satisfies CopyTable

export type LandCopy = Localized<typeof COPY>
