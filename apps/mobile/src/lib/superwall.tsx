/**
 * Superwall (native). The web build uses superwall.web.tsx, because the SDK's native module
 * can't load there. RevenueCat makes the purchases; Superwall decides when to show a paywall.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { CustomPurchaseControllerProvider, SuperwallProvider, useUser } from 'expo-superwall'
import { useAuthContext } from '../hooks/use-auth-context'
import {
  superwallPurchaseController,
  superwallStatus,
  syncPurchasesUser,
  watchCustomerInfo,
} from './purchases'

export { usePlacement } from 'expo-superwall'

// Public SDK keys, safe to ship in the app.
const apiKeys = {
  ios: 'pk_4rYoZCvxjo0KEo4ZMEWJ2',
  android: 'pk_UO1Gt3MYTn7Iz9X3kYK9x',
}

/** Keeps Superwall and RevenueCat in step with the signed-in user: identity, entitlements, attributes. */
function SuperwallSync() {
  const { userId, isLoading, profile } = useAuthContext()
  // useUser() returns new functions every render, and each call updates its store (re-rendering
  // us), so effects must not depend on them or they loop. Read them through a ref.
  const latest = useUser()
  const user = useRef(latest)
  // Declared first, so it runs before the effects below on every commit.
  useEffect(() => {
    user.current = latest
  })

  useEffect(() => {
    if (isLoading) return
    // Supabase user ids are UUIDs, which StoreKit needs for appAccountToken.
    const superwall = userId ? user.current.identify(userId) : user.current.signOut()
    Promise.all([superwall, syncPurchasesUser(userId)]).catch((e) =>
      console.warn('Purchases user sync failed', e),
    )
  }, [userId, isLoading])

  useEffect(
    () =>
      watchCustomerInfo((info) =>
        user.current
          .setSubscriptionStatus(superwallStatus(info))
          .catch((e) => console.warn('Superwall status sync failed', e)),
      ),
    [],
  )

  const name = profile?.display_name
  useEffect(() => {
    if (name)
      user.current.update({ name }).catch((e) => console.warn('Superwall attributes failed', e))
  }, [name])

  return null
}

export function SuperwallRoot({ children }: { children: ReactNode }) {
  return (
    <CustomPurchaseControllerProvider controller={superwallPurchaseController}>
      <SuperwallProvider apiKeys={apiKeys}>
        <SuperwallSync />
        {children}
      </SuperwallProvider>
    </CustomPurchaseControllerProvider>
  )
}
