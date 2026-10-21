import { Icon, type IconProps } from '../Icon'
// Exact Figma geometry for an icon common.tsx draws a little differently (not exported by name).

export const FigmaSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="M20.5 20.5l-4.2-4.2" />
  </Icon>
)
