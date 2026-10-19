// Gallery island: NumberField + quick-value chips + a live ledger, as on a calculator.
// Type Bangla (৫০০০) or English (5000) digits, commas or ৳; results update on every keystroke.
import { formatTaka } from '@hisab/core/lib/format'
import { KVList, KVRow, NumberField, QuickValues } from '@hisab/ui/base'
import { useState } from 'preact/hooks'

const RATE_PER_THOUSAND = 18.5

export default function AmountDemo() {
  const [amount, setAmount] = useState<number | null>(5000)
  const charge = amount !== null && amount >= 50 ? Math.round(amount * RATE_PER_THOUSAND) / 1000 : null
  return (
    <div class="grid max-w-form gap-3">
      <NumberField
        label="কত টাকা ক্যাশ আউট করবে?"
        prefix="৳"
        helper="বিকাশ প্রিয় এজেন্টের মাসিক লিমিট ৫০,০০০ টাকা"
        min={50}
        max={50000}
        unit="টাকা"
        value={amount}
        onValueChange={(value) => setAmount(value)}
      />
      <QuickValues label="দ্রুত পরিমাণ" values={[1000, 5000, 10000, 25000]} value={amount} onPick={setAmount} />
      <KVList aria-live="polite">
        <KVRow label="চার্জ (১৮.৫০/হাজার)" value={charge === null ? '—' : formatTaka(charge)} />
        <KVRow label="মোট লাগবে" value={charge === null || amount === null ? '—' : formatTaka(amount + charge)} total />
      </KVList>
    </div>
  )
}
