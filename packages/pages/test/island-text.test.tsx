// Each island must work with only the strings the server gives it (tool/text.ts): this renders
// it on a fresh @hisab/i18n/t that has no message files loaded, so a t() key missing from the
// island's message list throws here instead of on the live page.
import type { MfsChargesFile } from '@hisab/data/types'
import type { FunctionComponent } from 'preact'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import mfsJson from '../../../data/mfs-charges.json' with { type: 'json' }
import { CASH_OUT_MESSAGE_KEYS, cashOutChannels } from '../src/cash-out/content.ts'
import { COPY as CASH_OUT_COPY } from '../src/cash-out/copy.ts'
import { islandText } from '../src/tool/island-text.ts'
import exciseJson from '../../../data/finance/excise-duty.json' with { type: 'json' }
import { COPY as DPS_COPY } from '../src/dps/copy.ts'
import { COPY as EMI_COPY } from '../src/emi/copy.ts'
import { COPY as FDR_COPY } from '../src/fdr/copy.ts'
import { COPY as CMP_COPY } from '../src/loan-compare/copy.ts'
import { COPY as ELIG_COPY } from '../src/loan-eligibility/copy.ts'
import { COPY as GOAL_COPY } from '../src/savings-goal/copy.ts'
import { COPY as VAT_COPY } from '../src/vat/copy.ts'
import { COPY as DISCOUNT_COPY } from '../src/discount-percentage/copy.ts'
import { COPY as PROFIT_COPY } from '../src/profit-margin/copy.ts'
import { COPY as SALARY_COPY } from '../src/salary/copy.ts'
import { COPY as TAX_COPY } from '../src/income-tax/copy.ts'
import { COPY as SP_COPY } from '../src/sanchayapatra/copy.ts'
import { COPY as CUR_COPY } from '../src/currency-converter/copy.ts'
import { COPY as PACK_COPY } from '../src/data-pack/copy.ts'
import taxJson from '../../../data/income-tax-2026-27.json' with { type: 'json' }
import spJson from '../../../data/finance/sanchayapatra.json' with { type: 'json' }
import curJson from '../../../data/finance/currency-rates.json' with { type: 'json' }
import packJson from '../../../data/data-packs.json' with { type: 'json' }
import { COPY as AGE_COPY } from '../src/age/copy.ts'
import { COPY as JOB_COPY } from '../src/job-age-limit/copy.ts'
import { COPY as BD_COPY } from '../src/bangla-date/copy.ts'
import { COPY as HIJRI_COPY } from '../src/hijri-date/copy.ts'
import { COPY as DC_COPY } from '../src/day-count/copy.ts'
import { COPY as LAND_COPY } from '../src/land-converter/copy.ts'
import { COPY as LP_COPY } from '../src/land-price/copy.ts'
import { COPY as GOLD_COPY } from '../src/gold-converter/copy.ts'
import { COPY as JB_COPY } from '../src/jewelry-bill/copy.ts'
import specialJson from '../../../data/dates/special-days.json' with { type: 'json' }
import conventionsJson from '../../../data/land/conventions.json' with { type: 'json' }
import ratesJson from '../../../data/gold/bajus-rates.json' with { type: 'json' }

type Lang = 'bn' | 'en'

interface IslandCase {
  id: string
  /** Props built here, with the full catalog (as the server does). */
  props: (lang: Lang) => Record<string, unknown>
  load: () => Promise<Record<string, unknown>>
  /** Links that drive the island into each state it can show (result, error, other modes). */
  urls: string[]
}

const mfs = mfsJson as unknown as MfsChargesFile
const excise = (exciseJson as { value: unknown[] }).value

export const CASES: IslandCase[] = [
  {
    id: 'cash-out',
    props: (lang) => ({
      lang,
      text: islandText(lang, CASH_OUT_COPY, CASH_OUT_MESSAGE_KEYS),
      channels: cashOutChannels(mfs),
      referenceId: mfs.referenceByService.cashOut,
      title: 't',
      subtitle: 's',
    }),
    load: () => import('../src/islands/cash-out.ts'),
    urls: ['', '?mode=max', '?amount=40000', '?amount=10000&used=45000', '?amount=abc', '?mode=max&amount=0.5'],
  },
  {
    id: 'emi',
    props: (lang) => ({ lang, text: islandText(lang, EMI_COPY), title: 't' }),
    load: () => import('../src/islands/emi.ts'),
    urls: ['', '?rate=0', '?months=601', '?amount=0'],
  },
  {
    id: 'dps',
    props: (lang) => ({ lang, text: islandText(lang, DPS_COPY), exciseSlabs: excise, taxHelper: 'h', title: 't' }),
    load: () => import('../src/islands/dps.ts'),
    urls: ['', '?comp=quarterly', '?deposit=50000&years=10', '?years=0'],
  },
  {
    id: 'fdr',
    props: (lang) => ({ lang, text: islandText(lang, FDR_COPY), exciseSlabs: excise, title: 't' }),
    load: () => import('../src/islands/fdr.ts'),
    urls: ['', '?mode=renew', '?mode=renew&months=10', '?tax=101'],
  },
  {
    id: 'loan-eligibility',
    props: (lang) => ({ lang, text: islandText(lang, ELIG_COPY), dbrChips: [40, 50], title: 't' }),
    load: () => import('../src/islands/loan-eligibility.ts'),
    urls: ['', '?dbr=40', '?emi=40000', '?income=50000&emi=0'],
  },
  {
    id: 'loan-compare',
    props: (lang) => ({ lang, text: islandText(lang, CMP_COPY), title: 't' }),
    load: () => import('../src/islands/loan-compare.ts'),
    urls: ['', '?br=12&bf=1', '?ay=0'],
  },
  {
    id: 'savings-goal',
    props: (lang) => ({ lang, text: islandText(lang, GOAL_COPY), purposes: ['wedding', 'bike', 'study-abroad', 'emergency-fund'], title: 't' }),
    load: () => import('../src/islands/savings-goal.ts'),
    urls: ['', '?goal=bike', '?rate=0', '?months=0'],
  },
  {
    id: 'vat',
    props: (lang) => ({ lang, text: islandText(lang, VAT_COPY), rates: [5, 7.5, 10, 15], title: 't' }),
    load: () => import('../src/islands/vat.ts'),
    urls: ['', '?mode=remove&amount=1150', '?amount=999&rate=7.5', '?rate=101', '?amount=abc'],
  },
  {
    id: 'discount-percentage',
    props: (lang) => ({ lang, text: islandText(lang, DISCOUNT_COPY), title: 't' }),
    load: () => import('../src/islands/discount-percentage.ts'),
    urls: ['', '?off=50', '?off=120', '?n=abc'],
  },
  {
    id: 'profit-margin',
    props: (lang) => ({ lang, text: islandText(lang, PROFIT_COPY), title: 't' }),
    load: () => import('../src/islands/profit-margin.ts'),
    urls: ['', '?cost=1000&price=800', '?price=0', '?target=100'],
  },
  {
    id: 'salary',
    props: (lang) => ({ lang, text: islandText(lang, SALARY_COPY), preset: { medicalPctOfBasic: 10, conveyance: null }, title: 't' }),
    load: () => import('../src/islands/salary.ts'),
    urls: ['', '?rent=70', '?basic=0', '?gross=80000&basic=50'],
  },
  {
    id: 'income-tax',
    props: (lang) => ({ lang, text: islandText(lang, TAX_COPY), rules: taxJson.value, title: 't' }),
    load: () => import('../src/islands/income-tax.ts'),
    urls: ['', '?mode=freelancer', '?income=300000&cat=disabled', '?income=abc'],
  },
  {
    id: 'sanchayapatra',
    props: (lang) => ({ lang, text: islandText(lang, SP_COPY), schemes: spJson.value, title: 't' }),
    load: () => import('../src/islands/sanchayapatra.ts'),
    urls: ['', '?scheme=bangladesh-5y', '?scheme=pensioner&amount=300000', '?amount=5000'],
  },
  {
    id: 'currency-converter',
    props: (lang) => ({ lang, text: islandText(lang, CUR_COPY), sheet: curJson.value, title: 't' }),
    load: () => import('../src/islands/currency-converter.ts'),
    urls: ['', '?cur=USD&amount=250.5', '?cur=MYR', '?amount=0'],
  },
  {
    id: 'data-pack',
    props: (lang) => ({ lang, text: islandText(lang, PACK_COPY), operators: packJson.operators, packs: packJson.packs.flatMap((p) => p.value), title: 't' }),
    load: () => import('../src/islands/data-pack.ts'),
    urls: ['', '?days=7', '?budget=50', '?op=robi', '?days=2.5'],
  },
  {
    id: 'age',
    props: (lang) => ({ lang, text: islandText(lang, AGE_COPY), today: '2026-10-19', title: 't' }),
    load: () => import('../src/islands/age.ts'),
    urls: ['', '?on=2027-03-15', '?on=1990-01-01', '?birth=bad'],
  },
  {
    id: 'job-age-limit',
    props: (lang) => ({ lang, text: islandText(lang, JOB_COPY), presets: [30, 32, 35], rule: { limitDayIncluded: false }, today: '2026-10-19', title: 't' }),
    load: () => import('../src/islands/job-age-limit.ts'),
    urls: ['', '?max=29', '?ref=1990-01-01'],
  },
  {
    id: 'bangla-date',
    props: (lang) => ({ lang, text: islandText(lang, BD_COPY), specialDays: specialJson.value, hijriOffset: -1, today: '2026-10-19', title: 't' }),
    load: () => import('../src/islands/bangla-date.ts'),
    urls: ['', '?dir=to-en', '?dir=to-en&bdate=1433-07-31', '?date=1952-02-21'],
  },
  {
    id: 'hijri-date',
    props: (lang) => ({ lang, text: islandText(lang, HIJRI_COPY), offset: -1, today: '2026-10-19', title: 't' }),
    load: () => import('../src/islands/hijri-date.ts'),
    urls: ['', '?adj=1', '?date=2027-03-10&adj=-1'],
  },
  {
    id: 'day-count',
    props: (lang) => ({ lang, text: islandText(lang, DC_COPY), today: '2026-10-19', title: 't' }),
    load: () => import('../src/islands/day-count.ts'),
    urls: ['', '?inc=yes', '?start=2027-01-01'],
  },
  {
    id: 'land-converter',
    props: (lang) => ({ lang, text: islandText(lang, LAND_COPY), conventions: conventionsJson.value, title: 't' }),
    load: () => import('../src/islands/land-converter.ts'),
    urls: ['', '?unit=sqft&n=1000', '?area=custom&ks=0', '?area=chattogram&unit=gonda', '?n=abc'],
  },
  {
    id: 'land-price',
    props: (lang) => ({ lang, text: islandText(lang, LP_COPY), title: 't' }),
    load: () => import('../src/islands/land-price.ts'),
    urls: ['', '?unit=decimal&area=10', '?area=0', '?unit=hectare'],
  },
  {
    id: 'gold-converter',
    props: (lang) => ({ lang, text: islandText(lang, GOLD_COPY), rates: ratesJson.value, title: 't' }),
    load: () => import('../src/islands/gold-converter.ts'),
    urls: ['', '?k=18', '?p=200000&r=3', '?v=abc'],
  },
  {
    id: 'jewelry-bill',
    props: (lang) => ({ lang, text: islandText(lang, JB_COPY), rates: ratesJson.value, title: 't' }),
    load: () => import('../src/islands/jewelry-bill.ts'),
    urls: ['', '?v=0', '?mk=120', '?p=200000&vat=0'],
  },
]

describe.each(CASES)('$id island with only its own strings', ({ id, props, load, urls }) => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
  })

  it.each(['bn', 'en'] as const)('%s: every state renders and the report sheet opens', async (lang) => {
    const given = props(lang)
    vi.resetModules()
    const mod = await load()
    const Island = Object.values(mod).find((v) => typeof v === 'function') as FunctionComponent<Record<string, unknown>>
    for (const query of urls) {
      window.history.replaceState(null, '', `/tools/${id}${query}`)
      const errors: unknown[] = []
      const onError = (e: ErrorEvent) => errors.push(e.error)
      window.addEventListener('error', onError)
      const view = render(<Island {...given} />)
      await waitFor(() => expect(document.querySelector('[data-calculator-results]')?.textContent).toBeTruthy())
      window.removeEventListener('error', onError)
      expect(errors, query).toEqual([])
      view.unmount()
    }
    window.history.replaceState(null, '', `/tools/${id}`)
    render(<Island {...given} />)
    fireEvent.click(screen.getByText(lang === 'bn' ? 'ভুল পেলেন?' : 'Found a mistake?'))
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeTruthy())
  })
})
