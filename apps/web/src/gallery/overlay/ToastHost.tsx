// The page's one toast live region (fixed). Hydrated on load so toasts from any island show.
import { ToastViewport } from '@hisab/ui/overlay'

export default function ToastHost() {
  return <ToastViewport />
}
