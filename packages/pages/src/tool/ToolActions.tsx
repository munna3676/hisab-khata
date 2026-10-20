import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { getPlatform } from '@hisab/platform/index'
import { ActionBar } from '@hisab/ui/content'
import { BottomSheet, ReportErrorForm, ToastViewport, toaster, type ReportErrorData, type ReportErrorItem } from '@hisab/ui/overlay'
import { formatDateIn } from '@hisab/i18n/format'
import { useEffect, useState } from 'preact/hooks'

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

async function postReport(report: ReportErrorData & { toolId: string; url: string }): Promise<boolean> {
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
 * opens the report sheet (Figma S2). One toast region per page lives here.
 */
export function ToolActions({ lang, toolId, title, shareText, reportItems, sendReport = postReport, class: className }: ToolActionsProps) {
  const [reporting, setReporting] = useState(false)
  const [sending, setSending] = useState(false)
  // The printed page says when and where it came from (the link restores these inputs).
  const [printedOn, setPrintedOn] = useState('')
  useEffect(() => {
    const stamp = () => setPrintedOn(t(lang, 'content.printedOn', { date: formatDateIn(lang, new Date()), site: window.location.href }))
    stamp()
    window.addEventListener('beforeprint', stamp)
    return () => window.removeEventListener('beforeprint', stamp)
  }, [lang])

  const share = async () => {
    const platform = getPlatform()
    void platform.haptic('tap')
    const outcome = await platform.share({ title, text: shareText, url: window.location.href })
    if (outcome === 'copied') toaster.show(t(lang, 'toast.linkCopied'))
    else if (outcome === 'unsupported') toaster.show({ message: t(lang, 'toast.shareFailed'), tone: 'warn' })
  }

  const submit = async (data: ReportErrorData) => {
    setSending(true)
    const ok = await sendReport({ ...data, toolId, url: window.location.href })
    setSending(false)
    if (ok) {
      setReporting(false)
      toaster.show(t(lang, 'toast.reportSent'))
    } else {
      toaster.show({ message: t(lang, 'toast.reportFailed'), tone: 'warn' })
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
        onPdf={() => void getPlatform().print()}
        onReport={() => setReporting(true)}
      />
      <BottomSheet
        open={reporting}
        onClose={() => setReporting(false)}
        title={t(lang, 'sheet.reportError.title')}
        description={t(lang, 'sheet.reportError.body')}
        closeLabel={t(lang, 'action.close')}
      >
        <ReportErrorForm
          items={reportItems}
          itemLabel={t(lang, 'sheet.reportError.whichNumber')}
          correctLabel={t(lang, 'sheet.reportError.correctInfo')}
          correctPlaceholder={t(lang, 'sheet.reportError.correctPlaceholder')}
          sourceLabel={t(lang, 'sheet.reportError.sourceLink')}
          submitLabel={t(lang, 'sheet.reportError.submit')}
          submitting={sending}
          onSubmit={(data) => void submit(data)}
        />
      </BottomSheet>
      <ToastViewport label={t(lang, 'toast.region')} />
    </div>
    </>
  )
}
