/**
 * RevenueCat wrapper. The SDK is loaded lazily and only when a public API key exists, so a
 * build without keys (CI, screenshots, web) never touches it and the app is unaffected.
 * Every failure resolves to "no paywall": this must never block the app.
 */
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases'
// Type-only: expo-superwall's native module can't load on web, so never import its values here.
import type { CustomPurchaseControllerContext, SubscriptionStatus } from 'expo-superwall'

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

// --- Superwall bridge: Superwall shows the paywall, RevenueCat stays the source of truth. ---

const enabled = () => !!apiKey()

/** What Superwall needs to know about the user's entitlements (null = unknown/none → free). */
export function superwallStatus(info: CustomerInfo | null): SubscriptionStatus {
  const ids = Object.keys(info?.entitlements.active ?? {})
  return ids.length
    ? { status: 'ACTIVE', entitlements: ids.map((id) => ({ id, type: 'SERVICE_LEVEL' as const })) }
    : { status: 'INACTIVE' }
}

/**
 * Superwall asks, RevenueCat buys.
 * shortcut: subscriptions only (no one-time products) and no Android plan replacement,
 * add both here if a paywall ever sells them.
 */
export const superwallPurchaseController: CustomPurchaseControllerContext = {
  onPurchase: async (params) => {
    if (!enabled()) return { type: 'failed', error: 'Purchases are not configured' }
    try {
      const Purchases = sdk()
      const products = await Purchases.getProducts(
        [params.productId],
        Purchases.PRODUCT_CATEGORY.SUBSCRIPTION,
      )
      const product =
        products.find(
          (p) =>
            p.identifier === params.productId ||
            (params.platform === 'android' &&
              p.identifier === `${params.productId}:${params.basePlanId}`),
        )
      if (!product) return { type: 'failed', error: 'Product not found' }

      if (params.platform === 'android') {
        // Buy exactly the offer the paywall chose; never let RevenueCat pick its default.
        const id = params.offerId ? `${params.basePlanId}:${params.offerId}` : params.basePlanId
        const option = product.subscriptionOptions?.find((o) => o.id === id)
        if (!option) return { type: 'failed', error: 'Subscription option not found' }
        await Purchases.purchaseSubscriptionOption(option)
      } else {
        await Purchases.purchaseStoreProduct(product)
      }
    } catch (e) {
      const err = e as { code?: string; userCancelled?: boolean; message?: string }
      if (err.userCancelled) return { type: 'cancelled' }
      if (err.code === sdk().PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { type: 'pending' }
      return { type: 'failed', error: err.message }
    }
  },
  onPurchaseRestore: async () => {
    if (!enabled()) return { type: 'failed', error: 'Purchases are not configured' }
    try {
      await sdk().restorePurchases()
    } catch (e) {
      return { type: 'failed', error: (e as Error).message }
    }
  },
}

/** Ties purchases to the signed-in user (null = signed out) so they follow the account across devices. */
export async function syncPurchasesUser(userId: string | null) {
  if (!enabled()) return
  const Purchases = sdk()
  if (userId) await Purchases.logIn(userId)
  // logOut() throws while the user is already anonymous.
  else if (!(await Purchases.isAnonymous())) await Purchases.logOut()
}

/** Calls back with the current customer info, then on every change. Returns the unsubscribe function. */
export function watchCustomerInfo(listener: (info: CustomerInfo | null) => void) {
  if (!enabled()) {
    listener(null)
    return () => {}
  }
  const Purchases = sdk()
  Purchases.getCustomerInfo()
    .then(listener)
    .catch((e) => console.warn('RevenueCat customer info unavailable', e))
  Purchases.addCustomerInfoUpdateListener(listener)
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener)
  }
}
