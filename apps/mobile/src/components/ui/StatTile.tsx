import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { motion, radius, space, useTheme } from '../../theme'
import { AppText } from './AppText'
import { Reveal } from './Reveal'
import type { PillKind } from './Pill'

/** Duolingo-style tile: colored header strip with an UPPERCASE label, white body with icon + value. Pops in staggered by 80ms. */
export function StatTile({ kind, label, value, icon, index = 0 }: { kind: PillKind; label: string; value: string | number; icon?: ReactNode; index?: number }) {
  const theme = useTheme()
  const strip = { seed: theme.reward, streak: theme.streak, friends: theme.primary }[kind]
  const stripInk = kind === 'seed' ? 'rewardInk' : 'onPrimary'
  const valueInk = { seed: 'rewardInk', streak: 'streakInk', friends: 'primary' }[kind] as 'rewardInk' | 'streakInk' | 'primary'
  return (
    <Reveal delay={index * motion.celebrate.tileStagger} scaleFrom={0.95} style={styles.flex}>
      <View accessible accessibilityLabel={`${label} ${value}`} style={[styles.tile, { backgroundColor: theme.surface, borderColor: strip }]}>
        <View style={[styles.strip, { backgroundColor: strip }]}>
          <AppText variant="label" color={stripInk}>
            {label}
          </AppText>
        </View>
        <View style={styles.body}>
          {icon}
          <AppText variant="headline" color={valueInk}>
            {value}
          </AppText>
        </View>
      </View>
    </Reveal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tile: { borderRadius: radius.lg, borderWidth: 2, overflow: 'hidden' },
  strip: { paddingVertical: space.xxs, alignItems: 'center' },
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xxs, paddingVertical: space.sm },
})
