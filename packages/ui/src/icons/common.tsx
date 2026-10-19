// Generic icons every group may use. Read-only for component builders: add
// group-specific icons to ./base.tsx, ./nav.tsx, ./content.tsx or ./overlay.tsx.
import { Icon, type IconProps } from './Icon'

export const ChevronLeft = (p: IconProps) => <Icon {...p}><path d="M15 5l-7 7 7 7" /></Icon>
export const ChevronRight = (p: IconProps) => <Icon {...p}><path d="M9 5l7 7-7 7" /></Icon>
export const ChevronDown = (p: IconProps) => <Icon {...p}><path d="M5 9l7 7 7-7" /></Icon>
export const ChevronUp = (p: IconProps) => <Icon {...p}><path d="M5 15l7-7 7 7" /></Icon>
export const Close = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
export const Check = (p: IconProps) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
export const Plus = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const Minus = (p: IconProps) => <Icon {...p}><path d="M5 12h14" /></Icon>
export const Search = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></Icon>
export const Info = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Icon>
export const Alert = (p: IconProps) => <Icon {...p}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></Icon>
export const Sun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Icon>
)
export const Moon = (p: IconProps) => <Icon {...p}><path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z" /></Icon>
