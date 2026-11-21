// Native modules that Jest can't load. Each library ships its own mock.
import { jest } from '@jest/globals'

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
)
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
)
jest.mock('react-native-reanimated', () => require('./jest.reanimated').reanimatedStub())
