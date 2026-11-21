import { goldenHour } from './goldenHour'
import { testInverted } from './testInverted'

export type { Palette, PaletteKey } from './types'
export { goldenHour, testInverted }
export const palettes = { goldenHour, testInverted } as const
export type PaletteName = keyof typeof palettes
