// Gallery island: fires toasts into the page's ToastHost. They slide up above the bottom
// nav (below lg) or near the bottom (lg+), are announced politely and leave after 4 s
// (paused while hovered or focused).
import { Button } from '@hisab/ui/base'
import { toaster } from '@hisab/ui/overlay'

export default function ToastDemo() {
  return (
    <div class="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => toaster.show('ধন্যবাদ! রিপোর্ট পেয়েছি, ২৪ ঘণ্টার মধ্যে যাচাই করব।')}>
        T1 রিপোর্ট পাঠানো
      </Button>
      <Button variant="secondary" onClick={() => toaster.show('লিংক কপি হয়েছে। হোয়াটসঅ্যাপ বা মেসেঞ্জারে পেস্ট করো।')}>
        T2 লিংক কপি
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toaster.show({
            message: 'হিসাবটা সেভ থেকে সরানো হয়েছে।',
            tone: 'info',
            action: { label: 'ফেরত আনো', onClick: () => toaster.show('আবার সেভ হয়েছে।') },
          })
        }
      >
        অ্যাকশনসহ
      </Button>
    </div>
  )
}
