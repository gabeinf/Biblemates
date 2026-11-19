/**
 * Weekly stakes: what someone owes their circle after a missed week.
 * The presets are shared by 07 (stakes teaser) and 12 (stakes picker).
 */
import type { OnboardingDraft } from '@biblemates/shared'

export type Stakes = NonNullable<OnboardingDraft['stakes']>

export type StakesPreset = {
  label: string
  /** Ionicons glyph name. */
  icon: 'cafe-outline' | 'restaurant-outline' | 'heart-outline' | 'mail-outline'
}

export const STAKES_PRESETS: readonly StakesPreset[] = [
  { label: 'Coffee on me', icon: 'cafe-outline' },
  { label: 'I cook dinner', icon: 'restaurant-outline' },
  { label: 'Pray for you by name', icon: 'heart-outline' },
  { label: 'Handwritten note', icon: 'mail-outline' },
]

export const STAKES_MAX = 40

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
