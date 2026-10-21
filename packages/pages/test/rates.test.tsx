// Income tax, Sanchayapatra, currency converter and data pack (phase 3d) against the Figma example
// values. Where Figma and the engine disagree, the engine wins and the test says so.
import type { CurrencyRatesFile, DataPacksFile, IncomeTaxFile, SanchayapatraFile } from '@hisab/data/types'
import { checkDataFile } from '@hisab/data/checks'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import currencyJson from '../../../data/finance/currency-rates.json' with { type: 'json' }
import sanchayJson from '../../../data/finance/sanchayapatra.json' with { type: 'json' }
import packsJson from '../../../data/data-packs.json' with { type: 'json' }
import taxJson from '../../../data/income-tax-2026-27.json' with { type: 'json' }
import { CurrencyCalculator } from '../src/currency-converter/CurrencyCalculator.tsx'
import { currencyContent } from '../src/currency-converter/content.ts'
import { COPY as CUR } from '../src/currency-converter/copy.ts'
import { currencyCallout, currencyOptions, currencyOutcome } from '../src/currency-converter/model.ts'
import { CURRENCY_PARAMS } from '../src/currency-converter/params.ts'
import { allPacks, dataPackContent } from '../src/data-pack/content.ts'
import { COPY as PACK } from '../src/data-pack/copy.ts'
import { dataPackOutcome } from '../src/data-pack/model.ts'
import { DATA_PACK_PARAMS } from '../src/data-pack/params.ts'
import { incomeTaxContent } from '../src/income-tax/content.ts'
import { COPY as TAX } from '../src/income-tax/copy.ts'
import { incomeTaxCallout, incomeTaxOutcome } from '../src/income-tax/model.ts'
import { CATEGORY_CHIPS, TAX_AREA } from '../src/income-tax/params.ts'
import { sanchayapatraContent } from '../src/sanchayapatra/content.ts'
import { COPY as SP } from '../src/sanchayapatra/copy.ts'
import { pickerFooter, rateRows, sanchayapatraOutcome, schemeOptions } from '../src/sanchayapatra/model.ts'
import { SANCHAYAPATRA_PARAMS } from '../src/sanchayapatra/params.ts'
import { islandText } from '../src/tool/island-text.ts'
import { localize } from '../src/tool/text.ts'

const taxFile = taxJson as unknown as IncomeTaxFile
const spFile = sanchayJson as unknown as SanchayapatraFile
const curFile = currencyJson as unknown as CurrencyRatesFile
const packFile = packsJson as unknown as DataPacksFile

function result<T>(o: { kind: string; result?: T }): T {
  if (o.kind !== 'result') throw new Error(`expected a result, got ${o.kind}`)
  return o.result as T
}

describe('data these pages use', () => {
  it('is valid, and the link enums match it', () => {
    expect(checkDataFile('income-tax-2026-27.json', taxFile)).toEqual([])
    expect(checkDataFile('finance/sanchayapatra.json', spFile)).toEqual([])
    expect(checkDataFile('finance/currency-rates.json', curFile)).toEqual([])
    expect(checkDataFile('data-packs.json', packFile)).toEqual([])
    for (const c of CATEGORY_CHIPS) expect(Object.hasOwn(taxFile.value.thresholds, c)).toBe(true)
    expect(Object.hasOwn(taxFile.value.minimumTax, TAX_AREA)).toBe(true)
    expect([...SANCHAYAPATRA_PARAMS.scheme.values].sort()).toEqual(spFile.value.map((s) => s.id).sort())
    expect(DATA_PACK_PARAMS.op.values.slice(1)).toEqual(packFile.operators.map((o) => o.id))
    // Every currency on the sheet is reachable from the picker; MYR is the one Figma chip without a rate.
    const codes = curFile.value.rates.map((r) => r.code)
    expect(CURRENCY_PARAMS.cur.values.filter((c) => !codes.includes(c))).toEqual(['MYR'])
  })
})

describe('Income tax (Figma C6, C6-b)', () => {
  const copy = localize(TAX, 'bn')
  const run = (mode: 'salaried' | 'freelancer', income: number | null = 900000, category: 'general' | 'womenOrSenior' | 'disabled' = 'general') =>
    incomeTaxOutcome({ lang: 'bn', copy, mode, income, category, investment: 100000, rules: taxFile.value })

  it('C6 ৳৯,০০,০০০, সাধারণ, ৳১,০০,০০০ invested → ৳৪৫,০০০', () => {
    const r = result(run('salaried'))
    expect([r.label, r.value, r.sub]).toEqual(['আনুমানিক কর', 45000, 'স্ল্যাবে ৳৬০,০০০ − বিনিয়োগ রিবেট ৳১৫,০০০ · ন্যূনতম কর ৳৫,০০০'])
    expect(r.tableTitle).toBe('স্ল্যাব অনুযায়ী (সাধারণ করদাতা)')
    expect(r.rows).toEqual([
      { step: 'প্রথম ৪,০০,০০০', rate: '০%', tax: 0 },
      { step: 'পরের ৩,০০,০০০', rate: '১০%', tax: 30000 },
      { step: 'পরের ২,০০,০০০', rate: '১৫%', tax: 30000 },
    ])
    expect(incomeTaxCallout('bn', copy, 'salaried', taxFile.value)).toBe(
      'নারী ও ৬৫+ বয়সীদের করমুক্ত সীমা ৪,২৫,০০০, প্রতিবন্ধী ৫,০০,০০০। ফ্রিল্যান্সারদের আয় করমুক্ত করার প্রস্তাব বাজেট ২০২৬-২৭ এ এসেছে, চূড়ান্ত অবস্থা NBR থেকে মিলিয়ে নাও।',
    )
  })

  it('C6-b freelancer: ৳৪৫,০০০ on the ordinary slabs, ৳০ with the exemption in data', () => {
    const r = result(run('freelancer'))
    expect([r.label, r.value, r.sub]).toEqual(['আনুমানিক কর (সাধারণ স্ল্যাবে)', 45000, 'ফ্রিল্যান্সার কর-ছাড়ের প্রস্তাব পাস হলে ৳০'])
    expect(incomeTaxCallout('bn', copy, 'freelancer', taxFile.value)).toContain('ব্যাংকিং চ্যানেলে আনতে হয়')
  })

  it('under the limit, another category, empty; verified line pending', () => {
    const free = result(run('salaried', 300000))
    expect([free.value, free.sub]).toEqual([0, 'করমুক্ত সীমার মধ্যে, কর দিতে হবে না'])
    expect(result(run('salaried', 900000, 'disabled')).rows[0]!.step).toBe('প্রথম ৫,০০,০০০')
    expect(run('salaried', null).kind).toBe('empty')
    expect(incomeTaxContent('bn', taxFile).data?.verified).toBe(false)
  })
})

describe('Sanchayapatra (Figma C7, P7)', () => {
  const copy = localize(SP, 'bn')
  const schemes = spFile.value
  it('পরিবার ৫ লাখ → মাসিক মুনাফা ৳৪,৯৭১; engine tax 5% (NBR slab in data) → হাতে ৳৪,৭২২ (Figma flat 10% → ৳৪,৪৭৪)', () => {
    const r = result(sanchayapatraOutcome({ lang: 'bn', copy, schemes, scheme: 'paribar', amount: 500000 }))
    expect(r.label).toBe('মাসিক মুনাফা')
    expect(Math.round(r.value)).toBe(4971)
    expect(r.decimals).toBe(0)
    expect(r.sub).toBe('৫ লাখ ১১.৯৩% হারে · ৫% অগ্রিম কর কাটলে হাতে ৳৪,৭২২')
  })
  it('rate table and P7 from data; other schemes; limits with a fix', () => {
    expect(rateRows('bn', copy, schemes, 'paribar')).toEqual([
      { step: '৭.৫ লাখ পর্যন্ত (পরিবার)', rate: '১১.৯৩%' },
      { step: '৭.৫ লাখ এর বেশি (পরিবার)', rate: '১১.৮%' },
      { step: 'অন্য স্কিম (মেয়াদ অনুযায়ী)', rate: '১১.৮% – ১১.৯৩%' },
    ])
    expect(pickerFooter('bn', copy, schemes)).toBe('হার: ১১.৮% – ১১.৯৩%, জমার পরিমাণ অনুযায়ী ধাপে ধাপে।')
    expect(schemeOptions('bn', copy, schemes)[0]).toEqual({ value: 'paribar', label: 'পরিবার সঞ্চয়পত্র', description: '৫ বছর · মাসিক মুনাফা · নারী, প্রতিবন্ধী ও ৬৫+' })
    expect(schemeOptions('en', localize(SP, 'en'), schemes)[0]!.label).toBe('Paribar Sanchayapatra')
    expect(result(sanchayapatraOutcome({ lang: 'bn', copy, schemes, scheme: 'three-month', amount: 200000 })).label).toBe('৩ মাস পরপর মুনাফা')
    const end = result(sanchayapatraOutcome({ lang: 'bn', copy, schemes, scheme: 'bangladesh-5y', amount: 100000 }))
    expect([end.label, end.value]).toEqual(['মেয়াদ শেষে মুনাফা', 59650])
    // Pensioner (seeded from the engine test fixture): 0% tax up to 5 lakh.
    expect(result(sanchayapatraOutcome({ lang: 'bn', copy, schemes, scheme: 'pensioner', amount: 500000 })).sub).toContain('০% অগ্রিম কর')
    const low = sanchayapatraOutcome({ lang: 'bn', copy, schemes, scheme: 'paribar', amount: 5000 })
    expect(low.kind === 'error' && low.error.fix).toEqual({ label: '৳১০,০০০ দিয়ে হিসাব করো', field: 'amount', value: 10000 })
    expect(sanchayapatraContent('bn', spFile).data?.verified).toBe(false)
  })
})

describe('Currency converter (Figma F11, P8)', () => {
  const copy = localize(CUR, 'bn')
  const sheet = curFile.value
  it('১,০০০ SAR → ৳৩২,৬৪১ at DBBL TT; other currencies from the sheet', () => {
    const r = result(currencyOutcome({ lang: 'bn', copy, sheet, code: 'SAR', amount: 1000 }))
    expect([r.label, r.value, r.sub]).toEqual(['টাকায় পাবে', 32641, 'ডাচ-বাংলা ব্যাংক TT ক্রয় হার: ১ SAR = ৳৩২.৬৪ · ১৮ অক্টোবর ২০২৬'])
    expect(r.tableTitle).toBe('অন্য মুদ্রায় ১,০০০')
    // Figma lists AED, USD, GBP; the sheet also has EUR.
    expect(r.rows).toEqual([
      { code: 'AED', bdt: 33353 },
      { code: 'USD', bdt: 122500 },
      { code: 'GBP', bdt: 163268 },
      { code: 'EUR', bdt: 137680 },
    ])
    expect(currencyCallout('bn', copy, sheet)).toBe('ব্যাংক ভেদে রেট আলাদা। এখানে ডাচ-বাংলা ব্যাংকের TT ক্লিন ক্রয় হার দেখানো, প্রতিদিন আপডেট হবে।')
  })
  it('P8 options; MYR has no rate (error, disabled option); English', () => {
    const options = currencyOptions('bn', copy, sheet)
    expect(options.map((o) => [o.label, o.description, !!o.disabled])).toEqual([
      ['সৌদি রিয়াল · SAR', '১ SAR = ৳৩২.৬৪', false],
      ['আমিরাতি দিরহাম · AED', '১ AED = ৳৩৩.৩৫', false],
      ['মার্কিন ডলার · USD', '১ USD = ৳১২২.৫০', false],
      ['মালয়েশিয়ান রিংগিত · MYR', 'ব্যাংকের তালিকায় নেই, অন্য সূত্র যোগ হলে আসবে', true],
      ['ব্রিটিশ পাউন্ড · GBP', '১ GBP = ৳১৬৩.২৭', false],
      ['ইউরো · EUR', '১ EUR = ৳১৩৭.৬৮', false],
    ])
    const myr = currencyOutcome({ lang: 'bn', copy, sheet, code: 'MYR', amount: 1000 })
    expect(myr.kind === 'error' && myr.error.body).toBe('ব্যাংকের তালিকায় নেই, অন্য সূত্র যোগ হলে আসবে')
    expect(result(currencyOutcome({ lang: 'en', copy: localize(CUR, 'en'), sheet, code: 'SAR', amount: 1000 })).sub).toBe(
      'Dutch-Bangla Bank TT buying rate: 1 SAR = ৳32.64 · 18 October 2026',
    )
    expect(currencyContent('bn', curFile).data?.verified).toBe(false)
  })
})

describe('Mobile data pack (Figma C8)', () => {
  const copy = localize(PACK, 'bn')
  const run = (budget: number, days = 30, op: 'all' | 'gp' | 'robi' = 'all') =>
    dataPackOutcome({ lang: 'bn', copy, operators: packFile.operators, packs: allPacks(packFile), budget, days, op })
  it('৳৪০০, ৩০ দিন, সব → জিপি ৩০ GB; the other three are "শীঘ্রই"', () => {
    const r = result(run(400))
    expect([r.label, r.value, r.sub]).toEqual(['৳৪০০ এ সবচেয়ে বেশি ডেটা', 30, 'জিপি · ৳৩৯৯ · ৩০ দিন (দিনে ১ GB)'])
    expect(r.tableTitle).toBe('৳৪০০ বা কমে ৩০ দিনের প্যাক')
    expect(r.rows).toEqual([
      { operator: 'জিপি', data: '৩০ GB', price: '৩৯৯' },
      { operator: 'জিপি', data: '১০ GB', price: '৩০৮' },
      { operator: 'জিপি', data: '১ GB', price: '১৪৩' },
      { operator: 'রবি, বাংলালিংক, টেলিটক', data: 'শীঘ্রই', price: '—' },
    ])
  })
  it('nothing in budget: error with the cheapest pack as the fix; one operator without packs', () => {
    const none = run(50)
    expect(none.kind === 'error' && none.error.fix).toEqual({ label: '৳১৪৩ দিয়ে হিসাব করো', field: 'budget', value: 143 })
    expect(run(400, 30, 'robi').kind).toBe('error')
    expect(result(run(400, 7, 'gp')).value).toBe(5)
    expect(dataPackContent('bn', packFile).data?.verified).toBe(false)
  })
})

describe('CurrencyCalculator island', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/tools/currency-converter')
  })
  it('a shared link restores the currency; a chip writes the URL', async () => {
    window.history.replaceState(null, '', '/tools/currency-converter?cur=USD&amount=500')
    render(<CurrencyCalculator lang="bn" text={islandText('bn', CUR)} sheet={curFile.value} title="t" />)
    await waitFor(() => expect(screen.getByLabelText('পরিমাণ')).toHaveProperty('value', '৫০০'))
    await waitFor(() => expect(document.querySelector('[data-result-card]')?.textContent).toContain('৬১,২৫০'))
    fireEvent.click(screen.getByRole('button', { name: 'AED' }))
    await waitFor(() => expect(window.location.search).toBe('?cur=AED&amount=500'))
  })
})

describe('PickerField (P7, P8)', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/tools/currency-converter')
  })
  it('opens the sheet on tap, lists the options and picks one; a disabled one cannot be picked', async () => {
    window.history.replaceState(null, '', '/tools/currency-converter')
    render(<CurrencyCalculator lang="bn" text={islandText('bn', CUR)} sheet={curFile.value} title="t" />)
    fireEvent.click(document.getElementById('currency-code')!)
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'কোন মুদ্রা?' })).toBeTruthy())
    fireEvent.click(screen.getByText('মালয়েশিয়ান রিংগিত · MYR'))
    expect(window.location.search).toBe('')
    fireEvent.click(screen.getByText('মার্কিন ডলার · USD'))
    await waitFor(() => expect(window.location.search).toBe('?cur=USD'))
  })
})
