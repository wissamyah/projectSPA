import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/shared/Navbar'

const AppLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const location = useLocation()

  // Pages that need full width layout (no container)
  const fullWidthPages = ['/book', '/services', '/dashboard', '/admin']
  const isFullWidthPage = fullWidthPages.includes(location.pathname) || location.pathname.startsWith('/admin')

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
  }

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className={`min-h-screen ${isFullWidthPage ? '' : 'bg-gray-50'}`}>
      <Navbar />
      {isFullWidthPage ? (
        <main>
          <Outlet />
        </main>
      ) : (
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      )}
    </div>
  )
}

export default AppLayout