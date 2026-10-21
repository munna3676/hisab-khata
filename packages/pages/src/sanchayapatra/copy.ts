// Sanchayapatra page copy (Figma C7 29:7661, P7 পিকার 59:17386, D · C7 68:6269, D · P7 70:21156).
// Bangla verbatim from Figma except where marked "draft"; English is a faithful translation.
// Scheme names and details in Bangla come from data/finance/sanchayapatra.json.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  schemeLabel: { bn: 'স্কিম', en: 'Scheme' },
  pickerTitle: { bn: 'কোন সঞ্চয়পত্র?', en: 'Which Sanchayapatra?' },
  chipsLabel: { bn: 'স্কিম বেছে নাও', en: 'Pick a scheme' }, // draft: accessible name of the chip row
  short: {
    'bangladesh-5y': { bn: '৫ বছর মেয়াদি', en: '5-year' },
    'three-month': { bn: '৩ মাস অন্তর মুনাফা', en: '3-monthly profit' },
    paribar: { bn: 'পরিবার', en: 'Paribar' },
    pensioner: { bn: 'পেনশনার', en: 'Pensioner' },
  },
  /** English names and details (the Bangla ones are in the data file). */
  nameEn: {
    'bangladesh-5y': { bn: '৫ বছর মেয়াদি বাংলাদেশ সঞ্চয়পত্র', en: '5-year Bangladesh Sanchayapatra' },
    'three-month': { bn: '৩ মাস অন্তর মুনাফাভিত্তিক', en: '3-monthly profit Sanchayapatra' },
    paribar: { bn: 'পরিবার সঞ্চয়পত্র', en: 'Paribar Sanchayapatra' },
    pensioner: { bn: 'পেনশনার সঞ্চয়পত্র', en: 'Pensioner Sanchayapatra' },
  },
  detailEn: {
    'bangladesh-5y': { bn: '৫ বছর · মেয়াদ শেষে মুনাফা', en: '5 years · profit at maturity' },
    'three-month': { bn: '৩ বছর · তিন মাস পরপর মুনাফা', en: '3 years · profit every three months' },
    paribar: { bn: '৫ বছর · মাসিক মুনাফা · নারী, প্রতিবন্ধী ও ৬৫+', en: '5 years · monthly profit · women, disabled people and 65+' },
    pensioner: { bn: '৫ বছর · অবসরপ্রাপ্তদের জন্য', en: '5 years · for retired people' },
  },
  amountLabel: { bn: 'বিনিয়োগ', en: 'Investment' },
  resultMonthly: { bn: 'মাসিক মুনাফা', en: 'Monthly profit' },
  resultQuarterly: { bn: '৩ মাস পরপর মুনাফা', en: 'Profit every 3 months' }, // draft
  resultMaturity: { bn: 'মেয়াদ শেষে মুনাফা', en: 'Profit at maturity' }, // draft
  resultSub: {
    bn: '{amount} {rate}% হারে · {tax}% অগ্রিম কর কাটলে হাতে {net}',
    en: '{amount} at {rate}% · {net} in hand after {tax}% advance tax',
  },
  lakh: { bn: '{n} লাখ', en: '{n} lakh' },
  tableTitle: { bn: 'বর্তমান হার', en: 'Current rates' },
  colStep: { bn: 'বিনিয়োগের ধাপ', en: 'Investment band' },
  colRate: { bn: 'হার', en: 'Rate' },
  upTo: { bn: '{amount} পর্যন্ত ({scheme})', en: 'Up to {amount} ({scheme})' },
  above: { bn: '{amount} এর বেশি ({scheme})', en: 'Above {amount} ({scheme})' }, // draft
  otherSchemes: { bn: 'অন্য স্কিম (মেয়াদ অনুযায়ী)', en: 'Other schemes (by term)' },
  pct: { bn: '{n}%', en: '{n}%' },
  range: { bn: '{min}% – {max}%', en: '{min}% – {max}%' },
  pickerFooter: { bn: 'হার: {range}, জমার পরিমাণ অনুযায়ী ধাপে ধাপে।', en: 'Rates: {range}, in steps by the amount held.' },
  callout: {
    bn: 'মুনাফায় ১০% অগ্রিম কর করার প্রস্তাব ফাইন্যান্স বিল ২০২৬ এ। প্রতিটা স্কিমের আলাদা হার জাতীয় সঞ্চয় অধিদপ্তর থেকে মিলিয়ে নাও।',
    en: 'Finance Bill 2026 proposes a 10% advance tax on profit. Check each scheme’s rate with the Directorate of National Savings.',
  },
  /** draft */
  limitTitle: { bn: 'এই পরিমাণে কেনা যায় না', en: 'This amount cannot be bought' },
  /** draft */
  limitBody: { bn: 'এই স্কিমে {min} থেকে {max} পর্যন্ত কেনা যায়।', en: 'This scheme can be bought from {min} to {max}.' },
  /** draft */
  limitFix: { bn: '{amount} দিয়ে হিসাব করো', en: 'Calculate with {amount}' },
  /** draft */
  shareText: {
    bn: '{scheme} এ {amount} রাখলে {label} {profit}, কর কাটার পর হাতে {net}।',
    en: '{amount} in {scheme}: {label} {profit}, {net} after tax.',
  },
  reportProfit: { bn: 'মুনাফা', en: 'Profit' },
  reportTax: { bn: 'অগ্রিম কর', en: 'Advance tax' }, // draft
  reportRate: { bn: 'বর্তমান হার', en: 'Current rates' },
  close: { bn: 'বন্ধ করো', en: 'Close' },
} as const satisfies CopyTable

export type SanchayapatraCopy = Localized<typeof COPY>
