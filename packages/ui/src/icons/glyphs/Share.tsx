import { Icon, type IconProps } from '../Icon'

export const Share = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 13.2l7.6 4.1M15.8 6.7l-7.6 4.1" />
  </Icon>
)
