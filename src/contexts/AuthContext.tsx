import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

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
      // Get the role from the database
      const { data: profile, error } = await supabase
        .rpc('get_or_create_user_profile')

      if (!error && profile && profile.length > 0) {
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
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (!mounted) return

        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          await fetchUserRole(currentSession.user.id, currentSession.user.email)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
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

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await fetchUserRole(newSession.user.id, newSession.user.email)
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
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