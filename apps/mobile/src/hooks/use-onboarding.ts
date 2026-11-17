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

  /** Pops the stack, or, after a cold resume with no history, opens the previous step. */
  const goBack = useCallback(() => {
    if (router.canGoBack()) return router.back()
    router.replace(step === null ? '/' : backHref(step, getDraft().path))
  }, [router, step])

  return { step, goNext, goBack }
}

let resumeOffered = false

/**
 * The step to resume at on launch, offered once per app session so going back to the
 * welcome screen doesn't bounce the user straight back into the flow.
 */
export function takeResumeStep(): OnboardingStepId | null {
  if (resumeOffered) return null
  markResumeOffered()
  const { step } = getDraft()
  return step === undefined || step === 1 || step === 2 ? null : step
}

/** Called when the user is already in the flow (e.g. a deep link), so welcome won't redirect later. */
export function markResumeOffered() {
  resumeOffered = true
}
