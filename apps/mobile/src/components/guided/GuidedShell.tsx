import { useCallback, useEffect, useReducer } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardScreen } from '../KeyboardScreen'
import { Chibi, ChunkyButton, ProgressBar } from '../ui'
import { useMarkDayComplete } from '../../hooks/queries'
import { showCelebration } from '../../lib/celebrations'
import {
  GUIDED_STEPS,
  guidedReducer,
  initGuided,
  isLastStep,
  loadGuidedStep,
  saveGuidedStep,
} from '../../lib/guided-session'
import { space, useTheme } from '../../theme'
import { IntroStep } from './steps/IntroStep'
import { ReadStep } from './steps/ReadStep'
import { ReflectStep } from './steps/ReflectStep'
import { TogetherStep } from './steps/TogetherStep'
import type { StepProps } from './steps/types'

const STEP_VIEWS = {
  intro: IntroStep,
  read: ReadStep,
  reflect: ReflectStep,
  together: TogetherStep,
}

/** Full-screen guided Today: progress, close, chibi, the current step, and a sticky Continue. */
export function GuidedShell({ day, circleStudy, members }: Omit<StepProps, 'onReady'>) {
  const router = useRouter()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const markDay = useMarkDayComplete(circleStudy.id)
  const [state, dispatch] = useReducer(guidedReducer, undefined, () =>
    initGuided(loadGuidedStep(circleStudy.id, day.day_number)),
  )
  const step = GUIDED_STEPS[state.index]
  const StepView = STEP_VIEWS[step]

  useEffect(() => {
    saveGuidedStep(circleStudy.id, day.day_number, state.index)
  }, [circleStudy.id, day.day_number, state.index])

  const onReady = useCallback((ready: boolean) => dispatch({ type: 'ready', ready }), [])

  const confirmClose = () =>
    Alert.alert(
      'Leave today’s session?',
      'Your place is saved. You can pick up where you left off.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ],
    )

  const onContinue = async () => {
    if (!isLastStep(state)) return dispatch({ type: 'next' })
    try {
      await markDay.mutateAsync(day.day_number)
    } catch (e) {
      return Alert.alert('Couldn’t save your day', e instanceof Error ? e.message : 'Try again.')
    }
    saveGuidedStep(circleStudy.id, day.day_number, null)
    showCelebration(router, 'checkin')
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={confirmClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.flex}>
          <ProgressBar value={(state.index + 1) / GUIDED_STEPS.length} label="Session progress" />
        </View>
      </View>
      <KeyboardScreen
        footer={
          <ChunkyButton
            label={isLastStep(state) ? 'Finish' : 'Continue'}
            onPress={onContinue}
            disabled={!state.ready}
            loading={markDay.isPending}
          />
        }
      >
        <Chibi key={step} mood={state.advanced ? 'cheer' : 'idle'} size={96} />
        <StepView day={day} circleStudy={circleStudy} members={members} onReady={onReady} />
      </KeyboardScreen>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
})
