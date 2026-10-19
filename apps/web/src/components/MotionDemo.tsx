// Token showcase island: count-up (motion's animate, loaded lazily) and a
// replayable rise-in, both following html[data-motion].
import { formatTaka } from '@hisab/core/lib/format'
import { countUp, SETTINGS_EVENT } from '@hisab/ui/lib'
import { useEffect, useState } from 'preact/hooks'

interface Props {
  lang: 'bn' | 'en'
  value: number
  label: string
  replay: string
}

export default function MotionDemo({ lang, value, label, replay }: Props) {
  const [shown, setShown] = useState(value)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    void countUp(value, setShown, { signal: ctrl.signal })
    return () => ctrl.abort()
  }, [value, run])

  useEffect(() => {
    const again = () => setRun((n) => n + 1)
    window.addEventListener(SETTINGS_EVENT, again)
    return () => window.removeEventListener(SETTINGS_EVENT, again)
  }, [])

  return (
    <div class="flex flex-wrap items-center gap-4">
      <div key={run} class="animate-rise-in rounded-card border border-line bg-sheet px-4 py-3">
        <div class="type-label text-soft">{label}</div>
        <output class="type-number-l text-accent" aria-live="polite">
          {formatTaka(Math.round(shown), { digits: lang })}
        </output>
      </div>
      <button
        type="button"
        class="pressable min-h-touch rounded-input border border-line bg-sheet px-4 type-label text-ink"
        onClick={() => setRun((n) => n + 1)}
      >
        {replay}
      </button>
    </div>
  )
}
