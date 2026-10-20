// Gallery island: the country and district pickers, live. Type in Bangla, Banglish or
// English ("dhaka", "daka", "chittagong", "saudi"); ↑/↓ and Enter work in the search box.
import { Button } from '@hisab/ui/base'
import { ChevronDown } from '@hisab/ui/icons'
import { PickerSheet } from '@hisab/ui/overlay'
import { useState } from 'preact/hooks'
import { COUNTRIES, DISTRICTS, DISTRICT_GROUPS } from './data'

export default function PickerDemo() {
  const [which, setWhich] = useState<'country' | 'district' | null>(null)
  const [country, setCountry] = useState('SA')
  const [district, setDistrict] = useState('dhaka')
  const countryName = COUNTRIES.find((c) => c.value === country)?.label
  const districtName = DISTRICTS.find((d) => d.value === district)?.label
  return (
    <div class="flex flex-wrap gap-3">
      <Button variant="secondary" iconEnd={<ChevronDown />} onClick={() => setWhich('country')}>
        দেশ: {countryName}
      </Button>
      <Button variant="secondary" iconEnd={<ChevronDown />} onClick={() => setWhich('district')}>
        জেলা: {districtName}
      </Button>
      <PickerSheet
        open={which === 'country'}
        onClose={() => setWhich(null)}
        title="কোন দেশ থেকে পাঠাবে?"
        label="দেশ"
        searchPlaceholder="দেশের নাম লেখো"
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
      />
      <PickerSheet
        open={which === 'district'}
        onClose={() => setWhich(null)}
        title="জেলা বেছে নাও"
        label="জেলা"
        searchPlaceholder="জেলার নাম লেখো"
        caption="৬৪ জেলা · বিভাগীয় শহর আগে"
        options={DISTRICTS}
        groups={DISTRICT_GROUPS}
        value={district}
        onChange={setDistrict}
      />
    </div>
  )
}
