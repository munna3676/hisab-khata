import { round } from './lib/money.ts'

/**
 * Which nisab to measure against. 'silver' (রুপা অনুযায়ী) and 'gold' (সোনা
 * অনুযায়ী) are the screen's chips. 'auto' follows the Hanafi rule taught in
 * Bangladesh: gold's nisab when the only wealth is gold, silver's when it is
 * only silver, and silver's (the lower) for any mix or for cash.
 */
export type NisabBasis = 'silver' | 'gold' | 'auto'

/** The day's prices and the nisab rules (from data). */
export interface ZakatRates {
  /** Taka per ভরি of gold, from the day's BAJUS rate. */
  goldPricePerVori: number
  /** Taka per ভরি of silver, from the day's BAJUS rate. */
  silverPricePerVori: number
  /** ভরি of gold in the nisab: 7.5. */
  nisabGoldVori: number
  /** ভরি (তোলা) of silver in the nisab: 52.5. */
  nisabSilverVori: number
  /** Share of net wealth due, in percent: 2.5. */
  ratePct: number
}

/** Zakatable wealth in taka, valued today. Leave out what the person does not have. */
export interface ZakatAssets {
  /** সোনা: own weight × today's selling rate. */
  gold?: number
  silver?: number
  cash?: number
  bank?: number
  /** ব্যবসার পণ্য at today's selling value. */
  business?: number
  /** Money owed to the person that they expect to get back. */
  receivables?: number
  /** Any other zakatable wealth (shares, savings certificates, foreign currency...). */
  other?: number
}

export interface ZakatInput {
  assets: ZakatAssets
  /** দেনা due now, in taka. */
  liabilities: number
  basis: NisabBasis
  rates: ZakatRates
  /** A nisab typed in by hand ("৫২.৫ তোলা রুপার দাম"), used instead of the one from the rates. */
  nisabOverride?: number
}

export interface ZakatResult {
  /** মোট সম্পদ. */
  totalAssets: number
  liabilities: number
  /** নিট যাকাতযোগ্য সম্পদ: assets − liabilities; can be negative. */
  netAssets: number
  /** The basis actually used ('auto' resolved). */
  basis: 'silver' | 'gold'
  nisab: number
  goldNisab: number
  silverNisab: number
  meetsNisab: boolean
  ratePct: number
  /** 0 below the nisab. */
  zakat: number
}

export type ZakatError = 'assets' | 'liabilities' | 'basis' | 'rates' | 'nisab'

const ASSET_KEYS: readonly (keyof ZakatAssets)[] = [
  'gold',
  'silver',
  'cash',
  'bank',
  'business',
  'receivables',
  'other',
]

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateZakat(input: ZakatInput): ZakatError | null {
  if (!ASSET_KEYS.every((k) => isAmount(input.assets[k]))) return 'assets'
  if (!Number.isFinite(ASSET_KEYS.reduce((sum, k) => sum + (input.assets[k] ?? 0), 0))) return 'assets'
  if (!(input.liabilities >= 0 && Number.isFinite(input.liabilities))) return 'liabilities'
  if (!['silver', 'gold', 'auto'].includes(input.basis)) return 'basis'
  const r = input.rates
  const positive = [r.goldPricePerVori, r.silverPricePerVori, r.nisabGoldVori, r.nisabSilverVori]
  if (!positive.every((v) => v > 0 && Number.isFinite(v)) || !(r.ratePct > 0 && r.ratePct <= 100)) return 'rates'
  const nisabs = [r.nisabGoldVori * r.goldPricePerVori, r.nisabSilverVori * r.silverPricePerVori]
  if (!nisabs.every(Number.isFinite)) return 'rates'
  if (input.nisabOverride !== undefined && !(input.nisabOverride > 0 && Number.isFinite(input.nisabOverride))) {
    return 'nisab'
  }
  return null
}

/** The nisab basis 'auto' resolves to for these assets. */
export function resolveNisabBasis(basis: NisabBasis, assets: ZakatAssets): 'silver' | 'gold' {
  if (basis !== 'auto') return basis
  const held = ASSET_KEYS.filter((k) => (assets[k] ?? 0) > 0)
  return held.length === 1 && held[0] === 'gold' ? 'gold' : 'silver'
}

/** Net zakatable wealth against the nisab, and 2.5% of it when the nisab is met. */
export function calculateZakat(input: ZakatInput): ZakatResult {
  const { assets, rates } = input
  const totalAssets = round(ASSET_KEYS.reduce((sum, k) => sum + (assets[k] ?? 0), 0))
  const liabilities = round(input.liabilities)
  const netAssets = round(totalAssets - liabilities)

  const goldNisab = round(rates.nisabGoldVori * rates.goldPricePerVori)
  const silverNisab = round(rates.nisabSilverVori * rates.silverPricePerVori)
  const basis = resolveNisabBasis(input.basis, assets)
  const fromRates = basis === 'gold' ? goldNisab : silverNisab
  const nisab = input.nisabOverride !== undefined ? round(input.nisabOverride) : fromRates

  const meetsNisab = netAssets > 0 && netAssets >= nisab
  const zakat = meetsNisab ? round((netAssets * rates.ratePct) / 100) : 0
  return {
    totalAssets,
    liabilities,
    netAssets,
    basis,
    nisab,
    goldNisab,
    silverNisab,
    meetsNisab,
    ratePct: rates.ratePct,
    zakat,
  }
}
