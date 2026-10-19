// Gallery island: ResultCard with a live value. Picking an amount counts the
// charge up from the shown number; "আবার দেখাও" remounts the card, so it rises
// in and counts from 0. Nothing animates before the first tap, which keeps the
// gallery screenshots stable. The rate is a sample, not data.
import { formatTaka } from '@hisab/core/lib/format'
import { ResultCard } from '@hisab/ui/nav'
import { useState } from 'preact/hooks'

const AMOUNTS = [1000, 5000, 25000]
const SAMPLE_PER_1000 = 18.5

export default function ResultCardDemo() {
  const [amount, setAmount] = useState(5000)
  const [run, setRun] = useState(0)
  const [touched, setTouched] = useState(false)
  const charge = Math.round(amount * SAMPLE_PER_1000) / 1000

  return (
    <div class="grid gap-3">
      <ResultCard
        key={run}
        label="ক্যাশ আউট চার্জ (নমুনা হার ১৮.৫০/হাজার)"
        value={charge}
        countUp={touched}
        sub={`হাতে পাবে ${formatTaka(amount)} · ওয়ালেটে রাখতে হবে ${formatTaka(amount + charge, { decimals: 2 })}`}
      />
      <div class="flex flex-wrap gap-2" role="group" aria-label="টাকার পরিমাণ">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={a === amount}
            class="pressable min-h-touch rounded-full border border-line bg-sheet px-4 type-label text-ink aria-pressed:border-accent aria-pressed:bg-accent-tint aria-pressed:text-accent"
            onClick={() => {
              setTouched(true)
              setAmount(a)
            }}
          >
            {formatTaka(a)}
          </button>
        ))}
        <button
          type="button"
          class="pressable min-h-touch rounded-full px-4 type-label text-blue"
          onClick={() => {
            setTouched(true)
            setRun((n) => n + 1)
          }}
        >
          আবার দেখাও
        </button>
      </div>
    </div>
  )
}
