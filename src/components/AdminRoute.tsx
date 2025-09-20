import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Check localStorage first (fallback for when DB isn't set up)
      const adminEmail = localStorage.getItem('spa_admin_email')

      if (adminEmail && session.user.email === adminEmail) {
        setIsAdmin(true)
        setLoading(false)

        // Try to ensure the user has admin role in database
        await supabase
          .from('user_profiles')
          .upsert({
            id: session.user.id,
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || session.user.email
          })
        return
      }

      // Check user role from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // Final check: is this one of the default admin emails?
        const adminEmails = ['admin@spa.com', 'admin@example.com']
        setIsAdmin(adminEmails.includes(session.user.email || ''))
      } else {
        setIsAdmin(profile?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-stone-600 mt-4">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default AdminRoute