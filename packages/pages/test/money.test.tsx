// VAT, discount and percentage, profit margin and salary (phase 3d) against the Figma example
// values. Where Figma and the engine disagree, the engine wins and the test says so.
import type { SalaryPresetsFile, VatRatesFile } from '@hisab/data/types'
import { checkDataFile } from '@hisab/data/checks'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import salaryJson from '../../../data/finance/salary-presets.json' with { type: 'json' }
import vatJson from '../../../data/commerce/vat-rates.json' with { type: 'json' }
import { discountContent } from '../src/discount-percentage/content.ts'
import { COPY as DISCOUNT } from '../src/discount-percentage/copy.ts'
import { discountOutcome, percentOfLine } from '../src/discount-percentage/model.ts'
import { profitContent } from '../src/profit-margin/content.ts'
import { COPY as PROFIT } from '../src/profit-margin/copy.ts'
import { profitOutcome, targetPrice } from '../src/profit-margin/model.ts'
import { salaryContent, salaryPreset, salaryRest } from '../src/salary/content.ts'
import { COPY as SALARY } from '../src/salary/copy.ts'
import { salaryOutcome } from '../src/salary/model.ts'
import { SALARY_PARAMS } from '../src/salary/params.ts'
import { islandText } from '../src/tool/island-text.ts'
import { localize } from '../src/tool/text.ts'
import { VatCalculator } from '../src/vat/VatCalculator.tsx'
import { vatContent, vatRateChips } from '../src/vat/content.ts'
import { COPY as VAT } from '../src/vat/copy.ts'
import { vatCallout, vatOutcome } from '../src/vat/model.ts'
import { VAT_PARAMS } from '../src/vat/params.ts'

const vatFile = vatJson as unknown as VatRatesFile
const salaryFile = salaryJson as unknown as SalaryPresetsFile
const rows = (summary: { label: string; value: string }[]) => summary.map((r) => [r.label, r.value])

function result<T>(o: { kind: string; result?: T }): T {
  if (o.kind !== 'result') throw new Error(`expected a result, got ${o.kind}`)
  return o.result as T
}

describe('data these pages use', () => {
  it('is valid, and the link defaults match it', () => {
    expect(checkDataFile('commerce/vat-rates.json', vatFile)).toEqual([])
    expect(checkDataFile('finance/salary-presets.json', salaryFile)).toEqual([])
    expect(VAT_PARAMS.rate.default).toBe(vatFile.defaultPct.value)
    expect(vatRateChips(vatFile)).toEqual([5, 7.5, 10, 15])
    const preset = salaryPreset(salaryFile)
    expect(SALARY_PARAMS.basic.default).toBe(preset.basicPctOfGross)
    expect(SALARY_PARAMS.rent.default).toBe(preset.houseRentPctOfBasic)
  })
})

describe('VAT (Figma C1, C4-b)', () => {
  const run = (mode: 'add' | 'remove', amount: number | null, rate: number | null = 15, lang: 'bn' | 'en' = 'bn') =>
    vatOutcome({ lang, copy: localize(VAT, lang), mode, amount, rate })

  it('C1 add: ৳১,০০০ + 15% → ৳১,১৫০', () => {
    const r = result(run('add', 1000))
    expect([r.label, r.value, r.sub]).toEqual(['VAT সহ মোট দাম', 1150, 'VAT ১৫% = ৳১৫০'])
    expect(rows(r.summary)).toEqual([
      ['মূল দাম', '৳১,০০০'],
      ['VAT (১৫%)', '৳১৫০'],
      ['মোট', '৳১,১৫০'],
    ])
  })

  it('C4-b remove: ৳১,১৫০ with 15% → ৳১,০০০, VAT ৳১৫০', () => {
    const r = result(run('remove', 1150))
    expect([r.label, r.value, r.sub]).toEqual(['মূল দাম (VAT ছাড়া)', 1000, 'VAT ১৫% = ৳১৫০ · ১,১৫০ ÷ ১.১৫'])
    expect(rows(r.summary)).toEqual([
      ['VAT সহ দাম', '৳১,১৫০'],
      ['VAT (১৫%)', '− ৳১৫০'],
      ['মূল দাম', '৳১,০০০'],
    ])
  })

  it('callout example from the engine; paisa shown when there are any; English; empty and out of range', () => {
    expect(vatCallout('bn', localize(VAT, 'bn'), 15)).toBe('VAT বাদ দিতে: VAT সহ দাম ÷ ১.১৫। যেমন ১,১৫০ ÷ ১.১৫ = ১,০০০ টাকা।')
    expect(vatCallout('bn', localize(VAT, 'bn'), 7.5)).toContain('÷ ১.০৭৫')
    const paisa = result(run('add', 999))
    expect(paisa.decimals).toBe(2)
    expect(paisa.sub).toBe('VAT ১৫% = ৳১৪৯.৮৫')
    expect(result(run('add', 1000, 15, 'en')).summary[2]!.value).toBe('৳1,150')
    expect(run('add', null).kind).toBe('empty')
    expect(run('add', 1000, 120).fields).toEqual({ rate: 'সর্বোচ্চ ১০০ লেখা যাবে' })
  })

  it('page content: verified line pending (seed data), Figma FAQ', () => {
    const c = vatContent('bn', vatFile)
    expect(c.title).toBe('VAT ক্যালকুলেটর')
    expect(c.data?.verified).toBe(false)
    expect(c.faq?.items.map((f) => f.question)).toEqual(['VAT সহ দাম থেকে VAT কিভাবে বের করবো?'])
  })
})

describe('Discount and percentage (Figma C2)', () => {
  const copy = localize(DISCOUNT, 'bn')
  it('৳২,৫০০ with 20% off → ৳২,০০০, saves ৳৫০০; ১৫% of ৫,০০০ = ৳৭৫০', () => {
    const r = result(discountOutcome({ lang: 'bn', copy, price: 2500, off: 20 }))
    expect([r.label, r.value, r.sub]).toEqual(['দিতে হবে', 2000, 'বাঁচলো ৳৫০০ (২০%)'])
    expect(percentOfLine('bn', copy, 5000, 15)).toEqual({ label: '৫,০০০ এর ১৫%', value: '৳৭৫০' })
  })
  it('over 100% is a field error; an empty field is a dash; no data, no FAQ', () => {
    expect(discountOutcome({ lang: 'bn', copy, price: 2500, off: 120 }).fields).toEqual({ off: 'সর্বোচ্চ ১০০ লেখা যাবে' })
    expect(percentOfLine('bn', copy, null, 15).value).toBe('—')
    expect(percentOfLine('en', localize(DISCOUNT, 'en'), 5000, 15)).toEqual({ label: '15% of 5,000', value: '৳750' })
    const c = discountContent('bn')
    expect([c.data, c.faq]).toEqual([undefined, undefined])
  })
})

describe('Profit margin (Figma C3)', () => {
  const copy = localize(PROFIT, 'bn')
  it('৳৮০০ → ৳১,০০০: ৳২০০ profit, 20% margin, 25% markup; 30% target → ৳১,১৪৩', () => {
    const r = result(profitOutcome({ lang: 'bn', copy, cost: 800, price: 1000 }))
    expect([r.label, r.value, r.sub]).toEqual(['লাভ', 200, 'মার্জিন ২০% · মার্কআপ ২৫%'])
    expect(rows(r.summary)).toEqual([
      ['লাভ', '৳২০০'],
      ['মার্জিন (লাভ ÷ বেচার দাম)', '২০%'],
      ['মার্কআপ (লাভ ÷ কেনা দাম)', '২৫%'],
    ])
    // The engine gives 1,142.86; the card shows whole taka as Figma does.
    expect(targetPrice('bn', copy, 800, 30)).toEqual({ value: '৳১,১৪৩' })
  })
  it('a loss, cost 0, a target of 100% and no FAQ', () => {
    const loss = result(profitOutcome({ lang: 'bn', copy, cost: 1000, price: 800 }))
    expect([loss.label, loss.value, loss.sub]).toEqual(['ক্ষতি', 200, 'মার্জিন -২৫% · মার্কআপ -২০%'])
    expect(result(profitOutcome({ lang: 'bn', copy, cost: 0, price: 500 })).summary[2]!.value).toBe('—')
    expect(targetPrice('bn', copy, 800, 100)).toEqual({ value: '—', error: 'মার্জিন ১০০% এর কম লেখো' })
    expect(profitOutcome({ lang: 'bn', copy, cost: 800, price: 0 }).kind).toBe('empty')
    expect(profitContent('bn').faq).toBeUndefined()
  })
})

describe('Salary breakdown (Figma C5)', () => {
  const copy = localize(SALARY, 'bn')
  const preset = salaryRest(salaryFile)
  it('৳৫০,০০০, basic 60%, house rent 50% → basic ৳৩০,০০০, rent ৳১৫,০০০, medical ৳৩,০০০, conveyance ৳২,০০০', () => {
    const r = result(salaryOutcome({ lang: 'bn', copy, gross: 50000, basic: 60, rent: 50, preset }))
    expect([r.label, r.value, r.sub]).toEqual(['বেসিক বেতন', 30000, 'মোট ৳৫০,০০০ এর ৬০%'])
    expect(rows(r.summary)).toEqual([
      ['বেসিক (৬০%)', '৳৩০,০০০'],
      ['বাড়িভাড়া (বেসিকের ৫০%)', '৳১৫,০০০'],
      ['মেডিকেল (বেসিকের ১০%)', '৳৩,০০০'],
      ['যাতায়াত', '৳২,০০০'],
      ['মোট', '৳৫০,০০০'],
    ])
  })
  it('parts over the gross: error with a house-rent fix; verified line pending', () => {
    const o = salaryOutcome({ lang: 'bn', copy, gross: 50000, basic: 60, rent: 70, preset })
    expect(o.kind).toBe('error')
    if (o.kind !== 'error') return
    expect(o.error.fix).toEqual({ label: 'বাড়িভাড়া ৫৬% দিয়ে হিসাব করো', field: 'rent', value: 56 })
    expect(result(salaryOutcome({ lang: 'bn', copy, gross: 50000, basic: 60, rent: 56, preset })).value).toBe(30000)
    expect(salaryContent('bn', salaryFile).data?.verified).toBe(false)
  })
})

describe('VatCalculator island', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/tools/vat')
  })
  it('a shared link restores the mode and amount; a rate chip writes the URL', async () => {
    window.history.replaceState(null, '', '/tools/vat?mode=remove&amount=1150')
    render(<VatCalculator lang="bn" text={islandText('bn', VAT)} rates={[5, 7.5, 10, 15]} title="t" />)
    await waitFor(() => expect(screen.getByLabelText('VAT সহ দাম')).toHaveProperty('value', '১,১৫০'))
    fireEvent.click(screen.getByText('১০%'))
    await waitFor(() => expect(window.location.search).toBe('?mode=remove&amount=1150&rate=10'))
  })
})
