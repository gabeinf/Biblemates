import * as z from 'zod'

/** A step in the onboarding flow: numbered screens 1–19 plus the join-with-code branch. */
export const OnboardingStepIdSchema = z.union([z.number().int().min(1).max(19), z.literal('join')])
export type OnboardingStepId = z.infer<typeof OnboardingStepIdSchema>

/**
 * Answers collected during onboarding, saved on-device so the flow survives restarts.
 * Everything is optional: each step fills in its own fields.
 */
export const OnboardingDraftSchema = z.object({
  /** Last step the user reached, so we can resume there. */
  step: OnboardingStepIdSchema.optional(),
  /** Chosen at step 09: start a new circle, or join one with a code. */
  path: z.enum(['create', 'join']).optional(),
  intent: z.string().min(1).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  stakes: z
    .object({ kind: z.enum(['preset', 'custom']), label: z.string().min(1).max(40) })
    .optional(),
  displayName: z.string().trim().min(1).max(30).optional(),
  /** A circle's invite code: 6 uppercase hex characters (circles.invite_code). */
  inviteCode: z
    .string()
    .regex(/^[0-9A-F]{6}$/)
    .optional(),
  committedAt: z.iso.datetime().optional(),
  invitedAt: z.iso.datetime().optional(),
  notifications: z.enum(['granted', 'denied', 'unavailable']).optional(),
  source: z.object({ id: z.string().min(1), other: z.string().max(60).optional() }).optional(),
})
export type OnboardingDraft = z.infer<typeof OnboardingDraftSchema>
