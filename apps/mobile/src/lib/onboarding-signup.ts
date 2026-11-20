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

type Err = { message: string } | null
type Session = { access_token: string; refresh_token: string }
type Scratch = {
  auth: {
    signInWithIdToken(a: {
      provider: 'apple'
      token: string
    }): Promise<{ data: { session: Session | null }; error: Err }>
    signOut(): Promise<unknown>
  }
  rpc(
    fn: 'complete_onboarding',
    args: { answers: unknown; display: string | null },
  ): PromiseLike<{ error: Err }>
}
type Main = { auth: { setSession(s: Session): Promise<{ error: Err }> } }

/**
 * Provider sign-in. The session is created on a scratch client first, so the app's auth guard
 * doesn't move the user off step 19 mid-write: the draft is applied in one RPC, and only then
 * is the session handed to the real client. A failed write leaves the user here to retry.
 */
export async function signInWithAppleToken(
  { scratch, main }: { scratch: Scratch; main: Main },
  token: string,
  draft: OnboardingDraft,
): Promise<string | null> {
  const { data, error } = await scratch.auth.signInWithIdToken({ provider: 'apple', token })
  if (error || !data.session) return error?.message ?? 'Apple sign-in failed.'
  const { error: writeError } = await scratch.rpc('complete_onboarding', {
    answers: onboardingPayload(draft),
    display: draft.displayName || null,
  })
  if (writeError) {
    await scratch.auth.signOut()
    return signUpErrorMessage(writeError.message, draft.path === 'join')
  }
  const { error: sessionError } = await main.auth.setSession(data.session)
  return sessionError?.message ?? null
}
