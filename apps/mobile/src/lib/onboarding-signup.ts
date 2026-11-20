/**
 * Step 19 helpers: what the sign-up call carries, and which providers are switched on.
 * The answers ride in the auth user's metadata, and `handle_new_user` (see the
 * 20261119000000 migration) applies them in the same transaction as the account.
 */
import { Platform } from 'react-native'
import type { OnboardingDraft } from '@biblemates/shared'

/** The answers the database writes: profile, circle (create or join), goal, stakes, intent, source. */
export function onboardingPayload(draft: OnboardingDraft) {
  const { path, inviteCode, daysPerWeek, stakes, intent, source } = draft
  // A joiner's goal and stakes belong to the circle's creator, so they aren't sent.
  return path === 'join'
    ? { path, inviteCode, intent, source }
    : { path, daysPerWeek, stakes, intent, source }
}

/** Apple sign-in is iOS-only (native sheet); Google is not wired yet (needs OAuth client IDs). */
export const PROVIDERS = {
  apple: Platform.OS === 'ios',
}

/** Supabase hides a failed sign-up trigger behind "Database error", so say what likely went wrong. */
export function signUpErrorMessage(message: string, joining: boolean): string {
  return joining && /database error/i.test(message)
    ? 'We couldn’t find a circle for that invite code. Check it and try again.'
    : message
}

type Rpc = {
  auth: {
    signInWithIdToken(a: {
      provider: 'apple'
      token: string
    }): Promise<{ error: { message: string } | null }>
    signOut(): Promise<unknown>
  }
  rpc(
    fn: 'complete_onboarding',
    args: { answers: unknown; display: string | null },
  ): PromiseLike<{ error: { message: string } | null }>
}

/**
 * Provider sign-in: the session comes first, then the draft is applied in one RPC.
 * If the write fails we sign out again so the user stays on step 19 and can retry.
 */
export async function signInWithAppleToken(
  client: Rpc,
  token: string,
  draft: OnboardingDraft,
): Promise<string | null> {
  const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token })
  if (error) return error.message
  const { error: writeError } = await client.rpc('complete_onboarding', {
    answers: onboardingPayload(draft),
    display: draft.displayName || null,
  })
  if (!writeError) return null
  await client.auth.signOut()
  return signUpErrorMessage(writeError.message, draft.path === 'join')
}
