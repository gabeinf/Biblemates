/**
 * 01 · Splash. A short brand moment after launch: the mark from the native splash stays
 * put while a verse fades in word by word, then the app moves on by itself.
 * See docs/specs/onboarding.md → "01 · Splash".
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { Animated, Easing, Image, StyleSheet, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { SPLASH_LOGO, SPLASH_LOGO_WIDTH } from '../../../components/AnimatedSplash'
import {
  SPLASH_DESTINATION,
  SPLASH_MS,
  SPLASH_VERSE,
  SPLASH_VERSE_REFERENCE,
  VERSE_DELAY_MS,
  VERSE_STAGGER_MS,
  VERSE_WORD_MS,
} from '../../../lib/onboarding-flow'
import { useAppReady } from '../../../lib/splash'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

const WORDS = SPLASH_VERSE.split(' ')

/** Our own artwork: morning light over layered hills, drawn from theme colors. */
function Backdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={[colors.splashLight, colors.splash, colors.splashDeep]}
        locations={[0, 0.45, 1]}
      />
      <View style={styles.rings}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.ring, { width: RING * i, height: RING * i, opacity: 0.22 / i }]}
          />
        ))}
      </View>
      <View style={[styles.hill, styles.hillBack]} />
      <View style={[styles.hill, styles.hillFront]} />
    </View>
  )
}

/** The verse, one word at a time. Static when Reduce Motion is on. */
function Verse({ start }: { start: boolean }) {
  const reduceMotion = useReducedMotion()
  // One value per word, plus one for the reference line.
  const [fades] = useState(() =>
    [...WORDS, SPLASH_VERSE_REFERENCE].map(() => new Animated.Value(0)),
  )

  useEffect(() => {
    if (!start) return
    if (reduceMotion) return fades.forEach((v) => v.setValue(1))
    const anim = Animated.sequence([
      Animated.delay(VERSE_DELAY_MS),
      Animated.stagger(
        VERSE_STAGGER_MS,
        fades.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: VERSE_WORD_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ),
    ])
    anim.start()
    return () => anim.stop()
  }, [start, reduceMotion, fades])

  const lift = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
  })

  return (
    <View
      style={styles.verseBlock}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${SPLASH_VERSE} ${SPLASH_VERSE_REFERENCE}`}
    >
      <View style={styles.verse}>
        {WORDS.map((word, i) => (
          <Animated.Text key={i} style={[styles.word, lift(fades[i])]}>
            {word}
          </Animated.Text>
        ))}
      </View>
      <Animated.Text style={[styles.reference, lift(fades[WORDS.length])]}>
        {SPLASH_VERSE_REFERENCE}
      </Animated.Text>
    </View>
  )
}

export default function Splash() {
  const router = useRouter()
  const ready = useAppReady()

  // The clock starts once fonts and session have loaded (the app-ready signal).
  // Signed-in users never get here: the root guard sends them to /home.
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => router.replace(SPLASH_DESTINATION), SPLASH_MS)
    return () => clearTimeout(t)
  }, [ready, router])

  return (
    <View style={styles.screen}>
      <Backdrop />
      <Image
        source={SPLASH_LOGO}
        style={styles.logo}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
      <Verse start={ready} />
    </View>
  )
}

const LOGO_HALF = SPLASH_LOGO_WIDTH / 2
const RING = SPLASH_LOGO_WIDTH * 1.25

const styles = StyleSheet.create({
  // The mark sits dead centre, exactly where the native splash draws it.
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splash,
  },
  logo: { width: SPLASH_LOGO_WIDTH, height: SPLASH_LOGO_WIDTH },
  rings: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.onSplash,
  },
  hill: { position: 'absolute', width: '170%', aspectRatio: 1, borderRadius: radii.full },
  hillBack: { top: '74%', left: '-55%', backgroundColor: colors.splashDeep, opacity: 0.55 },
  hillFront: { top: '82%', left: '-5%', backgroundColor: colors.splashShade, opacity: 0.45 },
  verseBlock: {
    position: 'absolute',
    top: '50%',
    marginTop: LOGO_HALF + spacing.lg,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  verse: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: spacing.xs,
  },
  word: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    lineHeight: Math.round(typography.fontSize.title * 1.2),
    color: colors.Ink,
  },
  reference: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    letterSpacing: 1,
    color: colors.Ink,
  },
})
