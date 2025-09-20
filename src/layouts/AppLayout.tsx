import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/shared/Navbar'

const AppLayout = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('[AppLayout] Render - loading:', loading, 'user:', user?.email, 'path:', location.pathname)

  // Pages that need full width layout (no container)
  const fullWidthPages = ['/book', '/services', '/dashboard', '/admin']
  const isFullWidthPage = fullWidthPages.includes(location.pathname) || location.pathname.startsWith('/admin')

  if (loading) {
    console.log('[AppLayout] Showing loading screen')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-stone-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('[AppLayout] No user, redirecting to auth')
    return <Navigate to="/auth" replace />
  }

  console.log('[AppLayout] Rendering main layout')

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