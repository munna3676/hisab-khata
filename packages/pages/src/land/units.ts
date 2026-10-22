// What the land tools (converter L1, price L2) share: the P3 unit picker (পিকার — জমির একক
// 59:16558, D · P3 70:19840), unit names in both languages and how areas are written.
import { LAND_UNITS, landConvention, landUnitSqft, type LandConvention, type LandUnit } from '@hisab/core/land'
import type { Lang } from '@hisab/i18n/locale'
import type { ChoiceOption } from '../tool/ChoiceSheet.tsx'
import { decimal, fill, num } from '../tool/say.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

/** The units in P3, in Figma's order. Links may name any unit of @hisab/core land. */
export const PICKER_UNITS = ['decimal', 'katha', 'bigha', 'acre', 'sqft', 'gonda'] as const satisfies readonly LandUnit[]

/** Every unit of the engine, for the link params (a test checks it matches LAND_UNITS). */
export const ALL_LAND_UNITS = [
  'decimal', 'sqft', 'katha', 'bigha', 'acre', 'sqm', 'sqyard', 'chotak', 'kani', 'gonda', 'kora', 'kranti', 'link', 'hectare',
] as const satisfies readonly LandUnit[]

export const LAND_UNIT_COPY = {
  /** Unit names in running text ("১০ শতাংশ ="). */
  unitName: {
    decimal: { bn: 'শতাংশ', en: 'decimal' },
    sqft: { bn: 'বর্গফুট', en: 'sq ft' },
    katha: { bn: 'কাঠা', en: 'katha' },
    bigha: { bn: 'বিঘা', en: 'bigha' },
    acre: { bn: 'একর', en: 'acre' },
    sqm: { bn: 'বর্গমিটার', en: 'sq m' },
    sqyard: { bn: 'বর্গগজ', en: 'sq yd' },
    chotak: { bn: 'ছটাক', en: 'chotak' },
    kani: { bn: 'কানি', en: 'kani' },
    gonda: { bn: 'গণ্ডা', en: 'gonda' },
    kora: { bn: 'কড়া', en: 'kora' },
    kranti: { bn: 'ক্রান্তি', en: 'kranti' },
    link: { bn: 'বর্গলিংক', en: 'sq link' },
    hectare: { bn: 'হেক্টর', en: 'hectare' },
  },
  /** P3 option titles. */
  pickerName: {
    decimal: { bn: 'শতাংশ (ডেসিমাল)', en: 'Decimal (shotangsho)' },
    katha: { bn: 'কাঠা', en: 'Katha' },
    bigha: { bn: 'বিঘা', en: 'Bigha' },
    acre: { bn: 'একর', en: 'Acre' },
    sqft: { bn: 'বর্গফুট', en: 'Square feet' },
    gonda: { bn: 'গণ্ডা', en: 'Gonda' },
  },
  pickerTitle: { bn: 'কোন একক থেকে?', en: 'From which unit?' },
  decimalHelp: { bn: '১ শতাংশ = {sqft} বর্গফুট', en: '1 decimal = {sqft} sq ft' },
  kathaHelp: { bn: '১ কাঠা = {sqft} বর্গফুট = {decimal} শতাংশ', en: '1 katha = {sqft} sq ft = {decimal} decimal' },
  bighaHelp: { bn: '১ বিঘা = {katha} কাঠা ≈ {decimal} শতাংশ', en: '1 bigha = {katha} katha ≈ {decimal} decimal' },
  acreHelp: { bn: '১ একর = {decimal} শতাংশ', en: '1 acre = {decimal} decimal' },
  sqftHelp: { bn: 'মূল একক', en: 'Base unit' },
  gondaHelp: { bn: 'অঞ্চলভেদে মাপ আলাদা, এলাকা বেছে নিতে হবে', en: 'Size differs by region; pick the area' },
} as const satisfies CopyTable

export type LandUnitCopy = Localized<typeof LAND_UNIT_COPY>

/**
 * An area as the L1 table and result write it: whole numbers plain ("৪,৩৫৬", "১০"), others with two
 * decimals under 100 ("৬.০৫", "০.৩০"), one under 1,000 ("৪০৪.৭") and none above.
 */
export function landDecimals(value: number): number {
  if (Number.isInteger(value)) return 0
  const abs = Math.abs(value)
  return abs < 100 ? 2 : abs < 1000 ? 1 : 0
}

export const areaText = (lang: Lang, value: number) => num(lang, value, landDecimals(value))

/** P3's options with their one-line sizes, worked out from the convention in use. */
export function unitOptions(lang: Lang, copy: LandUnitCopy, convention: Partial<LandConvention> | undefined, current?: string): ChoiceOption[] {
  const c = landConvention(convention)
  const dec = landUnitSqft('decimal', c)
  const help: Record<(typeof PICKER_UNITS)[number], string> = {
    decimal: fill(lang, copy.decimalHelp, { sqft: decimal(lang, dec, 2) }),
    katha: fill(lang, copy.kathaHelp, { sqft: decimal(lang, c.kathaSqft, 2), decimal: decimal(lang, Math.round((c.kathaSqft / dec) * 100) / 100, 2) }),
    bigha: fill(lang, copy.bighaHelp, { katha: decimal(lang, c.kathaPerBigha, 2), decimal: num(lang, Math.round(landUnitSqft('bigha', c) / dec)) }),
    acre: fill(lang, copy.acreHelp, { decimal: num(lang, landUnitSqft('acre', c) / dec) }),
    sqft: copy.sqftHelp,
    gonda: copy.gondaHelp,
  }
  const options: ChoiceOption[] = PICKER_UNITS.map((u) => ({ value: u, label: copy.pickerName[u], description: help[u] }))
  if (current && !options.some((o) => o.value === current) && (LAND_UNITS as readonly string[]).includes(current)) {
    options.push({ value: current, label: copy.unitName[current as LandUnit] })
  }
  return options
}
