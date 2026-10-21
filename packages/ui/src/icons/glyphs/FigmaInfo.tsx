import { Icon, type IconProps } from '../Icon'
// Exact Figma geometry for an icon common.tsx draws a little differently (not exported by name).

export const FigmaInfo = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.2" />
  </Icon>
)

/** Every icon of the Figma Icons frame (3:2), by its Figma name, in Figma's order. */
