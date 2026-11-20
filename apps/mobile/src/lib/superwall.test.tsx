import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { SuperwallRoot } from './superwall'

const mockIdentify = jest.fn<(id: string) => Promise<void>>()
const mockSignOut = jest.fn<() => Promise<void>>()
const mockUpdate = jest.fn<(a: object) => Promise<void>>()
const mockSetStatus = jest.fn<(s: object) => Promise<void>>()
const mockSync = jest.fn<(id: string | null) => Promise<void>>()
let mockAuth: {
  userId: string | null
  isLoading: boolean
  profile: { display_name: string } | null
}
let listener: ((info: unknown) => void) | undefined

// virtual: the package's exports map has no `require` condition, so Jest can't resolve it.
jest.mock(
  'expo-superwall',
  () => ({
    CustomPurchaseControllerProvider: ({ children }: any) => children,
    SuperwallProvider: ({ children }: any) => children,
    usePlacement: jest.fn(),
    // New function identities on every call, like the real hook.
    useUser: () => ({
      identify: (id: string) => mockIdentify(id),
      signOut: () => mockSignOut(),
      update: (a: object) => mockUpdate(a),
      setSubscriptionStatus: (s: object) => mockSetStatus(s),
    }),
  }),
  { virtual: true },
)
jest.mock('../hooks/use-auth-context', () => ({ useAuthContext: () => mockAuth }))
jest.mock('./purchases', () => ({
  superwallPurchaseController: {},
  superwallStatus: () => ({ status: 'ACTIVE' }),
  syncPurchasesUser: (id: string | null) => mockSync(id),
  watchCustomerInfo: (cb: (info: unknown) => void) => {
    listener = cb
    return () => {}
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  for (const m of [mockIdentify, mockSignOut, mockUpdate, mockSetStatus, mockSync])
    m.mockResolvedValue()
  mockAuth = { userId: 'u1', isLoading: false, profile: { display_name: 'Ruth' } }
})

describe('SuperwallRoot sync', () => {
  it('identifies the user once and sets the name once, even across re-renders', async () => {
    const { rerender } = await render(<SuperwallRoot>{null}</SuperwallRoot>)
    await rerender(<SuperwallRoot>{null}</SuperwallRoot>)
    await rerender(<SuperwallRoot>{null}</SuperwallRoot>)
    expect(mockIdentify).toHaveBeenCalledTimes(1)
    expect(mockIdentify).toHaveBeenCalledWith('u1')
    expect(mockSync).toHaveBeenCalledWith('u1')
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Ruth' })
  })

  it('signs out when there is no user, and waits while auth is loading', async () => {
    mockAuth = { userId: null, isLoading: true, profile: null }
    const { rerender } = await render(<SuperwallRoot>{null}</SuperwallRoot>)
    expect(mockSignOut).not.toHaveBeenCalled()
    mockAuth = { userId: null, isLoading: false, profile: null }
    await rerender(<SuperwallRoot>{null}</SuperwallRoot>)
    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockIdentify).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('pushes entitlement changes to Superwall', async () => {
    await render(<SuperwallRoot>{null}</SuperwallRoot>)
    listener?.({})
    expect(mockSetStatus).toHaveBeenCalledWith({ status: 'ACTIVE' })
  })
})
