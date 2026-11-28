import { useEffect, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { motion, radius, space, useTheme } from '../../theme'
import { AppText } from './AppText'
import { Reveal } from './Reveal'
import type { PillKind } from './Pill'

const COUNT_MS = 700
const COUNT_STEPS = 14

/** 0 → `target` in even steps after the tile's pop-in; Reduce Motion (or a 0 target) shows `target` at once. */
function useCountUp(target: number | undefined, delayMs: number) {
  const reduce = useReducedMotion()
  const skip = target === undefined || reduce || target <= 0
  const [n, setN] = useState(0)
  useEffect(() => {
    if (skip) return
    let i = 0
    let timer: ReturnType<typeof setInterval> | undefined
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1
        setN(Math.round((target * i) / COUNT_STEPS))
        if (i >= COUNT_STEPS) clearInterval(timer)
      }, COUNT_MS / COUNT_STEPS)
    }, delayMs)
    return () => {
      clearTimeout(start)
      clearInterval(timer)
    }
  }, [skip, target, delayMs])
  return skip ? target : n
}

/** Duolingo-style tile: colored header strip with an UPPERCASE label, white body with icon + value. Pops in staggered by 80ms. */
export function StatTile({
  kind,
  label,
  value,
  icon,
  index = 0,
  countUp = false,
}: {
  kind: PillKind
  label: string
  value: string | number
  icon?: ReactNode
  index?: number
  /** Numeric `value` only: animate 0 → value (the a11y label always reads the final value). */
  countUp?: boolean
}) {
  const theme = useTheme()
  const delay = index * motion.celebrate.tileStagger
  const counted = useCountUp(countUp && typeof value === 'number' ? value : undefined, delay)
  const shown = counted ?? value
  const strip = { seed: theme.reward, streak: theme.streak, friends: theme.primary }[kind]
  const stripInk = kind === 'seed' ? 'rewardInk' : 'onPrimary'
  const valueInk = { seed: 'rewardInk', streak: 'streakInk', friends: 'primary' }[kind] as 'rewardInk' | 'streakInk' | 'primary'
  return (
    <Reveal delay={delay} scaleFrom={0.95} style={styles.flex}>
      <View accessible accessibilityLabel={`${label} ${value}`} style={[styles.tile, { backgroundColor: theme.surface, borderColor: strip }]}>
        <View style={[styles.strip, { backgroundColor: strip }]}>
          <AppText variant="label" color={stripInk}>
            {label}
          </AppText>
        </View>
        <View style={styles.body}>
          {icon}
          <AppText variant="headline" color={valueInk}>
            {shown}
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
