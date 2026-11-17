/**
 * On-device onboarding draft. Each step merges its answers in, and the draft is read
 * back (and validated) on launch so a killed app resumes where it left off.
 * Uses the same localStorage (expo-sqlite on native) as reader-prefs and the auth session.
 */
import { useSyncExternalStore } from 'react'
import { OnboardingDraftSchema, type OnboardingDraft } from '@biblemates/shared'

const KEY = 'onboarding:draft'
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

/** Parses stored JSON. Anything corrupt or from an older schema becomes an empty draft. */
export function parseDraft(raw: string | null): OnboardingDraft {
  if (!raw) return EMPTY
  try {
    const result = OnboardingDraftSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : EMPTY
  } catch {
    return EMPTY
  }
}

let cache: OnboardingDraft | null = null
const listeners = new Set<() => void>()

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function getDraft(): OnboardingDraft {
  if (!cache) cache = parseDraft(storage()?.getItem(KEY) ?? null)
  return cache
}

function setCache(next: OnboardingDraft) {
  cache = next
  listeners.forEach((l) => l())
}

export function updateDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = mergeDraft(getDraft(), patch)
  try {
    storage()?.setItem(KEY, JSON.stringify(next))
  } catch {
    // Best effort: the in-memory draft still works for this session.
  }
  setCache(next)
  return next
}

export function clearDraft() {
  try {
    storage()?.removeItem(KEY)
  } catch {
    // ignore
  }
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

/** Test-only: forget the in-memory copy so the next read hits storage. */
export function resetDraftCacheForTests() {
  cache = null
}
