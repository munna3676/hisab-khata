import { Icon, type IconProps } from '../Icon'
// Exact Figma geometry for an icon common.tsx draws a little differently (not exported by name).

export const FigmaAlert = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4L2.8 19.5h18.4L12 4z" />
    <path d="M12 10v4.2M12 16.8v.2" />
  </Icon>
)
