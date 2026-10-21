// Cash Out page copy (Figma 03 Calculator — Cash Out 13:404 and the C1-b/c/d frames). Bangla is
// verbatim from Figma except where marked "draft"; English is a faithful translation. Numbers in
// the copy come from data/mfs-charges.json through the functions below, never typed in.
import type { CopyTable, Localized } from '../tool/text.ts'

const PROVIDER_NAME = {
  bkash: { bn: 'বিকাশ', en: 'bKash' },
  nagad: { bn: 'নগদ', en: 'Nagad' },
  rocket: { bn: 'রকেট', en: 'Rocket' },
  upay: { bn: 'উপায়', en: 'Upay' },
}

/** How each channel is described in a compare row and, shorter, in the result label. */
const CHANNEL_TEXT = {
  'bkash-agent': { method: { bn: 'যেকোনো এজেন্ট', en: 'Any agent' }, short: { bn: 'যেকোনো এজেন্ট', en: 'any agent' } },
  'bkash-priyo-agent': { method: { bn: 'প্রিয় এজেন্ট', en: 'Priyo agent' }, short: { bn: 'প্রিয় এজেন্ট', en: 'Priyo agent' } },
  'bkash-atm': { method: { bn: 'ATM (BRAC, City, Q-Cash)', en: 'ATM (BRAC, City, Q-Cash)' }, short: { bn: 'ATM', en: 'ATM' } },
  'nagad-app': { method: { bn: 'অ্যাপ দিয়ে', en: 'Via the app' }, short: { bn: 'অ্যাপ', en: 'app' } },
  'nagad-ussd': { method: { bn: '*167# দিয়ে', en: 'Via *167#' }, short: { bn: '*167#', en: '*167#' } },
  'nagad-atm': { method: { bn: 'ATM', en: 'ATM' }, short: { bn: 'ATM', en: 'ATM' } },
  'rocket-agent': { method: { bn: 'এজেন্ট', en: 'Agent' }, short: { bn: 'এজেন্ট', en: 'agent' } },
  'rocket-atm': { method: { bn: 'DBBL ATM বা ব্রাঞ্চ', en: 'DBBL ATM or branch' }, short: { bn: 'DBBL ATM', en: 'DBBL ATM' } },
  'upay-agent': { method: { bn: 'এজেন্ট', en: 'Agent' }, short: { bn: 'এজেন্ট', en: 'agent' } },
  'upay-atm': { method: { bn: 'ATM', en: 'ATM' }, short: { bn: 'ATM', en: 'ATM' } },
}

export const COPY = {
  modeLabel: { bn: 'কী জানতে চাও?', en: 'What do you want to know?' },
  modeCharge: { bn: 'তুললে চার্জ কত', en: 'Charge to cash out' },
  modeMax: { bn: 'কত তোলা যাবে', en: 'How much I can take' },
  subtitleMax: {
    bn: 'ব্যালেন্স লিখলে দেখাবে চার্জ কেটে সর্বোচ্চ কত তুলতে পারবে।',
    en: 'Type your balance to see the most you can take out after the charge.',
  },
  amountLabel: { bn: 'কত টাকা ক্যাশ আউট করবে?', en: 'How much will you cash out?' },
  balanceLabel: { bn: 'ওয়ালেটে এখন কত টাকা আছে?', en: 'How much is in your wallet now?' },
  usedLabel: { bn: 'এই মাসে প্রিয় এজেন্ট থেকে আগে তুলেছ', en: 'Already taken via Priyo agent this month' },
  /** {quota}: the monthly Priyo amount without ৳, as Figma writes it. */
  usedHelper: {
    bn: 'বিকাশ প্রিয় এজেন্টের {quota} টাকা মাসিক লিমিট হিসাবের জন্য। না জানলে ০ রাখো।',
    en: 'For the {quota} taka monthly bKash Priyo agent limit. Leave 0 if you don’t know.',
  },
  usedOver: { bn: '{amount} তুললে মাসের {quota} সীমা পার হবে', en: 'Taking {amount} goes over the {quota} monthly limit' },
  compareCharge: { bn: 'সব উপায়, সস্তা থেকে দামি', en: 'Every way, cheapest first' },
  compareChargeColumn: { bn: 'চার্জ', en: 'Charge' },
  compareMax: { bn: 'কোন উপায়ে কত তোলা যাবে', en: 'How much each way gives you' },
  compareMaxColumn: { bn: 'হাতে পাবে', en: 'You get' },
  bestMax: { bn: 'সবচেয়ে বেশি তুলতে পারবে: {name}', en: 'Most you can take: {name}' },
  youGet: { bn: 'হাতে পাবে {amount}', en: 'You get {amount}' },
  keepInWallet: { bn: 'ওয়ালেটে রাখতে হবে {amount}', en: 'Keep {amount} in the wallet' },
  lessThan: { bn: '{reference} চেয়ে {amount} কম', en: '{amount} less than {reference}' },
  charge: { bn: 'চার্জ {amount}', en: 'Charge {amount}' },
  leftInWallet: { bn: 'ওয়ালেটে থাকবে {amount}', en: '{amount} stays in the wallet' },
  total: { bn: 'মোট {amount}', en: 'Total {amount}' },
  perThousand: { bn: '{rate}/হাজার', en: '{rate}/thousand' },
  overQuota: { bn: 'সীমা পার, {rate}/হাজার', en: 'over the limit, {rate}/thousand' },
  overLimit: { bn: 'লিমিট পার', en: 'Over the limit' },
  cheapest: { bn: 'সাশ্রয়ী', en: 'Cheapest' },
  calloutCharge: {
    bn: 'চার্জ টাকার উপর থেকে না, আলাদা করে ওয়ালেট থেকে কাটে। পুরো ব্যালেন্স তুলতে "ব্যালেন্স থেকে কত তোলা যাবে" বেছে নাও।',
    en: 'The charge is taken from your wallet on top of the amount. To empty the wallet, choose "How much I can take".',
  },
  calloutMax: {
    bn: 'চার্জ ওয়ালেট থেকে আলাদা কাটে, তাই পুরো ব্যালেন্স তোলা যায় না। এখানে চার্জ রেখে সর্বোচ্চ কত তোলা যাবে সেটা দেখানো হয়েছে।',
    en: 'The charge comes out of the wallet separately, so you can’t take the whole balance. This shows the most you can take while leaving the charge.',
  },
  /** C1-c, above the result. */
  quotaCallout: {
    bn: 'এই মাসে প্রিয় এজেন্ট থেকে {used} তুলেছ। {amount} তুললে {quota} সীমা পার হয়, তখন পুরো লেনদেনে {rate} রেট লাগে। {left} প্রিয় এজেন্টে আর বাকিটা অন্যভাবে তুললে খরচ কমবে।',
    en: 'You have taken {used} via Priyo agent this month. Taking {amount} goes over the {quota} limit, and then the whole transaction pays the {rate} rate. Take {left} via Priyo agent and the rest another way to pay less.',
  },
  /** C1-d: the amount field under the daily limit. */
  dailyLimitField: {
    bn: 'দিনে সর্বোচ্চ {max} ক্যাশ আউট করা যায় (বাংলাদেশ ব্যাংকের সীমা)',
    en: 'You can cash out at most {max} a day (Bangladesh Bank limit)',
  },
  /** draft: the per-transaction and monthly variants of the limit message. */
  txnLimitField: { bn: 'একবারে সর্বোচ্চ {max} ক্যাশ আউট করা যায়', en: 'You can cash out at most {max} at a time' },
  monthLimitField: { bn: 'মাসে সর্বোচ্চ {max} ক্যাশ আউট করা যায়', en: 'You can cash out at most {max} a month' },
  limitTitle: { bn: 'এই পরিমাণ একবারে তোলা যাবে না', en: 'This amount can’t be taken at once' },
  limitBody: { bn: '{max} বা কম লেখো।', en: 'Enter {max} or less.' },
  fixWith: { bn: '{max} দিয়ে হিসাব করো', en: 'Calculate with {max}' },
  /** draft: max mode, when the balance can't even cover the smallest withdrawal plus charge. */
  noBalanceTitle: { bn: 'এই ব্যালেন্স থেকে তোলা যাবে না', en: 'Nothing can be taken from this balance' },
  noBalanceBody: {
    bn: 'চার্জ দেওয়ার মতো টাকা ওয়ালেটে নেই। ব্যালেন্স আরেকটু বেশি লেখো।',
    en: 'The wallet can’t cover the charge. Enter a slightly larger balance.',
  },
  /** draft: the share text. */
  shareText: { bn: '{amount} ক্যাশ আউটে সবচেয়ে কম চার্জ {charge} ({name})।', en: 'Cheapest charge to cash out {amount}: {charge} ({name}).' },
  shareTextMax: { bn: '{amount} ব্যালেন্স থেকে সবচেয়ে বেশি তোলা যায় {best} ({name})।', en: 'From a {amount} balance you can take at most {best} ({name}).' },
  reportItem: { bn: '{provider} · {method} · {rate}', en: '{provider} · {method} · {rate}' },
  stepsTitle: { bn: 'চার্জ কমানোর ৪টা উপায়', en: '4 ways to pay less' },
  providers: PROVIDER_NAME,
  channels: CHANNEL_TEXT,
  /** The channel the saving is measured against, as the "less than" line names it. */
  references: {
    'bkash-agent': { bn: 'সাধারণ বিকাশ এজেন্টের', en: 'an ordinary bKash agent' },
  },
} as const satisfies CopyTable

/** The Cash Out copy in one language (what the island gets). */
export type CashOutCopy = Localized<typeof COPY>


