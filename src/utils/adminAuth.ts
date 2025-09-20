import { supabase } from '../lib/supabase'

export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return false

    // Check user_profiles table for role
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!error && profile?.role === 'admin') {
      return true
    }

    return false
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