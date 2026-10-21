// EMI page copy (Figma F6 27:5771, D · F6 66:29012). Bangla verbatim from Figma except where marked
// "draft"; English is a faithful translation. Numbers come from the engine, never typed in.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  amountLabel: { bn: 'ঋণের পরিমাণ', en: 'Loan amount' },
  rateLabel: { bn: 'বার্ষিক সুদের হার', en: 'Yearly interest rate' },
  rateHelper: { bn: 'ব্যাংকের অফার লেটারের হার বসাও।', en: 'Use the rate in the bank’s offer letter.' },
  termLabel: { bn: 'মেয়াদ', en: 'Term' },
  monthUnit: { bn: 'মাস', en: 'months' },
  termChips: { bn: 'মেয়াদ বেছে নাও', en: 'Pick a term' }, // draft: accessible name of the chip row
  years: { bn: '{n} বছর', en: '{n} {n:year|years}' },
  resultLabel: { bn: 'মাসিক কিস্তি (EMI)', en: 'Monthly instalment (EMI)' },
  resultSub: { bn: '{months} মাস ধরে প্রতি মাসে', en: 'Every month for {months} months' },
  summaryTitle: { bn: 'মোট হিসাব', en: 'Totals' },
  principal: { bn: 'ঋণের পরিমাণ', en: 'Loan amount' },
  totalInterest: { bn: 'মোট সুদ', en: 'Total interest' },
  totalPayment: { bn: 'মোট পরিশোধ', en: 'Total repayment' },
  splitPrincipal: { bn: 'মূল টাকা {pct}%', en: 'Principal {pct}%' },
  splitInterest: { bn: 'সুদ {pct}%', en: 'Interest {pct}%' },
  splitLabel: { bn: 'মোট পরিশোধে মূল টাকা আর সুদের ভাগ', en: 'Principal and interest in the total repayment' }, // draft
  /** draft: Figma shows the first three months ("মাসভিত্তিক পরিশোধ (প্রথম ৩ মাস)"); the page lists every month. */
  scheduleTitle: { bn: 'মাসভিত্তিক পরিশোধ', en: 'Month by month' },
  scheduleNote: { bn: 'শেষ কিস্তিতে পয়সার হিসাব মিলিয়ে নেওয়া হয়েছে।', en: 'The last instalment absorbs the rounding.' }, // draft
  colMonth: { bn: 'মাস', en: 'Month' },
  colPrincipal: { bn: 'মূল', en: 'Principal' },
  colInterest: { bn: 'সুদ', en: 'Interest' },
  colBalance: { bn: 'বাকি', en: 'Balance' },
  callout: {
    bn: 'প্রসেসিং ফি সাধারণত আলাদা করে শুরুতে নেয়। লোনের আগে মোট খরচ জেনে নাও।',
    en: 'Banks usually take the processing fee separately at the start. Know the total cost before you borrow.',
  },
  wholeMonths: { bn: 'মাস পূর্ণ সংখ্যায় লেখো', en: 'Enter whole months' }, // draft
  /** draft */
  shareText: {
    bn: '{amount} লোনে {rate}% হারে {months} মাসে মাসিক কিস্তি {emi}, মোট সুদ {interest}।',
    en: 'A {amount} loan at {rate}% over {months} months: {emi} a month, {interest} total interest.',
  },
  reportEmi: { bn: 'মাসিক কিস্তি (EMI)', en: 'Monthly instalment (EMI)' },
  reportInterest: { bn: 'মোট সুদ', en: 'Total interest' },
  reportSchedule: { bn: 'মাসভিত্তিক তালিকা', en: 'Month-by-month table' }, // draft
  faq1Q: { bn: 'EMI কীভাবে হিসাব হয়?', en: 'How is EMI calculated?' },
  faq1A: {
    bn: 'বাকি থাকা ঋণের উপর প্রতি মাসের সুদ ধরা হয় (reducing balance)। বাংলাদেশের বেশিরভাগ ব্যাংক এভাবেই হিসাব করে।',
    en: 'Each month’s interest is charged on the loan still unpaid (reducing balance). Most banks in Bangladesh calculate it this way.',
  },
  faq2Q: { bn: 'প্রথম দিকে সুদ বেশি কেন?', en: 'Why is the interest higher at first?' },
  /** draft answer: the Figma frame shows this item closed. */
  faq2A: {
    bn: 'শুরুতে বাকি ঋণ সবচেয়ে বেশি, তাই সুদও বেশি; কিস্তি একই থাকে বলে মূল টাকা ধীরে ধীরে বেশি শোধ হয়। যেমন {amount} লোনে {rate}% হারে প্রথম মাসে সুদ {first}, শেষ মাসে {last}।',
    en: 'At first the unpaid loan is largest, so the interest is too; the instalment stays the same, so more of it pays off the loan each month. On a {amount} loan at {rate}%, the first month’s interest is {first} and the last month’s {last}.',
  },
} as const satisfies CopyTable

export type EmiCopy = Localized<typeof COPY>
