/** Web has no Superwall: no paywalls, so every placement is skipped. See superwall.tsx. */
import type { ReactNode } from 'react'

export const SuperwallRoot = ({ children }: { children: ReactNode }) => <>{children}</>

export const usePlacement = (callbacks?: { onSkip?: () => void }) => ({
  registerPlacement: async (_args: { placement: string }) => callbacks?.onSkip?.(),
})
