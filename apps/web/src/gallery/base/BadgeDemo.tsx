// Gallery island: replays the 'Best' badge entrance (fade + scale; a plain fade under reduced motion).
import { Badge, Button } from '@hisab/ui/base'
import { useState } from 'preact/hooks'

export default function BadgeDemo() {
  const [run, setRun] = useState(0)
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Badge key={run} tone="good" appear>
        সাশ্রয়ী
      </Badge>
      <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
        আবার দেখাও
      </Button>
    </div>
  )
}
