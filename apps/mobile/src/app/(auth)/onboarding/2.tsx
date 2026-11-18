/**
 * 02 · Hook. Names the problem: a group starts a reading plan together, then drifts apart.
 * See docs/specs/onboarding.md → "02 · Hook".
 */
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button } from '../../../components/ui'
import { FadeIn, SwitchLink } from '../../../components/onboarding'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { HOOK_READERS, HOOK_WEEKS, type HookWeek } from '../../../lib/onboarding-flow'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

/** One week of the plan: each reader's seven days, read (gold) or missed (empty). */
function WeekPanel({ week }: { week: HookWeek }) {
  const read = week.days.flat().filter(Boolean).length
  const total = week.days.flat().length
  return (
    <View
      style={styles.panel}
      accessible
      accessibilityLabel={`${week.label}: ${read} of ${total} readings done`}
    >
      <Text style={[styles.panelLabel, !week.together && styles.panelLabelFaded]}>
        {week.label}
      </Text>
      <View style={styles.rows}>
        {HOOK_READERS.map((name, r) => (
          <View
            key={name}
            style={[
              styles.row,
              // Week 3: the readers drift out of line, each on their own.
              !week.together && { marginLeft: DRIFT[r] },
            ]}
          >
            <Avatar name={name} size={AVATAR} dim={!week.together} />
            <View style={styles.days}>
              {week.days[r].map((done, d) => (
                <View key={d} style={[styles.day, done ? styles.dayDone : styles.dayMissed]} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function Hook() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { goNext } = useOnboardingNav()

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <View style={styles.card}>
            {HOOK_WEEKS.map((week, i) => (
              <View key={week.label} style={styles.panelWrap}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <WeekPanel week={week} />
              </View>
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={120} style={styles.copy}>
          <Text style={styles.headline} accessibilityRole="header">
            {'We all start the plan together…\n'}
            <Text style={styles.headlineMuted}>and quietly drift apart.</Text>
          </Text>
          <Text style={styles.body}>
            Weeks get full and the reading slips, but you still want to grow, and to grow alongside
            your people.
          </Text>
        </FadeIn>
      </ScrollView>

      <FadeIn delay={240} style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button label="That’s us" size="lg" onPress={() => goNext()} />
        <SwitchLink
          prompt="Already have an account?"
          action="Sign in"
          onPress={() => router.push('/sign-in')}
        />
      </FadeIn>
    </View>
  )
}

const AVATAR = 18
const DAY = 9
/** How far each reader drifts sideways in week 3. Kept small so 375pt never clips. */
const DRIFT = [0, spacing.xs, spacing.xxs]

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  panelWrap: { flex: 1, flexDirection: 'row' },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  panel: { flex: 1, alignItems: 'center', gap: spacing.md },
  panelLabel: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.subTitle,
    color: colors.Ink,
  },
  panelLabelFaded: { color: colors.muted },
  rows: { gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  days: { flexDirection: 'row', gap: spacing.xxs },
  day: { width: DAY, height: DAY, borderRadius: radii.full },
  dayDone: { backgroundColor: colors.Gold },
  dayMissed: { borderWidth: 1, borderColor: colors.inactive },
  copy: { gap: spacing.md },
  headline: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    lineHeight: Math.round(typography.fontSize.title * 1.15),
    color: colors.Ink,
  },
  headlineMuted: { color: colors.muted },
  body: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    lineHeight: Math.round(typography.fontSize.bodySmall * 1.5),
    color: colors.muted,
  },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
})
