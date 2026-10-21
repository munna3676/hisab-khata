// Loan eligibility copy (Figma F9 27:6477, D · F9 66:29859). Bangla verbatim from Figma except
// where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  incomeLabel: { bn: 'মাসিক আয় (হাতে পাও)', en: 'Monthly income (take-home)' },
  emiLabel: { bn: 'এখন চলা লোনের মাসিক কিস্তি', en: 'Instalments on loans you already have' },
  rateLabel: { bn: 'সুদের হার', en: 'Interest rate' },
  termLabel: { bn: 'মেয়াদ', en: 'Term' },
  yearUnit: { bn: 'বছর', en: 'years' },
  dbrLabel: { bn: 'আয়ের কত অংশ কিস্তিতে যেতে পারে', en: 'How much of your income can go to instalments' },
  pct: { bn: '{n}%', en: '{n}%' },
  resultLabel: { bn: 'আনুমানিক লোন পেতে পারো', en: 'You may get about' },
  lakh: { bn: ' লাখ', en: ' lakh' },
  resultSub: {
    bn: 'মাসিক কিস্তি সর্বোচ্চ {cap} ধরে (আয়ের {pct}%, চলতি কিস্তি বাদে)',
    en: 'With a monthly instalment of at most {cap} ({pct}% of income, minus current instalments)',
  },
  summaryTitle: { bn: 'কিভাবে হিসাব হলো', en: 'How this was worked out' },
  incomeShare: { bn: 'আয়ের {pct}%', en: '{pct}% of income' },
  currentEmi: { bn: 'চলতি কিস্তি', en: 'Current instalments' },
  newEmiLimit: { bn: 'নতুন কিস্তির সীমা', en: 'Limit for the new instalment' },
  loanAt: { bn: '{years} বছর, {rate}% এ এই কিস্তিতে লোন', en: 'Loan at this instalment, {years} years at {rate}%' },
  minus: { bn: '− {amount}', en: '− {amount}' },
  callout: {
    bn: 'এটা শুধু আনুমানিক। ব্যাংক তোমার চাকরি, ক্রেডিট রিপোর্ট আর কাগজ দেখে আসল সীমা ঠিক করবে।',
    en: 'This is only an estimate. The bank sets the real limit from your job, credit report and papers.',
  },
  /** draft: no room left for a new instalment. */
  noRoomTitle: { bn: 'নতুন কিস্তির জায়গা নেই', en: 'No room for a new instalment' },
  noRoomBody: {
    bn: 'চলতি কিস্তি ({emi}) আয়ের {pct}% ({limit}) এর সমান বা বেশি। চলতি লোন কিছুটা শোধ হলে আবার দেখো।',
    en: 'Your current instalments ({emi}) already take {pct}% of income ({limit}) or more. Check again once some of the loan is repaid.',
  },
  wholeYears: { bn: 'বছর পূর্ণ সংখ্যায় লেখো', en: 'Enter whole years' }, // draft
  /** draft */
  shareText: {
    bn: 'মাসে {income} আয়ে আনুমানিক {loan} লোন পাওয়া যেতে পারে ({years} বছর, {rate}%)।',
    en: 'On {income} a month you may get a loan of about {loan} ({years} years at {rate}%).',
  },
  reportLoan: { bn: 'আনুমানিক লোন', en: 'Estimated loan' }, // draft
  reportShare: { bn: 'আয়ের কত অংশ (৪০% / ৫০%)', en: 'Share of income (40% / 50%)' }, // draft
} as const satisfies CopyTable

export type LoanEligibilityCopy = Localized<typeof COPY>
