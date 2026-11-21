import type { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import { radius, space, useTheme } from '../../theme'
import { AppText } from './AppText'

const TAIL = 14

/** White r16 bubble with a tail. `tail` says which edge points at the lamb. */
export function SpeechBubble({ children, tail = 'bottom' }: PropsWithChildren<{ tail?: 'bottom' | 'left' | 'top' }>) {
  const theme = useTheme()
  const pos = { bottom: { bottom: -TAIL / 2, left: space.lg }, top: { top: -TAIL / 2, left: space.lg }, left: { left: -TAIL / 2, top: space.md } }[tail]
  return (
    <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <AppText variant="body">{children}</AppText>
      <View style={[styles.tail, pos, { backgroundColor: theme.surface, borderColor: theme.border }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: { borderRadius: radius.lg, borderWidth: 1, padding: space.md },
  tail: { position: 'absolute', width: TAIL, height: TAIL, borderWidth: 1, transform: [{ rotate: '45deg' }] },
})
