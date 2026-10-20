// Static (zero-JS) gallery compositions. Astro cannot pass JSX elements as props to a
// Preact component, so specimens whose props take components are composed here.
import { Button } from '@hisab/ui/base'
import { EmptyState, ShareCardPreview, ShareSheetBody } from '@hisab/ui/overlay'
import { SHARE_CARD } from './data'

export function ShareBodySpecimen() {
  return <ShareSheetBody preview={<ShareCardPreview {...SHARE_CARD} />} />
}

export function EmptySearchSpecimen() {
  return (
    <EmptyState
      title={'"প্রাইজবন্ড ড্র" নিয়ে কিছু পাইনি'}
      description="অন্য বানানে খুঁজে দেখো, অথবা টুলটা চাও বলে জানাও।"
      headingLevel={4}
      action={<Button variant="secondary">নতুন টুলের অনুরোধ</Button>}
    />
  )
}
