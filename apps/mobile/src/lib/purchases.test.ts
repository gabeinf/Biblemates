import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockSdk = {
  configure: jest.fn(),
  getOfferings: jest.fn<() => Promise<unknown>>(),
  getCustomerInfo: jest.fn<() => Promise<unknown>>(),
  purchasePackage: jest.fn<() => Promise<unknown>>(),
  checkTrialOrIntroductoryPriceEligibility: jest.fn<() => Promise<unknown>>(),
  getProducts: jest.fn<(ids: string[], category: string) => Promise<unknown[]>>(),
  purchaseStoreProduct: jest.fn<(product: unknown) => Promise<unknown>>(),
  purchaseSubscriptionOption: jest.fn<(option: unknown) => Promise<unknown>>(),
  restorePurchases: jest.fn<() => Promise<unknown>>(),
  logIn: jest.fn<(id: string) => Promise<unknown>>(),
  logOut: jest.fn<() => Promise<unknown>>(),
  isAnonymous: jest.fn<() => Promise<boolean>>(),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
}
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    ...mockSdk,
    INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2 },
    PRODUCT_CATEGORY: { SUBSCRIPTION: 'SUBSCRIPTION' },
    PURCHASES_ERROR_CODE: { PAYMENT_PENDING_ERROR: 20 },
  },
}))

const env = { ...process.env }
beforeEach(() => {
  jest.resetModules()
  Object.values(mockSdk).forEach((f) => f.mockReset())
  mockSdk.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } })
})
afterEach(() => {
  process.env = { ...env }
})

const load = () => require('./purchases') as typeof import('./purchases')

const NONE = { packages: [], introEligible: [] }
const pkgA = { identifier: 'a', product: { identifier: 'a.product' } }

function configure() {
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key'
  process.env.EXPO_PUBLIC_PRIVACY_URL = 'https://p.example'
}

describe('loadOffer', () => {
  it('is empty and never touches the SDK without an API key', async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    process.env.EXPO_PUBLIC_PRIVACY_URL = 'https://p.example'
    expect(await load().loadOffer()).toEqual(NONE)
    expect(mockSdk.configure).not.toHaveBeenCalled()
  })

  it('is empty without a privacy URL, even with a key', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key'
    delete process.env.EXPO_PUBLIC_PRIVACY_URL
    expect(await load().loadOffer()).toEqual(NONE)
    expect(mockSdk.configure).not.toHaveBeenCalled()
  })

  it('returns packages and only the products the store says are intro-eligible', async () => {
    configure()
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: [pkgA] } })
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValue({
      'a.product': { status: 2 },
    })
    expect(await load().loadOffer()).toEqual({ packages: [pkgA], introEligible: ['a.product'] })
    expect(mockSdk.configure).toHaveBeenCalledWith({ apiKey: 'key' })
  })

  it('treats ineligible, unknown and failed eligibility checks as no trial', async () => {
    configure()
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: [pkgA] } })
    const { loadOffer } = load()
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValueOnce({
      'a.product': { status: 1 },
    })
    expect((await loadOffer()).introEligible).toEqual([])
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValueOnce({
      'a.product': { status: 0 },
    })
    expect((await loadOffer()).introEligible).toEqual([])
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockRejectedValueOnce(new Error('nope'))
    const offer = await loadOffer()
    expect(offer.packages).toEqual([pkgA])
    expect(offer.introEligible).toEqual([])
  })

  it('is empty when the SDK fails, there is no offering, or the user already subscribes', async () => {
    configure()
    const { loadOffer } = load()
    mockSdk.getOfferings.mockRejectedValue(new Error('offline'))
    expect(await loadOffer()).toEqual(NONE)
    mockSdk.getOfferings.mockResolvedValue({ current: null })
    expect(await loadOffer()).toEqual(NONE)
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: [pkgA] } })
    mockSdk.getCustomerInfo.mockResolvedValue({ entitlements: { active: { pro: {} } } })
    expect(await loadOffer()).toEqual(NONE)
  })
})

describe('purchase', () => {
  it('is false when the user cancels and rethrows other errors', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key'
    const { purchase } = load()
    mockSdk.purchasePackage.mockRejectedValueOnce({ userCancelled: true })
    expect(await purchase({} as never)).toBe(false)
    mockSdk.purchasePackage.mockRejectedValueOnce(new Error('boom'))
    await expect(purchase({} as never)).rejects.toThrow('boom')
    mockSdk.purchasePackage.mockResolvedValueOnce({})
    expect(await purchase({} as never)).toBe(true)
  })
})

describe('superwallStatus', () => {
  const info = (ids: string[]) =>
    ({ entitlements: { active: Object.fromEntries(ids.map((k) => [k, {}])) } }) as never
  it('mirrors the active RevenueCat entitlements', () => {
    const { superwallStatus } = load()
    expect(superwallStatus(info(['pro']))).toEqual({
      status: 'ACTIVE',
      entitlements: [{ id: 'pro', type: 'SERVICE_LEVEL' }],
    })
    expect(superwallStatus(info([]))).toEqual({ status: 'INACTIVE' })
    expect(superwallStatus(null)).toEqual({ status: 'INACTIVE' })
  })
})

describe('superwallPurchaseController', () => {
  const ios = { platform: 'ios', productId: 'pro_monthly' } as const
  const android = { platform: 'android', productId: 'pro', basePlanId: 'monthly' } as const
  const product = { identifier: 'pro_monthly' }

  it('fails without touching the SDK when there is no API key', async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    const c = load().superwallPurchaseController
    expect(await c.onPurchase(ios)).toEqual({ type: 'failed', error: 'Purchases are not configured' })
    expect(await c.onPurchaseRestore()).toEqual({
      type: 'failed',
      error: 'Purchases are not configured',
    })
    expect(mockSdk.configure).not.toHaveBeenCalled()
  })

  it('buys the iOS product through RevenueCat', async () => {
    configure()
    mockSdk.getProducts.mockResolvedValue([product])
    expect(await load().superwallPurchaseController.onPurchase(ios)).toBeUndefined()
    expect(mockSdk.purchaseStoreProduct).toHaveBeenCalledWith(product)
  })

  it('fails when RevenueCat has no such product', async () => {
    configure()
    mockSdk.getProducts.mockResolvedValue([])
    expect(await load().superwallPurchaseController.onPurchase(ios)).toEqual({
      type: 'failed',
      error: 'Product not found',
    })
  })

  it('maps cancel, pending and other errors to their own results', async () => {
    configure()
    const c = load().superwallPurchaseController
    mockSdk.getProducts.mockResolvedValue([product])
    mockSdk.purchaseStoreProduct.mockRejectedValueOnce({ userCancelled: true })
    expect(await c.onPurchase(ios)).toEqual({ type: 'cancelled' })
    mockSdk.purchaseStoreProduct.mockRejectedValueOnce({ code: 20 })
    expect(await c.onPurchase(ios)).toEqual({ type: 'pending' })
    mockSdk.purchaseStoreProduct.mockRejectedValueOnce(new Error('boom'))
    expect(await c.onPurchase(ios)).toEqual({ type: 'failed', error: 'boom' })
  })

  it('on Android buys exactly the base plan or offer the paywall chose', async () => {
    configure()
    const c = load().superwallPurchaseController
    const base = { id: 'monthly' }
    const trial = { id: 'monthly:trial' }
    mockSdk.getProducts.mockResolvedValue([
      { identifier: 'pro:monthly', subscriptionOptions: [trial, base] },
    ])
    await c.onPurchase(android)
    expect(mockSdk.purchaseSubscriptionOption).toHaveBeenLastCalledWith(base)
    await c.onPurchase({ ...android, offerId: 'trial' })
    expect(mockSdk.purchaseSubscriptionOption).toHaveBeenLastCalledWith(trial)
    expect(await c.onPurchase({ ...android, offerId: 'gone' })).toEqual({
      type: 'failed',
      error: 'Subscription option not found',
    })
  })

  it('restores through RevenueCat and reports failure', async () => {
    configure()
    const c = load().superwallPurchaseController
    mockSdk.restorePurchases.mockResolvedValueOnce({})
    expect(await c.onPurchaseRestore()).toBeUndefined()
    mockSdk.restorePurchases.mockRejectedValueOnce(new Error('offline'))
    expect(await c.onPurchaseRestore()).toEqual({ type: 'failed', error: 'offline' })
  })
})

describe('syncPurchasesUser', () => {
  it('does nothing without an API key', async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    await load().syncPurchasesUser('u1')
    expect(mockSdk.logIn).not.toHaveBeenCalled()
  })

  it('logs a user in, and only logs out a non-anonymous one', async () => {
    configure()
    const { syncPurchasesUser } = load()
    await syncPurchasesUser('u1')
    expect(mockSdk.logIn).toHaveBeenCalledWith('u1')
    mockSdk.isAnonymous.mockResolvedValueOnce(true)
    await syncPurchasesUser(null)
    expect(mockSdk.logOut).not.toHaveBeenCalled()
    mockSdk.isAnonymous.mockResolvedValueOnce(false)
    await syncPurchasesUser(null)
    expect(mockSdk.logOut).toHaveBeenCalledTimes(1)
  })
})

describe('watchCustomerInfo', () => {
  it('reports "no entitlements" once and never loads the SDK without a key', () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    const listener = jest.fn()
    load().watchCustomerInfo(listener)()
    expect(listener).toHaveBeenCalledWith(null)
    expect(mockSdk.addCustomerInfoUpdateListener).not.toHaveBeenCalled()
  })

  it('reports the current info, then updates, and unsubscribes', async () => {
    configure()
    const info = { entitlements: { active: {} } }
    mockSdk.getCustomerInfo.mockResolvedValue(info)
    const listener = jest.fn()
    const stop = load().watchCustomerInfo(listener)
    await Promise.resolve()
    expect(listener).toHaveBeenCalledWith(info)
    expect(mockSdk.addCustomerInfoUpdateListener).toHaveBeenCalledWith(listener)
    stop()
    expect(mockSdk.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(listener)
  })
})
