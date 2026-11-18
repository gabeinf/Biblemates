import { useEffect, useState } from 'react'
import { Redirect, useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Avatar, Button } from '../../components/ui'
import { FadeIn, SwitchLink } from '../../components/onboarding'
import { colors, radii, spacing, typography } from '../../theme/tokens'
import { isLaunchPending, markLaunchHandled } from '../../hooks/use-onboarding'
import { stepHref } from '../../lib/onboarding-flow'

/** A small preview of the app: the day's passage and who in the circle has read it. */
function PassagePreview() {
  return (
    <View style={styles.previewWrap}>
      <View style={[styles.card, styles.cardBehind]} />
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Today · Psalm 119:105</Text>
        <Text style={styles.verse}>“Thy word is a lamp unto my feet, And light unto my path.”</Text>
        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row' }}>
            {['Ruth Ames', 'Sam Okafor', 'Lea Park'].map((name, i) => (
              <View key={name} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <Avatar name={name} size={28} />
              </View>
            ))}
          </View>
          <Text style={styles.cardMeta}>3 reflections from your circle</Text>
        </View>
      </View>
    </View>
  )
}

export default function Welcome() {
  const router = useRouter()
  // On launch, show the splash first; it resumes an unfinished onboarding or comes back here.
  const [launch] = useState(isLaunchPending)
  useEffect(markLaunchHandled, [])

  if (launch) return <Redirect href={stepHref(1)} />

  return (
    <LinearGradient style={styles.flex} colors={['#fbefcf', colors.paper]} locations={[0, 0.55]}>
      <SafeAreaView style={styles.screen}>
        <FadeIn>
          <Text style={styles.wordmark}>Biblemates</Text>
        </FadeIn>

        <FadeIn delay={120}>
          <PassagePreview />
        </FadeIn>

        <View style={styles.bottom}>
          <FadeIn delay={240} style={{ gap: spacing.sm }}>
            <Text style={styles.hero} accessibilityRole="header">
              {'Read the Bible,\ntogether.'}
            </Text>
            <Text style={styles.sub}>
              One passage a day with a few people you love. Read on your own time, then reflect and pray as a circle.
            </Text>
          </FadeIn>

          <FadeIn delay={360} style={{ gap: spacing.sm }}>
            <Button label="Get started" size="lg" onPress={() => router.push(stepHref(3))} />
            <SwitchLink prompt="Already have an account?" action="Sign in" onPress={() => router.push('/sign-in')} />
          </FadeIn>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, justifyContent: 'space-between' },
  wordmark: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.display,
    fontSize: 22,
    color: colors.Gold,
    letterSpacing: 0.5,
  },
  previewWrap: { paddingTop: spacing.md, paddingHorizontal: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#5b4310',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardBehind: {
    position: 'absolute',
    top: spacing.md + 14,
    left: spacing.xl,
    right: spacing.xl,
    bottom: -14,
    backgroundColor: colors.Mat,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardEyebrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  verse: { fontFamily: typography.fontFamily.bodyItalic, fontSize: typography.fontSize.body, lineHeight: 28, color: colors.Ink },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardMeta: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.muted },
  bottom: { gap: spacing.xl },
  hero: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.display, lineHeight: 50, color: colors.Ink },
  sub: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, lineHeight: 24, color: colors.muted },
})
