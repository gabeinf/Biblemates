import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import PaywallScreen from '../app/(main)/paywall'

const mockBack = jest.fn()
const mockOffer = jest.fn<() => unknown>()
const mockPurchase = jest.fn<(p: unknown) => Promise<boolean>>()
const mockRestore = jest.fn<() => Promise<boolean>>()
const mockCanRemind = jest.fn<() => Promise<boolean>>()
const mockSchedule = jest.fn<(d: Date) => Promise<void>>()
const mockPrivacy = jest.fn<() => string | null>()

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }))
jest.mock('../hooks/use-paywall', () => ({ usePaywallOffer: () => mockOffer() }))
jest.mock('../lib/trial-reminder', () => ({
  canRemind: () => mockCanRemind(),
  scheduleTrialReminder: (d: Date) => mockSchedule(d),
}))
jest.mock('../lib/purchases', () => ({
  privacyUrl: () => mockPrivacy(),
  termsUrl: () => 'https://t.example',
  purchase: (p: unknown) => mockPurchase(p),
  restore: () => mockRestore(),
}))

const pkg = (intro: unknown = null) => ({
  identifier: 'yearly',
  product: {
    identifier: 'yearly.product',
    title: 'Plan',
    priceString: 'P-YEAR',
    pricePerMonth: 1,
    pricePerMonthString: 'P-MONTH',
    subscriptionPeriod: 'P1Y',
    introPrice: intro,
  },
})
const week = { price: 0, priceString: 'F', cycles: 1, periodUnit: 'DAY', periodNumberOfUnits: 7 }
const offer = (packages: unknown[], introEligible: string[] = []) => ({
  data: { packages, introEligible },
  isPending: false,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockPrivacy.mockReturnValue('https://p.example')
  mockCanRemind.mockResolvedValue(true)
  mockPurchase.mockResolvedValue(true)
  mockRestore.mockResolvedValue(false)
  mockSchedule.mockResolvedValue()
})

describe('paywall route', () => {
  it('leaves quietly, rendering nothing, when there is no offering', async () => {
    mockOffer.mockReturnValue(offer([]))
    await render(<PaywallScreen />)
    expect(screen.queryByText('Keep reading together')).toBeNull()
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  it('leaves when no privacy URL is configured', async () => {
    mockPrivacy.mockReturnValue(null)
    mockOffer.mockReturnValue(offer([pkg()]))
    await render(<PaywallScreen />)
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  it('waits while the offer is still loading', async () => {
    mockOffer.mockReturnValue({ data: undefined, isPending: true })
    await render(<PaywallScreen />)
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('purchase success closes the sheet and schedules the reminder for an eligible trial', async () => {
    mockOffer.mockReturnValue(offer([pkg(week)], ['yearly.product']))
    await render(<PaywallScreen />)
    await waitFor(() => expect(screen.getByText('Start free trial')).toBeTruthy())
    await fireEvent.press(screen.getByText('Start free trial'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
    expect(mockSchedule).toHaveBeenCalledTimes(1)
    const days = (mockSchedule.mock.calls[0][0].getTime() - Date.now()) / 86_400_000
    expect(Math.round(days)).toBe(5) // two days before billing at the end of a 7-day trial
  })

  it('does not schedule a reminder without notification permission, and omits the step', async () => {
    mockCanRemind.mockResolvedValue(false)
    mockOffer.mockReturnValue(offer([pkg(week)], ['yearly.product']))
    await render(<PaywallScreen />)
    await fireEvent.press(await screen.findByText('Start free trial'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
    expect(mockSchedule).not.toHaveBeenCalled()
    expect(screen.queryByText(/remind/i)).toBeNull()
  })

  it('shows no trial wording and schedules nothing when the user is not eligible', async () => {
    mockOffer.mockReturnValue(offer([pkg(week)], []))
    await render(<PaywallScreen />)
    await fireEvent.press(await screen.findByText('Continue'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
    expect(screen.queryByText('No payment due now')).toBeNull()
    expect(mockSchedule).not.toHaveBeenCalled()
  })

  it('stays open when the user cancels the purchase', async () => {
    mockPurchase.mockResolvedValue(false)
    mockOffer.mockReturnValue(offer([pkg()]))
    await render(<PaywallScreen />)
    await fireEvent.press(await screen.findByText('Continue'))
    await waitFor(() => expect(mockPurchase).toHaveBeenCalled())
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockSchedule).not.toHaveBeenCalled()
  })

  it('shows the error when the purchase fails', async () => {
    mockPurchase.mockRejectedValue(new Error('Card declined'))
    mockOffer.mockReturnValue(offer([pkg()]))
    await render(<PaywallScreen />)
    await fireEvent.press(await screen.findByText('Continue'))
    expect(await screen.findByText('Card declined')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('restore closes on success and says so when nothing was found', async () => {
    mockOffer.mockReturnValue(offer([pkg()]))
    await render(<PaywallScreen />)
    await fireEvent.press(await screen.findByText('Restore'))
    expect(await screen.findByText('No earlier purchase was found.')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
    mockRestore.mockResolvedValue(true)
    await fireEvent.press(screen.getByText('Restore'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  it('opens the configured Terms and Privacy URLs', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never)
    mockOffer.mockReturnValue(offer([pkg()]))
    await render(<PaywallScreen />)
    await fireEvent.press(await screen.findByText('Terms'))
    await fireEvent.press(screen.getByText('Privacy'))
    expect(open).toHaveBeenCalledWith('https://t.example')
    expect(open).toHaveBeenCalledWith('https://p.example')
  })
})
