import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { control, radius, space, useTheme } from '../../theme'
import { AppText } from './AppText'
import { SeedIcon } from './SeedIcon'

export type PillKind = 'seed' | 'streak' | 'friends'
/** Pills sit in a header row: cap Dynamic Type so they never push the title off screen. */
const DT_CAP = 1.3
const LABEL: Record<PillKind, string> = { seed: 'seeds', streak: 'day streak', friends: 'friends' }

/** 38h white pill, tinted 2px border, icon + ExtraBold number. */
export function Pill({ kind, value, icon }: { kind: PillKind; value: number | string; icon?: ReactNode }) {
  const theme = useTheme()
  const tone = {
    seed: { border: theme.rewardBorder, ink: 'rewardInk', color: theme.reward },
    streak: { border: theme.streakBorder, ink: 'streakInk', color: theme.streak },
    friends: { border: theme.primaryTint, ink: 'primary', color: theme.primary },
  }[kind] as { border: string; ink: 'rewardInk' | 'streakInk' | 'primary'; color: string }
  const glyph =
    icon ??
    (kind === 'seed' ? <SeedIcon size={22} /> : <Ionicons name={kind === 'streak' ? 'flame' : 'people'} size={20} color={tone.color} />)
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${LABEL[kind]}`}
      style={[styles.pill, { backgroundColor: theme.surface, borderColor: tone.border }]}
    >
      {glyph}
      <AppText variant="button" color={tone.ink} maxFontSizeMultiplier={DT_CAP}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    height: control.pill,
    minWidth: control.minTouch + space.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
  },
})
