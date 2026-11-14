import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { useAppReady } from '../lib/splash'

// Keep in sync with the expo-splash-screen plugin in app.json so the hand-off
// from the native splash is pixel-identical.
export const SPLASH_BACKGROUND = '#F7C341'
const LOGO_WIDTH = 180

/**
 * A JS copy of the native splash, drawn over the app. Once the app is ready it
 * swaps out the native splash (invisibly), gives the logo a small hop, then
 * fades away to reveal the already-rendered first screen.
 */
export default function AnimatedSplash() {
  const ready = useAppReady()
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [done, setDone] = useState(false)

  const lift = useRef(new Animated.Value(0)).current // 0 rest → 1 top of hop
  const fade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!ready || !logoLoaded) return
    let cancelled = false

    SplashScreen.hideAsync().finally(() => {
      if (cancelled) return
      Animated.sequence([
        Animated.delay(120), // let the first screen finish painting underneath
        Animated.timing(lift, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(lift, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(fade, { toValue: 0, duration: 380, delay: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start(() => setDone(true))
    })

    return () => {
      cancelled = true
    }
  }, [ready, logoLoaded, lift, fade])

  if (done) return null

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -22] })
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] })

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { opacity: fade, pointerEvents: ready ? 'none' : 'auto' }]}
    >
      <Animated.Image
        source={require('../../assets/splash-icon.png')}
        style={[styles.logo, { transform: [{ translateY }, { scale }] }]}
        resizeMode="contain"
        fadeDuration={0}
        onLoadEnd={() => setLogoLoaded(true)}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  logo: { width: LOGO_WIDTH, height: LOGO_WIDTH },
})
