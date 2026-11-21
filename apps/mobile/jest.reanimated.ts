// Stub of the Reanimated surface the app uses. Reanimated's own jest mock needs the worklets native
// module, which Jest doesn't have. Tests that need more (entering builders…) spread this and add to it.
import { View } from 'react-native'

const hold = <T,>(v: T) => v

export function reanimatedStub() {
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: hold },
    View,
    createAnimatedComponent: hold,
    Easing: { bezier: () => (t: number) => t, out: hold, quad: hold },
    interpolate: (v: number) => v,
    runOnJS: hold,
    useReducedMotion: () => false,
    useSharedValue: (v: unknown) => ({ value: v, get: () => v, set: () => undefined }),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    useAnimatedStyle: () => ({}),
    withTiming: hold,
    withSpring: hold,
    withDelay: (_: number, v: unknown) => v,
    withRepeat: hold,
    withSequence: (...v: unknown[]) => v[v.length - 1],
  }
}
