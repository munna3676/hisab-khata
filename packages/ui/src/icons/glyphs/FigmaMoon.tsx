import { Icon, type IconProps } from '../Icon'
// Exact Figma geometry for an icon common.tsx draws a little differently (not exported by name).

export const FigmaMoon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5C19.49 15.7 18.68 16.76 17.67 17.58C16.65 18.4 15.44 18.96 14.16 19.21C12.88 19.46 11.55 19.39 10.3 19.01C9.05 18.62 7.91 17.94 6.99 17.01C6.06 16.09 5.38 14.95 4.99 13.7C4.61 12.45 4.54 11.12 4.79 9.84C5.04 8.56 5.6 7.35 6.42 6.33C7.24 5.32 8.3 4.51 9.5 4C8.11 5.39 7.33 7.28 7.33 9.25C7.33 11.22 8.11 13.11 9.5 14.5C10.89 15.89 12.78 16.67 14.75 16.67C16.72 16.67 18.61 15.89 20 14.5Z" />
  </Icon>
)
