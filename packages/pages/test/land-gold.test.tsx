// Land and gold tools (Figma L1–L4, P3) against the Figma example values. Where Figma and the engine
// disagree, the engine wins and the test name says so (L2 per শতাংশ).
import { LAND_UNITS } from '@hisab/core/land'
import { checkDataFile } from '@hisab/data/checks'
import type { BajusRatesFile, JewelleryRulesFile, LandConventionsFile } from '@hisab/data/types'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import ratesJson from '../../../data/gold/bajus-rates.json' with { type: 'json' }
import rulesJson from '../../../data/gold/jewellery-rules.json' with { type: 'json' }
import conventionsJson from '../../../data/land/conventions.json' with { type: 'json' }
import { PRICE_FROM_RATES, priceIn, rateFor } from '../src/gold/shared.ts'
import { goldContent } from '../src/gold-converter/content.ts'
import { COPY as GOLD } from '../src/gold-converter/copy.ts'
import { GoldConverterCalculator } from '../src/gold-converter/GoldConverterCalculator.tsx'
import { goldCallout, goldOutcome } from '../src/gold-converter/model.ts'
import { GOLD_PARAMS } from '../src/gold-converter/params.ts'
import { jewelryContent } from '../src/jewelry-bill/content.ts'
import { COPY as JEWELRY } from '../src/jewelry-bill/copy.ts'
import { jewelryOutcome } from '../src/jewelry-bill/model.ts'
import { JEWELRY_PARAMS } from '../src/jewelry-bill/params.ts'
import { ALL_LAND_UNITS, unitOptions } from '../src/land/units.ts'
import { landContent } from '../src/land-converter/content.ts'
import { COPY as LAND } from '../src/land-converter/copy.ts'
import { landCallout, landOutcome } from '../src/land-converter/model.ts'
import { LAND_PARAMS } from '../src/land-converter/params.ts'
import { COPY as PRICE } from '../src/land-price/copy.ts'
import { landPriceOutcome } from '../src/land-price/model.ts'
import { landPriceContent } from '../src/land-price/content.ts'
import { islandText } from '../src/tool/island-text.ts'
import { localize } from '../src/tool/text.ts'

const conventions = conventionsJson as unknown as LandConventionsFile
const rates = ratesJson as unknown as BajusRatesFile
const rules = rulesJson as unknown as JewelleryRulesFile
const rows = (summary: { label: string; value: string }[]) => summary.map((r) => [r.label, r.value])

function result<T>(o: { kind: string; result?: T }): T {
  if (o.kind !== 'result') throw new Error(`expected a result, got ${o.kind}`)
  return o.result as T
}

describe('data these pages use', () => {
  it('is valid, and the link defaults match it', () => {
    expect(checkDataFile('land/conventions.json', conventions)).toEqual([])
    expect(checkDataFile('gold/bajus-rates.json', rates)).toEqual([])
    expect(checkDataFile('gold/jewellery-rules.json', rules)).toEqual([])
    expect([...ALL_LAND_UNITS].sort()).toEqual([...LAND_UNITS].sort())
    expect(conventions.value.map((c) => c.id)).toEqual(LAND_PARAMS.area.values.filter((v) => v !== 'custom'))
    expect(LAND_PARAMS.ks.default).toBe(conventions.value.find((c) => c.id === 'standard')!.kathaSqft)
    expect(JEWELRY_PARAMS.mk.default).toBe(rules.value.minMakingPct)
    expect(JEWELRY_PARAMS.vat.default).toBe(rules.value.vatPct)
    expect(GOLD_PARAMS.p.default).toBe(PRICE_FROM_RATES)
  })
  it('pages with data show "যাচাই বাকি" while the Facts are unverified', () => {
    expect(landContent('bn', conventions).data?.verified).toBe(false)
    expect(goldContent('bn', rates).data?.verified).toBe(false)
    expect(jewelryContent('bn', rules, rates).data?.verified).toBe(false)
    expect(landPriceContent('bn').data).toBeUndefined()
    expect(landPriceContent('bn').crumbs.map((c) => c.label)).toEqual(['হোম', 'জমি ও সোনা', 'জমির দাম'])
  })
})

describe('Land converter (Figma L1, P3)', () => {
  const copy = localize(LAND, 'bn')
  const run = (value: number | null = 10, unit: (typeof ALL_LAND_UNITS)[number] = 'decimal', area: 'standard' | 'custom' | 'chattogram' = 'standard', ks: number | null = 720) =>
    landOutcome({ lang: 'bn', copy, value, unit, area, kathaSqft: ks, conventions: conventions.value })
  it('L1: ১০ শতাংশ = ৪,৩৫৬ বর্গফুট', () => {
    const r = result(run())
    expect([r.label, r.value, r.decimals, r.suffix, r.sub]).toEqual(['১০ শতাংশ =', 4356, 0, ' বর্গফুট', '৬.০৫ কাঠা (ঢাকা মাপে) · ০.১০ একর'])
    expect(r.rows.map((x) => [x.label, x.value, !!x.current])).toEqual([
      ['শতাংশ / ডেসিমাল', '১০', true],
      ['বর্গফুট', '৪,৩৫৬', false],
      ['কাঠা', '৬.০৫', false],
      ['বিঘা', '০.৩০', false],
      ['একর', '০.১০', false],
      ['বর্গমিটার', '৪০৪.৭', false],
    ])
    expect(landCallout('bn', copy)).toBe('১ শতাংশ = ৪৩৫.৬ বর্গফুট, ১ একর = ১০০ শতাংশ। কাঠা আর বিঘার মাপ জায়গাভেদে আলাদা, তাই দলিলের মাপ মিলিয়ে নাও।')
  })
  it('P3 options and their sizes', () => {
    expect(unitOptions('bn', copy, undefined).map((o) => [o.label, o.description])).toEqual([
      ['শতাংশ (ডেসিমাল)', '১ শতাংশ = ৪৩৫.৬ বর্গফুট'],
      ['কাঠা', '১ কাঠা = ৭২০ বর্গফুট = ১.৬৫ শতাংশ'],
      ['বিঘা', '১ বিঘা = ২০ কাঠা ≈ ৩৩ শতাংশ'],
      ['একর', '১ একর = ১০০ শতাংশ'],
      ['বর্গফুট', 'মূল একক'],
      ['গণ্ডা', 'অঞ্চলভেদে মাপ আলাদা, এলাকা বেছে নিতে হবে'],
    ])
  })
  it('বর্গফুট typed → শতাংশ; a typed কাঠা size; a unit outside the table gets its own row', () => {
    expect(result(run(4356, 'sqft')).suffix).toBe(' শতাংশ')
    expect(result(run(1, 'katha', 'custom', 726)).sub).toBe('১ কাঠা (৭২৬ বর্গফুটের কাঠায়) · ০.০২ একর')
    expect(run(1, 'katha', 'custom', 0).fields).toEqual({ ks: 'কাঠার মাপ শূন্যের বেশি লেখো' })
    expect(result(run(1, 'gonda', 'chattogram')).rows.at(-1)).toMatchObject({ key: 'gonda', current: true })
  })
  it('FAQ numbers come from the engine', () => {
    expect(landContent('bn', conventions).faq?.items[0]?.answer).toBe('ঢাকার প্রচলিত মাপে ১ কাঠা = ৭২০ বর্গফুট = প্রায় ১.৬৫ শতাংশ।')
  })
})

describe('Land price (Figma L2)', () => {
  it('L2: ৫ কাঠা × ৳২৫,০০,০০০ = ৳১,২৫,০০,০০০; per শতাংশ ৳১৫,১২,৫০০ (engine, exact at 720 sq ft; Figma ৳১৫,১৫,১৫২ uses 1.65)', () => {
    const r = result(landPriceOutcome({ lang: 'bn', copy: localize(PRICE, 'bn'), area: 5, unit: 'katha', price: 2_500_000 }))
    expect([r.label, r.value, r.sub]).toEqual(['মোট দাম', 12_500_000, '১ কোটি ২৫ লাখ টাকা'])
    expect(rows(r.summary)).toEqual([
      ['প্রতি শতাংশ', '৳১৫,১২,৫০০'],
      ['প্রতি বর্গফুট', '৳৩,৪৭২'],
      ['প্রতি কাঠা', '৳২৫,০০,০০০'],
    ])
  })
  it('English words and a zero area', () => {
    const copy = localize(PRICE, 'en')
    expect(result(landPriceOutcome({ lang: 'en', copy, area: 1, unit: 'bigha', price: 1_234_567 })).sub).toBe('12 lakh 34 thousand 567 taka')
    expect(landPriceOutcome({ lang: 'en', copy, area: 0, unit: 'katha', price: 1 }).fields).toEqual({ area: 'Enter more than zero' })
  })
})

describe('Gold converter (Figma L3)', () => {
  const copy = localize(GOLD, 'bn')
  it('L3: ২ ভরি ৪ আনা = ২৬.২৪৪ গ্রাম, ২২ ক্যারেট ৳২,২৮,০৩১ → ৳৫,১৩,০৭০', () => {
    const price = priceIn(PRICE_FROM_RATES, rateFor(rates.value, '22'))
    expect(price).toBe(228031)
    const r = result(goldOutcome({ lang: 'bn', copy, vori: 2, ana: 4, roti: 0, karat: '22', price }))
    expect([r.label, r.value, r.decimals, r.sub]).toEqual(['মোট ওজন ও দাম', 26.244, 3, '২.২৫ ভরি × ৳২,২৮,০৩১ = ৳৫,১৩,০৭০ (২২ ক্যারেট)'])
    expect(r.rows.map((x) => [x.label, x.value, !!x.current])).toEqual([
      ['ভরি', '২.২৫', false],
      ['আনা', '৩৬', false],
      ['রতি', '২১৬', false],
      ['গ্রাম', '২৬.২৪৪', true],
    ])
    expect(goldCallout('bn', copy)).toBe('১ ভরি = ১৬ আনা = ৯৬ রতি = ১১.৬৬৪ গ্রাম।')
  })
  it('a karat without a rate shows the weight only', () => {
    expect(rateFor(rates.value, '18')).toBeNull()
    expect(result(goldOutcome({ lang: 'bn', copy, vori: 1, ana: 0, roti: 0, karat: '18', price: null })).sub).toBe('১ ভরি')
    expect(goldOutcome({ lang: 'bn', copy, vori: null, ana: null, roti: null, karat: '22', price: 1 }).kind).toBe('empty')
  })
})

describe('Jewellery bill (Figma L4)', () => {
  const copy = localize(JEWELRY, 'bn')
  const run = (over: Partial<Parameters<typeof jewelryOutcome>[0]> = {}) =>
    jewelryOutcome({ lang: 'bn', copy, vori: 1, ana: 0, roti: 0, price: 228031, fromRates: true, making: 6, vat: 5, ...over })
  it('L4: ১ ভরি, ৳২,২৮,০৩১, মজুরি ৬%, VAT ৫% → ৳২,৫৩,৭৯৯', () => {
    const r = result(run())
    expect([r.label, r.value, r.sub]).toEqual(['মোট বিল', 253798.5, 'বাজুস রেট, মজুরি ৬% ও VAT ৫% ধরে'])
    expect(rows(r.summary)).toEqual([
      ['সোনার দাম', '৳২,২৮,০৩১'],
      ['মজুরি (৬%)', '৳১৩,৬৮২'],
      ['VAT (৫%)', '৳১২,০৮৬'],
      ['মোট', '৳২,৫৩,৭৯৯'],
    ])
  })
  it('field errors: no weight, rates over 100%', () => {
    expect(run({ vori: 0 }).fields).toEqual({ v: 'ওজন লেখো' })
    expect(run({ making: 120 }).fields).toEqual({ mk: 'সর্বোচ্চ ১০০ লেখা যাবে' })
    expect(result(run({ fromRates: false })).sub).toBe('তোমার দেওয়া রেট, মজুরি ৬% ও VAT ৫% ধরে')
  })
})

describe('Gold converter island', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
  })
  it('a karat chip goes back to the day’s rate; a typed price goes into the link', async () => {
    window.history.replaceState(null, '', '/tools/gold-converter?k=21')
    render(<GoldConverterCalculator lang="bn" text={islandText('bn', GOLD)} rates={rates.value} title="t" />)
    await waitFor(() => expect((document.getElementById('gold-price') as HTMLInputElement).value).toBe('২,১৭,৭৬৭'))
    fireEvent.input(document.getElementById('gold-price')!, { target: { value: '200000' } })
    await waitFor(() => expect(window.location.search).toBe('?k=21&p=200000'))
    fireEvent.click(screen.getByRole('button', { name: '২২' }))
    await waitFor(() => expect(window.location.search).toBe(''))
  })
})
