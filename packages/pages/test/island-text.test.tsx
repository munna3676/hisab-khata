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
