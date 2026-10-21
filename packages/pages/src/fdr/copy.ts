// FDR page copy (Figma F8 27:6253, F8-b 64:21334, D · F8 66:29578, D · F8-b 69:39636). Bangla
// verbatim from Figma except where marked "draft"; English is a faithful translation.
import { DEPOSIT_COPY } from '../deposit/shared.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...DEPOSIT_COPY,
  amountLabel: { bn: 'জমার পরিমাণ', en: 'Deposit amount' },
  rateLabel: { bn: 'বার্ষিক হার', en: 'Yearly rate' },
  termLabel: { bn: 'মেয়াদ', en: 'Term' },
  monthUnit: { bn: 'মাস', en: 'months' },
  termChips: { bn: 'মেয়াদ বেছে নাও', en: 'Pick a term' }, // draft: accessible name of the chip row
  chipMonths: { bn: '{n} মাস', en: '{n} months' },
  chipYears: { bn: '{n} বছর', en: '{n} {n:year|years}' },
  modeLabel: { bn: 'মুনাফা যোগ হয়', en: 'Profit is paid' },
  modeSimple: { bn: 'মেয়াদ শেষে', en: 'At maturity' },
  modeRenew: { bn: 'প্রতি ৩ মাসে রিনিউ', en: 'Renew every 3 months' },
  resultLabel: { bn: 'মেয়াদ শেষে হাতে পাবে', en: 'You get at maturity' },
  resultSub: { bn: '{months} মাস পর, কর কাটার পর', en: 'After {months} months, after tax' },
  resultSubRenew: { bn: '৩ মাস পরপর মুনাফাসহ রিনিউ', en: 'renewed with profit every 3 months' },
  summaryTitle: { bn: 'হিসাব', en: 'Breakdown' },
  deposit: { bn: 'জমা', en: 'Deposit' },
  totalProfit: { bn: 'মোট মুনাফা', en: 'Total profit' },
  maturity: { bn: 'মেয়াদ শেষে', en: 'At maturity' },
  wholeMonths: { bn: 'মাস পূর্ণ সংখ্যায় লেখো', en: 'Enter whole months' }, // draft
  /** draft: renew needs a term in steps of 3 months. */
  renewTermTitle: { bn: 'রিনিউ হলে মেয়াদ ৩ মাসের গুণিতক হয়', en: 'A renewed FDR runs in steps of 3 months' },
  renewTermBody: { bn: '৩, ৬, ৯, ১২… মাস লেখো।', en: 'Enter 3, 6, 9, 12… months.' },
  renewTermField: { bn: '৩ মাসের গুণিতক লেখো', en: 'Enter a multiple of 3' },
  renewFix: { bn: '{months} মাস দিয়ে হিসাব করো', en: 'Calculate with {months} months' },
  /** draft */
  shareText: {
    bn: '{amount} FDR এ {rate}% হারে {months} মাসে মেয়াদ শেষে {maturity} (কর কাটার পর)।',
    en: 'A {amount} FDR at {rate}% for {months} months gives {maturity} at maturity, after tax.',
  },
  reportMaturity: { bn: 'মেয়াদ শেষের টাকা', en: 'Maturity amount' }, // draft
  reportProfit: { bn: 'মোট মুনাফা', en: 'Total profit' },
  reportTax: { bn: 'উৎসে কর / আবগারি শুল্ক', en: 'Tax at source / excise duty' }, // draft
  faq1Q: { bn: 'FDR এর মুনাফায় কত কর কাটে?', en: 'How much tax is taken from FDR profit?' },
  faq2Q: { bn: 'অটো-রিনিউ করলে কী হয়?', en: 'What happens with auto-renewal?' },
  /** draft answer: the Figma frame shows this item closed. */
  faq2A: {
    bn: 'মেয়াদ শেষে মূল টাকা আর কর কাটার পরের মুনাফা মিলিয়ে নতুন FDR খোলা হয়, তাই পরের বার মুনাফার উপরও মুনাফা আসে। যেমন {amount} {rate}% হারে ১ বছরে: মেয়াদ শেষে একবারে পেলে {simple}, প্রতি ৩ মাসে রিনিউ করলে {renew}।',
    en: 'At maturity the deposit and the profit after tax go into a new FDR, so the next term earns profit on the profit too. For {amount} at {rate}% over a year: {simple} paid once at maturity, {renew} renewed every 3 months.',
  },
} as const satisfies CopyTable

export type FdrCopy = Localized<typeof COPY>
