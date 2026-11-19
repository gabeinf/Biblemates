/**
 * Onboarding draft for this app session. Each step merges its answers in. It lives in
 * memory only, so closing the app starts onboarding over from the beginning.
 */
import { useSyncExternalStore } from 'react'
import type { OnboardingDraft } from '@biblemates/shared'

/** Where older builds saved the draft to disk. Removed on first read. */
const LEGACY_KEY = 'onboarding:draft'
const EMPTY: OnboardingDraft = Object.freeze({})

/** Merges a patch into a draft. `undefined` values clear a field (e.g. leaving the join path). */
export function mergeDraft(
  draft: OnboardingDraft,
  patch: Partial<OnboardingDraft>,
): OnboardingDraft {
  const next: Record<string, unknown> = { ...draft, ...patch }
  for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k]
  return next as OnboardingDraft
}

let cache: OnboardingDraft | null = null
const listeners = new Set<() => void>()

/** Deletes a draft an older build saved, so it can't linger on the device. */
function removeLegacyDraft() {
  try {
    globalThis.localStorage?.removeItem(LEGACY_KEY)
  } catch {
    // Best effort.
  }
}

export function getDraft(): OnboardingDraft {
  if (!cache) {
    removeLegacyDraft()
    cache = EMPTY
  }
  return cache
}

function setCache(next: OnboardingDraft) {
  cache = next
  listeners.forEach((l) => l())
}

export function updateDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = mergeDraft(getDraft(), patch)
  setCache(next)
  return next
}

export function clearDraft() {
  setCache(EMPTY)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current draft, re-rendering when any step updates it. */
export function useOnboardingDraft(): OnboardingDraft {
  return useSyncExternalStore(subscribe, getDraft, getDraft)
}

/** Test-only: drop the in-memory draft, as if the app had been closed and reopened. */
export function resetDraftCacheForTests() {
  cache = null
}
