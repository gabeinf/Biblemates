import { goldenHour, palettes, type Palette } from './palettes'

/** THE switch: change this one line (or add a palette file) to re-theme the whole app. */
export const ACTIVE_PALETTE: Palette = goldenHour

/** shortcut: morning/night reuse golden hour until those palettes are designed; add files in ./palettes and point here. */
export const PALETTE_BY_TIME = { morning: goldenHour, goldenHour, night: goldenHour } as const
export type TimeOfDay = keyof typeof PALETTE_BY_TIME

export { palettes }
