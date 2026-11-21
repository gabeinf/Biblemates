import { useEffect, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { motion, space } from '../../theme'
import { AppText } from './AppText'
import { ChunkyButton } from './ChunkyButton'
import { haptic } from './haptics'
import { Reveal } from './Reveal'
import { ScreenScaffold } from './ScreenScaffold'
import { StatTile } from './StatTile'
import type { PillKind } from './Pill'

export type Tile = { kind: PillKind; label: string; value: string | number; icon?: ReactNode }
type Action = { label: string; onPress: () => void }

type Props = {
  /** The hero: a `<LambView view="front" />` (or any swap). Reacts first, on frame 0. */
  lamb: ReactNode
  eyebrow?: string
  headline: string
  body?: string
  tiles?: readonly Tile[]
  primary: Action
  secondary?: Action
  share?: Action
}

/** Full-screen success layout: lamb → headline @120ms → tiles +80ms each → CTA @500ms. Reduce Motion: all at once. */
export function CelebrationScaffold({ lamb, eyebrow, headline, body, tiles = [], primary, secondary, share }: Props) {
  const reduce = useReducedMotion()
  const at = (ms: number) => (reduce ? 0 : ms)
  useEffect(() => {
    const t = setTimeout(haptic.success, reduce ? 0 : motion.celebrate.headline)
    return () => clearTimeout(t)
  }, [reduce])
  return (
    <ScreenScaffold
      scroll={false}
      style={styles.center}
      footer={
        <Reveal delay={at(motion.celebrate.cta)} style={styles.footer}>
          <ChunkyButton label={primary.label} onPress={primary.onPress} />
          {secondary ? <ChunkyButton label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
          {share ? <ChunkyButton label={share.label} variant="secondary" onPress={share.onPress} /> : null}
        </Reveal>
      }
    >
      <View style={styles.hero}>{lamb}</View>
      <Reveal delay={at(motion.celebrate.headline)} style={styles.text}>
        {eyebrow ? (
          <AppText variant="label" color="rewardInk">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="display" color="rewardLip" style={styles.centerText}>
          {headline}
        </AppText>
        {body ? (
          <AppText variant="body" color="textSecondary" style={styles.centerText}>
            {body}
          </AppText>
        ) : null}
      </Reveal>
      {tiles.length ? (
        <View style={styles.tiles}>
          {tiles.map((t, i) => (
            <StatTile key={t.label} {...t} index={reduce ? 0 : i + 1} />
          ))}
        </View>
      ) : null}
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center' },
  text: { alignItems: 'center', gap: space.xs },
  centerText: { textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: space.sm },
  footer: { gap: space.sm },
})
