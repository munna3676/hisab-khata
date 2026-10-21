import type { JSX } from 'preact'
import { Button } from '../base/Button'
import { Download } from '../icons/glyphs/Download'
import { Flag } from '../icons/glyphs/Flag'
import { Share } from '../icons/glyphs/Share'
import { cx } from '../lib/cx'

export type ActionBarAction = 'share' | 'pdf' | 'report'

export interface ActionBarLabels {
  /** Default "শেয়ার". */
  share: string
  /** Default "PDF". */
  pdf: string
  /** Default "ভুল পেলেন?". */
  report: string
  /** Name of the button group for screen readers. */
  group: string
}

const DEFAULT_LABELS: ActionBarLabels = {
  share: 'শেয়ার',
  pdf: 'PDF',
  report: 'ভুল পেলেন?',
  group: 'ফলাফল শেয়ার, সেভ বা ভুল জানানো',
}

type Handler = (event: JSX.TargetedMouseEvent<HTMLElement>) => void

export interface ActionBarProps {
  /** Share the result image or link (platform share()). */
  onShare?: Handler
  /** Save as PDF (print()). */
  onPdf?: Handler
  /** Report a wrong number: a handler (opens the report sheet) or a link to the report form. */
  onReport?: Handler
  reportHref?: string
  /** Actions to leave out, e.g. ['pdf'] on a page with nothing to print. */
  hide?: readonly ActionBarAction[]
  labels?: Partial<ActionBarLabels>
  class?: string
}

/**
 * Action Bar (Figma 9:314): share (primary), PDF (secondary) and "ভুল পেলেন?" (ghost),
 * 44px tall, 8px apart. As in Figma the buttons split the row into equal thirds at every
 * width (342px phone, 676/732/1080px desktop). The ghost column never gets narrower than
 * its own label, so on a 320-360px phone it keeps its text and the other two give way.
 */
export function ActionBar({ onShare, onPdf, onReport, reportHref, hide = [], labels, class: className }: ActionBarProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const show = (a: ActionBarAction) => !hide.includes(a)
  const columns = [show('share') && 'minmax(0,1fr)', show('pdf') && 'minmax(0,1fr)', show('report') && 'minmax(max-content,1fr)']
    .filter(Boolean)
    .join(' ')

  return (
    <div class={cx('min-w-0', className)} data-action-bar>
      <div role="group" aria-label={l.group} class="grid gap-2" style={{ gridTemplateColumns: columns }}>
        {show('share') && (
          <Button variant="primary" icon={<Share />} onClick={onShare} class="min-w-0 px-3!">
            {l.share}
          </Button>
        )}
        {show('pdf') && (
          <Button variant="secondary" icon={<Download />} onClick={onPdf} class="min-w-0 px-3!">
            {l.pdf}
          </Button>
        )}
        {show('report') &&
          (typeof reportHref === 'string' ? (
            <Button variant="ghost" icon={<Flag />} href={reportHref} onClick={onReport} class="px-0.5!">
              {l.report}
            </Button>
          ) : (
            <Button variant="ghost" icon={<Flag />} onClick={onReport} class="px-0.5!">
              {l.report}
            </Button>
          ))}
      </div>
    </div>
  )
}
