import type { MfsChargesFile } from '@hisab/data/types'
import { checkDataFile } from '@hisab/data/checks'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import mfsJson from '../../../data/mfs-charges.json' with { type: 'json' }
import { afterEach, describe, expect, it } from 'vitest'
import { CashOutCalculator } from '../src/cash-out/CashOutCalculator.tsx'
import { CASH_OUT_MESSAGE_KEYS, cashOutChannels, cashOutContent } from '../src/cash-out/content.ts'
import { COPY } from '../src/cash-out/copy.ts'
import { islandText } from '../src/tool/island-text.ts'
import { localize } from '../src/tool/text.ts'
import { cashOutOutcome } from '../src/cash-out/model.ts'

const file = mfsJson as unknown as MfsChargesFile
const channels = cashOutChannels(file)
const referenceId = file.referenceByService.cashOut
const outcome = (mode: 'charge' | 'max', amount: number | null, used = 0, lang: 'bn' | 'en' = 'bn') =>
  cashOutOutcome({ lang, copy: localize(COPY, lang), mode, amount, used, channels, referenceId })

describe('cash out model (Figma example values, seed data)', () => {
  it('uses valid data', () => {
    expect(checkDataFile('mfs-charges.json', file)).toEqual([])
    expect(channels.map((c) => c.id)).toHaveLength(7)
  })

  it('03 Calculator: ৳৫,০০০ → cheapest Rocket DBBL ATM ৳৪৫.০০, ৳৪৭.৫০ less than an ordinary bKash agent', () => {
    const o = outcome('charge', 5000)
    if (o.kind !== 'result') throw new Error(o.kind)
    expect(o.result.label).toBe('সবচেয়ে কম চার্জ: রকেট, DBBL ATM')
    expect(o.result.value).toBe(45)
    expect(o.result.sub).toEqual(['হাতে পাবে ৳৫,০০০', 'ওয়ালেটে রাখতে হবে ৳৫,০৪৫', 'সাধারণ বিকাশ এজেন্টের চেয়ে ৳৪৭.৫০ কম'])
    expect(o.result.rows.map((r) => r.value)).toEqual(['৳৪৫.০০', '৳৬৪.৯৫', '৳৬৯.৭৫', '৳৭৪.৫০', '৳৭৫.০০', '৳৮৩.৫০', '৳৯২.৫০'])
    expect(o.result.rows[0]).toMatchObject({ provider: 'রকেট', method: 'DBBL ATM বা ব্রাঞ্চ · ৯.০০/হাজার', sub: 'মোট ৳৫,০৪৫.০০', state: 'best', badge: 'সাশ্রয়ী' })
    expect(o.result.topCallout).toBeUndefined()
  })

  it('C1-b: a ৳৫,০০০ balance → at most ৳৪,৯৫৫ via Rocket DBBL ATM, charge ৳৪৪.৬০, ৳০.৪০ left', () => {
    const o = outcome('max', 5000)
    if (o.kind !== 'result') throw new Error(o.kind)
    expect(o.result.label).toBe('সবচেয়ে বেশি তুলতে পারবে: রকেট, DBBL ATM')
    expect(o.result.value).toBe(4955)
    expect(o.result.sub).toEqual(['চার্জ ৳৪৪.৬০', 'ওয়ালেটে থাকবে ৳০.৪০'])
    expect(o.result.rows.map((r) => r.value)).toEqual(['৳৪,৯৫৫', '৳৪,৯৩৫', '৳৪,৯৩১', '৳৪,৯২৬', '৳৪,৯২৬', '৳৪,৯১৭', '৳৪,৯০৯'])
  })

  it('C1-c: ৳১০,০০০ after ৳৪৫,০০০ at Priyo → warning row, field message and the callout', () => {
    const o = outcome('charge', 10000, 45000)
    if (o.kind !== 'result') throw new Error(o.kind)
    expect(o.result.value).toBe(90)
    expect(o.fields?.used).toBe('৳১০,০০০ তুললে মাসের ৫০,০০০ সীমা পার হবে')
    expect(o.result.topCallout).toBe(
      'এই মাসে প্রিয় এজেন্ট থেকে ৳৪৫,০০০ তুলেছ। ৳১০,০০০ তুললে ৫০,০০০ সীমা পার হয়, তখন পুরো লেনদেনে ১৮.৫০ রেট লাগে। ৳৫,০০০ প্রিয় এজেন্টে আর বাকিটা অন্যভাবে তুললে খরচ কমবে।',
    )
    const priyo = o.result.rows.find((r) => r.id === 'bkash-priyo-agent')!
    expect(priyo).toMatchObject({ state: 'warning', badge: 'লিমিট পার', method: 'প্রিয় এজেন্ট · সীমা পার, ১৮.৫০/হাজার', value: '৳১৮৫.০০' })
    // Ties keep Figma's order: the over-limit Priyo row comes before the ordinary agent.
    expect(o.result.rows.slice(-2).map((r) => r.id)).toEqual(['bkash-priyo-agent', 'bkash-agent'])
  })

  it('C1-d: ৳৪০,০০০ is over every daily limit → error state with a ৳৩০,০০০ fix', () => {
    const o = outcome('charge', 40000)
    if (o.kind !== 'error') throw new Error(o.kind)
    expect(o.error.title).toBe('এই পরিমাণ একদিনে তোলা যাবে না')
    expect(o.error.body).toBe('৳৩০,০০০ বা কম লেখো। বেশি দরকার হলে দুই দিনে ভাগ করে তোলো, অথবা ব্যাংক অ্যাকাউন্টে ট্রান্সফার করে ATM থেকে তোলো।')
    expect(o.error.fix).toEqual({ label: '৳৩০,০০০ দিয়ে হিসাব করো', field: 'amount', value: 30000 })
    expect(o.fields?.amount).toBe('দিনে সর্বোচ্চ ৳৩০,০০০ ক্যাশ আউট করা যায় (বাংলাদেশ ব্যাংকের সীমা)')
  })

  it('empty, zero and a balance too small for any charge', () => {
    expect(outcome('charge', null).kind).toBe('empty')
    expect(outcome('charge', 0).kind).toBe('empty')
    const tiny = outcome('max', 0.5)
    expect(tiny.kind).toBe('error')
  })

  it('English digits and copy on the English page', () => {
    const o = outcome('charge', 5000, 0, 'en')
    if (o.kind !== 'result') throw new Error(o.kind)
    expect(o.result.label).toBe('Lowest charge: Rocket, DBBL ATM')
    expect(o.result.sub[2]).toBe('৳47.50 less than an ordinary bKash agent')
  })

  it('page content: Figma tips from data, FAQ answers, registry breadcrumb and related tools', () => {
    const c = cashOutContent('bn', file)
    expect(c.title).toBe('বিকাশ, নগদ, রকেট ক্যাশ আউট চার্জ')
    expect(c.crumbs.map((x) => x.label)).toEqual(['হোম', 'মোবাইল ব্যাংকিং', 'ক্যাশ আউট চার্জ'])
    expect(c.steps?.items.map((s) => s.body)).toEqual([
      'প্রতি হাজারে ৪.৫৫ টাকা বাঁচে, মাসে ৫০,০০০ টাকা পর্যন্ত।',
      'রকেটের DBBL ATM সবচেয়ে সস্তা, প্রতি হাজারে ৯ টাকা।',
      'অ্যাপে প্রতি হাজারে ২ টাকার বেশি কম।',
      'QR পেমেন্ট, বিল পে আর রিচার্জে গ্রাহকের চার্জ নেই।',
    ])
    expect(c.faq?.items[0]?.answer).toBe('প্রিয় এজেন্টে ১৩.৯৫ টাকা, অন্য এজেন্টে ১৮.৫০ টাকা, ATM এ ১৪.৯০ টাকা। চার্জ আলাদা করে ওয়ালেট থেকে কাটে।')
    expect(c.related.map((r) => r.href)).toEqual(['/tools/send-money', '/mfs/compare', '/mfs/bkash/cash-out', '/guides/priyo-agent'])
    expect(c.data?.verified).toBe(false)
  })
})

describe('CashOutCalculator island', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/tools/cash-out')
  })

  const mount = () =>
    render(<CashOutCalculator lang="bn" text={islandText('bn', COPY, CASH_OUT_MESSAGE_KEYS)} channels={channels} referenceId={referenceId} title="t" subtitle="s" />)

  it('restores the inputs from a shared link', async () => {
    window.history.replaceState(null, '', '/tools/cash-out?amount=10000&used=45000')
    mount()
    await waitFor(() => expect(screen.getByLabelText('কত টাকা ক্যাশ আউট করবে?')).toHaveProperty('value', '১০,০০০'))
    expect(screen.getByText('৳১০,০০০ তুললে মাসের ৫০,০০০ সীমা পার হবে')).toBeTruthy()
  })

  it('writes typed inputs to the URL, and leaves it clean for the defaults', async () => {
    window.history.replaceState(null, '', '/tools/cash-out')
    mount()
    const field = screen.getByLabelText('কত টাকা ক্যাশ আউট করবে?')
    fireEvent.input(field, { target: { value: '২৫০০০' } })
    await waitFor(() => expect(window.location.search).toBe('?amount=25000'))
    fireEvent.click(screen.getByText('৫,০০০'))
    await waitFor(() => expect(window.location.search).toBe(''))
  })

  it('the error state fix button applies the allowed amount', async () => {
    window.history.replaceState(null, '', '/tools/cash-out?amount=40000')
    mount()
    const fix = await screen.findByText('৳৩০,০০০ দিয়ে হিসাব করো')
    fireEvent.click(fix)
    await waitFor(() => expect(window.location.search).toBe('?amount=30000'))
    expect(document.querySelector('[data-result-card]')).not.toBeNull()
  })
})
