// Gallery island: the date picker in a sheet (dialog from lg), with Bangla or English digits.
import { Button, SegmentedControl } from '@hisab/ui/base'
import { Calendar } from '@hisab/ui/icons'
import { DatePickerSheet, formatYMD, fromDate } from '@hisab/ui/overlay'
import { useState } from 'preact/hooks'
import { GALLERY_TODAY } from './data'

export default function DatePickerDemo() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(new Date(2000, 2, 15))
  const [digits, setDigits] = useState<'bn' | 'en'>('bn')
  return (
    <div class="grid max-w-form gap-3">
      <SegmentedControl
        label="অঙ্ক"
        options={[
          { value: 'bn', label: 'বাংলা অঙ্ক' },
          { value: 'en', label: 'English digits' },
        ]}
        value={digits}
        onChange={(v) => setDigits(v as 'bn' | 'en')}
      />
      <Button variant="secondary" icon={<Calendar />} onClick={() => setOpen(true)}>
        জন্ম তারিখ: {formatYMD(fromDate(date), 'bn', digits)}
      </Button>
      <DatePickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title="জন্ম তারিখ"
        value={date}
        onSelect={setDate}
        onConfirm={setDate}
        digits={digits}
        today={GALLERY_TODAY}
      />
    </div>
  )
}
