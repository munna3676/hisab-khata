// Gallery island: the four Figma sheets, live. Below lg they slide up (drag the handle
// down to dismiss); from lg they open as centred dialogs. Sending the report shows the
// T1 toast, copying the link the T2 toast (ToastHost must be on the page).
import { Button } from '@hisab/ui/base'
import { Download, Flag, Share, Star } from '@hisab/ui/icons'
import {
  BottomSheet,
  InstallAppPrompt,
  RateAlertForm,
  ReportErrorForm,
  ShareCardPreview,
  ShareSheetBody,
  toaster,
} from '@hisab/ui/overlay'
import { useState } from 'preact/hooks'
import { REPORT_ITEMS, SHARE_CARD } from './data'

type Which = 'share' | 'report' | 'alert' | 'install' | null

export default function SheetDemo() {
  const [open, setOpen] = useState<Which>(null)
  const close = () => setOpen(null)
  return (
    <div class="flex flex-wrap gap-3">
      <Button variant="secondary" icon={<Share />} onClick={() => setOpen('share')}>
        শেয়ার করো
      </Button>
      <Button variant="secondary" icon={<Flag />} onClick={() => setOpen('report')}>
        ভুল পেলেন?
      </Button>
      <Button variant="secondary" icon={<Star />} onClick={() => setOpen('alert')}>
        চার্জ বদলালে জানাও
      </Button>
      <Button variant="secondary" icon={<Download />} onClick={() => setOpen('install')}>
        অ্যাপ ইনস্টল
      </Button>

      <BottomSheet open={open === 'share'} onClose={close} title="শেয়ার করো" description="ফলাফলটা ছবি বা লিংক হিসেবে পাঠাও।">
        <ShareSheetBody
          preview={<ShareCardPreview {...SHARE_CARD} />}
          onSelect={(id) => {
            close()
            if (id === 'copy-link') toaster.show('লিংক কপি হয়েছে। হোয়াটসঅ্যাপ বা মেসেঞ্জারে পেস্ট করো।')
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={open === 'report'}
        onClose={close}
        title="ভুল পেলেন?"
        description="তোমার রিপোর্ট দেখে আমরা যাচাই করে ঠিক করব। নাম বা ফোন নম্বর লাগবে না।"
      >
        <ReportErrorForm
          items={REPORT_ITEMS}
          onSubmit={() => {
            close()
            toaster.show('ধন্যবাদ! রিপোর্ট পেয়েছি, ২৪ ঘণ্টার মধ্যে যাচাই করব।')
          }}
        />
      </BottomSheet>

      <BottomSheet open={open === 'alert'} onClose={close} title="চার্জ বদলালে জানাও" description="লগইন লাগবে না। যেকোনো সময় বন্ধ করা যায়।">
        <RateAlertForm
          onSubmit={() => {
            close()
            toaster.show('রেট অ্যালার্ট চালু হয়েছে।')
          }}
          onWhatsapp={close}
        />
      </BottomSheet>

      <BottomSheet open={open === 'install'} onClose={close} labelledBy="gallery-install-title">
        <InstallAppPrompt titleId="gallery-install-title" onLater={close} onInstall={close} />
      </BottomSheet>
    </div>
  )
}
