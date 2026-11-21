/**
 * Legacy token names (`colors.Gold`, `typography.fontFamily.body`…) that existing screens import.
 * Values come from the ACTIVE palette via semantic roles, so the whole app re-themes from
 * theme/active.ts. New code uses `useTheme()` from 'theme' instead; screens migrate in the rework batches.
 */
import { Platform } from 'react-native'
import { ACTIVE_PALETTE } from './active'
import { alpha } from './color'
import { makeTheme } from './semantic'
import { font } from './system'

const t = makeTheme(ACTIVE_PALETTE)

export const colors = {
  paper: t.bg,
  Mat: t.surfaceSunken,
  Ink: t.text,
  /** Legacy "accent": primary action color (meadow). Gold the *reward* color is `theme.reward`. */
  Gold: t.primary,
  muted: t.textSecondary,
  border: t.border,
  inactive: t.disabledFill,
  surface: t.surface,
  goldSoft: t.primaryTint,
  success: t.success,
  danger: t.error,
  dangerSoft: alpha(t.error, 0.08),
  warning: t.streakInk,
  shadow: t.outline,
  wash: t.rewardTint,
  /** Launch splash. `splash` must match the expo-splash-screen backgroundColor in app.json. */
  splash: t.brand,
  splashLight: t.brandSoft,
  splashDeep: t.brandDeep,
  splashShade: t.brandDeep,
  onSplash: t.onPrimary,
} as const

/** Verse highlight swatches (stored by key in the `highlights.color` column). */
export const highlightColors = {
  gold: t.rewardBorder,
  sage: ACTIVE_PALETTE.meadow300,
  sky: ACTIVE_PALETTE.sky300,
  rose: ACTIVE_PALETTE.rose100,
} as const
export type HighlightColor = keyof typeof highlightColors

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  ml: 18,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const

export const typography = {
  fontFamily: {
    display: font.extrabold,
    body: font.semibold,
    /** No Nunito italic is bundled; italic call sites render upright. */
    bodyItalic: font.semibold,
    /** System monospace, for codes. */
    mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' }),
  },
  fontSize: {
    caption: 12,
    bodySmall: 16,
    body: 18,
    subTitle: 24,
    title: 32,
    display: 48,
  },
} as const

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const
