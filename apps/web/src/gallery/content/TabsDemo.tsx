// Gallery island: Tab Bar with panels, live. Click or use Left/Right/Home/End: the
// indicator slides to the new tab (220 ms, transform only) and the panel switches.
// `count` shows the 1-5 tab variants; `manual` waits for Enter/Space after arrow keys.
import { TabBar, TabPanel } from '@hisab/ui/content'
import { useState } from 'preact/hooks'

interface Props {
  id: string
  count?: 1 | 2 | 3 | 4 | 5
  manual?: boolean
}

const TABS = [
  { value: 'cashout', label: 'ক্যাশ আউট', body: 'এজেন্ট, ATM বা ব্যাংক থেকে টাকা তোলার চার্জ।' },
  { value: 'send', label: 'সেন্ড মানি', body: 'এক নম্বর থেকে আরেক নম্বরে টাকা পাঠানোর চার্জ।' },
  { value: 'cashin', label: 'ক্যাশ ইন', body: 'এজেন্ট বা ব্যাংক থেকে ওয়ালেটে টাকা আনা।' },
  { value: 'billpay', label: 'বিল পে', body: 'বিদ্যুৎ, গ্যাস, পানি আর ইন্টারনেট বিল।' },
  { value: 'limit', label: 'লিমিট', body: 'দিনে আর মাসে কত টাকা লেনদেন করা যায়।' },
] as const

export default function TabsDemo({ id, count = 5, manual = false }: Props) {
  const tabs = TABS.slice(0, count)
  const [value, setValue] = useState<string>(tabs[0]!.value)
  return (
    <div class="overflow-hidden rounded-card border border-line bg-sheet">
      <TabBar
        id={id}
        label="চার্জের ধরন"
        items={tabs.map(({ value, label }) => ({ value, label }))}
        value={value}
        onChange={setValue}
        panels
        activation={manual ? 'manual' : 'auto'}
      />
      {tabs.map((tab) => (
        <TabPanel key={tab.value} tabsId={id} value={tab.value} selected={tab.value === value} class="p-4 type-body-small text-soft">
          {tab.body}
        </TabPanel>
      ))}
    </div>
  )
}
