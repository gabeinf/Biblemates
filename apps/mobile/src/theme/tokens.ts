export const colors = {
    paper: '#f3f2f2',
    Mat: '#eae9e9',
    Ink: '#201f1d',
    Gold: '#8c6911',
    muted: '#5B5A59',
    border: '#5b5a5966',
    inactive: '#D1D0D0',
    surface: '#ffffff',
    goldSoft: '#B6833522',
    success: '#4F7A4A',
    danger: '#A3402E',
    /** Owes-something outcomes: amber, darker than Gold so it reads as a warning. */
    warning: '#9A5B13',
    /** Launch splash. `splash` must match the expo-splash-screen backgroundColor in app.json. */
    splash: '#F7C341',
    splashLight: '#FCE3A0',
    splashDeep: '#E8A93A',
    splashShade: '#D9932E',
    onSplash: '#FFFFFF',
} as const;

/** Verse highlight swatches (stored by key in the `highlights.color` column). */
export const highlightColors = {
    gold: '#F4DFA8',
    sage: '#D5E5C8',
    sky: '#CFE2F0',
    rose: '#F2D0CF',
} as const;
export type HighlightColor = keyof typeof highlightColors;

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
} as const;

export const typography = {
    fontFamily: {
        display: 'CormorantGaramond',
        body: 'Lora',
        bodyItalic: 'Lora-Italic',
    },
    fontSize: {
        caption: 12,
        bodySmall: 16,
        body: 18,
        subTitle : 24,
        title: 32,
        display: 48,
    }
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
