import type { Palette } from './palettes/types'

/** Roles only. Screens read these via `useTheme()`; nothing outside theme/ names a swatch. */
export function makeTheme(p: Palette) {
  return {
    bg: p.canvas,
    surface: p.surface,
    surfaceSunken: p.surfaceSunken,
    border: p.line,
    text: p.ink900,
    textSecondary: p.ink600,
    textTertiary: p.ink400,
    onPrimary: p.wool,
    primary: p.meadow700,
    primaryLip: p.meadow800,
    primaryTint: p.meadow100,
    progress: p.meadow500,
    success: p.meadow700,
    reward: p.gold500,
    rewardLip: p.gold700,
    rewardInk: p.goldInk,
    rewardTint: p.gold100,
    rewardBorder: p.gold300,
    streak: p.ember500,
    streakInk: p.ember700,
    streakTint: p.ember100,
    streakBorder: p.ember200,
    love: p.rose500,
    loveTint: p.rose100,
    brand: p.navy700,
    brandDeep: p.navy900,
    brandSoft: p.navy500,
    info: p.navy500,
    error: p.error,
    disabledFill: p.disabledFill,
    disabledText: p.disabledInk,
    outline: p.outline,
    scene: {
      sky: [p.sky400, p.skyLilac, p.skyPink, p.skyPeach] as const,
      hillBack: p.hillBack,
      hillMid: p.hillMid,
      hillFront: p.hillFront,
      grassDetail: p.grassDetail,
      path: p.path,
      pond: p.pond,
      pondLight: p.pondLight,
      sun: p.sun,
      tree: p.tree,
      treeLight: p.treeLight,
      wool: p.wool,
      woolShade: p.woolShade,
    },
  }
}

export type Theme = ReturnType<typeof makeTheme>
export type Role = Exclude<keyof Theme, 'scene'>
