/**
 * 11 · Stakes rules. How the weekly stakes settle, for a circle of any size.
 * See docs/specs/onboarding.md → "11 · Stakes rules".
 */
import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button, Card } from '../../../components/ui'
import { AuthScreen, FadeIn } from '../../../components/onboarding'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

type Tone = 'success' | 'warning' | 'neutral'
type Outcome = { title: string; result: string; tone: Tone; you: boolean; circle: boolean }

/**
 * "Circle" stands for everyone else, so the rules hold for 2 or 12 members: whoever
 * misses owes the stakes, unless nobody read at all.
 */
const OUTCOMES: readonly Outcome[] = [
  {
    title: 'Everyone reads',
    result: 'Nobody owes a thing.',
    tone: 'success',
    you: true,
    circle: true,
  },
  {
    title: 'Someone falls short',
    result: 'Whoever missed owes.',
    tone: 'warning',
    you: false,
    circle: true,
  },
  {
    title: 'Everyone misses',
    result: 'Call it even, start fresh.',
    tone: 'neutral',
    you: false,
    circle: false,
  },
]

const TONE_COLOR: Record<Tone, string> = {
  success: colors.success,
  warning: colors.warning,
  neutral: colors.muted,
}

function Badge({ who, hit }: { who: string; hit: boolean }) {
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${who}: ${hit ? 'hit' : 'missed'}`}
    >
      <View style={[styles.dot, { backgroundColor: hit ? colors.success : colors.danger }]}>
        <Ionicons name={hit ? 'checkmark' : 'close'} size={22} color={colors.surface} />
      </View>
      <Text style={styles.badgeLabel}>{who}</Text>
    </View>
  )
}

export default function StakesRules() {
  const { goNext } = useOnboardingNav()

  return (
    <AuthScreen
      footer={
        <FadeIn delay={240}>
          <Button label="Choose your stakes" size="lg" onPress={() => goNext()} />
        </FadeIn>
      }
    >
      <FadeIn style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          How the weekly stakes work
        </Text>
        <Text style={styles.subtitle}>
          Meet your goal and you’re square. Miss it and you owe the stakes, unless the whole circle
          missed too. Two people or twelve, it works the same.
        </Text>
      </FadeIn>

      <View style={styles.cards}>
        {OUTCOMES.map((o, i) => (
          <FadeIn key={o.title} delay={80 + i * 60}>
            <Card style={styles.card}>
              <View style={styles.text}>
                <Text style={styles.cardTitle}>{o.title}</Text>
                <Text style={[styles.result, { color: TONE_COLOR[o.tone] }]}>{o.result}</Text>
              </View>
              <View style={styles.badges}>
                <Badge who="You" hit={o.you} />
                <Badge who="Circle" hit={o.circle} />
              </View>
            </Card>
          </FadeIn>
        ))}
      </View>
    </AuthScreen>
  )
}

const DOT = 44

const styles = StyleSheet.create({
  head: { gap: spacing.sm, alignItems: 'center' },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    color: colors.Ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  cards: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  text: { flex: 1, gap: spacing.xxs },
  cardTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.subTitle,
    color: colors.Ink,
  },
  result: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall },
  badges: { flexDirection: 'row', gap: spacing.xs },
  badge: { alignItems: 'center', gap: spacing.xxs },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
})
