// Currency converter page copy (Figma F11 27:6940, P8 পিকার 59:17540, D · F11 66:30468, D · P8
// 70:21452). Bangla verbatim from Figma except where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  currencyLabel: { bn: 'কোন মুদ্রা?', en: 'Which currency?' },
  amountLabel: { bn: 'পরিমাণ', en: 'Amount' },
  popular: { bn: 'জনপ্রিয়', en: 'Popular' },
  /** Currency names (Figma P8); a name in the data file wins on Bangla pages. */
  names: {
    SAR: { bn: 'সৌদি রিয়াল', en: 'Saudi riyal' },
    AED: { bn: 'আমিরাতি দিরহাম', en: 'UAE dirham' },
    USD: { bn: 'মার্কিন ডলার', en: 'US dollar' },
    MYR: { bn: 'মালয়েশিয়ান রিংগিত', en: 'Malaysian ringgit' },
    GBP: { bn: 'ব্রিটিশ পাউন্ড', en: 'British pound' },
    EUR: { bn: 'ইউরো', en: 'Euro' },
  },
  banks: {
    'Dutch-Bangla Bank': { bn: 'ডাচ-বাংলা ব্যাংক', en: 'Dutch-Bangla Bank' },
  },
  option: { bn: '{name} · {code}', en: '{name} · {code}' },
  perUnit: { bn: '১ {code} = {rate}', en: '1 {code} = {rate}' },
  notListed: { bn: 'ব্যাংকের তালিকায় নেই, অন্য সূত্র যোগ হলে আসবে', en: 'Not on the bank’s list; it will appear when another source is added' },
  searchLabel: { bn: 'মুদ্রা খোঁজো', en: 'Search currencies' }, // draft
  searchPlaceholder: { bn: 'মুদ্রার নাম বা কোড', en: 'Currency name or code' }, // draft
  searchEmpty: { bn: '"{q}" নামে কোনো মুদ্রা পাইনি।', en: 'No currency called "{q}".' }, // draft
  sheetFooter: { bn: '{bank} · {date} এর হার', en: '{bank} · rates of {date}' }, // draft
  resultLabel: { bn: 'টাকায় পাবে', en: 'You get in taka' },
  resultSub: { bn: '{bank} TT ক্রয় হার: ১ {code} = {rate} · {date}', en: '{bank} TT buying rate: 1 {code} = {rate} · {date}' },
  tableTitle: { bn: 'অন্য মুদ্রায় {amount}', en: '{amount} in other currencies' },
  colCurrency: { bn: 'মুদ্রা', en: 'Currency' },
  colTaka: { bn: 'টাকায়', en: 'In taka' },
  noRateTitle: { bn: '{code} এর হার এখনো নেই', en: 'No {code} rate yet' }, // draft
  callout: {
    bn: 'ব্যাংক ভেদে রেট আলাদা। এখানে {bank}ের TT ক্লিন ক্রয় হার দেখানো, প্রতিদিন আপডেট হবে।',
    en: 'Rates differ by bank. This shows {bank}’s TT clean buying rate, updated daily.',
  },
  /** draft */
  shareText: { bn: '{amount} {code} = {taka} ({bank}, {date})', en: '{amount} {code} = {taka} ({bank}, {date})' },
  reportResult: { bn: 'টাকায় পাবে', en: 'Amount in taka' },
  reportRate: { bn: 'ক্রয় হার', en: 'Buying rate' }, // draft
  reportTable: { bn: 'অন্য মুদ্রার হার', en: 'Other currencies' }, // draft
  close: { bn: 'বন্ধ করো', en: 'Close' },
} as const satisfies CopyTable

export type CurrencyCopy = Localized<typeof COPY>
