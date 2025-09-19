import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ModalProvider } from './contexts/ModalContext'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
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

function App() {
  return (
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
            <Suspense fallback={<RouteLoadingFallback />}>
              <Admin />
            </Suspense>
          } />
          <Route path="admin/settings" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminSettings />
            </Suspense>
          } />
          <Route path="admin/staff" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminStaff />
            </Suspense>
          } />
          <Route path="admin/services" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminServices />
            </Suspense>
          } />
          <Route path="admin/categories" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminCategories />
            </Suspense>
          } />
          <Route path="admin/schedule" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminSchedule />
            </Suspense>
          } />
          <Route path="admin/archive" element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminArchive />
            </Suspense>
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

        {/* 404 catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </ModalProvider>
  )
}

export default App