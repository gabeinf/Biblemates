import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { space } from '../../theme'
import { LambView, type LambHandle } from './LambView'
import { SpeechBubble } from './SpeechBubble'

export type ChibiMood = 'idle' | 'cheer' | 'reading' | 'think' | 'waiting'

/** How long the cheer hop plays before the chibi settles into `waiting`. */
export const CHEER_MS = 900
/** Idle time in `waiting` before the gentle nudge appears. */
export const READY_MS = 6000

type Props = {
  mood: ChibiMood
  message?: string
  /** Fires once when a `cheer` has settled into `waiting`. */
  onSettled?: () => void
  size?: number
}

/**
 * The guided-Today lamb. Placeholder art via LambView; props stay stable so Rive can swap the
 * internals later (reading/think share the idle art until then).
 */
export function Chibi({ mood, message, onSettled, size = 140 }: Props) {
  const reduce = useReducedMotion()
  const lamb = useRef<LambHandle>(null)
  const [settled, setSettled] = useState(false)
  const [ready, setReady] = useState(false)
  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onSettledRef.current = onSettled
  })

  // A new cheer restarts the settle; any other mood leaves it.
  useEffect(() => {
    if (mood !== 'cheer') return
    if (!reduce) lamb.current?.pet()
    const t = setTimeout(() => {
      setSettled(true)
      onSettledRef.current?.()
    }, CHEER_MS)
    return () => {
      clearTimeout(t)
      setSettled(false)
    }
  }, [mood, reduce])

  const waiting = mood === 'waiting' || (mood === 'cheer' && settled)
  useEffect(() => {
    if (!waiting) return
    const t = setTimeout(() => setReady(true), READY_MS)
    return () => {
      clearTimeout(t)
      setReady(false)
    }
  }, [waiting])

  const bob = useSharedValue(0)
  const bobbing = waiting && !reduce
  useEffect(() => {
    bob.value = bobbing
      ? withRepeat(
          withSequence(withTiming(-4, { duration: 1400 }), withTiming(0, { duration: 1400 })),
          -1,
        )
      : 0
  }, [bobbing, bob])
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }))

  const text = message ?? (waiting && ready ? 'Ready when you are' : undefined)
  return (
    <View style={{ alignItems: 'center', gap: space.md }}>
      {text ? <SpeechBubble>{text}</SpeechBubble> : null}
      <Animated.View style={bobStyle}>
        <LambView view="front" size={size} petRef={lamb} />
      </Animated.View>
    </View>
  )
}
