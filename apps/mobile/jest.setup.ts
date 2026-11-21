// Native modules that Jest can't load. Each library ships its own mock.
import { jest } from '@jest/globals'

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
)
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
)
// Reanimated's own mock needs the worklets native module, so stub just what the app uses.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  const hold = (v: unknown) => v
  return {
    __esModule: true,
    default: { View },
    View,
    Easing: { bezier: () => (t: number) => t },
    useReducedMotion: () => false,
    useSharedValue: (v: unknown) => ({ value: v, get: () => v, set: () => undefined }),
    useAnimatedStyle: () => ({}),
    withTiming: hold,
    withSpring: hold,
    withDelay: (_: number, v: unknown) => v,
    withSequence: (...v: unknown[]) => v[v.length - 1],
  }
})
