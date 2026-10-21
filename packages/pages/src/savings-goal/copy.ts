// Savings goal copy (Figma C4 28:7332, D · C4 68:5478). Bangla verbatim from Figma except where
// marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  targetLabel: { bn: 'লক্ষ্য', en: 'Goal' },
  monthsLabel: { bn: 'সময়', en: 'Time' },
  monthUnit: { bn: 'মাস', en: 'months' },
  rateLabel: { bn: 'মুনাফা', en: 'Return' },
  purposeLabel: { bn: 'কিসের জন্য', en: 'What for' },
  /** English names of data/finance/savings-goal-presets.json (it holds Bangla only). */
  purposes: {
    wedding: { bn: 'বিয়ে', en: 'Wedding' },
    bike: { bn: 'বাইক', en: 'Motorbike' },
    'study-abroad': { bn: 'বিদেশে পড়া', en: 'Study abroad' },
    'emergency-fund': { bn: 'জরুরি তহবিল', en: 'Emergency fund' },
  },
  resultLabel: { bn: 'মাসে জমাতে হবে', en: 'Save each month' },
  resultSub: { bn: '{rate}% মুনাফা ধরে · মুনাফা ছাড়া লাগত {without}', en: 'At {rate}% return · {without} without any return' },
  resultSubNoReturn: { bn: 'মুনাফা ছাড়া', en: 'Without any return' }, // draft: rate 0
  summaryTitle: { bn: '{months} মাস পর', en: 'After {months} months' },
  totalDeposit: { bn: 'তোমার মোট জমা', en: 'Your total savings' },
  profit: { bn: 'মুনাফা', en: 'Return' },
  goal: { bn: 'লক্ষ্য', en: 'Goal' },
  callout: {
    bn: 'DPS বা সঞ্চয়পত্রে রাখলে মুনাফা আর কর আলাদা হবে। DPS ক্যালকুলেটরে মিলিয়ে দেখো।',
    en: 'In a DPS or savings certificate the return and tax will differ. Check with the DPS calculator.',
  },
  wholeMonths: { bn: 'মাস পূর্ণ সংখ্যায় লেখো', en: 'Enter whole months' }, // draft
  /** draft */
  shareText: { bn: '{months} মাসে {target} জমাতে মাসে {monthly} রাখতে হবে।', en: 'To reach {target} in {months} months, save {monthly} a month.' },
  shareTextFor: { bn: '{purpose}: {months} মাসে {target} জমাতে মাসে {monthly} রাখতে হবে।', en: '{purpose}: to reach {target} in {months} months, save {monthly} a month.' },
  reportMonthly: { bn: 'মাসে জমাতে হবে', en: 'Monthly saving' },
} as const satisfies CopyTable

export type SavingsGoalCopy = Localized<typeof COPY>
