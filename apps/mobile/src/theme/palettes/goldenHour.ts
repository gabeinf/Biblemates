// Golden hour: the default palette. Raw swatches only; screens use roles from theme/semantic.ts.
import type { Palette } from './types'

export const goldenHour = {
  // Brand / night — trust, calm, the splash sky
  navy900: '#1B2D4F', // = ink900
  navy700: '#243E69', // brand, splash, night sky
  navy500: '#3A5A93',
  navy300: '#8FA6CF',
  navy200: '#B9C8E6',
  navy100: '#E3EAF6',

  // Meadow — growth, primary action, success
  meadow800: '#236634', // button lip (pressed shadow)
  meadow700: '#2F8443', // PRIMARY button fill (white label 4.66:1)
  meadow500: '#4CB860', // progress, success icons, illustration
  meadow300: '#9BDB8F',
  meadow100: '#E4F6DF', // selected tab pill, success tint

  // Harvest — seeds (currency) and rewards
  gold700: '#B87A0E',
  gold500: '#F5B731', // seed body
  gold300: '#FAD77E', // seed highlight, seed pill border
  gold100: '#FFF3D1',
  goldInk: '#5A3A00', // text on gold100 / white (9.3:1)

  // Ember — streaks
  ember700: '#C4581A', // streak number (large text 4.41:1)
  ember500: '#FF8A3D', // flame
  ember200: '#FFD9BF', // streak pill border
  ember100: '#FFE8D6',

  // Rose — love, petting, blush
  rose500: '#F2738C',
  rose400: '#F79584', // lamb blush, flowers
  rose100: '#FDE4E8',

  // Sky — day pasture
  sky700: '#2F7FC1', // large text / icons only
  sky400: '#7CC8F2', // sky top
  sky300: '#A9DDF7', // sky horizon
  sky100: '#E3F4FC',

  // Character (lamb) — do not use for UI chrome
  wool: '#FFFFFF',
  woolShade: '#F2E2CC',
  woolCurl: '#EBD6BC',
  outline: '#2B1C16', // characters + collectibles only
  cocoa600: '#5E3824',
  cocoa500: '#8A5A42',
  cocoa400: '#B37D5E', // lamb face
  cocoa300: '#A06C4F',

  // Scenery — flat, never outlined
  hillBack: '#A6DB8C',
  hillMid: '#78C66B',
  hillFront: '#57AE5C',
  grassDetail: '#3F8E4B',
  path: '#FFF1DC',
  pond: '#5AA9E6',
  pondLight: '#BFE3FF',
  sun: '#FFC94A',
  tree: '#3F9455',
  treeLight: '#5DB26C',

  // Warm neutrals (never pure grey)
  canvas: '#FFF8EE', // app background
  surface: '#FFFFFF', // cards, tab bar, pills
  surfaceSunken: '#F6EEE2', // progress track, inputs
  line: '#EADFCF',
  ink900: '#1B2D4F', // primary text (13.0:1 on canvas)
  ink600: '#4A5878', // secondary text (6.7:1)
  ink400: '#687290', // tertiary / inactive tab (4.5:1)
  disabledFill: '#E6E1D8',
  disabledInk: '#A8AEBD',
  error: '#D63B40', // white label 4.61:1
  // Scene sky, top to bottom after sky400: lilac → pink → peach
  skyLilac: '#B9A5E8',
  skyPink: '#F3B2C8',
  skyPeach: '#FDD3B8',
} as const satisfies Palette
