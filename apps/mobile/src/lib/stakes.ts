/**
 * Friendly weekly stakes. One list shared by 07 (teaser carousel) and 12 (stakes picker),
 * so the examples people see first are the ones they can pick.
 * See docs/specs/onboarding.md → "07 · Stakes teaser" and "12 · Stakes picker".
 *
 * Keep these wholesome: no money, betting or gambling language (spec open question 1).
 */
import type Ionicons from '@expo/vector-icons/Ionicons'

export type StakesPreset = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export const STAKES_PRESETS: readonly StakesPreset[] = [
  { id: 'coffee', label: 'Coffee on me', icon: 'cafe-outline' },
  { id: 'dinner', label: 'I cook dinner', icon: 'restaurant-outline' },
  { id: 'pray', label: 'Pray for you by name', icon: 'heart-outline' },
  { id: 'note', label: 'Handwritten note', icon: 'mail-outline' },
]

/** Words that would turn friendly stakes into gambling. Used by tests on every preset. */
export const GAMBLING_WORDS = /\b(bet|bets|betting|wager|gamble|gambling|money|cash|pay|\$)/i
