import { calculateAge, validateAge } from '@hisab/core/age'
import { calculateCurrency, validateCurrency, type CurrencyDirection, type CurrencyRate } from '@hisab/core/currency'
import { calculateEmi, validateEmi } from '@hisab/core/emi'
import { calculateGold, validateGold, type GoldUnit, type GoldWeight } from '@hisab/core/gold'
import { calculateLand, validateLand, type LandConvention, type LandUnit } from '@hisab/core/land'
import { calendarDateAt, isValidDate, toIsoDate, type CalendarDate } from '@hisab/core/lib/dates-calendar'
import { toBanglaDigits } from '@hisab/core/lib/digits'
import { formatNumber, formatTaka } from '@hisab/core/lib/format'
import {
  calculateMfsCharge,
  calculateMfsCompare,
  validateMfsCharge,
  validateMfsCompare,
  type MfsChannel,
  type MfsChannelKind,
} from '@hisab/core/mfs-charge'
import { calculateNumberWords, validateNumberWords } from '@hisab/core/number-words'
import { calculateDiscount, calculatePercentOf, validateDiscount, validatePercentOf } from '@hisab/core/percentage'
import { calculateVat, validateVat, type VatMode } from '@hisab/core/vat'
import { getEntry, routeFor, type Lang } from '@hisab/data/registry'
import { cleanText, normalizeText, words, type SynonymMap } from './normalize.ts'
import { defaultSynonymMap } from './synonyms.ts'

/**
 * Direct answers in the search box: "bkash cash out 5000", "বিকাশ ক্যাশআউট
 * ৫০০০", "bikash 5k", "emi 5 lakh 12% 3 years", "১ শতাংশ কত বর্গফুট",
 * "gold 2 vori", "age 1995-03-12". parseIntent finds the tool and its inputs;
 * answer() runs the @hisab/core engine on data the caller passes in (nothing
 * is fetched here) and returns the answer card, whose link reopens the tool
 * with the same inputs.
 */

export type MfsProvider = 'bkash' | 'nagad' | 'rocket' | 'upay'

export type Intent =
  | {
      kind: 'mfs'
      toolId: 'cash-out' | 'send-money'
      params: { service: 'cashOut' | 'sendMoney'; amount: number; provider?: MfsProvider }
    }
  | { kind: 'emi'; toolId: 'emi'; params: { principal: number; ratePct?: number; months?: number } }
  | { kind: 'land'; toolId: 'land-converter'; params: { value: number; from: LandUnit; to?: LandUnit } }
  | {
      kind: 'gold'
      toolId: 'gold-converter'
      /** The weight parts (vori, ana, …) sit beside metal, karat and the unit asked for. */
      params: GoldWeight & { metal: 'gold' | 'silver'; karat?: string; to?: GoldUnit }
    }
  | { kind: 'age'; toolId: 'age'; params: { birth: string } }
  | { kind: 'vat'; toolId: 'vat'; params: { amount: number; mode: VatMode; ratePct?: number } }
  | { kind: 'percent'; toolId: 'discount-percentage'; params: { value: number; pct: number } }
  | { kind: 'discount'; toolId: 'discount-percentage'; params: { price: number; discount: number } }
  | { kind: 'number-words'; toolId: 'number-to-words'; params: { amount: number } }
  | {
      kind: 'currency'
      toolId: 'currency-converter'
      params: { amount: number; code: string; direction: CurrencyDirection }
    }

export type IntentKind = Intent['kind']

// ---- Vocabulary: canonical synonym terms (data/search/synonyms.json) → engine values ----

/** The key a canonical term has after normalization, e.g. 'ক্যাশ আউট' → 'কাস আউট'. */
const key = (canonical: string) => normalizeText(canonical)

const table = <T>(rows: [string, T][]): Map<string, T> => new Map(rows.map(([k, v]) => [key(k), v]))

const PROVIDERS = table<MfsProvider>([
  ['বিকাশ', 'bkash'],
  ['নগদ', 'nagad'],
  ['রকেট', 'rocket'],
  ['উপায়', 'upay'],
])

const SERVICES = table<'cashOut' | 'sendMoney'>([
  ['ক্যাশ আউট', 'cashOut'],
  ['সেন্ড মানি', 'sendMoney'],
  // A bare "send" or "পাঠাবো" ("bkash send 1000", "নগদে ২০০০ পাঠাবো") is a send money, never a cash out.
  ['send', 'sendMoney'],
  ['পাঠাবো', 'sendMoney'],
  ['পাঠাতে', 'sendMoney'],
  ['পাঠানো', 'sendMoney'],
  ['pathabo', 'sendMoney'],
  ['pathate', 'sendMoney'],
  ['pathano', 'sendMoney'],
])

const LAND_UNIT_WORDS = table<LandUnit>([
  ['শতাংশ', 'decimal'],
  ['বর্গফুট', 'sqft'],
  ['কাঠা', 'katha'],
  ['বিঘা', 'bigha'],
  ['একর', 'acre'],
  ['বর্গমিটার', 'sqm'],
  ['বর্গগজ', 'sqyard'],
  ['ছটাক', 'chotak'],
  ['কানি', 'kani'],
  ['গণ্ডা', 'gonda'],
  ['কড়া', 'kora'],
  ['ক্রান্তি', 'kranti'],
  ['হেক্টর', 'hectare'],
])

const GOLD_UNIT_WORDS = table<GoldUnit>([
  ['ভরি', 'vori'],
  ['আনা', 'ana'],
  ['রতি', 'roti'],
  ['পয়েন্ট', 'point'],
  ['গ্রাম', 'gram'],
  ['তোলা', 'tola'],
  ['ounce', 'ounce'],
  ['আউন্স', 'ounce'],
])

const CURRENCIES = table<string>([
  ['ডলার', 'USD'],
  ['রিয়াল', 'SAR'],
  ['দিরহাম', 'AED'],
  ['রিংগিত', 'MYR'],
  ['পাউন্ড', 'GBP'],
  ['ইউরো', 'EUR'],
  ['রুপি', 'INR'],
  ['kwd', 'KWD'],
  ['qar', 'QAR'],
  ['omr', 'OMR'],
  ['sgd', 'SGD'],
])

/** Words that multiply the number before them: 5k, ৫ হাজার, 2 lakh, ১ কোটি. */
const MULTIPLIERS = table<number>([
  ['k', 1_000],
  ['হাজার', 1_000],
  ['লাখ', 100_000],
  ['কোটি', 10_000_000],
])

const MONTH_WORDS = table<number>([
  ['বছর', 12],
  ['মাস', 1],
])

const MONTH_NAMES = new Map<string, number>()
;[
  ['জানুয়ারি', 'january', 'jan'],
  ['ফেব্রুয়ারি', 'february', 'feb'],
  ['মার্চ', 'march', 'mar'],
  ['এপ্রিল', 'april', 'apr'],
  ['মে', 'may'],
  ['জুন', 'june', 'jun'],
  ['জুলাই', 'july', 'jul'],
  ['আগস্ট', 'august', 'aug'],
  ['সেপ্টেম্বর', 'september', 'sep', 'sept'],
  ['অক্টোবর', 'october', 'oct'],
  ['নভেম্বর', 'november', 'nov'],
  ['ডিসেম্বর', 'december', 'dec'],
].forEach((names, i) => names.forEach((n) => MONTH_NAMES.set(key(n), i + 1)))

const K = {
  taka: key('টাকা'),
  emi: key('ইএমআই'),
  loan: key('লোন'),
  interest: key('সুদ'),
  rate: key('রেট'),
  pct: key('পার্সেন্ট'),
  age: key('বয়স'),
  birth: key('জন্ম তারিখ'),
  birthday: key('জন্মদিন'),
  gold: key('সোনা'),
  silver: key('রুপা'),
  karat: key('ক্যারেট'),
  vat: key('ভ্যাট'),
  discount: key('ডিসকাউন্ট'),
  words: key('কথায়'),
  land: key('জমি'),
  charge: key('চার্জ'),
  removeVat: ['বাদ', 'বাদে', 'bad', 'remove', 'minus', 'exclusive'].map(key),
} as const

// ---- Tokens ----

type Token =
  | { t: 'num'; v: number }
  | { t: 'date'; v: CalendarDate }
  | { t: 'pct' }
  /** A word or phrase: its canonical key ('কাস আউট') when the synonym file knows it, else the normalized word. */
  | { t: 'word'; k: string; known: boolean }

const DATE = /^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})$/

/** Longest query parseIntent reads; a direct question is short, and a pasted page is not one. */
export const MAX_INTENT_QUERY = 200

/** "1995-03-12" or "12/03/1995" (day first, as in Bangladesh). */
function parseDate(text: string): CalendarDate | null {
  const m = DATE.exec(text)
  if (!m) return null
  const [a, b, c] = [m[1]!, Number(m[2]), m[3]!]
  const date = a.length === 4 ? { year: Number(a), month: b, day: Number(c) } : { year: Number(c), month: b, day: Number(a) }
  if (date.year < 100) return null
  return isValidDate(date) ? date : null
}

/** Splits a query into numbers, dates, % and words, with Bangla digits and thousands commas read. */
function tokenize(query: string, synonyms: SynonymMap): Token[] {
  const text = cleanText(query)
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/৳/g, ' টাকা ')
    .replace(/%/g, ' % ')
    // Split "5000tk", "৫০০০টাকা", "3yr", "tk500" into a number and a word; keep 1995-03-12 and 2.5 whole.
    .replace(/(\d)(?=[^\d\s.\-/])/g, '$1 ')
    .replace(/([^\d\s.\-/])(?=\d)/g, '$1 ')
  const tokens: Token[] = []
  let pending: string[] = []
  const flush = () => {
    for (const s of synonyms.segment(words(pending.join(' ')))) {
      tokens.push({ t: 'word', k: s.words.join(' '), known: s.known })
    }
    pending = []
  }
  for (const raw of text.split(/\s+/)) {
    if (raw === '') continue
    const date = parseDate(raw)
    // 01712345678 is a phone number and 007 a code: a leading zero is never an amount.
    const num = (/^\d+(\.\d+)?$/.test(raw) && !/^0\d/.test(raw)) || /^\.\d+$/.test(raw) ? Number(raw) : null
    if (date || num !== null || raw === '%') {
      flush()
      tokens.push(date ? { t: 'date', v: date } : num !== null ? { t: 'num', v: num } : { t: 'pct' })
    } else {
      pending.push(raw)
    }
  }
  flush()
  return mergeTextDates(tokens)
}

/** "12 march 1995" and "১২ মার্চ ১৯৯৫" → one date token. */
function mergeTextDates(tokens: Token[]): Token[] {
  const out: Token[] = []
  for (let i = 0; i < tokens.length; i++) {
    const [a, b, c] = [tokens[i]!, tokens[i + 1], tokens[i + 2]]
    const month = b?.t === 'word' ? MONTH_NAMES.get(b.k) : undefined
    if (a.t === 'num' && month && c?.t === 'num' && c.v >= 1000) {
      const date = { year: c.v, month, day: a.v }
      if (isValidDate(date)) {
        out.push({ t: 'date', v: date })
        i += 2
        continue
      }
    }
    out.push(a)
  }
  return out
}

const isWord = (tok: Token | undefined, k: string): boolean => tok?.t === 'word' && tok.k === k

/** A number with the multiplier after it (5k, ২ লাখ), and how many tokens it used. */
interface Amount {
  /** Index of the number token. */
  at: number
  value: number
  /** The token after the number (and its multiplier). */
  next: Token | undefined
  /** % or পার্সেন্ট follows it. */
  pct: boolean
}

function amounts(tokens: readonly Token[]): Amount[] {
  const out: Amount[] = []
  tokens.forEach((tok, i) => {
    if (tok.t !== 'num') return
    let value = tok.v
    let j = i + 1
    const after = tokens[j]
    const mult = after?.t === 'word' ? MULTIPLIERS.get(after.k) : undefined
    if (mult) {
      value *= mult
      j++
    }
    out.push({ at: i, value, next: tokens[j], pct: tokens[j]?.t === 'pct' || isWord(tokens[j], K.pct) })
  })
  return out
}

/** The word key of a token, or undefined. */
const wordKey = (tok: Token | undefined): string | undefined => (tok?.t === 'word' ? tok.k : undefined)

// ---- Parsers, one per intent ----

interface Parsed {
  tokens: Token[]
  nums: Amount[]
  has: (k: string) => boolean
  /** Known words other than the given ones and number glue (টাকা, multipliers). */
  others: (ignore: readonly string[]) => string[]
}

function parseAgeIntent(p: Parsed): Intent | null {
  const date = p.tokens.find((t): t is Extract<Token, { t: 'date' }> => t.t === 'date')
  if (!date) return null
  const asked = p.has(K.age) || p.has(K.birth) || p.has(K.birthday)
  if (!asked && p.others([]).length > 0) return null
  return { kind: 'age', toolId: 'age', params: { birth: toIsoDate(date.v) } }
}

function parseEmiIntent(p: Parsed): Intent | null {
  const loanish = p.has(K.emi) || p.has(K.loan)
  if (!loanish) return null
  let principal: number | undefined
  let ratePct: number | undefined
  let months: number | undefined
  for (const a of p.nums) {
    const unit = wordKey(a.next)
    const per = unit ? MONTH_WORDS.get(unit) : undefined
    const before = wordKey(p.tokens[a.at - 1])
    if (a.pct || before === K.interest || before === K.rate) ratePct ??= a.value
    // "3 years 6 months" is 42 months.
    else if (per) months = (months ?? 0) + Math.round(a.value * per)
    else principal = Math.max(principal ?? 0, a.value)
  }
  if (principal === undefined) return null
  if (!p.has(K.emi) && (ratePct === undefined || months === undefined)) return null
  const params: Extract<Intent, { kind: 'emi' }>['params'] = { principal }
  if (ratePct !== undefined) params.ratePct = ratePct
  if (months !== undefined) params.months = months
  return { kind: 'emi', toolId: 'emi', params }
}

function parseCurrencyIntent(p: Parsed): Intent | null {
  for (const a of p.nums) {
    const code = CURRENCIES.get(wordKey(a.next) ?? '')
    if (code) return { kind: 'currency', toolId: 'currency-converter', params: { amount: a.value, code, direction: 'toBdt' } }
    // "5000 taka to dollar" / "৫০০০ টাকায় কত রিয়াল"
    if (isWord(a.next, K.taka)) {
      const target = p.tokens.slice(a.at + 1).map(wordKey).find((k) => k !== undefined && CURRENCIES.has(k))
      if (target) {
        return {
          kind: 'currency',
          toolId: 'currency-converter',
          params: { amount: a.value, code: CURRENCIES.get(target)!, direction: 'fromBdt' },
        }
      }
    }
  }
  return null
}

function parseLandIntent(p: Parsed): Intent | null {
  const first = p.nums.find((a) => LAND_UNIT_WORDS.has(wordKey(a.next) ?? ''))
  if (!first) return null
  const from = LAND_UNIT_WORDS.get(wordKey(first.next)!)!
  // The unit asked for: a later land unit with no number before it.
  let to: LandUnit | undefined
  p.tokens.forEach((tok, i) => {
    if (to || i <= first.at + 1) return
    const unit = LAND_UNIT_WORDS.get(wordKey(tok) ?? '')
    if (unit && p.tokens[i - 1]?.t !== 'num') to = unit
  })
  const params: Extract<Intent, { kind: 'land' }>['params'] = { value: first.value, from }
  if (to && to !== from) params.to = to
  return { kind: 'land', toolId: 'land-converter', params }
}

const KARATS = new Set([18, 21, 22, 24])

function parseGoldIntent(p: Parsed): Intent | null {
  const weight: GoldWeight = {}
  let karat: string | undefined
  let usedNumber = -1
  for (const a of p.nums) {
    const tok = p.tokens[a.at]!
    const after = p.tokens[a.at + 1]
    const raw = tok.t === 'num' ? tok.v : 0
    // "22k", "22 carat", "২২ ক্যারেট": a karat, not 22,000.
    if (KARATS.has(raw) && (isWord(after, K.karat) || isWord(after, 'k'))) {
      karat = `${raw}K`
      continue
    }
    const unit = GOLD_UNIT_WORDS.get(wordKey(a.next) ?? '')
    if (unit && a.at > usedNumber) {
      weight[unit] = (weight[unit] ?? 0) + a.value
      usedNumber = a.at
    }
  }
  const units = Object.keys(weight) as GoldUnit[]
  if (units.length === 0) return null
  const metalWord = p.has(K.gold) || p.has(K.silver)
  // Grams alone could be anything; ভরি, আনা, রতি and তোলা are only ever gold or silver.
  if (!metalWord && units.every((u) => u === 'gram' || u === 'ounce')) return null
  let to: GoldUnit | undefined
  p.tokens.forEach((tok, i) => {
    const unit = GOLD_UNIT_WORDS.get(wordKey(tok) ?? '')
    if (!to && unit && p.tokens[i - 1]?.t !== 'num' && !units.includes(unit)) to = unit
  })
  const params: Extract<Intent, { kind: 'gold' }>['params'] = { ...weight, metal: p.has(K.silver) ? 'silver' : 'gold' }
  if (karat) params.karat = karat
  if (to) params.to = to
  return { kind: 'gold', toolId: 'gold-converter', params }
}

/** The first amount that is not a percent. */
const plainAmount = (p: Parsed) => p.nums.find((a) => !a.pct)

function parseWordsIntent(p: Parsed): Intent | null {
  if (!p.has(K.words)) return null
  const a = plainAmount(p)
  return a ? { kind: 'number-words', toolId: 'number-to-words', params: { amount: a.value } } : null
}

function parseVatIntent(p: Parsed): Intent | null {
  if (!p.has(K.vat)) return null
  const amount = plainAmount(p)
  if (!amount) return null
  const rate = p.nums.find((a) => a.pct)
  const mode: VatMode = K.removeVat.some((k) => p.has(k)) ? 'remove' : 'add'
  const params: Extract<Intent, { kind: 'vat' }>['params'] = { amount: amount.value, mode }
  if (rate) params.ratePct = rate.value
  return { kind: 'vat', toolId: 'vat', params }
}

function parsePercentIntent(p: Parsed): Intent | null {
  const pct = p.nums.find((a) => a.pct)
  const value = plainAmount(p)
  if (!pct || !value) return null
  if (p.has(K.discount)) {
    return { kind: 'discount', toolId: 'discount-percentage', params: { price: value.value, discount: pct.value } }
  }
  return { kind: 'percent', toolId: 'discount-percentage', params: { value: value.value, pct: pct.value } }
}

function parseMfsIntent(p: Parsed): Intent | null {
  const named = new Set(p.tokens.flatMap((t) => PROVIDERS.get(wordKey(t) ?? '') ?? []))
  // "bkash cash out 5000 nagad" names two: compare them all rather than pick one.
  const provider = named.size === 1 ? [...named][0] : undefined
  const service = p.tokens.map((t) => SERVICES.get(wordKey(t) ?? '')).find((v) => v !== undefined)
  if (named.size === 0 && !service) return null
  // "bkash helpline 16247" is a search, not an amount: without a service, only the provider may be named.
  if (!service && (named.size > 1 || p.others([...PROVIDERS.keys(), K.charge]).length > 0)) return null
  const amount = plainAmount(p)
  if (!amount) return null
  const s = service ?? 'cashOut'
  const params: Extract<Intent, { kind: 'mfs' }>['params'] = { service: s, amount: amount.value }
  if (provider) params.provider = provider
  return { kind: 'mfs', toolId: s === 'cashOut' ? 'cash-out' : 'send-money', params }
}

/** Tried in this order; the first that fits wins. */
const PARSERS = [
  parseAgeIntent,
  parseEmiIntent,
  parseWordsIntent,
  parseCurrencyIntent,
  parseLandIntent,
  parseGoldIntent,
  parseVatIntent,
  parseMfsIntent,
  parsePercentIntent,
]

/** Number glue that does not count as "another topic" for the age rule. */
const GLUE = new Set([K.taka, ...MULTIPLIERS.keys()])

/** The tool and inputs a query asks for directly, or null when it is an ordinary search. */
export function parseIntent(query: string, synonyms: SynonymMap = defaultSynonymMap()): Intent | null {
  if (query.length > MAX_INTENT_QUERY) return null
  const tokens = tokenize(query, synonyms)
  if (!tokens.some((t) => t.t === 'num' || t.t === 'date')) return null
  const keys = new Set(tokens.flatMap((t) => (t.t === 'word' ? [t.k] : [])))
  const parsed: Parsed = {
    tokens,
    nums: amounts(tokens),
    has: (k) => keys.has(k),
    others: (ignore) =>
      tokens.flatMap((t) => (t.t === 'word' && t.known && !GLUE.has(t.k) && !ignore.includes(t.k) ? [t.k] : [])),
  }
  for (const parse of PARSERS) {
    const intent = parse(parsed)
    if (intent) return intent
  }
  return null
}

// ---- Answer cards ----

/** Data the engines need, passed in by the page (from data/ at build time, or the synced store in the app). */
export interface AnswerData {
  /** MFS channels from data/mfs-charges.json (each Fact's value). */
  mfsChannels?: readonly MfsChannel[]
  /** Taka per ভরি by karat label ('22K', '21K', '18K', 'traditional'), from the day's BAJUS rates. */
  goldPricePerVori?: Readonly<Record<string, number>>
  silverPricePerVori?: Readonly<Record<string, number>>
  currencyRates?: readonly CurrencyRate[]
  /** The standard VAT rate, from data/commerce/vat-rates.json; used when the query gives none. */
  vatRatePct?: number
  landConvention?: Partial<LandConvention>
}

export interface AnswerOptions {
  lang?: Lang
  /** "Today" for the age answer; Bangladesh's date now when left out. */
  today?: CalendarDate
}

export interface AnswerLine {
  label: string
  value: string
}

export interface AnswerCard {
  intent: Intent
  toolId: string
  /** The tool's name, e.g. "বিকাশ ক্যাশ আউট চার্জ". */
  title: string
  /** The query restated as the card's heading (Figma Answer Card 7:302), e.g. "বিকাশে ৫,০০০ টাকা ক্যাশ আউট". */
  question: string
  /** The big number (or words) and what it is. */
  main: AnswerLine
  /** The breakdown under it. */
  lines: AnswerLine[]
  /** A caveat to show under the card (a limit crossed, a rate assumed). */
  note?: string
  /** The tool's page with query parameters that restore these inputs. */
  link: string
}

const BD_UTC_OFFSET_MINUTES = 6 * 60

/** "বিকাশে ৫,০০০ টাকা ক্যাশ আউট": the provider with the locative ending. */
const PROVIDER_AT: Record<MfsProvider, string> = { bkash: 'বিকাশে', nagad: 'নগদে', rocket: 'রকেটে', upay: 'উপায়ে' }

const PROVIDER_NAMES: Record<MfsProvider, [string, string]> = {
  bkash: ['বিকাশ', 'bKash'],
  nagad: ['নগদ', 'Nagad'],
  rocket: ['রকেট', 'Rocket'],
  upay: ['উপায়', 'Upay'],
}

const CHANNEL_NAMES: Record<MfsChannelKind, [string, string]> = {
  agent: ['এজেন্ট', 'agent'],
  priyoAgent: ['প্রিয় এজেন্ট', 'Priyo Agent'],
  app: ['অ্যাপ', 'app'],
  ussd: ['USSD', 'USSD'],
  atm: ['এটিএম', 'ATM'],
  branch: ['ব্রাঞ্চ', 'branch'],
  priyoNumber: ['প্রিয় নম্বর', 'Priyo number'],
  other: ['অন্যান্য', 'other'],
}

const LAND_NAMES: Record<LandUnit, [string, string]> = {
  decimal: ['শতাংশ', 'decimal'],
  sqft: ['বর্গফুট', 'sq ft'],
  katha: ['কাঠা', 'katha'],
  bigha: ['বিঘা', 'bigha'],
  acre: ['একর', 'acre'],
  sqm: ['বর্গমিটার', 'sq m'],
  sqyard: ['বর্গগজ', 'sq yd'],
  chotak: ['ছটাক', 'chhatak'],
  kani: ['কানি', 'kani'],
  gonda: ['গণ্ডা', 'gonda'],
  kora: ['কড়া', 'kora'],
  kranti: ['ক্রান্তি', 'kranti'],
  link: ['লিংক', 'link'],
  hectare: ['হেক্টর', 'hectare'],
}

const GOLD_NAMES: Record<GoldUnit, [string, string]> = {
  vori: ['ভরি', 'vori'],
  ana: ['আনা', 'ana'],
  roti: ['রতি', 'roti'],
  point: ['পয়েন্ট', 'point'],
  gram: ['গ্রাম', 'g'],
  tola: ['তোলা', 'tola'],
  ounce: ['আউন্স', 'oz'],
}

const WEEKDAYS: [string, string][] = [
  ['রবিবার', 'Sunday'],
  ['সোমবার', 'Monday'],
  ['মঙ্গলবার', 'Tuesday'],
  ['বুধবার', 'Wednesday'],
  ['বৃহস্পতিবার', 'Thursday'],
  ['শুক্রবার', 'Friday'],
  ['শনিবার', 'Saturday'],
]

/**
 * Channels shown first for a provider: the Priyo Agent price for cash out, as
 * in the Figma Answer Card (৳৬৯.৭৫ "প্রিয় এজেন্ট · অন্য এজেন্টে ৳৯২.৫০"), then
 * the plain agent; the app for send money.
 */
const CHANNEL_ORDER: Record<'cashOut' | 'sendMoney', MfsChannelKind[]> = {
  cashOut: ['priyoAgent', 'agent', 'app', 'ussd', 'atm', 'branch', 'priyoNumber', 'other'],
  sendMoney: ['app', 'ussd', 'agent', 'priyoNumber', 'priyoAgent', 'atm', 'branch', 'other'],
}

/** Up to 2 decimals (4 below 1, so 0.0303 বিঘা still shows), trailing zeros dropped, in the page's digits. */
function num(value: number, lang: Lang): string {
  const decimals = Math.abs(value) < 1 ? 4 : 2
  const text = formatNumber(Number(value.toFixed(decimals)), { digits: 'en', decimals }).replace(/\.?0+$/, '')
  return lang === 'bn' ? toBanglaDigits(text) : text
}

const taka = (value: number, lang: Lang) => formatTaka(value, { digits: lang })

/** The tool's page with the intent's inputs as query parameters. */
export function intentLink(intent: Intent, lang: Lang = 'bn'): string {
  const entry = getEntry(intent.toolId)
  const path = entry ? routeFor(entry, lang) : `/tools/${intent.toolId}`
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(intent.params)) if (v !== undefined) query.set(k, String(v))
  const qs = query.toString()
  return qs ? `${path}?${qs}` : path
}

/** Reads the inputs back from a tool link's query string (the reverse of intentLink). */
export function intentParams(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search))
}

/** The card's heading: what was asked, in the page's language and digits. */
export function intentQuestion(intent: Intent, lang: Lang = 'bn'): string {
  const bn = lang === 'bn'
  const n = (v: number) => num(v, lang)
  switch (intent.kind) {
    case 'mfs': {
      const { service, amount, provider } = intent.params
      const what = service === 'cashOut' ? (bn ? 'ক্যাশ আউট' : 'cash out') : bn ? 'সেন্ড মানি' : 'send money'
      if (bn) return `${provider ? `${PROVIDER_AT[provider]} ` : ''}${n(amount)} টাকা ${what}`
      return `${provider ? `${PROVIDER_NAMES[provider][1]} ` : ''}${what} of ${taka(amount, lang)}`
    }
    case 'emi': {
      const { principal, ratePct, months } = intent.params
      const term =
        months === undefined ? '' : months % 12 === 0 ? (bn ? `${n(months / 12)} বছরের ` : `${months / 12} years`) : bn ? `${n(months)} মাসের ` : `${months} months`
      if (bn) return `${n(principal)} টাকা ${ratePct !== undefined ? `${n(ratePct)}% সুদে ` : ''}${term}লোনের মাসিক কিস্তি`
      return `EMI on ${taka(principal, lang)}${ratePct !== undefined ? ` at ${n(ratePct)}%` : ''}${term ? ` over ${term}` : ''}`
    }
    case 'land': {
      const { value, from, to } = intent.params
      const target = to ?? (from === 'sqft' ? 'decimal' : 'sqft')
      const name = (u: LandUnit) => LAND_NAMES[u][bn ? 0 : 1]
      return bn ? `${n(value)} ${name(from)} কত ${name(target)}` : `${n(value)} ${name(from)} in ${name(target)}`
    }
    case 'gold': {
      const { metal, karat, to, ...weight } = intent.params
      const name = (u: GoldUnit) => GOLD_NAMES[u][bn ? 0 : 1]
      const w = (Object.keys(weight) as GoldUnit[]).map((u) => `${n(weight[u]!)} ${name(u)}`).join(' ')
      if (to) return bn ? `${w} কত ${name(to)}` : `${w} in ${name(to)}`
      const m = metal === 'silver' ? (bn ? 'রুপার' : 'silver') : bn ? 'সোনার' : 'gold'
      return bn ? `${w} ${karat ? `${karat} ` : ''}${m} দাম` : `Price of ${w} ${karat ? `${karat} ` : ''}${m}`
    }
    case 'age': {
      const birth = bn ? toBanglaDigits(intent.params.birth) : intent.params.birth
      return bn ? `${birth} জন্ম হলে বয়স কত` : `Age if born on ${birth}`
    }
    case 'vat': {
      const { amount, mode } = intent.params
      if (mode === 'remove') return bn ? `${n(amount)} টাকা থেকে VAT বাদ` : `${taka(amount, lang)} without VAT`
      return bn ? `${n(amount)} টাকার সাথে VAT` : `${taka(amount, lang)} with VAT`
    }
    case 'currency': {
      const { amount, code, direction } = intent.params
      if (direction === 'toBdt') return bn ? `${n(amount)} ${code} কত টাকা` : `${n(amount)} ${code} in taka`
      return bn ? `${n(amount)} টাকা কত ${code}` : `${taka(amount, lang)} in ${code}`
    }
    case 'percent':
      return bn ? `${n(intent.params.value)} এর ${n(intent.params.pct)}%` : `${n(intent.params.pct)}% of ${n(intent.params.value)}`
    case 'discount':
      return bn
        ? `${n(intent.params.price)} টাকায় ${n(intent.params.discount)}% ছাড়`
        : `${n(intent.params.discount)}% off ${taka(intent.params.price, lang)}`
    case 'number-words':
      return bn ? `${n(intent.params.amount)} কথায়` : `${n(intent.params.amount)} in words`
  }
}

function card(intent: Intent, lang: Lang, main: AnswerLine, lines: AnswerLine[], note?: string): AnswerCard {
  const entry = getEntry(intent.toolId)
  const result: AnswerCard = {
    intent,
    toolId: intent.toolId,
    title: entry ? entry.name[lang] : intent.toolId,
    question: intentQuestion(intent, lang),
    main,
    lines,
    link: intentLink(intent, lang),
  }
  if (note) result.note = note
  return result
}

function mfsAnswer(intent: Extract<Intent, { kind: 'mfs' }>, data: AnswerData, lang: Lang): AnswerCard | null {
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  const { service, amount, provider } = intent.params
  const channels = (data.mfsChannels ?? []).filter((c) => c.service === service)
  const serviceName = service === 'cashOut' ? L('ক্যাশ আউট', 'cash out') : L('সেন্ড মানি', 'send money')
  const providerName = (p: string) => PROVIDER_NAMES[p as MfsProvider]?.[lang === 'bn' ? 0 : 1] ?? p
  const channelName = (c: MfsChannel) => CHANNEL_NAMES[c.channel][lang === 'bn' ? 0 : 1]

  if (!provider) {
    const input = { amount, channels: [...channels] }
    if (validateMfsCompare(input)) return null
    const r = calculateMfsCompare(input)
    if (!r.cheapest) return null
    const best = r.cheapest
    return card(
      intent,
      lang,
      {
        label: L(
          `সবচেয়ে কম চার্জ: ${providerName(best.channel.provider)} ${channelName(best.channel)}`,
          `Lowest charge: ${providerName(best.channel.provider)} ${channelName(best.channel)}`,
        ),
        value: taka(best.charge, lang),
      },
      r.rows.slice(0, 5).map((row) => ({
        label: `${providerName(row.channel.provider)} ${channelName(row.channel)}`,
        value: row.limit ? L('সীমার বাইরে', 'over the limit') : taka(row.charge, lang),
      })),
    )
  }

  const own = channels
    .filter((c) => c.provider === provider)
    .sort((a, b) => CHANNEL_ORDER[service].indexOf(a.channel) - CHANNEL_ORDER[service].indexOf(b.channel))
  const main = own[0]
  if (!main || validateMfsCharge({ amount, channel: main })) return null
  const r = calculateMfsCharge({ amount, channel: main })
  const lines: AnswerLine[] = [
    { label: L('মোট লাগবে', 'Total needed'), value: taka(r.total, lang) },
    { label: L('প্রতি হাজারে', 'Per 1,000'), value: taka(r.per1000, lang) },
  ]
  for (const other of own.slice(1)) {
    if (validateMfsCharge({ amount, channel: other })) continue
    const o = calculateMfsCharge({ amount, channel: other })
    lines.push({ label: L(`${channelName(other)} থেকে`, `Through ${channelName(other)}`), value: taka(o.charge, lang) })
  }
  const note = r.limit
    ? L(`এই পরিমাণ সীমার বাইরে; সর্বোচ্চ ${taka(r.limit.allowed, lang)}`, `Over the limit; at most ${taka(r.limit.allowed, lang)}`)
    : undefined
  return card(
    intent,
    lang,
    {
      label: L(
        `${providerName(provider)} ${channelName(main)} ${serviceName} চার্জ`,
        `${providerName(provider)} ${serviceName} charge (${channelName(main)})`,
      ),
      value: taka(r.charge, lang),
    },
    lines,
    note,
  )
}

function emiAnswer(intent: Extract<Intent, { kind: 'emi' }>, lang: Lang): AnswerCard | null {
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  const { principal, ratePct, months } = intent.params
  if (ratePct === undefined || months === undefined) return null
  const input = { principal, annualRatePct: ratePct, months }
  if (validateEmi(input)) return null
  const r = calculateEmi(input)
  return card(intent, lang, { label: L('মাসিক কিস্তি', 'Monthly EMI'), value: taka(r.emi, lang) }, [
    { label: L('মোট সুদ', 'Total interest'), value: taka(r.totalInterest, lang) },
    { label: L('মোট পরিশোধ', 'Total payment'), value: taka(r.totalPayment, lang) },
    { label: L('মেয়াদ', 'Term'), value: `${num(months, lang)} ${L('মাস', 'months')}` },
  ])
}

function landAnswer(intent: Extract<Intent, { kind: 'land' }>, data: AnswerData, lang: Lang): AnswerCard | null {
  const { value, from, to } = intent.params
  const input = { value, unit: from, ...(data.landConvention ? { convention: data.landConvention } : {}) }
  if (validateLand(input)) return null
  const r = calculateLand(input)
  const name = (u: LandUnit) => LAND_NAMES[u][lang === 'bn' ? 0 : 1]
  const target = to ?? (from === 'sqft' ? 'decimal' : 'sqft')
  const shown: LandUnit[] = ['sqft', 'decimal', 'katha', 'bigha', 'acre', 'sqm']
  return card(
    intent,
    lang,
    { label: `${num(value, lang)} ${name(from)} =`, value: `${num(r.values[target], lang)} ${name(target)}` },
    shown.filter((u) => u !== from && u !== target).map((u) => ({ label: name(u), value: num(r.values[u], lang) })),
  )
}

function goldAnswer(intent: Extract<Intent, { kind: 'gold' }>, data: AnswerData, lang: Lang): AnswerCard | null {
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  const { metal, karat, to, ...weight } = intent.params
  // Synced data can be schema-valid and still absurd: only a finite price above 0 counts.
  const prices = Object.fromEntries(
    Object.entries((metal === 'silver' ? data.silverPricePerVori : data.goldPricePerVori) ?? {}).filter(
      ([, v]) => Number.isFinite(v) && v > 0,
    ),
  )
  const has = (label: string) => Object.hasOwn(prices, label)
  const karatLabel = karat ?? (has('22K') ? '22K' : Object.keys(prices)[0])
  const price = karatLabel !== undefined && has(karatLabel) ? prices[karatLabel] : undefined
  const input = { weight, ...(price !== undefined ? { pricePerVori: price } : {}) }
  if (validateGold(input)) return null
  const r = calculateGold(input)
  const name = (u: GoldUnit) => GOLD_NAMES[u][lang === 'bn' ? 0 : 1]
  const asWeight = (Object.keys(weight) as GoldUnit[])
    .filter((u) => weight[u] !== undefined)
    .map((u) => `${num(weight[u]!, lang)} ${name(u)}`)
    .join(' ')
  const split = r.split
  const splitText = (['vori', 'ana', 'roti', 'point'] as const)
    .filter((u) => split[u] > 0)
    .map((u) => `${num(split[u], lang)} ${name(u)}`)
    .join(' ')
  const lines: AnswerLine[] = [
    { label: L('ওজন (গ্রাম)', 'Weight (grams)'), value: num(r.grams, lang) },
    { label: L('ভরি-আনা-রতি', 'Vori-ana-roti'), value: splitText || num(0, lang) },
  ]
  if (to) {
    return card(intent, lang, { label: `${asWeight} =`, value: `${num(r.values[to], lang)} ${name(to)}` }, lines)
  }
  if (r.value !== null && price !== undefined) {
    const metalName = metal === 'silver' ? L('রুপা', 'silver') : L('সোনা', 'gold')
    lines.push({ label: L('প্রতি ভরি', 'Per vori'), value: taka(price, lang) })
    return card(intent, lang, { label: `${asWeight} ${metalName} (${karatLabel})`, value: taka(r.value, lang) }, lines)
  }
  return card(intent, lang, { label: `${asWeight} =`, value: `${num(r.grams, lang)} ${name('gram')}` }, lines.slice(1))
}

function ageAnswer(intent: Extract<Intent, { kind: 'age' }>, lang: Lang, today: CalendarDate): AnswerCard | null {
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  const [y, m, d] = intent.params.birth.split('-').map(Number)
  const input = { birth: { year: y!, month: m!, day: d! }, on: today }
  if (validateAge(input)) return null
  const r = calculateAge(input)
  const n = (v: number) => num(v, lang)
  return card(
    intent,
    lang,
    {
      label: L('বয়স', 'Age'),
      value: L(`${n(r.years)} বছর ${n(r.months)} মাস ${n(r.days)} দিন`, `${r.years} years ${r.months} months ${r.days} days`),
    },
    [
      { label: L('মোট দিন', 'Total days'), value: n(r.totalDays) },
      { label: L('পরের জন্মদিন', 'Next birthday'), value: L(`${n(r.nextBirthday.daysLeft)} দিন পর`, `in ${r.nextBirthday.daysLeft} days`) },
      { label: L('জন্মের বার', 'Born on'), value: WEEKDAYS[r.bornOnWeekday]![lang === 'bn' ? 0 : 1] },
    ],
  )
}

function vatAnswer(intent: Extract<Intent, { kind: 'vat' }>, data: AnswerData, lang: Lang): AnswerCard | null {
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  const { amount, mode } = intent.params
  const ratePct = intent.params.ratePct ?? data.vatRatePct
  if (ratePct === undefined) return null
  const input = { amount, ratePct, mode }
  if (validateVat(input)) return null
  const r = calculateVat(input)
  const rate = `${num(ratePct, lang)}%`
  const note = intent.params.ratePct === undefined ? L(`সাধারণ হার ${rate} ধরে`, `Assuming the standard ${rate}`) : undefined
  if (mode === 'remove') {
    return card(
      intent,
      lang,
      { label: L('VAT ছাড়া দাম', 'Price without VAT'), value: taka(r.base, lang) },
      [{ label: L(`VAT (${rate})`, `VAT (${rate})`), value: taka(r.vat, lang) }],
      note,
    )
  }
  return card(
    intent,
    lang,
    { label: L('VAT সহ দাম', 'Price with VAT'), value: taka(r.total, lang) },
    [
      { label: L('মূল দাম', 'Price'), value: taka(r.base, lang) },
      { label: L(`VAT (${rate})`, `VAT (${rate})`), value: taka(r.vat, lang) },
    ],
    note,
  )
}

function currencyAnswer(intent: Extract<Intent, { kind: 'currency' }>, data: AnswerData, lang: Lang): AnswerCard | null {
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  const { amount, code, direction } = intent.params
  // An Infinity rate passes the engine's > 0 check and prints as "৳Infin,ity".
  const finite = (v: number | undefined) => v === undefined || Number.isFinite(v)
  const rates = (data.currencyRates ?? []).filter((r) => Number.isFinite(r.buy) && finite(r.sell) && finite(r.unit))
  const input = { amount, code, direction, rates }
  if (validateCurrency(input)) return null
  const r = calculateCurrency(input)
  const lines = [{ label: L(`১ ${code} রেট`, `1 ${code} rate`), value: taka(r.rate, lang) }]
  if (direction === 'toBdt') {
    return card(intent, lang, { label: `${num(amount, lang)} ${code} =`, value: taka(r.result, lang) }, lines)
  }
  return card(intent, lang, { label: `${taka(amount, lang)} =`, value: `${num(r.result, lang)} ${code}` }, lines)
}

/**
 * The answer card for an intent, or null when the engine cannot answer it:
 * an input is missing (EMI without a rate), the data it needs was not
 * passed, or the numbers are out of range. The search box then shows only
 * the tool link (intentLink).
 */
export function answer(intent: Intent, data: AnswerData = {}, options: AnswerOptions = {}): AnswerCard | null {
  const lang = options.lang ?? 'bn'
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en)
  switch (intent.kind) {
    case 'mfs':
      return mfsAnswer(intent, data, lang)
    case 'emi':
      return emiAnswer(intent, lang)
    case 'land':
      return landAnswer(intent, data, lang)
    case 'gold':
      return goldAnswer(intent, data, lang)
    case 'age':
      return ageAnswer(intent, lang, options.today ?? calendarDateAt(new Date(), BD_UTC_OFFSET_MINUTES))
    case 'vat':
      return vatAnswer(intent, data, lang)
    case 'currency':
      return currencyAnswer(intent, data, lang)
    case 'number-words': {
      const input = { amount: intent.params.amount, style: 'taka' as const }
      if (validateNumberWords(input)) return null
      const r = calculateNumberWords(input)
      return card(intent, lang, { label: L('কথায়', 'In words'), value: lang === 'bn' ? r.bangla : r.english }, [
        { label: L('অন্য ভাষায়', 'In Bangla'), value: lang === 'bn' ? r.english : r.bangla },
      ])
    }
    case 'percent': {
      const { value, pct } = intent.params
      if (validatePercentOf({ value, pct })) return null
      return card(
        intent,
        lang,
        {
          label: L(`${num(value, lang)} এর ${num(pct, lang)}%`, `${num(pct, lang)}% of ${num(value, lang)}`),
          value: num(calculatePercentOf({ value, pct }), lang),
        },
        [],
      )
    }
    case 'discount': {
      const { price, discount } = intent.params
      const input = { price, discount }
      if (validateDiscount(input)) return null
      const r = calculateDiscount(input)
      return card(intent, lang, { label: L('দিতে হবে', 'You pay'), value: taka(r.finalPrice, lang) }, [
        { label: L('বাঁচলো', 'You save'), value: taka(r.saved, lang) },
        { label: L('আসল দাম', 'Original price'), value: taka(price, lang) },
      ])
    }
  }
}
