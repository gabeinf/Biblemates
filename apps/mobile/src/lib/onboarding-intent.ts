/**
 * Options for 03 · Intent. The draft stores the option's `id` as `intent`, so labels
 * can change without breaking saved answers or later personalization.
 * See docs/specs/onboarding.md → "03 · Intent".
 */
import type Ionicons from '@expo/vector-icons/Ionicons'

export type IntentOption = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export const INTENT_OPTIONS: readonly IntentOption[] = [
  { id: 'habit', label: 'I want a steady reading habit', icon: 'calendar-outline' },
  { id: 'closer', label: 'I want to feel closer to God', icon: 'heart-outline' },
  { id: 'heavy', label: 'I’m carrying something heavy', icon: 'cloud-outline' },
  { id: 'marriage', label: 'Our marriage needs it', icon: 'people-outline' },
  { id: 'peace', label: 'I want peace in a busy season', icon: 'leaf-outline' },
  { id: 'understand', label: 'The Bible is hard for me to follow', icon: 'book-outline' },
  { id: 'other', label: 'Something else', icon: 'ellipsis-horizontal' },
]

/** The saved intent only counts if it's still one of the options. */
export function validIntent(id: string | undefined): string | null {
  return INTENT_OPTIONS.some((o) => o.id === id) ? (id as string) : null
}

export const INTENT_VERSE = 'Your word is a lamp to my feet and a light to my path.'
export const INTENT_VERSE_REFERENCE = 'Psalm 119:105'
