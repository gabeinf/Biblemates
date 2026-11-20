import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { hasSeenPaywall, markPaywallSeen } from '../lib/paywall'
import { loadOffer } from '../lib/purchases'
import { usePlacement } from '../lib/superwall'

const KEY = ['paywall', 'offer'] as const

/** Offer for the paywall sheet; usually already cached by the pre-check below. */
export function usePaywallOffer() {
  return useQuery({ queryKey: KEY, queryFn: loadOffer, staleTime: 5 * 60_000 })
}

/**
 * Returns a function to call when the user completes a reading. The first time, it registers
 * the Superwall placement: a campaign on the dashboard decides which paywall shows. Until a
 * campaign exists (or if Superwall can't show one), it falls back to our own paywall sheet,
 * and only if a store offering loads. Anything else is a silent no-op.
 */
export function useShowPaywallAfterFirstReading() {
  const router = useRouter()
  const qc = useQueryClient()

  const openSheet = useCallback(async () => {
    try {
      const { packages } = await qc.fetchQuery({
        queryKey: KEY,
        queryFn: loadOffer,
        staleTime: 5 * 60_000,
      })
      if (!packages.length) return
      markPaywallSeen()
      router.push('/paywall')
    } catch {
      // Never block reading on the paywall.
    }
  }, [qc, router])

  const { registerPlacement } = usePlacement({
    onPresent: markPaywallSeen,
    onSkip: () => void openSheet(),
    onError: () => void openSheet(),
  })

  return useCallback(async () => {
    if (hasSeenPaywall()) return
    try {
      await registerPlacement({ placement: 'first_reading_completed' })
    } catch {
      // Never block reading on the paywall.
    }
  }, [registerPlacement])
}
