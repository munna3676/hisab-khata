// Home page content (Figma "01 Home" 11:2, "D1 Home — Desktop" 19:2, "A10 Home — English" 25:4022).
// Copy that only the home page uses lives here; every number is computed by @hisab/core from data/.
import { calculateEmi } from '@hisab/core/emi'
import { convertLand } from '@hisab/core/land'
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import { calculateMfsCharge, type MfsChannel } from '@hisab/core/mfs-charge'
import type { Fact } from '@hisab/data/types'
import { formatNumberIn, formatTakaIn } from '@hisab/i18n/format'
import { t } from '@hisab/i18n/messages'
import { routeOf } from '@hisab/i18n/routes'
import ageLimitJson from '../../../../data/jobs/govt-age-limit.json'
import mfsJson from '../../../../data/mfs-charges.json'
import { banglaDateText } from './dates'
import type { Lang } from './site'

const channels = (mfsJson as { channels: Fact<MfsChannel>[] }).channels
const ageLimit = ageLimitJson as Fact<{ maxYears: number; presets: number[] }>

function channel(id: string): Fact<MfsChannel> {
  const fact = channels.find((c) => c.value.id === id)
  if (!fact) throw new Error(`home: no MFS channel '${id}' in data/mfs-charges.json`)
  return fact
}

/** A Fact is unverified until someone checks it at the source (data/README: note "unverified…"). */
export const isUnverified = (fact: Fact<unknown>) => typeof fact.note === 'string' && /^unverified\b/i.test(fact.note)

export { banglaDateText, dateLine, todayInDhaka } from './dates'

/** Popular search chips (mobile shows six, desktop the first four). */
export const POPULAR: Record<Lang, string[]> = {
  bn: ['বিকাশ চার্জ', 'লোন EMI', 'বয়স হিসাব', 'শতাংশ থেকে কাঠা', 'GPA', 'NID সংশোধন'],
  en: ['bKash charge', 'Loan EMI', 'Age', 'Decimal to katha', 'GPA', 'NID correction'],
}

export const searchHref = (lang: Lang, query: string) => `${routeOf('search', lang)}?q=${encodeURIComponent(query)}`

export type SectionIcon = 'wallet' | 'bank' | 'send' | 'calculator' | 'land' | 'guide'

export interface SectionItem {
  id: string
  icon: SectionIcon
  /** Mobile subtitle (01 Home) and the shorter desktop one (D1). */
  subtitle: Record<Lang, { mobile: string; desktop: string }>
}

export const SECTIONS: SectionItem[] = [
  {
    id: 'mobile-banking',
    icon: 'wallet',
    subtitle: {
      bn: { mobile: 'বিকাশ, নগদ, রকেট, উপায়', desktop: 'বিকাশ, নগদ, রকেট, উপায়' },
      en: { mobile: 'bKash, Nagad, Rocket, Upay', desktop: 'bKash, Nagad, Rocket, Upay' },
    },
  },
  {
    id: 'bank',
    icon: 'bank',
    subtitle: { bn: { mobile: 'লোন, DPS, FDR, তুলনা', desktop: 'লোন, DPS, FDR' }, en: { mobile: 'Loan, DPS, FDR', desktop: 'Loan, DPS, FDR' } },
  },
  {
    id: 'remittance',
    icon: 'send',
    subtitle: {
      bn: { mobile: 'বিদেশ থেকে কোনটায় বেশি', desktop: 'কোনটায় বেশি পাবে' },
      en: { mobile: 'Who pays your family more', desktop: 'Who pays more' },
    },
  },
  {
    id: 'calculators',
    icon: 'calculator',
    subtitle: {
      bn: { mobile: 'VAT, ট্যাক্স, GPA, মেস', desktop: 'VAT, ট্যাক্স, GPA, মেস' },
      en: { mobile: 'VAT, tax, GPA, mess', desktop: 'VAT, tax, GPA, mess' },
    },
  },
  {
    id: 'date-land-gold',
    icon: 'land',
    subtitle: {
      bn: { mobile: 'বয়স, কাঠা-বিঘা, ভরি', desktop: 'বয়স, কাঠা, ভরি' },
      en: { mobile: 'Age, katha, vori', desktop: 'Age, katha, vori' },
    },
  },
  {
    id: 'sorkari-kaj',
    icon: 'guide',
    subtitle: {
      bn: { mobile: 'NID, পাসপোর্ট, জন্ম নিবন্ধন', desktop: 'NID, পাসপোর্ট' },
      en: { mobile: 'NID, passport, birth reg.', desktop: 'NID, passport' },
    },
  },
]

/** Section card titles: Figma uses the short section names (English A10: "Banks", "Govt tasks"). */
export const SECTION_TITLE_KEY = {
  'mobile-banking': 'nav.mobileBanking',
  bank: 'nav.bank',
  remittance: 'nav.remittance',
  calculators: 'nav.calculators',
  'date-land-gold': null,
  'sorkari-kaj': 'nav.sorkariKaj',
} as const

export interface TodayRow {
  label: string
  value: string
  /** Shown on the desktop card only (D1 has five rows, 01 Home four). */
  desktopOnly?: boolean
}

export interface TodayLedger {
  rows: TodayRow[]
  /** Every Fact behind the rows has been checked at its source. */
  verified: boolean
  /** The oldest check among them (YYYY-MM-DD), for the Verified Line. */
  checked: string
  source: string
}

const TODAY_CHANNELS: { id: string; label: Record<Lang, string>; desktopOnly?: boolean }[] = [
  { id: 'bkash-priyo-agent', label: { bn: 'বিকাশ প্রিয় এজেন্ট', en: 'bKash Priyo agent' } },
  { id: 'bkash-agent', label: { bn: 'বিকাশ অন্য এজেন্ট', en: 'bKash other agent' }, desktopOnly: true },
  { id: 'nagad-app', label: { bn: 'নগদ অ্যাপ', en: 'Nagad app' } },
  { id: 'rocket-atm', label: { bn: 'রকেট DBBL ATM', en: 'Rocket DBBL ATM' } },
]

/** আজকের খাতা: today's Bangla date and the cash-out price per 1,000 on four channels, from data/mfs-charges.json. */
export function todayLedger(lang: Lang, day: CalendarDate): TodayLedger {
  const facts = TODAY_CHANNELS.map((c) => channel(c.id))
  const rows: TodayRow[] = [{ label: lang === 'bn' ? 'বাংলা তারিখ' : 'Bangla date', value: banglaDateText(lang, day) }]
  TODAY_CHANNELS.forEach((c, i) => {
    const per1000 = calculateMfsCharge({ amount: 1000, channel: facts[i]!.value }).charge
    rows.push({
      label: c.label[lang],
      value: t(lang, 'home.perThousand', { amount: formatTakaIn(lang, per1000, { decimals: 2 }) }),
      desktopOnly: c.desktopOnly,
    })
  })
  const oldest = [...facts].sort((a, b) => a.checked.localeCompare(b.checked))[0]!
  return { rows, verified: !facts.some(isUnverified), checked: oldest.checked, source: oldest.source }
}

export interface PopularTool {
  id: string
  icon: SectionIcon | 'calendar'
  tag: string
  title: string
  description: string
  example: string
}

/** জনপ্রিয় টুল: the six D1 cards (the phone shows the first four, as 01 Home does). */
export function popularTools(lang: Lang): PopularTool[] {
  const bn = lang === 'bn'
  const n = (v: number, decimals?: number) => formatNumberIn(lang, v, decimals === undefined ? {} : { decimals })
  const nagad = calculateMfsCharge({ amount: 5000, channel: channel('nagad-app').value }).charge
  const rocketAtm = calculateMfsCharge({ amount: 5000, channel: channel('rocket-atm').value }).charge
  const decimalSqft = convertLand(1, 'decimal', 'sqft')
  const emi = calculateEmi({ principal: 500000, annualRatePct: 12, months: 36 }).emi
  const [general, quota] = ageLimit.value.presets
  return [
    {
      id: 'cash-out',
      icon: 'calculator',
      tag: t(lang, 'nav.mobileBanking'),
      title: bn ? 'ক্যাশ আউট চার্জ ক্যালকুলেটর' : 'Cash out charge calculator',
      description: bn ? '৭টা উপায় পাশাপাশি, সবচেয়ে সস্তা কোনটা' : '7 ways side by side, cheapest first',
      // A10 shows the Rocket ATM line in English; 01 Home and D1 the Nagad one.
      example: bn ? `${n(5000)} তুলতে নগদে ${formatTakaIn(lang, nagad, { decimals: 2 })}` : `Tk 5,000 via Rocket ATM: Tk ${n(rocketAtm)}`,
    },
    {
      id: 'job-age-limit',
      icon: 'calendar',
      tag: bn ? 'তারিখ ও বয়স' : 'Date and age',
      title: bn ? 'সরকারি চাকরির বয়স হিসাব' : 'Government job age',
      description: bn ? 'সার্কুলারের তারিখে তোমার বয়স কত, আবেদন করা যাবে কিনা' : 'Your age on the circular date, and whether you can apply',
      example: `${bn ? 'বয়সসীমা' : 'Age limit'} ${n(general ?? ageLimit.value.maxYears)} / ${n(quota ?? ageLimit.value.maxYears)}`,
    },
    {
      id: 'land-converter',
      icon: 'land',
      tag: bn ? 'জমি' : 'Land',
      title: bn ? 'জমি মাপের কনভার্টার' : 'Land measurement converter',
      description: bn ? 'শতাংশ, কাঠা, বিঘা, একর, বর্গফুট একসাথে' : 'Decimal, katha, bigha, acre and square feet together',
      example: bn ? `${n(1)} শতাংশ = ${n(decimalSqft, 1)} বর্গফুট` : `1 decimal = ${n(decimalSqft, 1)} sq ft`,
    },
    {
      id: 'emi',
      icon: 'calculator',
      tag: bn ? 'লোন' : 'Loan',
      title: bn ? 'লোন EMI ক্যালকুলেটর' : 'Loan EMI calculator',
      description: bn ? 'মাসিক কিস্তি, মোট সুদ আর পরিশোধ তালিকা' : 'Monthly instalment, total interest and schedule',
      example: bn
        ? `${n(5)} লাখ, ${n(12)}%, ${n(3)} বছর → ${formatTakaIn(lang, Math.round(emi))}`
        : `5 lakh, 12%, 3 years → ${formatTakaIn(lang, Math.round(emi))}`,
    },
    {
      id: 'remittance-compare',
      icon: 'send',
      tag: t(lang, 'nav.remittance'),
      title: bn ? 'রেমিট্যান্স তুলনা' : 'Remittance comparison',
      description: bn ? 'বিদেশ থেকে কোন সার্ভিসে বেশি পাবে' : 'Which service pays more from abroad',
      example: bn ? 'সৌদি, দুবাই, মালয়েশিয়া' : 'Saudi, Dubai, Malaysia',
    },
    {
      id: 'guide-nid-correction',
      icon: 'guide',
      tag: t(lang, 'nav.sorkariKaj'),
      title: bn ? 'NID সংশোধন গাইড' : 'NID correction guide',
      description: bn ? 'কাগজের তালিকা, ধাপ, অফিসিয়াল লিংক' : 'Documents, steps and official links',
      example: bn ? '"আমার কী লাগবে?" উইজার্ড' : '"What do I need?" wizard',
    },
  ]
}

