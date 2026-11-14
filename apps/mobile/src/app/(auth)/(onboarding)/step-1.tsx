import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button } from '../../../components/ui'
import { AuthScreen, FadeIn, ScreenTitle } from '../../../components/onboarding'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

const FEATURES = [
  {
    icon: 'book-outline',
    title: 'One passage, every day',
    body: 'Your circle reads the same passage, each at whatever time suits them.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Reflect and pray together',
    body: 'Share what stood out, read what your circle noticed, and lift up each other’s prayer requests.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Ask what Scripture says',
    body: 'Tell the Scripture companion what’s on your heart and it finds passages that speak to it.',
  },
] as const

export default function HowItWorks() {
  const router = useRouter()

  return (
    <AuthScreen footer={<Button label="Continue" size="lg" onPress={() => router.push('/step-2')} />}>
      <FadeIn>
        <ScreenTitle eyebrow="How it works" title={'A few minutes a day,\nside by side.'} />
      </FadeIn>

      <View style={styles.list}>
        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={120 + i * 100} style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={f.icon} size={22} color={colors.Gold} />
            </View>
            <View style={styles.text}>
              <Text style={styles.rowTitle}>{f.title}</Text>
              <Text style={styles.rowBody}>{f.body}</Text>
            </View>
          </FadeIn>
        ))}
      </View>

      <FadeIn delay={480}>
        <Text style={styles.note}>
          Next you’ll create an account, then start a circle or join one with an invite code.
        </Text>
      </FadeIn>
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  text: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, color: colors.Ink },
  rowBody: { fontFamily: typography.fontFamily.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  note: { fontFamily: typography.fontFamily.body, fontSize: 14, lineHeight: 20, color: colors.muted },
})
