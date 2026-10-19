// Icons used by the base group. Owned by the base builder.
// Source: Figma MUjojuzU7TFg6rKcfZhByP, Design System › Icons (node 3:2): 24px frame,
// 1.75 stroke, round caps and joins. Paths are the Figma vectors exported as SVG,
// with stroke colour replaced by currentColor (through the shared <Icon> wrapper).
//
// Names must be unique across all icon files (they are re-exported from ./index),
// so the ten Figma icons that common.tsx already names (Search, ChevronLeft/Right/Down,
// Moon, Check, Alert, Info, Close = "x", Plus) are not exported by name here.
// ICON_SET below maps every Figma icon name to a component. Check, Close and Plus are
// identical to Figma, so it reuses them. The other seven differ slightly from the
// Figma vectors in common.tsx, so ICON_SET carries the exact Figma geometry for them.
import type { FunctionComponent } from 'preact'
import { Check, Close, Plus } from './common'
import { Icon, type IconProps } from './Icon'

export const Home = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 10.5L12 3.5l8.5 7V20a1 1 0 01-1 1H15v-6H9v6H4.5a1 1 0 01-1-1v-9.5z" />
  </Icon>
)
export const Star = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.7l6.2-.9L12 3z" />
  </Icon>
)
export const Share = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 13.2l7.6 4.1M15.8 6.7l-7.6 4.1" />
  </Icon>
)
export const Download = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5V15M7 10.5l5 5 5-5M5 20.5h14" />
  </Icon>
)
export const Globe = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5s1.2-6.1 3.6-8.5z" />
  </Icon>
)
export const Wallet = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18M15.5 15H18" />
  </Icon>
)
export const Bank = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 9.5L12 4l9 5.5M5.5 10.5v7M10 10.5v7M14 10.5v7M18.5 10.5v7M3 20h18" />
  </Icon>
)
export const Send = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.5 3.5L10 14m0 0l-6.5-4 17-6.5-6.5 17L10 14z" />
  </Icon>
)
export const Calculator = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2" />
    <path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h7" />
  </Icon>
)
export const Calendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
)
export const Land = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6.5L9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </Icon>
)
export const Guide = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H6.5A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V8l-5-5z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h5" />
  </Icon>
)
export const Grid = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Icon>
)
export const Bookmark = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4v-17z" />
  </Icon>
)
export const Flag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 21V4h11l-2 4 2 4h-11" />
  </Icon>
)
export const Message = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.5 11.5C20.51 12.96 20.14 14.4 19.43 15.68C18.72 16.96 17.69 18.03 16.44 18.79C15.2 19.56 13.77 19.99 12.31 20.04C10.85 20.1 9.4 19.77 8.1 19.1L3.5 20.5L4.9 16.1C4.17 14.99 3.71 13.73 3.56 12.41C3.4 11.09 3.56 9.75 4.02 8.5C4.48 7.26 5.22 6.14 6.19 5.23C7.15 4.32 8.32 3.65 9.6 3.27C10.87 2.9 12.21 2.83 13.52 3.06C14.83 3.3 16.06 3.84 17.12 4.64C18.18 5.44 19.04 6.48 19.62 7.67C20.21 8.86 20.51 10.17 20.5 11.5Z" />
  </Icon>
)
export const WifiOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3L21 21M8.5 16.5C9.43 15.58 10.69 15.07 12 15.07C13.31 15.07 14.57 15.58 15.5 16.5M12 20H12.01M5 12.6C6.13 11.5 7.5 10.67 9 10.2M19 12.6C18.15 11.8 17.17 11.16 16.1 10.7M2 8.8C3.31 7.69 4.8 6.81 6.4 6.2M22 8.8C20.49 7.52 18.74 6.55 16.85 5.95C14.96 5.35 12.97 5.13 11 5.3" />
  </Icon>
)
export const Coin = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v10M14.8 9.4c-.4-.9-1.5-1.5-2.8-1.5-1.6 0-2.8.9-2.8 2.1 0 2.8 5.6 1.4 5.6 4.1 0 1.2-1.2 2.1-2.8 2.1-1.3 0-2.4-.6-2.8-1.5" />
  </Icon>
)
export const Clock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
)
export const Verified = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3L4.5 6v5.5c0 4.4 3.2 7.9 7.5 9.5 4.3-1.6 7.5-5.1 7.5-9.5V6L12 3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Icon>
)
export const Filter = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 5h17L14 13v6.5l-4-2V13L3.5 5z" />
  </Icon>
)
export const Menu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)

// Exact Figma geometry for the icons common.tsx draws a little differently (not exported by name).
const FigmaSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="M20.5 20.5l-4.2-4.2" />
  </Icon>
)
const FigmaChevronRight = (p: IconProps) => <Icon {...p}><path d="M9.5 18l6-6-6-6" /></Icon>
const FigmaChevronLeft = (p: IconProps) => <Icon {...p}><path d="M14.5 18l-6-6 6-6" /></Icon>
const FigmaChevronDown = (p: IconProps) => <Icon {...p}><path d="M6 9.5l6 6 6-6" /></Icon>
const FigmaMoon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5C19.49 15.7 18.68 16.76 17.67 17.58C16.65 18.4 15.44 18.96 14.16 19.21C12.88 19.46 11.55 19.39 10.3 19.01C9.05 18.62 7.91 17.94 6.99 17.01C6.06 16.09 5.38 14.95 4.99 13.7C4.61 12.45 4.54 11.12 4.79 9.84C5.04 8.56 5.6 7.35 6.42 6.33C7.24 5.32 8.3 4.51 9.5 4C8.11 5.39 7.33 7.28 7.33 9.25C7.33 11.22 8.11 13.11 9.5 14.5C10.89 15.89 12.78 16.67 14.75 16.67C16.72 16.67 18.61 15.89 20 14.5Z" />
  </Icon>
)
const FigmaAlert = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4L2.8 19.5h18.4L12 4z" />
    <path d="M12 10v4.2M12 16.8v.2" />
  </Icon>
)
const FigmaInfo = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.2" />
  </Icon>
)

/** Every icon of the Figma Icons frame (3:2), by its Figma name, in Figma's order. */
export const ICON_SET = {
  search: FigmaSearch,
  home: Home,
  star: Star,
  share: Share,
  download: Download,
  'chevron-right': FigmaChevronRight,
  'chevron-left': FigmaChevronLeft,
  'chevron-down': FigmaChevronDown,
  moon: FigmaMoon,
  globe: Globe,
  check: Check,
  alert: FigmaAlert,
  wallet: Wallet,
  bank: Bank,
  send: Send,
  calculator: Calculator,
  calendar: Calendar,
  land: Land,
  guide: Guide,
  x: Close,
  grid: Grid,
  bookmark: Bookmark,
  info: FigmaInfo,
  flag: Flag,
  message: Message,
  'wifi-off': WifiOff,
  coin: Coin,
  clock: Clock,
  verified: Verified,
  filter: Filter,
  plus: Plus,
  menu: Menu,
} satisfies Record<string, FunctionComponent<IconProps>>

/** A Figma icon name, e.g. 'wallet' or 'chevron-right' (data files can name icons this way). */
export type IconName = keyof typeof ICON_SET

export const ICON_NAMES = Object.keys(ICON_SET) as IconName[]

export function isIconName(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICON_SET, name)
}

/** Renders a Figma icon by name: <IconByName name="bank" size={20} class="text-blue" />. */
export function IconByName({ name, ...rest }: IconProps & { name: IconName }) {
  const Glyph = ICON_SET[name]
  return <Glyph {...rest} />
}
