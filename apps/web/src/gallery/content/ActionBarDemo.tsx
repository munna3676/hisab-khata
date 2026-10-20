// Gallery island: Action Bar with handlers. The real share/print/report wiring comes
// from the platform adapter later; here each press is just announced.
import { ActionBar } from '@hisab/ui/content'
import { useState } from 'preact/hooks'

export default function ActionBarDemo() {
  const [last, setLast] = useState('কিছু চাপা হয়নি')
  return (
    <div class="grid gap-2">
      <ActionBar
        onShare={() => setLast('শেয়ার চাপা হয়েছে')}
        onPdf={() => setLast('PDF চাপা হয়েছে')}
        onReport={() => setLast('ভুল জানানো চাপা হয়েছে')}
      />
      <p class="type-body-small text-soft" aria-live="polite">
        {last}
      </p>
    </div>
  )
}
