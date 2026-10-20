// Gallery island: one Guide Wizard step (Figma 17:1843), live. Native radios: arrow
// keys move the choice, the card turns accent-tint with a 2px accent border.
import { WizardOptionGroup } from '@hisab/ui/content'
import { useState } from 'preact/hooks'

const OPTIONS = [
  { value: 'name', label: 'নিজের নাম' },
  { value: 'parents', label: 'বাবা-মায়ের নাম' },
  { value: 'dob', label: 'জন্ম তারিখ' },
  { value: 'address', label: 'ঠিকানা' },
  { value: 'other', label: 'অন্য কিছু' },
]

export default function WizardDemo() {
  const [value, setValue] = useState('parents')
  const chosen = OPTIONS.find((o) => o.value === value)
  return (
    <div class="grid gap-3">
      <WizardOptionGroup legend="NID তে কোন তথ্য ভুল আছে?" options={OPTIONS} value={value} onChange={setValue} name="nid-wrong" />
      <p class="type-body-small text-soft" aria-live="polite">
        বাছাই: {chosen?.label}
      </p>
    </div>
  )
}
