import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Menu, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-slate-700" />
            <span className="text-xl font-bold text-slate-900">Spa Booking</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/services" className="text-slate-700 hover:text-slate-900">Services</Link>
            <Link to="/book" className="text-slate-700 hover:text-slate-900">Book Now</Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-700 hover:text-slate-900">Dashboard</Link>
                {/* Temporarily allow all users to access admin */}
                {user && (
                  <Link to="/admin" className="text-slate-700 hover:text-slate-900">Admin</Link>
                )}
                <button 
                  onClick={handleSignOut}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/auth" 
                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link to="/services" className="block py-2 text-slate-700 hover:text-slate-900">Services</Link>
            <Link to="/book" className="block py-2 text-slate-700 hover:text-slate-900">Book Now</Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="block py-2 text-slate-700 hover:text-slate-900">Dashboard</Link>
                {/* Temporarily allow all users to access admin */}
                {user && (
                  <Link to="/admin" className="block py-2 text-slate-700 hover:text-slate-900">Admin</Link>
                )}
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left py-2 text-slate-700 hover:text-slate-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" className="block py-2 text-slate-700 hover:text-slate-900">Sign In</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar