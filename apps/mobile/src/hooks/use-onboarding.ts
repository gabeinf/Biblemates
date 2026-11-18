import { useCallback } from 'react'
import { usePathname, useRouter } from 'expo-router'
import type { OnboardingDraft, OnboardingStepId } from '@biblemates/shared'
import { getDraft, updateDraft } from '../lib/onboarding-draft'
import { backHref, nextStep, parseStep, stepHref } from '../lib/onboarding-flow'

/** The onboarding step for the current route, or null outside /onboarding. */
export function useCurrentStep(): OnboardingStepId | null {
  const pathname = usePathname()
  const m = pathname.match(/^\/onboarding\/([^/]+)$/)
  return m ? parseStep(m[1]) : null
}

/** Moves between onboarding steps, saving answers to the draft on the way forward. */
export function useOnboardingNav() {
  const router = useRouter()
  const step = useCurrentStep()

  /** Saves `answers` (if any) and opens the next step on the user's path. */
  const goNext = useCallback(
    (answers: Partial<OnboardingDraft> = {}) => {
      if (step === null) return
      const draft = updateDraft(answers)
      const next = nextStep(step, draft.path)
      router.push(next === null ? '/' : stepHref(next))
    },
    [router, step],
  )

  /** Pops the stack, or, with no history (deep link, web reload), opens the previous step. */
  const goBack = useCallback(() => {
    if (router.canGoBack()) return router.back()
    router.replace(step === null ? '/' : backHref(step, getDraft().path))
  }, [router, step])

  return { step, goNext, goBack }
}

let launchHandled = false

/**
 * True until "/" has been shown once in this app session, so the first visit opens the
 * splash (01), which opens the hook (02). After that, "/" shows the welcome screen.
 * A pure read, safe to call while rendering; `markLaunchHandled` records the visit.
 */
export function isLaunchPending(): boolean {
  return !launchHandled
}

/** Called once "/" or any step has shown, so later visits to "/" skip the splash. */
export function markLaunchHandled() {
  launchHandled = true
}
