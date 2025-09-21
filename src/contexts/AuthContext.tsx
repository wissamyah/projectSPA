import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { queryClient } from '../lib/queryClient'

interface AuthContextType {
  session: Session | null
  user: User | null
  role: 'customer' | 'admin' | 'staff' | null
  loading: boolean
  isAdmin: boolean
  isStaff: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'customer' | 'admin' | 'staff' | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (userId: string, userEmail?: string) => {
    console.log('[AUTH] fetchUserRole started for user:', userId)
    try {
      console.log('[AUTH] Calling get_or_create_user_profile RPC')
      // Get the role from the database
      const { data: profile, error } = await supabase
        .rpc('get_or_create_user_profile')

      if (error) {
        console.error('[AUTH] Error in get_or_create_user_profile:', error)
        // If it's an auth error, try to refresh the session
        if (error.message?.includes('JWT') || error.message?.includes('token')) {
          console.log('[AUTH] JWT error detected, attempting to refresh session')
          const { data: { session: newSession } } = await supabase.auth.refreshSession()
          if (newSession) {
            console.log('[AUTH] Session refreshed, retrying RPC call')
            // Retry with new session
            const { data: retryProfile, error: retryError } = await supabase
              .rpc('get_or_create_user_profile')

            if (!retryError && retryProfile && retryProfile.length > 0) {
              const userRole = retryProfile[0].role as 'customer' | 'admin' | 'staff'
              console.log('[AUTH] Role fetched after retry:', userRole)
              setRole(userRole)
              return userRole
            }
            console.log('[AUTH] Retry failed or no profile found')
          }
        }
        console.log('[AUTH] Defaulting to customer role due to error')
        setRole('customer')
        return 'customer'
      }

      if (profile && profile.length > 0) {
        const userRole = profile[0].role as 'customer' | 'admin' | 'staff'
        console.log('[AUTH] Role fetched successfully:', userRole)
        setRole(userRole)
        return userRole
      }

      // Default to customer if no role found
      console.log('[AUTH] No profile found, defaulting to customer')
      setRole('customer')
      return 'customer'
    } catch (error) {
      console.error('[AUTH] Unexpected error in fetchUserRole:', error)
      setRole('customer')
      return 'customer'
    }
  }

  useEffect(() => {
    let mounted = true
    let isInitializing = true

    // Get initial session
    const initAuth = async () => {
      console.log('[AUTH] initAuth started')
      try {
        // First try to get the session
        console.log('[AUTH] Getting session...')
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (!mounted) {
          console.log('[AUTH] Component unmounted, aborting initAuth')
          return
        }

        if (error) {
          console.error('[AUTH] Error getting session:', error)
          // Try to refresh if there's an error
          console.log('[AUTH] Attempting to refresh session...')
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
          if (refreshedSession) {
            console.log('[AUTH] Session refreshed successfully')
            setSession(refreshedSession)
            setUser(refreshedSession.user)
            await fetchUserRole(refreshedSession.user.id, refreshedSession.user.email)
          } else {
            console.log('[AUTH] No session after refresh, setting to null')
            setSession(null)
            setUser(null)
            setRole(null)
          }
        } else if (currentSession) {
          console.log('[AUTH] Session found:', currentSession.user.email)
          setSession(currentSession)
          setUser(currentSession.user)
          await fetchUserRole(currentSession.user.id, currentSession.user.email)
        } else {
          console.log('[AUTH] No session found, setting to null')
          setSession(null)
          setUser(null)
          setRole(null)
        }
      } catch (error) {
        console.error('[AUTH] Critical error in initAuth:', error)
        setSession(null)
        setUser(null)
        setRole(null)
      } finally {
        if (mounted) {
          console.log('[AUTH] InitAuth complete, setting loading to false')
          setLoading(false)
          isInitializing = false
        } else {
          console.log('[AUTH] Component unmounted, not updating loading state')
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AUTH] Auth state changed - Event:', event, 'Session:', newSession?.user?.email, 'isInitializing:', isInitializing)

      if (!mounted) {
        console.log('[AUTH] Component unmounted, ignoring auth state change')
        return
      }

      // Skip processing during initialization to avoid duplicate work
      if (isInitializing && event === 'SIGNED_IN') {
        console.log('[AUTH] Skipping SIGNED_IN event during initialization')
        return
      }

      // Handle token refresh events
      if (event === 'TOKEN_REFRESHED') {
        console.log('[AUTH] Token refreshed successfully')
      }

      // Handle signed in event
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('[AUTH] User signed in or token refreshed')
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          console.log('[AUTH] Fetching role for signed in user')
          await fetchUserRole(newSession.user.id, newSession.user.email)
        }
        // Only invalidate queries on actual sign in, not token refresh
        // And only invalidate user-specific queries, not all queries
        if (event === 'SIGNED_IN') {
          // Only invalidate user-specific and booking queries that might have changed
          queryClient.invalidateQueries({ queryKey: ['supabase', 'bookings'] })
          queryClient.invalidateQueries({ queryKey: ['supabase', 'user'] })
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH] User signed out')
        setSession(null)
        setUser(null)
        setRole(null)
        // Clear all cached data on sign out
        queryClient.clear()
      } else if (event === 'USER_UPDATED') {
        console.log('[AUTH] User updated')
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id, newSession.user.email)
        }
        // Only invalidate user-specific queries, not all queries
        queryClient.invalidateQueries({ queryKey: ['supabase', 'user'] })
      } else {
        console.log('[AUTH] Other auth event:', event)
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id, newSession.user.email)
        } else {
          setRole(null)
        }
      }

      console.log('[AUTH] Setting loading to false after auth state change')
      setLoading(false)
    })

    // Set up periodic session refresh (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      if (!mounted) return

      const { data: { session }, error } = await supabase.auth.getSession()
      if (session && !error) {
        // Session is still valid, check if it needs refresh
        const expiresAt = session.expires_at
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = expiresAt - now

          // Refresh if less than 10 minutes until expiry
          if (timeUntilExpiry < 600) {
            console.log('Session expiring soon, refreshing...')
            const { data: { session: newSession } } = await supabase.auth.refreshSession()
            if (newSession) {
              setSession(newSession)
              setUser(newSession.user)
            }
          }
        }
      }
    }, 30 * 60 * 1000) // Check every 30 minutes

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user.id, user.email)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setRole(null)
  }

  const value: AuthContextType = {
    session,
    user,
    role,
    loading,
    isAdmin: role === 'admin',
    isStaff: role === 'admin' || role === 'staff',
    signOut,
    refreshRole
  }

  console.log('[AUTH PROVIDER] Rendering - loading:', loading, 'user:', user?.email, 'role:', role)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}