// Loan comparison copy (Figma F10 27:6681, D · F10 66:30163). Bangla verbatim from Figma except
// where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  offer: { bn: 'অফার {name}', en: 'Offer {name}' },
  principalLabel: { bn: 'ঋণ', en: 'Loan' },
  rateLabel: { bn: 'হার', en: 'Rate' },
  termLabel: { bn: 'মেয়াদ', en: 'Term' },
  yearUnit: { bn: 'বছর', en: 'years' },
  feeLabel: { bn: 'প্রসেসিং ফি', en: 'Processing fee' },
  cheaper: { bn: 'অফার {name} সস্তা', en: 'Offer {name} is cheaper' },
  less: { bn: ' কম', en: ' less' },
  resultSub: { bn: '{name} তে মাসিক {emi} · মোট খরচ (সুদ + ফি) {cost}', en: '{name}: {emi} a month · total cost (interest + fee) {cost}' },
  /** draft: both offers cost the same. */
  tieLabel: { bn: 'দুটো অফারে মোট খরচ সমান', en: 'Both offers cost the same' },
  tieSub: { bn: 'মোট খরচ (সুদ + ফি) {cost}', en: 'Total cost (interest + fee) {cost}' },
  tableTitle: { bn: 'পাশাপাশি', en: 'Side by side' },
  rowEmi: { bn: 'মাসিক কিস্তি', en: 'Monthly instalment' },
  rowInterest: { bn: 'মোট সুদ', en: 'Total interest' },
  rowFee: { bn: 'প্রসেসিং ফি', en: 'Processing fee' },
  rowCost: { bn: 'মোট খরচ', en: 'Total cost' },
  lowest: { bn: 'কম', en: 'lower' }, // draft: screen-reader word for the green cell
  callout: {
    bn: 'কম হার মানেই সবসময় সস্তা না। বেশি ফি থাকলে মোট খরচ বাড়তে পারে, তাই মোট খরচ দেখো।',
    en: 'A lower rate is not always cheaper. A higher fee can raise the total cost, so compare the total cost.',
  },
  wholeYears: { bn: 'বছর পূর্ণ সংখ্যায় লেখো', en: 'Enter whole years' }, // draft
  /** draft */
  shareText: {
    bn: 'দুটো লোন অফারের মধ্যে অফার {name} এ মোট খরচ {saving} কম ({cost})।',
    en: 'Of two loan offers, offer {name} costs {saving} less in total ({cost}).',
  },
  reportTable: { bn: 'পাশাপাশি তালিকার কোনো সংখ্যা', en: 'A number in the side-by-side table' }, // draft
} as const satisfies CopyTable

export type LoanCompareCopy = Localized<typeof COPY>
