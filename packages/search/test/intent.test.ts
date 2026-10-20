import { describe, expect, it } from 'vitest'
import { calculateEmi } from '@hisab/core/emi'
import { answer, intentLink, intentParams, parseIntent, type AnswerData, type Intent } from '../src/intent.ts'
import { answerData, today } from './fixtures.ts'

const card = (query: string, lang: 'bn' | 'en' = 'bn') => {
  const intent = parseIntent(query)
  expect(intent, query).not.toBeNull()
  return answer(intent!, answerData, { lang, today })
}

describe('parseIntent', () => {
  it.each([
    ['bkash cash out 5000', { service: 'cashOut', amount: 5000, provider: 'bkash' }],
    ['বিকাশ ক্যাশআউট ৫০০০', { service: 'cashOut', amount: 5000, provider: 'bkash' }],
    ['bikash 5k', { service: 'cashOut', amount: 5000, provider: 'bkash' }],
    ['bkash 5,000tk', { service: 'cashOut', amount: 5000, provider: 'bkash' }],
    ['৳৫০০০ বিকাশ', { service: 'cashOut', amount: 5000, provider: 'bkash' }],
    ['rocket ১.৫ হাজার', { service: 'cashOut', amount: 1500, provider: 'rocket' }],
  ])('reads %s as a cash out', (query, params) => {
    expect(parseIntent(query)).toEqual({ kind: 'mfs', toolId: 'cash-out', params })
  })

  it('reads send money', () => {
    expect(parseIntent('nagad send money 2000')).toEqual({
      kind: 'mfs',
      toolId: 'send-money',
      params: { service: 'sendMoney', amount: 2000, provider: 'nagad' },
    })
  })

  it('reads a cash out with no provider as a comparison', () => {
    expect(parseIntent('cash out 10000')?.params).toEqual({ service: 'cashOut', amount: 10000 })
  })

  it('reads an EMI with lakh, percent and years', () => {
    expect(parseIntent('emi 5 lakh 12% 3 years')).toEqual({
      kind: 'emi',
      toolId: 'emi',
      params: { principal: 500000, ratePct: 12, months: 36 },
    })
    expect(parseIntent('ইএমআই ৫০০০০০ টাকা ১২ পার্সেন্ট ৩৬ মাস')?.params).toEqual({ principal: 500000, ratePct: 12, months: 36 })
  })

  it('keeps a partial EMI so the link can prefill what was given', () => {
    expect(parseIntent('emi 5 lakh')?.params).toEqual({ principal: 500000 })
  })

  it('reads land conversions', () => {
    expect(parseIntent('১ শতাংশ কত বর্গফুট')).toEqual({
      kind: 'land',
      toolId: 'land-converter',
      params: { value: 1, from: 'decimal', to: 'sqft' },
    })
    expect(parseIntent('3 kotha')?.params).toEqual({ value: 3, from: 'katha' })
  })

  it('reads gold weights, karat and the unit asked for', () => {
    expect(parseIntent('gold 2 vori')).toEqual({ kind: 'gold', toolId: 'gold-converter', params: { vori: 2, metal: 'gold' } })
    expect(parseIntent('২ ভরি ৪ আনা ২১ ক্যারেট সোনা')?.params).toEqual({ vori: 2, ana: 4, metal: 'gold', karat: '21K' })
    expect(parseIntent('1 vori koto gram')?.params).toEqual({ vori: 1, metal: 'gold', to: 'gram' })
  })

  it('does not read grams alone as gold', () => {
    expect(parseIntent('500 gram')).toBeNull()
  })

  it('reads birth dates in ISO, day-first and written forms', () => {
    for (const q of ['age 1995-03-12', 'বয়স ১২/০৩/১৯৯৫', 'boyos 12.03.1995', 'age 12 march 1995', 'জন্ম তারিখ ১২ মার্চ ১৯৯৫']) {
      expect(parseIntent(q), q).toEqual({ kind: 'age', toolId: 'age', params: { birth: '1995-03-12' } })
    }
  })

  it('rejects impossible dates', () => {
    expect(parseIntent('age 1995-02-30')).toBeNull()
  })

  it('reads VAT, percent, discount, words and currency', () => {
    expect(parseIntent('vat 1000')?.params).toEqual({ amount: 1000, mode: 'add' })
    expect(parseIntent('1150 vat bad')?.params).toEqual({ amount: 1150, mode: 'remove' })
    expect(parseIntent('20% of 5000')?.params).toEqual({ value: 5000, pct: 20 })
    expect(parseIntent('5000 টাকায় ১০% ছাড়')?.params).toEqual({ price: 5000, discount: 10 })
    expect(parseIntent('১২৫০০ কথায়')?.params).toEqual({ amount: 12500 })
    expect(parseIntent('100 dollar')?.params).toEqual({ amount: 100, code: 'USD', direction: 'toBdt' })
    expect(parseIntent('6000 taka to riyal')?.params).toEqual({ amount: 6000, code: 'SAR', direction: 'fromBdt' })
  })

  it('leaves ordinary searches alone', () => {
    for (const q of ['bkash cash out', 'emi calculator', 'bkash helpline 16247', 'ssc 2025 result', '']) {
      expect(parseIntent(q), q).toBeNull()
    }
  })
})

describe('answer', () => {
  it('fills the bKash cash out card as the Figma Answer Card does: Priyo Agent first, the other agent below', () => {
    // Figma 7:302: "বিকাশে ৫,০০০ টাকা ক্যাশ আউট" → ৳৬৯.৭৫, "প্রিয় এজেন্ট · অন্য এজেন্টে ৳৯২.৫০".
    const c = card('bkash cash out 5000')!
    expect(c.title).toBe('বিকাশ, নগদ, রকেট ক্যাশ আউট চার্জ')
    expect(c.question).toBe('বিকাশে ৫,০০০ টাকা ক্যাশ আউট')
    expect(c.main).toEqual({ label: 'বিকাশ প্রিয় এজেন্ট ক্যাশ আউট চার্জ', value: '৳৬৯.৭৫' })
    expect(c.lines).toEqual([
      { label: 'মোট লাগবে', value: '৳৫,০৬৯.৭৫' },
      { label: 'প্রতি হাজারে', value: '৳১৩.৯৫' },
      { label: 'এজেন্ট থেকে', value: '৳৯২.৫০' },
      { label: 'এটিএম থেকে', value: '৳৭৪.৫০' },
    ])
    expect(c.link).toBe('/tools/cash-out?service=cashOut&amount=5000&provider=bkash')
  })

  it('gives the same card for Bangla digits and for 5k', () => {
    expect(card('বিকাশ ক্যাশআউট ৫০০০')!.main).toEqual(card('bikash 5k')!.main)
  })

  it('writes the card in English on /en with English digits', () => {
    const c = card('bkash cash out 5000', 'en')!
    expect(c.main).toEqual({ label: 'bKash cash out charge (Priyo Agent)', value: '৳69.75' })
    expect(c.question).toBe('bKash cash out of ৳5,000')
    expect(c.link).toBe('/en/tools/cash-out?service=cashOut&amount=5000&provider=bkash')
  })

  it('compares every provider when none is named', () => {
    const c = card('cash out 10000')!
    expect(c.main.label).toBe('সবচেয়ে কম চার্জ: নগদ অ্যাপ')
    expect(c.main.value).toBe('৳১২৯.৯০')
    expect(c.lines[0]).toEqual({ label: 'নগদ অ্যাপ', value: '৳১২৯.৯০' })
  })

  it('notes a cash out over the daily limit', () => {
    expect(card('bkash cash out 40000')!.note).toBe('এই পরিমাণ সীমার বাইরে; সর্বোচ্চ ৳৩০,০০০')
  })

  it('shows send money charges', () => {
    expect(card('bkash send money 1000')!.main.value).toBe('৳৫')
    expect(card('nagad send money 2000')!.main.value).toBe('৳০')
  })

  it('computes the EMI with @hisab/core', () => {
    const c = card('emi 5 lakh 12% 3 years')!
    const emi = calculateEmi({ principal: 500000, annualRatePct: 12, months: 36 })
    expect(c.main).toEqual({ label: 'মাসিক কিস্তি', value: '৳১৬,৬০৭.১৫' })
    expect(emi.emi).toBe(16607.15)
    expect(c.link).toBe('/tools/emi?principal=500000&ratePct=12&months=36')
  })

  it('converts land', () => {
    const c = card('১ শতাংশ কত বর্গফুট')!
    expect(c.main).toEqual({ label: '১ শতাংশ =', value: '৪৩৫.৬ বর্গফুট' })
    expect(c.link).toBe('/tools/land-converter?value=1&from=decimal&to=sqft')
  })

  it('prices gold at the 22K rate unless a karat is given', () => {
    expect(card('gold 2 vori')!.main).toEqual({ label: '২ ভরি সোনা (22K)', value: '৳২,৮০,০০০' })
    expect(card('gold 2 vori 21k')!.main.value).toBe('৳২,৬৬,০০০')
    expect(card('1 vori koto gram')!.main).toEqual({ label: '১ ভরি =', value: '১১.৬৬ গ্রাম' })
  })

  it('weighs gold without a price when none is passed', () => {
    const intent = parseIntent('gold 2 vori')!
    expect(answer(intent, {}, { today })!.main).toEqual({ label: '২ ভরি =', value: '২৩.৩৩ গ্রাম' })
  })

  it('measures age on the given day', () => {
    const c = card('age 1995-03-12')!
    expect(c.main.value).toBe('৩১ বছর ৭ মাস ৮ দিন')
    expect(c.lines.find((l) => l.label === 'জন্মের বার')?.value).toBe('রবিবার')
    expect(c.link).toBe('/tools/age?birth=1995-03-12')
  })

  it('adds or removes VAT, assuming the standard rate from data when none is typed', () => {
    const add = card('vat 1000')!
    expect(add.main.value).toBe('৳১,১৫০')
    expect(add.note).toBe('সাধারণ হার ১৫% ধরে')
    expect(card('1150 vat bad')!.main).toEqual({ label: 'VAT ছাড়া দাম', value: '৳১,০০০' })
    expect(answer(parseIntent('vat 1000')!, {}, { today })).toBeNull()
  })

  it('answers percent, discount, words and currency', () => {
    expect(card('20% of 5000')!.main.value).toBe('১,০০০')
    expect(card('1000 taka 20% discount')!.main.value).toBe('৳৮০০')
    expect(card('5000 in words')!.main.value).toBe('পাঁচ হাজার টাকা মাত্র')
    expect(card('5000 in words', 'en')!.main.value).toBe('Five Thousand Taka Only')
    expect(card('100 usd')!.main.value).toBe('৳১২,০০০')
    expect(card('6100 taka to dollar', 'en')!.main.value).toBe('50 USD')
  })

  it('returns null when the engine cannot answer', () => {
    expect(card('emi 5 lakh')).toBeNull()
    expect(answer(parseIntent('bkash cash out 5000')!, {}, { today })).toBeNull()
    expect(card('age 2030-01-01')).toBeNull()
  })
})

describe('intentLink / intentParams', () => {
  it('round-trips the inputs through the query string', () => {
    const intent = parseIntent('2 vori 4 ana sona 22k') as Intent
    const link = intentLink(intent)
    expect(link).toBe('/tools/gold-converter?vori=2&ana=4&metal=gold&karat=22K')
    expect(intentParams(link.split('?')[1]!)).toEqual({ vori: '2', ana: '4', metal: 'gold', karat: '22K' })
  })
})

describe('review: false positives, hostile data and Figma examples', () => {
  it('never reads a phone number or a leading-zero code as an amount', () => {
    expect(parseIntent('bkash 01712345678')).toBeNull()
    expect(parseIntent('বিকাশ ০১৭১২৩৪৫৬৭৮')).toBeNull()
    expect(parseIntent('nagad cash out 017')).toBeNull()
    // A decimal below 1 is still a number.
    expect(parseIntent('0.5 vori gold')?.params).toMatchObject({ vori: 0.5 })
  })

  it('reads a bare "send" or "পাঠাবো" as send money, not cash out', () => {
    for (const q of ['bkash send 1000', 'nagad 2000 send', 'বিকাশে ১০০০ টাকা পাঠাবো', 'rocket e 500 pathabo']) {
      expect(parseIntent(q), q).toMatchObject({ kind: 'mfs', toolId: 'send-money', params: { service: 'sendMoney' } })
    }
  })

  it('compares every provider when the query names two', () => {
    expect(parseIntent('bkash cash out 5000 nagad')).toEqual({
      kind: 'mfs',
      toolId: 'cash-out',
      params: { service: 'cashOut', amount: 5000 },
    })
    // Two brands and a bare number, with no service, is a comparison search.
    expect(parseIntent('bkash nagad 5000')).toBeNull()
  })

  it('adds up a term given in years and months', () => {
    expect(parseIntent('emi 5 lakh 12% 3 years 6 months')?.params).toEqual({ principal: 500000, ratePct: 12, months: 42 })
    expect(parseIntent('ইএমআই ২ লাখ ১০% ১ বছর ৩ মাস')?.params).toEqual({ principal: 200000, ratePct: 10, months: 15 })
  })

  it('ignores a query too long to be a direct question', () => {
    expect(parseIntent('bkash cash out 5000 ' + 'x'.repeat(300))).toBeNull()
  })

  it('restates the query as the card heading, as the Figma Answer Card examples do', () => {
    expect(card('emi 5 lakh 12% 3 years')!.question).toBe('৫,০০,০০০ টাকা ১২% সুদে ৩ বছরের লোনের মাসিক কিস্তি')
    expect(card('emi 5 lakh 12% 3 years')!.main.value).toBe('৳১৬,৬০৭.১৫')
    const land = card('১ শতাংশ কত বর্গফুট')!
    expect(land.question).toBe('১ শতাংশ কত বর্গফুট')
    expect(land.main.value).toBe('৪৩৫.৬ বর্গফুট')
    const nagad = card('nagad cash out 5000')!
    expect(nagad.question).toBe('নগদে ৫,০০০ টাকা ক্যাশ আউট')
    expect(nagad.main.value).toBe('৳৬৪.৯৫')
    expect(card('100 dollar', 'en')!.question).toBe('100 USD in taka')
  })

  it('checks the engines against hand-computed answers', () => {
    // 2 ভরি 4 আনা = 2.25 ভরি × ৳1,40,000.
    expect(card('২ ভরি ৪ আনা সোনার দাম', 'en')!.main.value).toBe('৳3,15,000')
    // 5 কাঠা = 5 × 720 = 3,600 sq ft = 0.25 বিঘা (20 কাঠা).
    expect(card('5 katha to bigha', 'en')!.main.value).toBe('0.25 bigha')
    // 1,150 with 15% VAT inside: 1,150 / 1.15 = 1,000.
    expect(card('vat 1150 bad', 'en')!.main.value).toBe('৳1,000')
    // ৳5,000 at the ৳122 selling rate.
    expect(card('5000 taka to dollar', 'en')!.main.value).toBe('40.98 USD')
  })

  it('returns no card for synced data that is schema-valid but absurd', () => {
    const run = (q: string, data: AnswerData) => answer(parseIntent(q)!, data, { lang: 'en', today })
    for (const v of [Infinity, Number.NaN, -1, 0]) {
      expect(run('100 dollar', { currencyRates: [{ code: 'USD', buy: v, sell: v }] }), `rate ${v}`).toBeNull()
      expect(run('5000 taka to dollar', { currencyRates: [{ code: 'USD', buy: 120, sell: v }] }), `sell ${v}`).toBeNull()
    }
    for (const v of [Infinity, Number.NaN, -1, 0]) {
      // No usable price: the card falls back to the weight in grams instead of a ৳ value.
      const c = run('gold 2 vori', { goldPricePerVori: { '22K': v } })!
      expect(c.main.value, `price ${v}`).toBe('23.33 g')
    }
    // A karat the sheet does not have is not priced from Object.prototype.
    expect(run('18k gold 2 vori', { goldPricePerVori: { '22K': 140000 } })!.main.value).toBe('23.33 g')
    expect(run('gold 2 vori', { goldPricePerVori: { toString: 0 } as never })!.main.value).toBe('23.33 g')
    for (const v of [Infinity, Number.NaN, -15, 1e9]) expect(run('vat 1000', { vatRatePct: v }), `vat ${v}`).toBeNull()
    const badBand = { ...answerData.mfsChannels![0]!, bands: [{ from: 0, per1000: Number.NaN }] }
    expect(run('bkash cash out 5000', { mfsChannels: [badBand] })).toBeNull()
  })
})
