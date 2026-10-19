// Gallery island: Segmented Control, live. The accent block slides over --duration-tab.
import { SegmentedControl } from '@hisab/ui/base'
import { useState } from 'preact/hooks'

interface Props {
  /** Which option starts selected (Figma Selected=1 / Selected=2). */
  initial?: string
  /** Show the three-option variant. */
  three?: boolean
}

const TWO = [
  { value: 'charge', label: 'তুললে চার্জ কত' },
  { value: 'reverse', label: 'কত তোলা যাবে' },
]
const THREE = [
  { value: 'month', label: 'মাসিক' },
  { value: 'year', label: 'বার্ষিক' },
  { value: 'total', label: 'মোট' },
]

export default function SegmentedDemo({ initial, three = false }: Props) {
  const options = three ? THREE : TWO
  const [value, setValue] = useState(initial ?? options[0]!.value)
  return (
    <div class="grid gap-2">
      <SegmentedControl label={three ? 'সময়কাল' : 'হিসাবের ধরন'} options={options} value={value} onChange={setValue} />
      <p class="type-body-small text-soft" aria-live="polite">
        বাছাই: <span class="font-number">{value}</span>
      </p>
    </div>
  )
}
