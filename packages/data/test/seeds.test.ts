/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { calculateBanglaDate } from '@hisab/core/bangla-date'
import { calculateCgpa } from '@hisab/core/cgpa'
import { calculateCurrency } from '@hisab/core/currency'
import { calculateDataPack } from '@hisab/core/data-pack'
import { calculateDayCount } from '@hisab/core/day-count'
import { calculateDeliveryProfit } from '@hisab/core/delivery-profit'
import { calculateDps } from '@hisab/core/dps'
import { calculateElectricityBill, resolveTariff } from '@hisab/core/electricity-bill'
import { calculateFitra } from '@hisab/core/fitra'
import { calculateGpa } from '@hisab/core/gpa'
import { calculateHijriDate } from '@hisab/core/hijri-date'
import { calculateIncomeTax } from '@hisab/core/income-tax'
import { calculateJewelryBill } from '@hisab/core/jewelry-bill'
import { calculateLand } from '@hisab/core/land'
import { calculateLandPrice } from '@hisab/core/land-price'
import { calculateLoanEligibility } from '@hisab/core/loan-eligibility'
import { calculateMfsCompare } from '@hisab/core/mfs-charge'
import { calculateSalary } from '@hisab/core/salary'
import { calculateSanchayapatra } from '@hisab/core/sanchayapatra'
import { calculateRamadanTimetable } from '@hisab/core/sehri-iftar'
import { calculateVat } from '@hisab/core/vat'
import { calculateZakat } from '@hisab/core/zakat'
import type {
  BajusRatesFile,
  BoardGradingFile,
  CouriersFile,
  CurrencyRatesFile,
  DataPacksFile,
  DistrictsFile,
  ElectricityTariffFile,
  ExciseDutyFile,
  FitraFile,
  HijriOffsetFile,
  IncomeTaxFile,
  InterestTaxFile,
  JewelleryRulesFile,
  LandConventionsFile,
  LandRegistrationCostsFile,
  LoanDbrFile,
  MfsChargesFile,
  MfsProvidersFile,
  RamadanFile,
  SalaryPresetsFile,
  SanchayapatraFile,
  SehriIftarMethodFile,
  SpecialDaysFile,
  UgcGradingFile,
  VatRatesFile,
  WeekendFile,
  ZakatFile,
} from '../src/types.ts'

// The seeded data files, handed straight to @hisab/core: each reproduces the
// Figma example its engine test checks, so the files have the shapes the
// engines take (and typecheck against the engines' own types).
const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../../data/${path}`, import.meta.url), 'utf8')) as T

describe('seeded data feeds the engines', () => {
  it('mfs-charges.json → 03 Cash Out: ৳৫,০০০, ৳৪৭.৫০ less than a bKash agent', () => {
    const file = read<MfsChargesFile>('mfs-charges.json')
    const channels = file.channels.map((c) => c.value).filter((c) => c.service === 'cashOut')
    const r = calculateMfsCompare({ amount: 5000, channels, referenceId: file.referenceByService.cashOut! })
    expect(r.rows.find((row) => row.channel.id === 'bkash-priyo-agent')!.charge).toBe(69.75)
    expect(r.rows.find((row) => row.channel.id === 'nagad-app')!.charge).toBe(64.95)
    expect(r.rows.find((row) => row.channel.id === 'upay-agent')!.charge).toBe(70)
    expect(r.cheapest!.channel.id).toBe('nagad-atm')
    expect(r.savingVsReference).toBe(92.5 - 35)
  })
  it('mfs-providers.json → the header lines (হেল্পলাইন ১৬২৪৭ · USSD *247#)', () => {
    const { providers } = read<MfsProvidersFile>('mfs-providers.json')
    expect(providers.map((p) => [p.id, p.helpline.value, p.ussd.value])).toEqual([
      ['bkash', '16247', '*247#'],
      ['nagad', '16167', '*167#'],
      ['rocket', '16216', '*322#'],
      ['upay', '16268', '*268#'],
    ])
  })
  it('electricity-tariff.json → E5: DESCO আবাসিক, ২৫০ ইউনিট, ২ kW = ৳২,০৯৫.৮০', () => {
    const { value } = read<ElectricityTariffFile>('electricity-tariff.json')
    const tariff = resolveTariff(value, 'desco', 'LT-A')!
    expect(calculateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff }).total).toBe(2095.8)
    expect(value.companies).toHaveLength(6)
  })
  it('income-tax-2026-27.json → C6: ৯,০০,০০০ আয়, ১,০০,০০০ বিনিয়োগ = ৳৪৫,০০০', () => {
    const rules = read<IncomeTaxFile>('income-tax-2026-27.json').value
    const r = calculateIncomeTax({ mode: 'salaried', income: 900000, category: 'general', investment: 100000, area: 'dhakaCtgCity', rules })
    expect(r.tax).toBe(45000)
  })
  it('data-packs.json → C8: ৳৪০০, ৩০ দিন → 30 GB জিপি ৳৩৯৯', () => {
    const file = read<DataPacksFile>('data-packs.json')
    const r = calculateDataPack({ packs: file.packs.flatMap((p) => p.value), operators: file.operators.map((o) => o.id), budget: 400, validityDays: 30 })
    expect(r.rows[0]!.pack).toMatchObject({ dataGb: 30, price: 399 })
  })
  it('commerce/couriers.json → E6: ৳১,২০০ − ৳৭০০ − ৳৮০ − ৳১১.২০ = ৳৪০৮.৮০', () => {
    const { steadfast } = read<CouriersFile>('commerce/couriers.json')
    const r = calculateDeliveryProfit({ sellingPrice: 1200, productCost: 700, courier: steadfast!.value, zone: 'inside-dhaka', weightKg: 1 })
    expect(r.profit).toBe(408.8)
  })
  it('commerce/vat-rates.json → C1: ৳১,০০০ + ১৫% = ৳১,১৫০', () => {
    const vat = read<VatRatesFile>('commerce/vat-rates.json')
    expect(calculateVat({ amount: 1000, ratePct: vat.defaultPct.value, mode: 'add' }).total).toBe(1150)
  })
  it('finance/interest-tax.json + excise-duty.json → DPS: ৳১০,০০০ a month pays ৳১,১৫০ excise over 5 years', () => {
    const taxPct = read<InterestTaxFile>('finance/interest-tax.json').value.withTinPct
    const exciseSlabs = read<ExciseDutyFile>('finance/excise-duty.json').value
    const r = calculateDps({ monthlyDeposit: 10000, annualRatePct: 9, months: 60, compounding: 'monthly', taxPct, exciseSlabs })
    expect(r.exciseDuty).toBe(1150)
  })
  it('finance/loan-dbr.json → F9 with the 50% chip: EMI limit ৳৩০,০০০', () => {
    const chips = read<LoanDbrFile>('finance/loan-dbr.json').value
    const r = calculateLoanEligibility({ monthlyIncome: 60000, existingEmi: 5000, maxDebtBurdenPct: chips[1]!, annualRatePct: 12, months: 60 })
    expect(r.emiLimit).toBe(30000)
  })
  it('finance/salary-presets.json → C5: ৳৫০,০০০ gross, প্রচলিত কাঠামো → basic ৳৩০,০০০', () => {
    const preset = read<SalaryPresetsFile>('finance/salary-presets.json').structures.value[0]!
    expect(calculateSalary({ from: 'gross', amount: 50000, structure: preset }).basic).toBe(30000)
  })
  it('finance/sanchayapatra.json → C7: পরিবার, ৫ লাখ, ১১.৯৩% → মাসে ৳৪,৯৭১', () => {
    const paribar = read<SanchayapatraFile>('finance/sanchayapatra.json').value.find((s) => s.id === 'paribar')!
    expect(Math.round(calculateSanchayapatra({ scheme: paribar, investment: 500000 }).profitPerPayout)).toBe(4971)
  })
  it('finance/currency-rates.json → F11: ১,০০০ SAR = ৳৩২,৬৪১', () => {
    const sheet = read<CurrencyRatesFile>('finance/currency-rates.json').value
    expect(calculateCurrency({ amount: 1000, code: 'SAR', direction: 'toBdt', rates: sheet.rates }).result).toBe(32641)
  })
  it('gold/bajus-rates.json + jewellery-rules.json → L4: ১ ভরি 22K = ৳২,৫৩,৭৯৮.৫০', () => {
    const rates = read<BajusRatesFile>('gold/bajus-rates.json').value
    const rules = read<JewelleryRulesFile>('gold/jewellery-rules.json').value
    const r = calculateJewelryBill({ weight: { vori: 1 }, pricePerVori: rates.gold['22K']!, makingPct: rules.minMakingPct, vatPct: rules.vatPct ?? 0 })
    expect(r.total).toBe(253798.5)
  })
  it('religion/zakat.json + bajus-rates.json → R1: নিসাব ৳২,২০,৪৪৭.৫০, যাকাত ৳১৬,২৫০', () => {
    const nisab = read<ZakatFile>('religion/zakat.json').value
    const prices = read<BajusRatesFile>('gold/bajus-rates.json').value
    const rates = { ...nisab, goldPricePerVori: prices.gold['22K']!, silverPricePerVori: prices.silver['22K']! }
    const r = calculateZakat({ assets: { gold: 250000, cash: 450000 }, liabilities: 50000, basis: 'silver', rates })
    expect(r).toMatchObject({ nisab: 220447.5, zakat: 16250 })
  })
  it('religion/fitra.json → R2: ৫ জন × আটা ৳১১০ = ৳৫৫০', () => {
    expect(calculateFitra({ members: 5, itemId: 'atta', rates: read<FitraFile>('religion/fitra.json').value }).total).toBe(550)
  })
  it('religion/ramadan.json + sehri-iftar-method.json + districts.json → R3: ঢাকা, ১ রোজা ৫:১২ / ৫:৫৮', () => {
    const ramadan = read<RamadanFile>('religion/ramadan.json').value
    const method = read<SehriIftarMethodFile>('religion/sehri-iftar-method.json').value
    const dhaka = read<DistrictsFile>('districts.json').value.find((d) => d.id === 'dhaka')!
    const [year, month, day] = ramadan.start.split('-').map(Number) as [number, number, number]
    const rows = calculateRamadanTimetable({ start: { year, month, day }, days: ramadan.days, lat: dhaka.lat, lng: dhaka.lng, method })
    expect(rows).toHaveLength(30)
    expect([rows[0]!.sehri, rows[0]!.iftar]).toEqual([5 * 60 + 12, 17 * 60 + 58])
  })
  it('dates/hijri-offset.json → D5-b: ১৪ এপ্রিল ২০২৭ = ৬ জিলকদ', () => {
    const offsetDays = read<HijriOffsetFile>('dates/hijri-offset.json').value
    expect(calculateHijriDate({ from: 'gregorian', date: { year: 2027, month: 4, day: 14 }, offsetDays }).hijri).toMatchObject({ month: 11, day: 6 })
  })
  it('dates/special-days.json → D3: ১৬ ডিসেম্বর is বিজয় দিবস', () => {
    const specialDays = read<SpecialDaysFile>('dates/special-days.json').value
    expect(calculateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 12, day: 16 }, specialDays }).specialDays).toEqual(['বিজয় দিবস'])
  })
  it('dates/weekend.json → 2026 has 261 working days with no holidays', () => {
    const weekend = read<WeekendFile>('dates/weekend.json').value
    const r = calculateDayCount({ start: { year: 2026, month: 1, day: 1 }, end: { year: 2026, month: 12, day: 31 }, includeEnd: true, work: { weekend } })
    expect(r.working!.workingDays).toBe(261)
  })
  it('land/conventions.json → L1: ১০ শতাংশ = ৬.০৫ কাঠা; the Chattogram কানি is 40 শতক', () => {
    const chips = read<LandConventionsFile>('land/conventions.json').value
    expect(calculateLand({ value: 10, unit: 'decimal', convention: chips[0]! }).values.katha).toBe(6.05)
    expect(calculateLand({ value: 1, unit: 'kani', convention: chips[1]! }).values.decimal).toBe(40)
  })
  it('land/registration-costs.json → L2 costs run on the engine', () => {
    const costs = read<LandRegistrationCostsFile>('land/registration-costs.json').value
    const r = calculateLandPrice({ area: 10, areaUnit: 'decimal', price: 500000, priceUnit: 'decimal', costs })
    expect(r.costs.map((c) => c.id)).toEqual(['stamp', 'registration', 'local-govt', 'source-tax', 'mutation'])
  })
  it('education/board-grading.json and ugc-grading.json → GPA 5.00 and CGPA 4.00 at the top', () => {
    const board = read<BoardGradingFile>('education/board-grading.json').value
    const gpa = calculateGpa({ subjects: [{ grade: 'A+' }, { grade: 'A+', optional: true }], scale: board.scale, fourthSubjectBase: board.fourthSubjectBase })
    expect(gpa.gpa).toBe(5)
    const scale = read<UgcGradingFile>('education/ugc-grading.json').value
    expect(calculateCgpa({ semesters: [{ courses: [{ credits: 3, grade: 'A+' }] }], scale }).cgpa).toBe(4)
  })
})
