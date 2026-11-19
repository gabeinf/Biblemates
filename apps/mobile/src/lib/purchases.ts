/**
 * RevenueCat wrapper. The SDK is loaded lazily and only when a public API key exists, so a
 * build without keys (CI, screenshots, web) never touches it and the app is unaffected.
 * Every failure resolves to "no paywall": this must never block the app.
 */
import type { PurchasesPackage } from 'react-native-purchases'

// Read the literal names so Expo inlines them at build time.
const apiKey = () => process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
/** Apple's standard subscription terms; override with EXPO_PUBLIC_TERMS_URL. */
export const termsUrl = () =>
  process.env.EXPO_PUBLIC_TERMS_URL ||
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
/** No default: the store requires our own policy, so the paywall stays off until it is set. */
export const privacyUrl = () => process.env.EXPO_PUBLIC_PRIVACY_URL || null

export const paywallConfigured = () => !!apiKey() && !!privacyUrl()

let configured = false
function sdk() {
  // Lazy require: nothing loads unless a key is set.
  const Purchases = (require('react-native-purchases') as typeof import('react-native-purchases'))
    .default
  if (!configured) {
    Purchases.configure({ apiKey: apiKey()! })
    configured = true
  }
  return Purchases
}

export type Offer = {
  packages: PurchasesPackage[]
  /** Product ids the store says are still eligible for their introductory offer. */
  introEligible: string[]
}
const NONE: Offer = { packages: [], introEligible: [] }

/** Current offering; empty when unconfigured, offline, no offering or already subscribed. */
export async function loadOffer(): Promise<Offer> {
  if (!paywallConfigured()) return NONE
  try {
    const Purchases = sdk()
    const [offerings, info] = await Promise.all([
      Purchases.getOfferings(),
      Purchases.getCustomerInfo(),
    ])
    const packages = offerings.current?.availablePackages ?? []
    if (Object.keys(info.entitlements.active).length || !packages.length) return NONE
    // Unknown eligibility counts as ineligible: better no trial wording than a wrong promise.
    const status = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      packages.map((p) => p.product.identifier),
    ).catch(() => ({}) as Record<string, { status: number }>)
    const introEligible = Object.entries(status)
      .filter(
        ([, e]) =>
          e.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE,
      )
      .map(([id]) => id)
    return { packages, introEligible }
  } catch (e) {
    console.warn('paywall offering unavailable', e)
    return NONE
  }
}

/** True when the purchase went through, false when the user backed out. Other errors throw. */
export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  const Purchases = sdk()
  try {
    await Purchases.purchasePackage(pkg)
    return true
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false
    throw e
  }
}

/** True when the restore found an active subscription. */
export async function restore(): Promise<boolean> {
  const info = await sdk().restorePurchases()
  return Object.keys(info.entitlements.active).length > 0
}
