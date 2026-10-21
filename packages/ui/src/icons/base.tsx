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
import type { IconProps } from './Icon'
// Each glyph lives in its own module (./glyphs/), so a page's bundle carries only the icons it
// uses even though the gallery imports ICON_SET (one shared module would carry every icon).
import { Home } from './glyphs/Home'
import { Star } from './glyphs/Star'
import { Share } from './glyphs/Share'
import { Download } from './glyphs/Download'
import { Globe } from './glyphs/Globe'
import { Wallet } from './glyphs/Wallet'
import { Bank } from './glyphs/Bank'
import { Send } from './glyphs/Send'
import { Calculator } from './glyphs/Calculator'
import { Calendar } from './glyphs/Calendar'
import { Land } from './glyphs/Land'
import { Guide } from './glyphs/Guide'
import { Grid } from './glyphs/Grid'
import { Bookmark } from './glyphs/Bookmark'
import { Flag } from './glyphs/Flag'
import { Message } from './glyphs/Message'
import { WifiOff } from './glyphs/WifiOff'
import { Coin } from './glyphs/Coin'
import { Clock } from './glyphs/Clock'
import { Verified } from './glyphs/Verified'
import { Filter } from './glyphs/Filter'
import { Menu } from './glyphs/Menu'
import { FigmaSearch } from './glyphs/FigmaSearch'
import { FigmaChevronRight } from './glyphs/FigmaChevronRight'
import { FigmaChevronLeft } from './glyphs/FigmaChevronLeft'
import { FigmaChevronDown } from './glyphs/FigmaChevronDown'
import { FigmaMoon } from './glyphs/FigmaMoon'
import { FigmaAlert } from './glyphs/FigmaAlert'
import { FigmaInfo } from './glyphs/FigmaInfo'

export {
  Home,
  Star,
  Share,
  Download,
  Globe,
  Wallet,
  Bank,
  Send,
  Calculator,
  Calendar,
  Land,
  Guide,
  Grid,
  Bookmark,
  Flag,
  Message,
  WifiOff,
  Coin,
  Clock,
  Verified,
  Filter,
  Menu,
}

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
