import { createContext, useContext } from 'react'
import type { Profile } from '../types/db'

export type AuthData = {
  claims?: Record<string, any> | null
  profile?: Profile | null
  userId: string | null
  isLoading: boolean
  isLoggedIn: boolean
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  profile: undefined,
  userId: null,
  isLoading: true,
  isLoggedIn: false,
  refreshProfile: async () => {},
})

export const useAuthContext = () => useContext(AuthContext)

/** For screens inside the logged-in area, where a user id is guaranteed. */
export function useUserId(): string {
  const { userId } = useAuthContext()
  if (!userId) throw new Error('useUserId called outside an authenticated route')
  return userId
}
