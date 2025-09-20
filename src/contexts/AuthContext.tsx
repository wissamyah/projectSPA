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
    try {
      // First, ensure we have a valid session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.log('No session found when fetching role')
        setRole(null)
        return null
      }

      // Get the role from the database
      const { data: profile, error } = await supabase
        .rpc('get_or_create_user_profile')

      if (error) {
        console.error('Error in get_or_create_user_profile:', error)
        // If it's an auth error, try to refresh the session
        if (error.message?.includes('JWT') || error.message?.includes('token')) {
          const { data: { session: newSession } } = await supabase.auth.refreshSession()
          if (newSession) {
            // Retry with new session
            const { data: retryProfile, error: retryError } = await supabase
              .rpc('get_or_create_user_profile')

            if (!retryError && retryProfile && retryProfile.length > 0) {
              const userRole = retryProfile[0].role as 'customer' | 'admin' | 'staff'
              setRole(userRole)
              return userRole
            }
          }
        }
        setRole('customer')
        return 'customer'
      }

      if (profile && profile.length > 0) {
        const userRole = profile[0].role as 'customer' | 'admin' | 'staff'
        setRole(userRole)
        return userRole
      }

      // Default to customer if no role found
      setRole('customer')
      return 'customer'
    } catch (error) {
      console.error('Error fetching user role:', error)
      setRole('customer')
      return 'customer'
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initAuth = async () => {
      try {
        // First try to get the session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          // Try to refresh if there's an error
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
          if (refreshedSession) {
            setSession(refreshedSession)
            setUser(refreshedSession.user)
            await fetchUserRole(refreshedSession.user.id, refreshedSession.user.email)
          } else {
            setSession(null)
            setUser(null)
            setRole(null)
          }
        } else if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          await fetchUserRole(currentSession.user.id, currentSession.user.email)
        } else {
          setSession(null)
          setUser(null)
          setRole(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setSession(null)
        setUser(null)
        setRole(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      console.log('Auth state changed:', event)

      // Handle token refresh events
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }

      // Handle signed in event
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id, newSession.user.email)
        }
        // Invalidate queries to refetch with new auth
        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries()
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setRole(null)
        // Clear all cached data on sign out
        queryClient.clear()
      } else if (event === 'USER_UPDATED') {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id, newSession.user.email)
        }
        // Invalidate user-specific queries
        queryClient.invalidateQueries()
      } else {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchUserRole(newSession.user.id, newSession.user.email)
        } else {
          setRole(null)
        }
      }

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}