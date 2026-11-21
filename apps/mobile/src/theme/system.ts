/** Non-color design tokens: type, space, radius, control, shadow, motion, pasture. Per DESIGN_SYSTEM §2-§4. */
/** Nunito, bundled 600 + 800 only (no 700 file shipped). */
export const font = {
  semibold: 'Nunito_600SemiBold',
  extrabold: 'Nunito_800ExtraBold',
} as const

export const type = {
  display: { fontFamily: font.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.4 },
  title: { fontFamily: font.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  headline: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontFamily: font.semibold, fontSize: 17, lineHeight: 24, letterSpacing: 0 },
  /** Scripture text gets more room: never caps, never ExtraBold. */
  scripture: { fontFamily: font.semibold, fontSize: 17, lineHeight: 26, letterSpacing: 0 },
  callout: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  button: { fontFamily: font.extrabold, fontSize: 18, lineHeight: 22, letterSpacing: 0.2 },
  label: { fontFamily: font.extrabold, fontSize: 13, lineHeight: 16, letterSpacing: 0.6 }, // UPPERCASE eyebrows
  caption: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  tab: { fontFamily: font.extrabold, fontSize: 12, lineHeight: 14, letterSpacing: 0.2 },
} as const
export type TypeVariant = keyof typeof type

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, sheet: 28, pill: 999 } as const
export const control = { height: 56, lip: 4, radius: radius.lg, hitSlop: 8, minTouch: 44, pill: 38 } as const

/** Geometry only: the color comes from `theme.outline` so shadows follow the palette. */
export const shadow = {
  card: {
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const

/** Motion: Reanimated. Springs use duration + dampingRatio (Apple's model). */
export const motion = {
  ease: {
    out: [0.23, 1, 0.32, 1] as const, // entrances, UI default
    inOut: [0.77, 0, 0.175, 1] as const, // on-screen movement
    sheet: [0.32, 0.72, 0, 1] as const, // sheets
  },
  duration: { press: 120, small: 180, standard: 260 },
  spring: {
    settle: { duration: 400, dampingRatio: 1 },
    snap: { duration: 400, dampingRatio: 0.8 },
    sheet: { duration: 300, dampingRatio: 0.8 },
    reward: { duration: 450, dampingRatio: 0.6 }, // reward moments ONLY
  },
  pressScale: 0.97,
  /** Success-screen choreography (DESIGN_SYSTEM §5): headline 120ms, tiles +80ms each, CTA 500ms. */
  celebrate: { headline: 120, tileStagger: 80, cta: 500 },
} as const

export const pasture = {
  artboard: { width: 390, height: 560 },
  walkBounds: [
    [24, 380], [200, 330], [252, 300], [366, 318], [370, 410],
    [212, 430], [380, 500], [380, 532], [12, 532],
  ] as const,
  obstacles: {
    barn: { x: 26, y: 276, w: 80, h: 84 },
    pond: { cx: 296, cy: 456, rx: 84, ry: 32 },
    tree: { x: 296, y: 212, w: 72, h: 92 },
  },
  lambArtboard: { name: 'Lamb Side', width: 440, height: 300, feetX: 190, feetY: 272 },
  lambScale: { atY340: 0.18, atY530: 0.25 },
  walkSpeed: 38,
  maxVisibleLambs: 30,
} as const
