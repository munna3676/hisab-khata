import type { ElectricityTariff } from '@hisab/core/electricity-bill'
import type { IncomeTaxRules } from '@hisab/core/income-tax'
import type { DataPack } from '@hisab/core/data-pack'
import type { CourierRate } from '@hisab/core/delivery-profit'
import type { ExciseSlab } from '@hisab/core/lib/finance-slabs'
import type { SanchayapatraScheme } from '@hisab/core/sanchayapatra'
import type { CurrencyRate } from '@hisab/core/currency'
import type { SalaryDeduction, SalaryStructure } from '@hisab/core/salary'
import type { FitraRates } from '@hisab/core/fitra'
import type { ZakatRates } from '@hisab/core/zakat'
import type { JobAgeExtension, JobAgeLimit } from '@hisab/core/job-age-limit'
import type { SpecialDay } from '@hisab/core/bangla-date'
import type { Holiday } from '@hisab/core/day-count'
import type { District, SehriIftarMethod } from '@hisab/core/sehri-iftar'
import type { LandConvention } from '@hisab/core/land'
import type { LandCostRule } from '@hisab/core/land-price'
import type { GradeBand } from '@hisab/core/lib/land-gold-edu-grading'
import type { MfsChannel, MfsService } from '@hisab/core/mfs-charge'
import type { Registry } from './registry.ts'

/**
 * Types for every file in data/, one per schema in data/_schema. Where an
 * engine takes the value directly, the type is the engine's own (MfsChannel,
 * ElectricityTariff…), so a file that passes its schema can be handed to
 * @hisab/core without mapping. Picker labels and ids the engines ignore are
 * added with `&`.
 */

/** One number or rule shown to users, with where it came from (data/_schema/fact.schema.json). */
export interface Fact<T> {
  value: T
  /** e.g. 'BDT', 'BDT per 1000', 'percent', 'days'. */
  unit?: string
  /** Official page the value was read from. */
  source: string
  /** Date a person last confirmed the value at the source, YYYY-MM-DD. */
  checked: string
  note?: string
}

export interface Localized {
  bn: string
  en: string
}

// ── Mobile banking ───────────────────────────────────────────────────────

/** mfs-charges.json */
export interface MfsChargesFile {
  /** One Fact per channel, so every provider's rate keeps its own source. */
  channels: Fact<MfsChannel>[]
  /** Channel id each service compares against ("৳৪৭.৫০ কম বিকাশ এজেন্টের চেয়ে"). */
  referenceByService: Partial<Record<MfsService, string>>
}

/** A row of the "কোন কোন বিল দেওয়া যায়" list. */
export interface BillerCategory {
  id: string
  label: string
  detail: string
}

export interface MfsProvider {
  id: string
  name: Localized
  /** The bank that runs the service (Rocket: Dutch-Bangla Bank). */
  operator?: Localized
  /** Five-digit short code, e.g. '16247'. */
  helpline: Fact<string>
  /** e.g. '*247#'. */
  ussd: Fact<string>
  billers: Fact<BillerCategory[]>
}

/** mfs-providers.json */
export interface MfsProvidersFile {
  providers: MfsProvider[]
}

// ── Banks and remittance ─────────────────────────────────────────────────

export type BankKind = 'state' | 'private' | 'foreign' | 'specialised'

export interface BankInfo {
  id: string
  name: Localized
  /** Short Bangla label for tables and chips (ব্র্যাক). */
  shortName?: string
  kind: BankKind
  /** Shariah-based bank (the ইসলামী filter). */
  islamic: boolean
  helpline: Fact<string>
  website?: string
}

/** banks.json: the directory; each bank's rates are in banks/<id>.json. */
export interface BanksFile {
  banks: BankInfo[]
}

/** A deposit rate by term: months 12 is FDR ১ বছর, 60 is DPS ৫ বছর. */
export interface BankTermRate {
  months: number
  ratePct: number
}

export interface BankLoanRate {
  /** e.g. 'personal', 'home', 'car'. */
  id: string
  label: string
  ratePct: number
}

/** banks/<id>.json */
export interface BankRatesFile {
  bankId: string
  fdr?: Fact<BankTermRate[]>
  dps?: Fact<BankTermRate[]>
  loans?: Fact<BankLoanRate[]>
}

export interface RemittanceCountry {
  /** ISO 3166 alpha-2, lower case. */
  id: string
  name: string
  /** ISO 4217 code, e.g. 'SAR'. */
  currency: string
  currencyName: string
}

export interface RemittanceService {
  id: string
  name: string
  /** A RemittanceChannel id. */
  channel: string
  /** Country ids it sends from. */
  countries: string[]
  /** Sender fee in the sending currency. */
  feeLocal?: number
  /** Percent the service's rate is below (+) or above (-) the reference bank rate. */
  rateSpreadPct?: number
  speed?: string
  url?: string
}

/** remittance.json */
export interface RemittanceFile {
  countries: RemittanceCountry[]
  /** How the family receives it, e.g. 'এক্সচেঞ্জ হাউস → ব্যাংক'. */
  channels: { id: string; label: string }[]
  services: Fact<RemittanceService>[]
  /** Government cash incentive on inward remittance, in percent. */
  incentivePct?: Fact<number>
}

// ── Bills, tax, packs ────────────────────────────────────────────────────

export interface ElectricityCompany {
  /** bpdb, desco, dpdc, nesco, wzpdcl, breb. */
  id: string
  bn: string
  en: string
  /** Area served, for the picker. */
  area: string
}

/** electricity-tariff.json value: @hisab/core ElectricityTariffTable plus the company list. */
export interface ElectricityTariffData {
  companies: ElectricityCompany[]
  tariffs: Record<string, ElectricityTariff>
  overrides?: Record<string, Record<string, Partial<ElectricityTariff>>>
}
export type ElectricityTariffFile = Fact<ElectricityTariffData>

/** income-tax-<year>.json */
export type IncomeTaxFile = Fact<IncomeTaxRules>

export interface Operator {
  /** gp, robi, banglalink, teletalk. */
  id: string
  bn: string
  en: string
}

/** data-packs.json: one Fact per operator, each with its own source. */
export interface DataPacksFile {
  operators: Operator[]
  packs: Fact<DataPack[]>[]
}

// ── Commerce ─────────────────────────────────────────────────────────────

/** commerce/couriers.json: courier id → its rates. */
export type CouriersFile = Record<string, Fact<CourierRate>>

export interface Chip {
  id: string
  label: string
}

/** commerce/delivery-zones.json */
export interface DeliveryZonesFile {
  zones: Fact<Chip[]>
}

export interface RateChip {
  pct: number
  label?: string
}

/** commerce/vat-rates.json */
export interface VatRatesFile {
  rates: Fact<RateChip[]>
  defaultPct: Fact<number>
}

/** commerce/sd-rates.json */
export interface SdRatesFile {
  rates: Fact<RateChip[]>
}

// ── Finance ──────────────────────────────────────────────────────────────

/** finance/interest-tax.json: DPS/FDR taxPct. */
export type InterestTaxFile = Fact<{ withTinPct: number; withoutTinPct?: number }>

/** finance/excise-duty.json: DPS/FDR exciseSlabs. */
export type ExciseDutyFile = Fact<ExciseSlab[]>

/** finance/loan-dbr.json: the maxDebtBurdenPct chips. */
export type LoanDbrFile = Fact<number[]>

/** finance/loan-caps.json: optional maxLoanCap by loan type. */
export type LoanCapsFile = Fact<Record<string, number>>

/** finance/loan-fees.json */
export type LoanFeesFile = Fact<{ processingFeePct?: number }>

export type SalaryPreset = SalaryStructure & { id: string; labelBn: string }

/** finance/salary-presets.json */
export interface SalaryPresetsFile {
  structures: Fact<SalaryPreset[]>
  deductions?: Fact<SalaryDeduction[]>
}

export type SanchayapatraSchemeData = SanchayapatraScheme & { nameBn: string; detailBn?: string }

/** finance/sanchayapatra.json */
export type SanchayapatraFile = Fact<SanchayapatraSchemeData[]>

export interface SavingsGoalPreset {
  id: string
  labelBn: string
  target?: number
  months?: number
}

/** finance/savings-goal-presets.json */
export type SavingsGoalPresetsFile = Fact<SavingsGoalPreset[]>

export interface CurrencyRateSheet {
  bank: string
  rateType: string
  /** Date of the bank's sheet, YYYY-MM-DD. */
  asOf: string
  rates: (CurrencyRate & { nameBn: string })[]
}

/** finance/currency-rates.json */
export type CurrencyRatesFile = Fact<CurrencyRateSheet>

// ── Gold and religion ────────────────────────────────────────────────────

export type Karat = '24K' | '22K' | '21K' | '18K' | 'traditional'

export interface BajusRates {
  date: string
  /** Taka per ভরি (11.664 g). */
  gold: Partial<Record<Karat, number>>
  silver: Partial<Record<Karat, number>>
}

/** gold/bajus-rates.json */
export type BajusRatesFile = Fact<BajusRates>

export interface JewelleryRules {
  /** BAJUS minimum মজুরি in percent. */
  minMakingPct: number
  /** Exactly one of vatPct and vatPerVori is set, matching the current NBR rule. */
  vatPct: number | null
  vatPerVori: number | null
  exchangeDeductionPct?: number
  buybackDeductionPct?: number
  pointsPerRoti?: number
}

/** gold/jewellery-rules.json */
export type JewelleryRulesFile = Fact<JewelleryRules>

/** religion/zakat.json: the nisab half of @hisab/core ZakatRates (prices come from bajus-rates.json). */
export type ZakatFile = Fact<Pick<ZakatRates, 'nisabGoldVori' | 'nisabSilverVori' | 'ratePct'>>

/** religion/fitra.json */
export type FitraFile = Fact<FitraRates & { announced?: string }>

/** religion/sehri-iftar-method.json */
export type SehriIftarMethodFile = Fact<SehriIftarMethod>

/** religion/ramadan.json */
export type RamadanFile = Fact<{ hijriYear: number; start: string; days: number }>

// ── Dates and jobs ───────────────────────────────────────────────────────

/** dates/hijri-offset.json */
export type HijriOffsetFile = Fact<number>

/** dates/special-days.json */
export type SpecialDaysFile = Fact<SpecialDay[]>

/** dates/weekend.json: 0 = Sunday. */
export type WeekendFile = Fact<number[]>

/** dates/holidays-<year>.json */
export type HolidaysFile = Fact<(Holiday & { name: string; kind?: 'public' | 'executive' | 'optional' })[]>

export type JobAgeRule = JobAgeLimit & {
  /** The বয়সসীমা chips. */
  presets: number[]
  /** Whether a candidate may still apply on the day the limit is completed. */
  limitDayIncluded: boolean
  extensions: (JobAgeExtension & { label: string })[]
}

/** jobs/govt-age-limit.json */
export type JobAgeLimitFile = Fact<JobAgeRule>

// ── Land, education, places ──────────────────────────────────────────────

export type LandConventionChip = LandConvention & { id: string; label: string }

/** land/conventions.json */
export type LandConventionsFile = Fact<LandConventionChip[]>

/** land/registration-costs.json */
export type LandRegistrationCostsFile = Fact<LandCostRule[]>

/** education/board-grading.json */
export type BoardGradingFile = Fact<{ scale: GradeBand[]; fourthSubjectBase: number }>

/** education/board-subjects.json: exam → group → subject names. */
export type BoardSubjectsFile = Fact<{ ssc?: Record<string, string[]>; hsc?: Record<string, string[]> }>

/** education/ugc-grading.json */
export type UgcGradingFile = Fact<GradeBand[]>

/** districts.json */
export type DistrictsFile = Fact<District[]>

// ── Guides ───────────────────────────────────────────────────────────────

export interface GuideDocument {
  id: string
  label: string
  /** Needed only in some cases ("(প্রয়োজনে)"). */
  optional?: boolean
}

export interface GuideStep {
  title: string
  detail?: string
}

export interface GuideFee {
  id: string
  label: string
  /** Taka. */
  amount: number
  note?: string
}

export interface WizardQuestion {
  id: string
  title: string
  help?: string
  options: { id: string; label: string }[]
}

export interface WizardResult {
  /** Question id → option id; a result applies when every pair matches the answers. */
  when: Record<string, string>
  title: string
  /** GuideDocument ids. */
  documents: string[]
  tip?: string
}

/** guides/<slug>.json */
export interface GuideFile {
  id: string
  title: string
  summary: string
  documents: Fact<GuideDocument[]>
  steps: Fact<GuideStep[]>
  fees: Fact<GuideFee[]>
  tips?: { kind: 'info' | 'warn'; text: string }[]
  faq: { q: string; a: string }[]
  sources: { label: string; url: string }[]
  /** The "তোমার ঠিক কোন কাগজ লাগবে?" questions. */
  wizard?: { questions: WizardQuestion[]; results: WizardResult[] }
}

// ── Editorial files ──────────────────────────────────────────────────────

/** search/synonyms.json */
export interface SynonymsFile {
  terms: { canonical: string; variants: string[] }[]
}

/** text/name-variants.json */
export interface NameVariantsFile {
  groups: { id: string; variants: string[]; note?: string }[]
}

export interface ChangelogEntry {
  /** '<file>#<path>', array items named by their id where they have one. */
  key: string
  old: unknown
  new: unknown
  source: string | null
  date: string
}

/** changelog.json */
export interface ChangelogFile {
  entries: ChangelogEntry[]
}

/** Each contract pattern's file type, for typed reads from the store. */
export interface DataFileTypes {
  'mfs-charges.json': MfsChargesFile
  'mfs-providers.json': MfsProvidersFile
  'banks.json': BanksFile
  [bank: `banks/${string}.json`]: BankRatesFile
  'remittance.json': RemittanceFile
  'electricity-tariff.json': ElectricityTariffFile
  [incomeTax: `income-tax-${string}.json`]: IncomeTaxFile
  'data-packs.json': DataPacksFile
  'commerce/couriers.json': CouriersFile
  'commerce/delivery-zones.json': DeliveryZonesFile
  'commerce/vat-rates.json': VatRatesFile
  'commerce/sd-rates.json': SdRatesFile
  'finance/interest-tax.json': InterestTaxFile
  'finance/excise-duty.json': ExciseDutyFile
  'finance/loan-dbr.json': LoanDbrFile
  'finance/loan-caps.json': LoanCapsFile
  'finance/loan-fees.json': LoanFeesFile
  'finance/salary-presets.json': SalaryPresetsFile
  'finance/sanchayapatra.json': SanchayapatraFile
  'finance/savings-goal-presets.json': SavingsGoalPresetsFile
  'finance/currency-rates.json': CurrencyRatesFile
  'gold/bajus-rates.json': BajusRatesFile
  'gold/jewellery-rules.json': JewelleryRulesFile
  'religion/zakat.json': ZakatFile
  'religion/fitra.json': FitraFile
  'religion/sehri-iftar-method.json': SehriIftarMethodFile
  'religion/ramadan.json': RamadanFile
  'dates/hijri-offset.json': HijriOffsetFile
  'dates/special-days.json': SpecialDaysFile
  'dates/weekend.json': WeekendFile
  [holidays: `dates/holidays-${string}.json`]: HolidaysFile
  'jobs/govt-age-limit.json': JobAgeLimitFile
  'land/conventions.json': LandConventionsFile
  'land/registration-costs.json': LandRegistrationCostsFile
  'education/board-grading.json': BoardGradingFile
  'education/board-subjects.json': BoardSubjectsFile
  'education/ugc-grading.json': UgcGradingFile
  'districts.json': DistrictsFile
  [guide: `guides/${string}.json`]: GuideFile
  'search/synonyms.json': SynonymsFile
  'text/name-variants.json': NameVariantsFile
  'changelog.json': ChangelogFile
  'registry/tools.json': Registry
}
