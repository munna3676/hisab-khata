import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/t'
import { ActionBar } from '@hisab/ui/content/ActionBar'
import type { ReportErrorData, ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { ToastOptions, ToastViewportProps } from '@hisab/ui/overlay/Toast'
import { formatDateIn } from '@hisab/i18n/format'
import type { ComponentType } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { ReportSheetProps } from './ReportSheet.tsx'

/** Where "ভুল পেলেন?" reports go: the Cloudflare Worker (docs/decisions/0001-stack.md, Backend). */
export const REPORT_ENDPOINT = '/api/report'

export interface ToolActionsProps {
  lang: Lang
  /** Registry id, sent with a report. */
  toolId: string
  /** Share title (the page name) and a one-line summary of the result. */
  title: string
  shareText?: string
  /** The numbers on the page a person can report. */
  reportItems: readonly ReportErrorItem[]
  /** Override the report transport (the app, tests). Resolve true when the report was accepted. */
  sendReport?: (report: ReportErrorData & { toolId: string; url: string }) => Promise<boolean>
  class?: string
}

export async function postReport(report: ReportErrorData & { toolId: string; url: string }): Promise<boolean> {
  try {
    const response = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(report),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * The calculator's action bar (Figma Action Bar 13:567): share the link to this exact result
 * (the URL carries the inputs), PDF/print through the platform adapter (window.print on the web,
 * the native printer in the app; print CSS lays the page out for A4), and "ভুল পেলেন?", which
 * opens the report sheet (Figma S2). One toast region per page lives here. The sheet (BottomSheet,
 * the form, preact/compat) is loaded on the first tap, not with the page.
 */
export function ToolActions({ lang, toolId, title, shareText, reportItems, sendReport = postReport, class: className }: ToolActionsProps) {
  const [reporting, setReporting] = useState(false)
  const [sending, setSending] = useState(false)
  const [Sheet, setSheet] = useState<ComponentType<ReportSheetProps> | null>(null)
  // Toasts load on the first one. The live region mounts empty first and the toast is added a
  // moment later, so screen readers still announce it.
  const [Viewport, setViewport] = useState<ComponentType<ToastViewportProps> | null>(null)
  const viewportReady = useRef<Promise<void> | null>(null)
  const markReady = useRef<() => void>(() => undefined)
  useEffect(() => {
    if (Viewport) setTimeout(() => markReady.current(), 60)
  }, [Viewport])
  const toast = async (options: ToastOptions | string) => {
    const m = await import('@hisab/ui/overlay/Toast')
    viewportReady.current ??= new Promise<void>((resolve) => {
      markReady.current = resolve
      setViewport(() => m.ToastViewport)
    })
    await viewportReady.current
    m.toaster.show(options)
  }
  const openReport = () => {
    setReporting(true)
    if (!Sheet) {
      import('./ReportSheet.tsx').then(
        (m) => setSheet(() => m.ReportSheet),
        () => {
          setReporting(false)
          void toast({ message: t(lang, 'toast.reportFailed'), tone: 'warn' })
        },
      )
    }
  }
  // The printed page says when and where it came from (the link restores these inputs).
  const [printedOn, setPrintedOn] = useState('')
  useEffect(() => {
    const stamp = () => setPrintedOn(t(lang, 'content.printedOn', { date: formatDateIn(lang, new Date()), site: window.location.href }))
    stamp()
    window.addEventListener('beforeprint', stamp)
    return () => window.removeEventListener('beforeprint', stamp)
  }, [lang])

  // The platform adapter (share sheet, print) loads on the first tap, not with the page.
  const loadPlatform = async () => (await import('@hisab/platform/index')).getPlatform()

  const share = async () => {
    const platform = await loadPlatform()
    void platform.haptic('tap')
    const outcome = await platform.share({ title, text: shareText, url: window.location.href })
    if (outcome === 'copied') void toast(t(lang, 'toast.linkCopied'))
    else if (outcome === 'unsupported') void toast({ message: t(lang, 'toast.shareFailed'), tone: 'warn' })
  }

  const submit = async (data: ReportErrorData) => {
    setSending(true)
    const ok = await sendReport({ ...data, toolId, url: window.location.href })
    setSending(false)
    if (ok) {
      setReporting(false)
      void toast(t(lang, 'toast.reportSent'))
    } else {
      void toast({ message: t(lang, 'toast.reportFailed'), tone: 'warn' })
    }
  }

  return (
    <>
    <p class="type-body-small break-all text-soft" data-print-only>
      {printedOn}
    </p>
    <div class={className} data-print-hide>
      <ActionBar
        labels={{ share: t(lang, 'action.share'), pdf: 'PDF', report: t(lang, 'action.reportError'), group: t(lang, 'action.actionBar') }}
        onShare={() => void share()}
        onPdf={() => void loadPlatform().then((p) => p.print())}
        onReport={openReport}
      />
      {Sheet && (
        <Sheet lang={lang} open={reporting} items={reportItems} sending={sending} onClose={() => setReporting(false)} onSubmit={(data) => void submit(data)} />
      )}
      {Viewport && <Viewport label={t(lang, 'toast.region')} />}
    </div>
    </>
  )
}
