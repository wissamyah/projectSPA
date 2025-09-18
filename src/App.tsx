import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ModalProvider } from './contexts/ModalContext'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Services from './pages/Services'
import Book from './pages/Book'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import AdminSettings from './pages/AdminSettings'
import AdminStaff from './pages/AdminStaff'
import AdminServices from './pages/AdminServices'
import AdminCategories from './pages/AdminCategories'
import AdminSchedule from './pages/AdminSchedule'
import AdminArchive from './pages/AdminArchive'
import StaffSchedule from './pages/StaffSchedule'
import EmailViewer from './pages/EmailViewer'
import NotFound from './pages/NotFound'

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
          <Route path="admin" element={<Admin />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/staff" element={<AdminStaff />} />
          <Route path="admin/services" element={<AdminServices />} />
          <Route path="admin/categories" element={<AdminCategories />} />
          <Route path="admin/schedule" element={<AdminSchedule />} />
          <Route path="admin/archive" element={<AdminArchive />} />
          <Route path="emails" element={<EmailViewer />} />
        </Route>

        {/* Public staff schedule route (no auth required) */}
        <Route path="/schedule/:staffId" element={<StaffSchedule />} />

        {/* 404 catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </ModalProvider>
  )
}

export default App