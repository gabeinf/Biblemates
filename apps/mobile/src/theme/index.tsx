import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import { ACTIVE_PALETTE, PALETTE_BY_TIME, type TimeOfDay } from './active'
import { palettes, type PaletteName } from './palettes'
import { makeTheme, type Theme } from './semantic'

export { ACTIVE_PALETTE, PALETTE_BY_TIME, palettes }
export type { Theme, TimeOfDay, PaletteName }
export { alpha } from './color'
export { makeTheme } from './semantic'
export { type, space, radius, control, shadow, motion, pasture, font, type TypeVariant } from './system'

const Ctx = createContext<Theme>(makeTheme(ACTIVE_PALETTE))

/** Optional: without a provider `useTheme()` returns the ACTIVE_PALETTE theme. `palette` beats `timeOfDay`. */
export function ThemeProvider({
  palette,
  timeOfDay,
  children,
}: PropsWithChildren<{ palette?: PaletteName; timeOfDay?: TimeOfDay }>) {
  const theme = useMemo(() => {
    const p = palette ? palettes[palette] : timeOfDay ? PALETTE_BY_TIME[timeOfDay] : ACTIVE_PALETTE
    return makeTheme(p)
  }, [palette, timeOfDay])
  return <Ctx.Provider value={theme}>{children}</Ctx.Provider>
}

export function useTheme(): Theme {
  return useContext(Ctx)
}
