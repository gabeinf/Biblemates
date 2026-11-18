// Native modules that Jest can't load. Each library ships its own mock.
import { jest } from '@jest/globals'

jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'))
