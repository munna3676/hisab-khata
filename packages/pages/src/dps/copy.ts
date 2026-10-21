// DPS page copy (Figma F7 27:6030, F7-b 64:21115, D · F7 66:29288, D · F7-b 69:39346). Bangla
// verbatim from Figma except where marked "draft"; English is a faithful translation.
import { DEPOSIT_COPY } from '../deposit/shared.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DEPOSIT_COPY,
  depositLabel: { bn: 'মাসিক জমা', en: 'Monthly deposit' },
  rateLabel: { bn: 'বার্ষিক হার', en: 'Yearly rate' },
  termLabel: { bn: 'মেয়াদ', en: 'Term' },
  yearUnit: { bn: 'বছর', en: 'years' },
  compLabel: { bn: 'চক্রবৃদ্ধি', en: 'Compounding' },
  compMonthly: { bn: 'মাসিক', en: 'Monthly' },
  compQuarterly: { bn: 'ত্রৈমাসিক', en: 'Quarterly' },
  resultLabel: { bn: 'মেয়াদ শেষে হাতে পাবে', en: 'You get at maturity' },
  resultSub: { bn: '{months} মাস পর, কর কাটার পর', en: 'After {months} months, after tax' },
  resultSubQuarterly: { bn: '৩ মাস পরপর মুনাফা যোগ', en: 'profit added every 3 months' },
  summaryTitle: { bn: 'হিসাব', en: 'Breakdown' },
  totalDeposit: { bn: 'মোট জমা', en: 'Total deposits' },
  totalProfit: { bn: 'মোট মুনাফা', en: 'Total profit' },
  maturity: { bn: 'মেয়াদ শেষে', en: 'At maturity' },
  /** draft: Figma F7 has no table; the year-by-year schedule prints with the page. */
  scheduleTitle: { bn: 'বছরভিত্তিক হিসাব', en: 'Year by year' },
  colYear: { bn: 'বছর', en: 'Year' },
  colDeposit: { bn: 'জমা', en: 'Deposits' },
  colProfit: { bn: 'মুনাফা', en: 'Profit' },
  colBalance: { bn: 'বছর শেষে', en: 'Year-end balance' },
  scheduleNote: { bn: 'বছর শেষের স্থিতি কর কাটার আগের।', en: 'Year-end balances are before tax.' }, // draft
  callout: {
    bn: 'মেয়াদের আগে ভাঙলে বেশিরভাগ ব্যাংক কম হারে মুনাফা দেয়। খোলার আগে শর্ত পড়ে নাও।',
    en: 'Most banks pay a lower rate if you close a DPS early. Read the terms before you open one.',
  },
  wholeYears: { bn: 'বছর পূর্ণ সংখ্যায় লেখো', en: 'Enter whole years' }, // draft
  /** draft */
  shareText: {
    bn: 'মাসে {deposit} করে {years} বছর DPS এ জমালে মেয়াদ শেষে {maturity} (কর কাটার পর)।',
    en: 'Saving {deposit} a month in a DPS for {years} years gives {maturity} at maturity, after tax.',
  },
  reportMaturity: { bn: 'মেয়াদ শেষের টাকা', en: 'Maturity amount' }, // draft
  reportProfit: { bn: 'মোট মুনাফা', en: 'Total profit' },
  reportTax: { bn: 'উৎসে কর / আবগারি শুল্ক', en: 'Tax at source / excise duty' }, // draft
  faq1Q: { bn: 'মাসিক আর ত্রৈমাসিক চক্রবৃদ্ধির পার্থক্য কী?', en: 'What is the difference between monthly and quarterly compounding?' },
  faq1A: {
    bn: 'মাসিকে প্রতি মাসের মুনাফা পরের মাস থেকেই মূলের সাথে যোগ হয়, তাই মুনাফা সামান্য বেশি।',
    en: 'With monthly compounding each month’s profit joins the balance from the next month, so the profit is slightly higher.',
  },
  faq2Q: { bn: 'DPS এ আবগারি শুল্ক কাটে?', en: 'Is excise duty taken on a DPS?' },
} as const satisfies CopyTable

export type DpsCopy = Localized<typeof COPY>
