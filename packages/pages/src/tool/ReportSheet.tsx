// "ভুল পেলেন?" sheet (Figma S2): loaded by ToolActions on the first tap, so BottomSheet, the form
// and preact/compat stay out of the page's initial JavaScript.
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/t'
import { BottomSheet } from '@hisab/ui/overlay/BottomSheet'
import { ReportErrorForm, type ReportErrorData, type ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'

export interface ReportSheetProps {
  lang: Lang
  open: boolean
  items: readonly ReportErrorItem[]
  sending: boolean
  onClose: () => void
  onSubmit: (data: ReportErrorData) => void
}

export function ReportSheet({ lang, open, items, sending, onClose, onSubmit }: ReportSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t(lang, 'sheet.reportError.title')}
      description={t(lang, 'sheet.reportError.body')}
      closeLabel={t(lang, 'action.close')}
    >
      <ReportErrorForm
        items={items}
        itemLabel={t(lang, 'sheet.reportError.whichNumber')}
        correctLabel={t(lang, 'sheet.reportError.correctInfo')}
        correctPlaceholder={t(lang, 'sheet.reportError.correctPlaceholder')}
        sourceLabel={t(lang, 'sheet.reportError.sourceLink')}
        submitLabel={t(lang, 'sheet.reportError.submit')}
        submitting={sending}
        onSubmit={onSubmit}
      />
    </BottomSheet>
  )
}
