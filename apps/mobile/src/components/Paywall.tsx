import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button, Card, Muted } from './ui'
import { shortDate, type PlanView } from '../lib/paywall'
import { colors, radii, spacing, typography } from '../theme/tokens'

type Props = {
  plans: PlanView[]
  selectedId: string
  onSelect: (id: string) => void
  onSubscribe: () => void
  onRestore: () => void
  onClose: () => void
  /** A local reminder will be scheduled on purchase, so the timeline may promise one. */
  remind?: boolean
  busy?: boolean
  error?: string | null
  termsUrl: string
  privacyUrl: string
}

function Step({ title, body, last }: { title: string; body: string; last?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {!last && <View style={styles.line} />}
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Muted>{body}</Muted>
      </View>
    </View>
  )
}

/** Full-screen paywall sheet. Pure view: the route supplies plans (from the store) and handlers. */
export default function Paywall({
  plans,
  selectedId,
  onSelect,
  onSubscribe,
  onRestore,
  onClose,
  remind,
  busy,
  error,
  termsUrl,
  privacyUrl,
}: Props) {
  const plan = plans.find((p) => p.id === selectedId) ?? plans[0]
  const trial = plan.trial
  const per = plan.period ? ` / ${plan.period}` : ''

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color={colors.Ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={onClose}
        >
          <Ionicons name="close" size={26} color={colors.Ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headline}>Keep reading together</Text>

        {trial && (
          <View>
            <Step
              title="Today"
              body={`Your ${trial.days}-day free trial starts. Nothing is charged.`}
            />
            {remind && trial.reminderDate && (
              <Step
                title={shortDate(trial.reminderDate)}
                body="We remind you that the trial is ending. Cancel before billing in your store settings."
              />
            )}
            <Step
              title={shortDate(trial.billingDate)}
              body={`Billing starts at ${plan.price}${per}.`}
              last
            />
          </View>
        )}

        <View style={styles.plans} accessibilityRole="radiogroup">
          {plans.map((p, i) => {
            const selected = p.id === plan.id
            return (
              <View key={p.id}>
                {i === 0 && (
                  <View style={styles.banner}>
                    <Text style={styles.bannerText}>Covers you and your circle</Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${p.name}, ${p.price}${p.period ? ` per ${p.period}` : ''}`}
                  onPress={() => onSelect(p.id)}
                >
                  <Card style={[styles.plan, selected && styles.planSelected]}>
                    <View style={styles.planRow}>
                      <Text style={styles.planName}>{p.name}</Text>
                      {p.badge && <Text style={styles.badge}>{p.badge}</Text>}
                    </View>
                    <Text style={styles.planPrice}>
                      {p.price}
                      {p.period ? ` / ${p.period}` : ''}
                    </Text>
                    {p.perMonth && <Muted>{`${p.perMonth} / month`}</Muted>}
                  </Card>
                </Pressable>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {trial && <Text style={styles.noPayment}>No payment due now</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          size="lg"
          label={trial ? 'Start free trial' : 'Continue'}
          loading={busy}
          onPress={onSubscribe}
        />
        <Muted style={styles.fine}>
          {`Renews${plan.period ? ` every ${plan.period}` : ''} at ${plan.price} until you cancel. Cancel any time in your store account settings.`}
        </Muted>
        <View style={styles.links}>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(termsUrl).catch(() => {})}
          >
            <Text style={styles.link}>Terms</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(privacyUrl).catch(() => {})}
          >
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={onRestore}>
            <Text style={styles.link}>Restore</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  content: { padding: spacing.lg, gap: spacing.lg },
  headline: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    lineHeight: 38,
    color: colors.Ink,
    textAlign: 'center',
  },
  step: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 12 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: colors.Gold,
    marginTop: spacing.xxs,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.inactive },
  stepText: { flex: 1, paddingBottom: spacing.md },
  stepTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  plans: { gap: spacing.sm },
  banner: {
    alignSelf: 'center',
    backgroundColor: colors.Gold,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    marginBottom: -spacing.sm,
    zIndex: 1,
  },
  bannerText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.surface,
  },
  plan: { paddingTop: spacing.lg },
  planSelected: { borderColor: colors.Gold, borderWidth: 2 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.body,
    color: colors.Ink,
  },
  badge: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.success,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  planPrice: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.subTitle,
    color: colors.Ink,
  },
  footer: { padding: spacing.lg, gap: spacing.sm, alignItems: 'stretch' },
  noPayment: { textAlign: 'center', fontFamily: typography.fontFamily.body, color: colors.Ink },
  error: { textAlign: 'center', fontFamily: typography.fontFamily.body, color: colors.danger },
  fine: { textAlign: 'center', fontSize: typography.fontSize.caption },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  link: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
})
