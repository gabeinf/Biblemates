import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { hasSeenPaywall, markPaywallSeen } from '../lib/paywall'
import { loadOffer } from '../lib/purchases'

const KEY = ['paywall', 'offer'] as const

/** Offer for the paywall sheet; usually already cached by the pre-check below. */
export function usePaywallOffer() {
  return useQuery({ queryKey: KEY, queryFn: loadOffer, staleTime: 5 * 60_000 })
}

/**
 * Returns a function to call when the user completes a reading. The first time, and only if
 * a store offering loads, it opens the paywall sheet. Anything else is a silent no-op.
 */
export function useShowPaywallAfterFirstReading() {
  const router = useRouter()
  const qc = useQueryClient()
  return useCallback(async () => {
    if (hasSeenPaywall()) return
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
}
