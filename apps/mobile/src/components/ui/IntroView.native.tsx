import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, StyleSheet, View } from 'react-native'
import {
  Alignment,
  Fit,
  RiveView,
  useRiveFile,
  useRiveTrigger,
  useViewModelInstance,
} from '@rive-app/react-native'
import { useTheme } from '../../theme'
import { IntroStatic } from './IntroStatic'

const file = require('../../../assets/rive/biblemates.riv')

type Props = {
  /** Lamb touched down (Rive trigger `landed`). */
  onLanded?: () => void
  /** Continue is tappable (Rive trigger `onboardingReady`). */
  onReady?: () => void
  /** Continue tapped (Rive trigger `continueTapped`). */
  onContinue: () => void
}

/** Native intro: the Rive `Intro` artboard, copy and Continue baked in. Web renders IntroView.tsx instead. */
export function IntroView(props: Props) {
  const theme = useTheme()
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion, () => setReduceMotion(false))
  }, [])
  // Wait for the setting: reduceMotion must be on the instance before the first frame.
  return (
    <View style={[styles.fill, { backgroundColor: theme.brand }]}>
      {reduceMotion !== null && <Scene {...props} reduceMotion={reduceMotion} />}
    </View>
  )
}

function Scene({ onLanded, onReady, onContinue, reduceMotion }: Props & { reduceMotion: boolean }) {
  const { riveFile, error: fileError } = useRiveFile(file)
  const { instance, error: instanceError } = useViewModelInstance(riveFile, {
    async: true,
    artboardName: 'Intro',
    onInit: (vmi) => vmi.booleanProperty('reduceMotion')?.set(reduceMotion),
  })
  const [ready, setReady] = useState(false)
  const done = useRef(false)
  const next = () => {
    if (done.current) return
    done.current = true
    onContinue()
  }
  const { trigger: skip } = useRiveTrigger('skip', instance)
  useRiveTrigger('landed', instance, { onTrigger: () => onLanded?.() })
  useRiveTrigger('onboardingReady', instance, {
    onTrigger: () => {
      setReady(true)
      onReady?.()
    },
  })
  useRiveTrigger('continueTapped', instance, { onTrigger: next })

  // A broken .riv must not strand a first-run user without Continue.
  if (fileError || instanceError) {
    return <IntroStatic onLanded={onLanded} onReady={onReady} onContinue={onContinue} />
  }
  if (!riveFile || !instance) return null
  return (
    <View
      style={styles.fill}
      testID="intro-scene"
      // Rive owns the touches; just watch for a tap during the splash.
      onTouchStart={() => !ready && skip()}
      accessible={ready}
      accessibilityRole="button"
      accessibilityLabel="Continue"
      onAccessibilityTap={next}
    >
      <RiveView
        style={styles.fill}
        file={riveFile}
        artboardName="Intro"
        fit={Fit.Cover}
        alignment={Alignment.BottomCenter}
        dataBind={instance}
        autoPlay
      />
    </View>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
