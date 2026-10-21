import { Icon, type IconProps } from '../Icon'

export const Coin = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v10M14.8 9.4c-.4-.9-1.5-1.5-2.8-1.5-1.6 0-2.8.9-2.8 2.1 0 2.8 5.6 1.4 5.6 4.1 0 1.2-1.2 2.1-2.8 2.1-1.3 0-2.4-.6-2.8-1.5" />
  </Icon>
)
