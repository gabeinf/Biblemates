/**
 * Step 19 helpers: what the sign-up call carries, and which providers are switched on.
 * The answers ride in the auth user's metadata, and `handle_new_user` (see the
 * 20261119000000 migration) applies them in the same transaction as the account.
 */
import type { OnboardingDraft } from '@biblemates/shared'

/** The answers the database writes: profile, circle (create or join), goal, stakes, intent, source. */
export function onboardingPayload(draft: OnboardingDraft) {
  const { path, inviteCode, daysPerWeek, stakes, intent, source } = draft
  // A joiner's goal and stakes belong to the circle's creator, so they aren't sent.
  return path === 'join'
    ? { path, inviteCode, intent, source }
    : { path, daysPerWeek, stakes, intent, source }
}

/** Provider buttons stay hidden until the provider is set up (EXPO_PUBLIC_AUTH_<NAME>=true). */
export const PROVIDERS = {
  apple: process.env.EXPO_PUBLIC_AUTH_APPLE === 'true',
  google: process.env.EXPO_PUBLIC_AUTH_GOOGLE === 'true',
}

/** Supabase hides a failed sign-up trigger behind "Database error", so say what likely went wrong. */
export function signUpErrorMessage(message: string, joining: boolean): string {
  return joining && /database error/i.test(message)
    ? 'We couldn’t find a circle for that invite code. Check it and try again.'
    : message
}
