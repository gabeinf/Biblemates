import { palettes, type Palette } from './palettes'
import { makeTheme, type Theme } from './semantic'

function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function ratio(a: string, b: string) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

type Pair = { fg: keyof Theme; bg: keyof Theme; min: number; note: string }
/** Every text-on-fill pair the kit uses. min 4.5 for body text, 3 for large/bold (≥18pt) text and icons. */
export const PAIRS: Pair[] = [
  { fg: 'text', bg: 'bg', min: 4.5, note: 'body on canvas' },
  { fg: 'text', bg: 'surface', min: 4.5, note: 'body on card' },
  { fg: 'text', bg: 'surfaceSunken', min: 4.5, note: 'body on inputs' },
  { fg: 'textSecondary', bg: 'bg', min: 4.5, note: 'secondary on canvas' },
  { fg: 'textSecondary', bg: 'surface', min: 4.5, note: 'secondary on card' },
  { fg: 'textTertiary', bg: 'surface', min: 4.5, note: 'tertiary on card' },
  { fg: 'onPrimary', bg: 'primary', min: 4.5, note: 'primary button label' },
  { fg: 'primary', bg: 'surface', min: 4.5, note: 'links on card' },
  { fg: 'primaryLip', bg: 'primaryTint', min: 4.5, note: 'selected tab label' },
  { fg: 'rewardInk', bg: 'rewardTint', min: 4.5, note: 'seed pill number' },
  { fg: 'rewardInk', bg: 'reward', min: 4.5, note: 'reward button label' },
  { fg: 'streakInk', bg: 'surface', min: 3, note: 'streak number (large)' },
  { fg: 'rewardLip', bg: 'bg', min: 3, note: 'celebration headline (large)' },
  { fg: 'onPrimary', bg: 'error', min: 4.5, note: 'destructive label' },
]

/** Returns human-readable failures for one palette; empty = pass. */
export function contrastFailures(p: Palette) {
  const t = makeTheme(p)
  return PAIRS.flatMap(({ fg, bg, min, note }) => {
    const r = ratio(t[fg] as string, t[bg] as string)
    return r >= min ? [] : [`${fg} on ${bg} (${note}): ${r.toFixed(2)} < ${min}`]
  })
}

export function allContrastFailures() {
  return Object.entries(palettes).flatMap(([name, p]) => contrastFailures(p).map((f) => `${name}: ${f}`))
}
