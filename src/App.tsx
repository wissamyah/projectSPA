import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ModalProvider } from './contexts/ModalContext'
import { AuthProvider } from './contexts/AuthContext'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import AdminRoute from './components/AdminRoute'
import RouteLoadingFallback from './components/RouteLoadingFallback'

// Eager load customer-facing pages for best performance
import Landing from './pages/Landing'
import Services from './pages/Services'
import Book from './pages/Book'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

// Lazy load admin pages (not needed for customers)
const Admin = lazy(() => import('./pages/Admin'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const AdminStaff = lazy(() => import('./pages/AdminStaff'))
const AdminServices = lazy(() => import('./pages/AdminServices'))
const AdminCategories = lazy(() => import('./pages/AdminCategories'))
const AdminSchedule = lazy(() => import('./pages/AdminSchedule'))
const AdminArchive = lazy(() => import('./pages/AdminArchive'))

// Lazy load rarely used pages
const StaffSchedule = lazy(() => import('./pages/StaffSchedule'))
const EmailViewer = lazy(() => import('./pages/EmailViewer'))
const Setup = lazy(() => import('./pages/Setup'))
const DebugAuth = lazy(() => import('./pages/DebugAuth'))

// Lazy load React Query Devtools only in development
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : () => null

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <Router>
          <Routes>
        {/* Public routes with landing page layout */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="services" element={<Services />} />
          <Route path="auth" element={<Auth />} />
        </Route>

        {/* App routes with authenticated layout */}
        <Route path="/" element={<AppLayout />}>
          <Route path="book" element={<Book />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Admin />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/settings" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminSettings />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/staff" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminStaff />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/services" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminServices />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/categories" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminCategories />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/schedule" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminSchedule />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="admin/archive" element={
            <AdminRoute>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminArchive />
              </Suspense>
            </AdminRoute>
          } />
          <Route path="emails" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <EmailViewer />
            </Suspense>
          } />
        </Route>

        {/* Public staff schedule route (no auth required) */}
        <Route path="/schedule/:staffId" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <StaffSchedule />
          </Suspense>
        } />

        {/* Setup route for initial admin creation */}
        <Route path="/setup" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <Setup />
          </Suspense>
        } />

        {/* Debug auth route for checking role issues */}
        <Route path="/debug-auth" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <DebugAuth />
          </Suspense>
        } />

        {/* 404 catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </ModalProvider>
    </AuthProvider>
    {import.meta.env.DEV && (
      <Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} />
      </Suspense>
    )}
    </QueryClientProvider>
  )
}

export default App