import { AuthContext } from '../hooks/use-auth-context'
import { supabase } from '../lib/supabase'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import type { Profile } from '../types/db'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
  const [profile, setProfile] = useState<Profile | null>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch the claims once, and subscribe to auth state changes
  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.auth.getClaims()
      if (error) {
        console.error('Error fetching claims:', error)
      }
      setClaims(data?.claims ?? null)
    }

    fetchClaims()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      const { data } = await supabase.auth.getClaims()
      setClaims(data?.claims ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const userId: string | null = claims?.sub ?? null

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data)
  }, [userId])

  // Fetch the profile when the claims change
  useEffect(() => {
    if (claims === undefined) return
    refreshProfile().finally(() => setIsLoading(false))
  }, [claims, refreshProfile])

  return (
    <AuthContext.Provider
      value={{
        claims,
        isLoading,
        profile,
        userId,
        isLoggedIn: claims != undefined,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
