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
