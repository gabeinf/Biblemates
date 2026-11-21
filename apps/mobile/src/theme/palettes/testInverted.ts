// Deliberately different palette: dark canvas, magenta primary. Used by the dev palette switcher,
// the contrast script and QA (swap ACTIVE_PALETTE to this and the whole app must re-theme).
import { goldenHour } from './goldenHour'
import type { Palette } from './types'

export const testInverted: Palette = {
  ...goldenHour,
  canvas: '#14102A',
  surface: '#221C45',
  surfaceSunken: '#0E0B20',
  line: '#3A3266',
  ink900: '#F6F2FF',
  ink600: '#C8C0EA',
  ink400: '#A79FD0',
  meadow700: '#F06AC0',
  meadow800: '#F9A8DC',
  meadow500: '#E85DB8',
  meadow100: '#3A1B52',
  wool: '#14102A',
  error: '#FF7A7D',
  disabledFill: '#2E2858',
  disabledInk: '#8C84BA',
}
