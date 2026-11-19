import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockSdk = {
  configure: jest.fn(),
  getOfferings: jest.fn<() => Promise<unknown>>(),
  getCustomerInfo: jest.fn<() => Promise<unknown>>(),
  purchasePackage: jest.fn<() => Promise<unknown>>(),
  checkTrialOrIntroductoryPriceEligibility: jest.fn<() => Promise<unknown>>(),
}
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { ...mockSdk, INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2 } },
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
