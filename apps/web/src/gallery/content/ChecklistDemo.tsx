// Gallery island: the NID guide's documents checklist (Figma Guide 17:1577), live.
// Ticking a box draws the tick (240 ms) and updates the "২/৫ রেডি" badge, which
// screen readers hear politely. Progress is saved in this browser under a gallery key.
import { Checklist } from '@hisab/ui/content'

const ITEMS = [
  { id: 'ssc', label: 'এসএসসি বা সমমানের সনদ' },
  { id: 'birth', label: 'জন্ম নিবন্ধন সনদের কপি' },
  { id: 'parents-nid', label: 'বাবা-মায়ের NID কপি' },
  { id: 'citizenship', label: 'নাগরিকত্ব সনদ (প্রয়োজনে)' },
  { id: 'proof', label: 'ভুলের প্রমাণ দেয় এমন অন্য কাগজ' },
]

export default function ChecklistDemo() {
  return (
    <Checklist
      title="কাগজপত্র"
      titleAs="h4"
      items={ITEMS}
      defaultChecked={['ssc', 'birth']}
      storageKey="hk-gallery-checklist-nid"
      name="nid-docs"
      hint="টিক দিলে তোমার ফোনেই সেভ থাকে, প্রিন্ট বা PDF করা যায়।"
    />
  )
}
