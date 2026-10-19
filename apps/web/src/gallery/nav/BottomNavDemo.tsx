// Gallery island: a live BottomNav. Tapping a tab moves aria-current and slides
// the indicator (transform only, --duration-tab), the way the app shell routes in place.
import { BottomNav, type BottomNavId } from '@hisab/ui/nav'
import { useState } from 'preact/hooks'

export default function BottomNavDemo({ initial = 'home' }: { initial?: BottomNavId }) {
  const [active, setActive] = useState<BottomNavId>(initial)
  return (
    <BottomNav
      placement="static"
      label="নমুনা নিচের মেনু"
      active={active}
      onSelect={(id, event) => {
        event.preventDefault()
        setActive(id)
      }}
    />
  )
}
