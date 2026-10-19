import { round } from './lib/money.ts'

/**
 * Bangla words for 0–99. Every one of them is irregular (৪৫ is পঁয়তাল্লিশ, not
 * "চার দশ পাঁচ"), so they are listed, not built. Spelling follows the Bangla
 * Academy forms in everyday use on cheques and in textbooks.
 */
const BN_0_99: readonly string[] = [
  'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
  'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
  'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
  'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
  'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
  'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
  'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
  'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
  'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টাশি', 'ঊননব্বই',
  'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই',
]

const EN_0_19: readonly string[] = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
]
const EN_TENS: readonly string[] = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
/** Western groups of three digits. */
const EN_GROUPS: readonly string[] = ['', 'Thousand', 'Million', 'Billion', 'Trillion']

/** Largest amount the words are built for: ৯,৯৯,৯৯৯ কোটি… (just under 10 lakh crore), safe to the paisa. */
export const NUMBER_WORDS_MAX = 9_999_999_999_999.99

export type NumberWordsStyle = 'taka' | 'plain'

export interface NumberWordsInput {
  /** The number to write out, in taka for the cheque style. */
  amount: number
  /**
   * "taka" (চেকের মতো): rounded to paisa, "… টাকা … পয়সা মাত্র" and
   * "… Taka and … Paisa Only". "plain": just the number, with দশমিক / Point
   * for a fraction.
   */
  style: NumberWordsStyle
  /** English grouping: "lakh" (Lakh, Crore, as on Bangladeshi cheques) or "international" (Million, Billion). */
  englishSystem?: 'lakh' | 'international'
  /** Word for 1,00,000 in Bangla: লক্ষ (default, cheque style) or লাখ. */
  bnLakh?: 'লক্ষ' | 'লাখ'
  /** Word for a hundred in Bangla: শত (default, "পাঁচশত") or শো ("পাঁচশো"). */
  bnHundred?: 'শত' | 'শো'
}

export interface NumberWordsResult {
  bangla: string
  english: string
  /** The whole part the words were built from (whole taka in the cheque style). */
  whole: number
  /** Paisa (0–99) in the cheque style; 0 in the plain style. */
  paisa: number
}

export type NumberWordsError = 'amount' | 'style'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateNumberWords(input: NumberWordsInput): NumberWordsError | null {
  if (!(input.amount >= 0 && input.amount <= NUMBER_WORDS_MAX)) return 'amount'
  if (input.style !== 'taka' && input.style !== 'plain') return 'style'
  return null
}

interface BnOptions {
  lakh: string
  hundred: string
}

function bnBelowThousand(n: number, opts: BnOptions): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  // "পাঁচশত", written as one word the way cheques write it.
  if (hundreds > 0) parts.push(BN_0_99[hundreds]! + opts.hundred)
  if (rest > 0) parts.push(BN_0_99[rest]!)
  return parts.join(' ')
}

/**
 * Whole number in Bangla words, South Asian grouping: কোটি, লক্ষ, হাজার, শত.
 * Above 99 কোটি the কোটি count is itself read in words ("একশত পঁচিশ কোটি").
 */
export function banglaWords(n: number, opts: Partial<BnOptions> = {}): string {
  const o: BnOptions = { lakh: opts.lakh ?? 'লক্ষ', hundred: opts.hundred ?? 'শত' }
  if (n === 0) return BN_0_99[0]!
  const parts: string[] = []
  const crore = Math.floor(n / 1e7)
  const rest = n % 1e7
  if (crore > 0) parts.push(banglaWords(crore, o) + ' কোটি')
  const lakh = Math.floor(rest / 1e5)
  const thousand = Math.floor((rest % 1e5) / 1000)
  const below = rest % 1000
  if (lakh > 0) parts.push(BN_0_99[lakh]! + ' ' + o.lakh)
  if (thousand > 0) parts.push(BN_0_99[thousand]! + ' হাজার')
  if (below > 0) parts.push(bnBelowThousand(below, o))
  return parts.join(' ')
}

function enBelowHundred(n: number): string {
  if (n < 20) return EN_0_19[n]!
  const unit = n % 10
  return EN_TENS[Math.floor(n / 10)]! + (unit ? '-' + EN_0_19[unit]! : '')
}

function enBelowThousand(n: number): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (hundreds > 0) parts.push(EN_0_19[hundreds]! + ' Hundred')
  if (rest > 0) parts.push(enBelowHundred(rest))
  return parts.join(' ')
}

/** Whole number in English words, Title Case, "Twenty-Five" hyphenated, no "and". */
export function englishWords(n: number, system: 'lakh' | 'international' = 'lakh'): string {
  if (n === 0) return EN_0_19[0]!
  const parts: string[] = []
  if (system === 'lakh') {
    const crore = Math.floor(n / 1e7)
    const rest = n % 1e7
    if (crore > 0) parts.push(englishWords(crore, 'lakh') + ' Crore')
    const lakh = Math.floor(rest / 1e5)
    const thousand = Math.floor((rest % 1e5) / 1000)
    const below = rest % 1000
    if (lakh > 0) parts.push(enBelowHundred(lakh) + ' Lakh')
    if (thousand > 0) parts.push(enBelowHundred(thousand) + ' Thousand')
    if (below > 0) parts.push(enBelowThousand(below))
    return parts.join(' ')
  }
  let rest = n
  for (let g = 0; rest > 0; g++) {
    const chunk = rest % 1000
    if (chunk > 0) parts.unshift(enBelowThousand(chunk) + (EN_GROUPS[g] ? ' ' + EN_GROUPS[g] : ''))
    rest = Math.floor(rest / 1000)
  }
  return parts.join(' ')
}

/**
 * Whole part and the digits after the point as typed (up to 6, trailing zeros
 * dropped): 12.50 → 12 and "5". Uses the shortest decimal that reads back as
 * the same number, because toFixed shows binary noise above 10¹⁰
 * (1234567890123.45 → "…123.449951").
 */
function plainParts(value: number): { whole: number; digits: string } {
  let text = String(value)
  if (/e/i.test(text) || (text.split('.')[1]?.length ?? 0) > 6) text = String(round(value, 6))
  const [int = '0', frac = ''] = text.split('.')
  return { whole: Number(int), digits: frac.replace(/0+$/, '') }
}

/** The amount in Bangla and English words, cheque style or plain. */
export function calculateNumberWords(input: NumberWordsInput): NumberWordsResult {
  const system = input.englishSystem ?? 'lakh'
  const bnOpts = { lakh: input.bnLakh ?? 'লক্ষ', hundred: input.bnHundred ?? 'শত' }

  if (input.style === 'plain') {
    const { whole, digits } = plainParts(input.amount)
    const bnFrac = [...digits].map((d) => BN_0_99[Number(d)]!).join(' ')
    const enFrac = [...digits].map((d) => EN_0_19[Number(d)]!).join(' ')
    return {
      bangla: banglaWords(whole, bnOpts) + (digits ? ' দশমিক ' + bnFrac : ''),
      english: englishWords(whole, system) + (digits ? ' Point ' + enFrac : ''),
      whole,
      paisa: 0,
    }
  }

  // Cheque style: work in whole paisa so 0.1 + 0.2 never shows as 29 paisa.
  // `|| 0` turns -0 (which passes validation) into 0.
  const totalPaisa = Math.round(round(input.amount) * 100) || 0
  const whole = Math.floor(totalPaisa / 100)
  const paisa = totalPaisa % 100

  const bnParts: string[] = []
  const enParts: string[] = []
  if (whole > 0 || paisa === 0) {
    bnParts.push(banglaWords(whole, bnOpts) + ' টাকা')
    enParts.push(englishWords(whole, system) + ' Taka')
  }
  if (paisa > 0) {
    bnParts.push(BN_0_99[paisa]! + ' পয়সা')
    enParts.push((whole > 0 ? 'and ' : '') + enBelowHundred(paisa) + ' Paisa')
  }
  return {
    bangla: bnParts.join(' ') + ' মাত্র',
    english: enParts.join(' ') + ' Only',
    whole,
    paisa,
  }
}
