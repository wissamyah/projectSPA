import { Outlet } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cream-50 via-white to-sage-50">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default PublicLayout