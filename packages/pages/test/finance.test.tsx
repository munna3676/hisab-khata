// The finance calculators (phase 3c) against the Figma example values. Where Figma and the engine
// disagree, the engine wins and the test says so (docs/engine-review.md, docs/open-items.md).
import type { ExciseDutyFile, InterestTaxFile, LoanDbrFile, SavingsGoalPresetsFile } from '@hisab/data/types'
import { checkDataFile } from '@hisab/data/checks'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import exciseJson from '../../../data/finance/excise-duty.json' with { type: 'json' }
import taxJson from '../../../data/finance/interest-tax.json' with { type: 'json' }
import dbrJson from '../../../data/finance/loan-dbr.json' with { type: 'json' }
import presetsJson from '../../../data/finance/savings-goal-presets.json' with { type: 'json' }
import { taxHelperText } from '../src/deposit/shared.ts'
import { dpsContent } from '../src/dps/content.ts'
import { COPY as DPS } from '../src/dps/copy.ts'
import { dpsOutcome } from '../src/dps/model.ts'
import { DPS_PARAMS } from '../src/dps/params.ts'
import { EmiCalculator } from '../src/emi/EmiCalculator.tsx'
import { emiContent } from '../src/emi/content.ts'
import { COPY as EMI } from '../src/emi/copy.ts'
import { emiOutcome } from '../src/emi/model.ts'
import { fdrContent } from '../src/fdr/content.ts'
import { COPY as FDR } from '../src/fdr/copy.ts'
import { fdrOutcome } from '../src/fdr/model.ts'
import { FDR_PARAMS } from '../src/fdr/params.ts'
import { loanCompareContent } from '../src/loan-compare/content.ts'
import { COPY as CMP } from '../src/loan-compare/copy.ts'
import { loanCompareOutcome } from '../src/loan-compare/model.ts'
import { loanEligibilityContent } from '../src/loan-eligibility/content.ts'
import { COPY as ELIG } from '../src/loan-eligibility/copy.ts'
import { loanEligibilityOutcome } from '../src/loan-eligibility/model.ts'
import { LOAN_ELIGIBILITY_PARAMS } from '../src/loan-eligibility/params.ts'
import { savingsGoalPurposes } from '../src/savings-goal/content.ts'
import { COPY as GOAL } from '../src/savings-goal/copy.ts'
import { savingsGoalOutcome } from '../src/savings-goal/model.ts'
import { islandText } from '../src/tool/island-text.ts'
import { localize } from '../src/tool/text.ts'

const tax = taxJson as unknown as InterestTaxFile
const excise = exciseJson as unknown as ExciseDutyFile
const dbr = dbrJson as unknown as LoanDbrFile
const presets = presetsJson as unknown as SavingsGoalPresetsFile
const rows = (summary: { label: string; value: string }[]) => summary.map((r) => [r.label, r.value])

function result<T>(o: { kind: string; result?: T }): T {
  if (o.kind !== 'result') throw new Error(`expected a result, got ${o.kind}`)
  return o.result as T
}

describe('data the finance pages use', () => {
  it('is valid, and the link defaults match it', () => {
    expect(checkDataFile('finance/interest-tax.json', tax)).toEqual([])
    expect(checkDataFile('finance/excise-duty.json', excise)).toEqual([])
    expect(checkDataFile('finance/loan-dbr.json', dbr)).toEqual([])
    expect(checkDataFile('finance/savings-goal-presets.json', presets)).toEqual([])
    // The tax field's default is the with-TIN rate; the DBR default is one of the data chips.
    expect(DPS_PARAMS.tax.default).toBe(tax.value.withTinPct)
    expect(FDR_PARAMS.tax.default).toBe(tax.value.withTinPct)
    expect(dbr.value).toContain(LOAN_ELIGIBILITY_PARAMS.dbr.default)
    expect(savingsGoalPurposes(presets)).toEqual(['wedding', 'bike', 'study-abroad', 'emergency-fund'])
  })
})

describe('EMI (Figma F6)', () => {
  const run = (amount: number | null, rate: number | null, months: number | null, lang: 'bn' | 'en' = 'bn') =>
    emiOutcome({ lang, copy: localize(EMI, lang), amount, rate, months })

  it('৳৫,০০,০০০ at 12% for 36 months → ৳১৬,৬০৭ a month, ৳৯৭,৮৫৮ interest, 84/16 split', () => {
    const r = result(run(500000, 12, 36))
    expect(r.value).toBe(16607)
    expect(r.label).toBe('মাসিক কিস্তি (EMI)')
    expect(r.sub).toBe('৩৬ মাস ধরে প্রতি মাসে')
    expect(rows(r.summary)).toEqual([
      ['ঋণের পরিমাণ', '৳৫,০০,০০০'],
      ['মোট সুদ', '৳৯৭,৮৫৮'],
      ['মোট পরিশোধ', '৳৫,৯৭,৮৫৮'],
    ])
    expect([r.split.principalLabel, r.split.interestLabel]).toEqual(['মূল টাকা ৮৪%', 'সুদ ১৬%'])
    // Figma's first three rows: 11,607 / 5,000 / 4,88,393 …
    expect(r.schedule.slice(0, 3).map((x) => [Math.round(x.principal), Math.round(x.interest), Math.round(x.balance)])).toEqual([
      [11607, 5000, 488393],
      [11723, 4884, 476670],
      [11840, 4767, 464829],
    ])
    expect(r.schedule).toHaveLength(36)
  })

  it('empty, out-of-range and English', () => {
    expect(run(null, 12, 36).kind).toBe('empty')
    const bad = run(500000, 120, 0.5)
    expect(bad.kind).toBe('empty')
    expect(bad.fields).toEqual({ rate: 'সর্বোচ্চ ১০০ লেখা যাবে', months: 'কমপক্ষে ১ লিখতে হবে' })
    expect(run(500000, 12, 36.5).fields?.months).toBe('মাস পূর্ণ সংখ্যায় লেখো')
    const en = result(run(500000, 12, 36, 'en'))
    expect(en.summary[1]!.value).toBe('৳97,858')
    expect(en.split.principalLabel).toBe('Principal 84%')
  })

  it('page content: Figma FAQ, second answer from the engine', () => {
    const c = emiContent('bn')
    expect(c.title).toBe('লোন EMI ক্যালকুলেটর')
    expect(c.data).toBeUndefined()
    expect(c.faq?.items.map((f) => f.question)).toEqual(['EMI কীভাবে হিসাব হয়?', 'প্রথম দিকে সুদ বেশি কেন?'])
    expect(c.faq?.items[1]!.answer).toContain('প্রথম মাসে সুদ ৳৫,০০০, শেষ মাসে ৳১৬৪')
  })
})

describe('DPS (Figma F7, F7-b)', () => {
  const run = (comp: 'monthly' | 'quarterly', deposit: number | null = 5000) =>
    dpsOutcome({ lang: 'bn', copy: localize(DPS, 'bn'), deposit, rate: 9, years: 5, comp, tax: 10, exciseSlabs: excise.value })

  it('F7 monthly: ৳৫,০০০ × 60 at 9% → ৳৩,৭১,৯৫৪ after 10% tax', () => {
    const r = result(run('monthly'))
    expect(r.value).toBe(371954)
    expect(r.sub).toBe('৬০ মাস পর, কর কাটার পর')
    expect(rows(r.summary)).toEqual([
      ['মোট জমা', '৳৩,০০,০০০'],
      ['মোট মুনাফা', '৳৭৯,৯৪৯'],
      ['উৎসে কর (১০%)', '− ৳৭,৯৯৫'],
      ['মেয়াদ শেষে', '৳৩,৭১,৯৫৪'],
    ])
    expect(r.years).toHaveLength(5)
  })

  it('F7-b quarterly: ৳৩,৭১,৩৫০, profit ৳৭৯,২৭৮, tax ৳৭,৯২৮', () => {
    const r = result(run('quarterly'))
    expect(r.value).toBe(371350)
    expect(r.sub).toBe('৬০ মাস পর, কর কাটার পর · ৩ মাস পরপর মুনাফা যোগ')
    expect(r.summary.map((x) => x.value)).toEqual(['৳৩,০০,০০০', '৳৭৯,২৭৮', '− ৳৭,৯২৮', '৳৩,৭১,৩৫০'])
  })

  it('shows excise duty when the balance passes the free limit', () => {
    const r = result(run('monthly', 20000))
    expect(r.summary.find((x) => x.key === 'excise')?.label).toBe('আবগারি শুল্ক')
  })

  it('page content: tax help line and excise answer from data', () => {
    expect(taxHelperText('bn', tax)).toBe('সাধারণত TIN থাকলে ১০%, না থাকলে ১৫%।')
    const c = dpsContent('bn', tax, excise)
    expect(c.faq?.items[1]!.answer).toContain('৳৪,০০,০০০ পর্যন্ত কোনো শুল্ক নেই')
    expect(c.data?.verified).toBe(false)
  })
})

describe('FDR (Figma F8, F8-b)', () => {
  const run = (mode: 'simple' | 'renew', months = 12) =>
    fdrOutcome({ lang: 'bn', copy: localize(FDR, 'bn'), amount: 100000, rate: 10, months, mode, tax: 10, exciseSlabs: excise.value })

  it('F8 at maturity: ৳১,০০,০০০ at 10% for 12 months → ৳১,০৯,০০০', () => {
    const r = result(run('simple'))
    expect(r.value).toBe(109000)
    expect(rows(r.summary)).toEqual([
      ['জমা', '৳১,০০,০০০'],
      ['মোট মুনাফা', '৳১০,০০০'],
      ['উৎসে কর (১০%)', '− ৳১,০০০'],
      ['মেয়াদ শেষে', '৳১,০৯,০০০'],
    ])
  })

  it('F8-b renew every 3 months: engine ৳১,০৯,৩০৮ (Figma ৳১,০৯,৩৪৩ adds profit before tax each quarter)', () => {
    const r = result(run('renew'))
    expect(r.value).toBe(109308)
    expect(r.sub).toBe('১২ মাস পর, কর কাটার পর · ৩ মাস পরপর মুনাফাসহ রিনিউ')
    expect(r.summary.map((x) => x.value)).toEqual(['৳১,০০,০০০', '৳১০,৩৪৩', '− ৳১,০৩৪', '৳১,০৯,৩০৮'])
  })

  it('renew needs whole quarters: error with a fix', () => {
    const o = run('renew', 10)
    if (o.kind !== 'error') throw new Error(o.kind)
    expect(o.error.fix).toEqual({ label: '৯ মাস দিয়ে হিসাব করো', field: 'months', value: 9 })
    expect(o.fields?.months).toBe('৩ মাসের গুণিতক লেখো')
  })

  it('page content: FAQ answers from data and the engine', () => {
    const c = fdrContent('bn', tax, excise)
    expect(c.faq?.items[0]!.answer).toBe('সাধারণত TIN থাকলে ১০%, না থাকলে ১৫%।')
    expect(c.faq?.items[1]!.answer).toContain('মেয়াদ শেষে একবারে পেলে ৳১,০৯,০০০, প্রতি ৩ মাসে রিনিউ করলে ৳১,০৯,৩০৮')
  })
})

describe('Loan eligibility (Figma F9)', () => {
  const run = (emi: number, lang: 'bn' | 'en' = 'bn') =>
    loanEligibilityOutcome({ lang, copy: localize(ELIG, lang), income: 60000, emi, rate: 12, years: 5, dbr: 50 })

  it('৳৬০,০০০ income, ৳৫,০০০ instalments, 50% → ৳১১.২ লাখ (৳১১,২৩,৮৭৬)', () => {
    const r = result(run(5000))
    expect([r.value, r.decimals, r.suffix]).toEqual([11.2, 1, ' লাখ'])
    expect(r.sub).toBe('মাসিক কিস্তি সর্বোচ্চ ৳২৫,০০০ ধরে (আয়ের ৫০%, চলতি কিস্তি বাদে)')
    expect(rows(r.summary)).toEqual([
      ['আয়ের ৫০%', '৳৩০,০০০'],
      ['চলতি কিস্তি', '− ৳৫,০০০'],
      ['নতুন কিস্তির সীমা', '৳২৫,০০০'],
      ['৫ বছর, ১২% এ এই কিস্তিতে লোন', '৳১১,২৩,৮৭৬'],
    ])
    expect(result(run(5000, 'en')).suffix).toBe(' lakh')
  })

  it('no room for a new instalment is an error', () => {
    expect(run(30000).kind).toBe('error')
  })

  it('page content: verified line from loan-dbr.json, no FAQ', () => {
    const c = loanEligibilityContent('bn', dbr)
    expect(c.title).toBe('কত টাকা লোন পাবো?')
    expect(c.faq).toBeUndefined()
    expect(c.data?.verified).toBe(false)
  })
})

describe('Loan comparison (Figma F10)', () => {
  const offers = {
    a: { p: 500000, r: 12, y: 3, f: 1 },
    b: { p: 500000, r: 11, y: 3, f: 2 },
  }

  it('B is cheaper by ৳৩,৫৬১ (Figma ৳৩,৫৭৪: it takes B’s interest from the whole-taka EMI)', () => {
    const r = result(loanCompareOutcome({ lang: 'bn', copy: localize(CMP, 'bn'), offers }))
    expect(r.label).toBe('অফার B সস্তা')
    expect([r.value, r.suffix]).toEqual([3561, ' কম'])
    expect(r.sub).toBe('B তে মাসিক ৳১৬,৩৬৯ · মোট খরচ (সুদ + ফি) ৳৯৯,২৯৭')
    expect(r.rows.map((x) => [x.label, ...x.values, x.lowest])).toEqual([
      ['মাসিক কিস্তি', '১৬,৬০৭', '১৬,৩৬৯', 1],
      ['মোট সুদ', '৯৭,৮৫৮', '৮৯,২৯৭', 1],
      ['প্রসেসিং ফি', '৫,০০০', '১০,০০০', 0],
      ['মোট খরচ', '১,০২,৮৫৮', '৯৯,২৯৭', 1],
    ])
  })

  it('a tie, a field error per offer and no verified line', () => {
    const tie = result(loanCompareOutcome({ lang: 'bn', copy: localize(CMP, 'bn'), offers: { a: offers.a, b: offers.a } }))
    expect(tie.label).toBe('দুটো অফারে মোট খরচ সমান')
    const bad = loanCompareOutcome({ lang: 'bn', copy: localize(CMP, 'bn'), offers: { a: offers.a, b: { ...offers.b, r: 101 } } })
    expect(bad.fields).toEqual({ br: 'সর্বোচ্চ ১০০ লেখা যাবে' })
    expect(loanCompareContent('bn').data).toBeUndefined()
  })
})

describe('Savings goal (Figma C4)', () => {
  it('৳৫,০০,০০০ in 24 months at 6% → ৳১৯,৬৬০ a month (Figma’s ৳২০,৮৩৪ without return is ৳২০,৮৩৩)', () => {
    const r = result(savingsGoalOutcome({ lang: 'bn', copy: localize(GOAL, 'bn'), target: 500000, months: 24, rate: 6, goal: 'none' }))
    expect(r.value).toBe(19660)
    expect(r.sub).toBe('৬% মুনাফা ধরে · মুনাফা ছাড়া লাগত ৳২০,৮৩৩')
    expect(r.summaryTitle).toBe('২৪ মাস পর')
    expect(rows(r.summary)).toEqual([
      ['তোমার মোট জমা', '৳৪,৭১,৮৪০'],
      ['মুনাফা', '৳২৮,১৬০'],
      ['লক্ষ্য', '৳৫,০০,০০০'],
    ])
  })

  it('a purpose names the plan in the share text; 0% has no return line', () => {
    const r = result(savingsGoalOutcome({ lang: 'bn', copy: localize(GOAL, 'bn'), target: 500000, months: 24, rate: 0, goal: 'bike' }))
    expect(r.shareText.startsWith('বাইক:')).toBe(true)
    expect(r.sub).toBe('মুনাফা ছাড়া')
  })
})

describe('EmiCalculator island', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/tools/emi')
  })

  it('a shared link restores the inputs; a term chip writes the URL', async () => {
    window.history.replaceState(null, '', '/tools/emi?amount=800000&months=60')
    render(<EmiCalculator lang="bn" text={islandText('bn', EMI)} title="t" />)
    await waitFor(() => expect(screen.getByLabelText('ঋণের পরিমাণ')).toHaveProperty('value', '৮,০০,০০০'))
    fireEvent.click(screen.getByText('৩ বছর'))
    await waitFor(() => expect(window.location.search).toBe('?amount=800000'))
  })
})
