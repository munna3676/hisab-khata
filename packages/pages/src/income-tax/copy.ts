// Income tax page copy (Figma C6 28:7708, C6-b ফ্রিল্যান্সার 64:21554, D · C6 68:6010, D · C6-b
// 69:39942). Bangla verbatim from Figma except where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  modeLabel: { bn: 'তুমি কে?', en: 'You are' },
  salaried: { bn: 'চাকরিজীবী', en: 'Salaried' },
  freelancer: { bn: 'ফ্রিল্যান্সার', en: 'Freelancer' },
  incomeLabel: { bn: 'বছরের মোট করযোগ্য আয়', en: 'Total taxable income for the year' },
  freelanceIncomeLabel: { bn: 'বছরে ফ্রিল্যান্সিং আয় (ব্যাংকে আনা)', en: 'Freelancing income for the year (brought in through a bank)' },
  categoryLabel: { bn: 'করদাতার ধরন', en: 'Taxpayer type' },
  categories: {
    general: { bn: 'সাধারণ', en: 'General' },
    womenOrSenior: { bn: 'নারী / ৬৫+', en: 'Women / 65+' },
    disabled: { bn: 'প্রতিবন্ধী', en: 'Disabled' },
  },
  /** Table title: Figma "স্ল্যাব অনুযায়ী (সাধারণ করদাতা)"; the other two are draft. */
  tableTitle: { bn: 'স্ল্যাব অনুযায়ী ({who} করদাতা)', en: 'By slab ({who} taxpayer)' },
  investmentLabel: { bn: 'বিনিয়োগ (রিবেটের জন্য)', en: 'Investment (for the rebate)' },
  resultLabel: { bn: 'আনুমানিক কর', en: 'Estimated tax' },
  resultLabelFreelancer: { bn: 'আনুমানিক কর (সাধারণ স্ল্যাবে)', en: 'Estimated tax (ordinary slabs)' },
  resultSub: {
    bn: 'স্ল্যাবে {gross} − বিনিয়োগ রিবেট {rebate} · ন্যূনতম কর {minimum}',
    en: 'Slabs {gross} − investment rebate {rebate} · minimum tax {minimum}',
  },
  resultSubFree: { bn: 'করমুক্ত সীমার মধ্যে, কর দিতে হবে না', en: 'Within the tax-free limit: no tax to pay' }, // draft
  resultSubFreelancer: { bn: 'ফ্রিল্যান্সার কর-ছাড়ের প্রস্তাব পাস হলে {tax}', en: '{tax} if the freelancer exemption is passed' },
  colStep: { bn: 'আয়ের ধাপ', en: 'Income band' },
  colRate: { bn: 'হার', en: 'Rate' },
  colTax: { bn: 'কর', en: 'Tax' },
  first: { bn: 'প্রথম {amount}', en: 'First {amount}' },
  next: { bn: 'পরের {amount}', en: 'Next {amount}' },
  pct: { bn: '{n}%', en: '{n}%' },
  calloutSalaried: {
    bn: 'নারী ও ৬৫+ বয়সীদের করমুক্ত সীমা {women}, প্রতিবন্ধী {disabled}। ফ্রিল্যান্সারদের আয় করমুক্ত করার প্রস্তাব বাজেট {year} এ এসেছে, চূড়ান্ত অবস্থা NBR থেকে মিলিয়ে নাও।',
    en: 'The tax-free limit is {women} for women and people 65+, {disabled} for disabled people. Budget {year} proposes making freelancers’ income tax-free; check the final position with NBR.',
  },
  calloutFreelancer: {
    bn: 'বাজেট {year} এ IT ফ্রিল্যান্সিং আয় করমুক্ত রাখার প্রস্তাব এসেছে, চূড়ান্ত অবস্থা NBR থেকে মিলিয়ে নাও। সুবিধা পেতে আয় ব্যাংকিং চ্যানেলে আনতে হয়, রিটার্ন জমা দিতে হয়।',
    en: 'Budget {year} proposes keeping IT freelancing income tax-free; check the final position with NBR. To get it, the income must come in through banking channels and you must file a return.',
  },
  /** draft */
  shareText: {
    bn: 'বছরে {income} আয়ে আনুমানিক আয়কর {tax} (আয়বর্ষ {year})।',
    en: 'Estimated income tax on {income} a year: {tax} (income year {year}).',
  },
  reportTax: { bn: 'আনুমানিক কর', en: 'Estimated tax' },
  reportSlabs: { bn: 'স্ল্যাব অনুযায়ী হিসাব', en: 'Tax by slab' }, // draft
  reportRebate: { bn: 'বিনিয়োগ রিবেট', en: 'Investment rebate' },
} as const satisfies CopyTable

export type IncomeTaxCopy = Localized<typeof COPY>
