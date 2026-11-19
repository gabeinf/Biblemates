/**
 * Weekly stakes: what someone owes their circle after a missed week.
 * The presets are shared by 07 (stakes teaser) and 12 (stakes picker).
 */
import type { OnboardingDraft } from '@biblemates/shared'

export type Stakes = NonNullable<OnboardingDraft['stakes']>

export type StakesPreset = {
  id: string
  label: string
  /** Ionicons glyph name. */
  icon: 'cafe-outline' | 'restaurant-outline' | 'heart-outline' | 'mail-outline'
}

export const STAKES_PRESETS: readonly StakesPreset[] = [
  { id: 'coffee', label: 'Coffee on me', icon: 'cafe-outline' },
  { id: 'dinner', label: 'I cook dinner', icon: 'restaurant-outline' },
  { id: 'pray', label: 'Pray for you by name', icon: 'heart-outline' },
  { id: 'note', label: 'Handwritten note', icon: 'mail-outline' },
]

export const STAKES_MAX = 40

/**
 * Words that would turn friendly stakes into gambling (spec open question 1). Tests run every
 * preset through it, and 12 can reuse it to check custom stakes text.
 */
export const GAMBLING_WORDS = /\b(bet|bets|betting|wager|gamble|gambling|money|cash|pay)\b|\$/i

/** An error message for a typed stakes label, or null if it's fine. */
export function stakesLabelError(raw: string): string | null {
  const label = raw.trim()
  if (!label) return 'Write what you’ll owe.'
  if (label.length > STAKES_MAX) return `Keep it to ${STAKES_MAX} characters.`
  return null
}

/**
 * Stakes from a typed label. Typing a preset's exact label selects that preset;
 * anything else (including an edited preset) becomes custom.
 */
export function stakesFromLabel(raw: string): Stakes | null {
  if (stakesLabelError(raw)) return null
  const label = raw.trim()
  const preset = STAKES_PRESETS.find((p) => p.label.toLowerCase() === label.toLowerCase())
  return preset ? { kind: 'preset', label: preset.label } : { kind: 'custom', label }
}
