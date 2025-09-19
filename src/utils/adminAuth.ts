import { supabase } from '../lib/supabase'

export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return false

    // Check if this user is the admin based on setup
    const adminEmail = localStorage.getItem('spa_admin_email')

    if (adminEmail && session.user.email === adminEmail) {
      return true
    }

    // Also check for specific admin emails (can be customized)
    const adminEmails = [
      'admin@spa.com',
      'admin@example.com'
    ]

    return adminEmails.includes(session.user.email || '')
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export const requireAdmin = async () => {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
  return true
}