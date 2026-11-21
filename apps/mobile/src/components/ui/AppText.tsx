import { Text, type TextProps } from 'react-native'
import { type, useTheme, type Theme, type TypeVariant } from '../../theme'

type Props = TextProps & {
  variant?: TypeVariant
  /** A theme role, not a hex. */
  color?: Exclude<keyof Theme, 'scene'>
}

/** The one text component: `variant` picks a type-scale entry, `color` a theme role. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const theme = useTheme()
  return (
    <Text
      {...rest}
      style={[type[variant], { color: theme[color] as string }, variant === 'label' && { textTransform: 'uppercase' }, style]}
    />
  )
}
