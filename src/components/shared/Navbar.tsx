import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Flower2, Menu, X, User, Sparkles, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Check if we're on a page that needs fully transparent navbar
  const transparentPages = ['/', '/book', '/services', '/dashboard', '/admin']
  const isTransparentPage = transparentPages.includes(location.pathname) || location.pathname.startsWith('/admin')

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      isScrolled
        ? 'glass-effect shadow-lg py-2'
        : isTransparentPage
        ? 'bg-transparent py-4'
        : 'bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r from-sage-400 to-spa-400 rounded-full blur-lg transition-all duration-500 ${
                isScrolled ? 'opacity-50 group-hover:opacity-70' : 'opacity-70 group-hover:opacity-90'
              }`}></div>
              <div className={`relative p-2 rounded-full transition-all duration-500 ${
                isScrolled
                  ? 'bg-white/50 backdrop-blur-md border border-white/30'
                  : isTransparentPage
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-white/90 backdrop-blur-sm'
              }`}>
                <Flower2 className="h-8 w-8 text-sage-600" />
              </div>
            </div>
            <div>
              <span className={`text-2xl font-light transition-colors duration-500 ${
                isScrolled ? 'text-stone-800' : 'text-stone-900'
              }`}>Serenity</span>
              <span className={`text-xs block -mt-1 transition-colors duration-500 ${
                isScrolled ? 'text-stone-500' : 'text-stone-600'
              }`}>SPA & WELLNESS</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/services"
              className={`font-light transition-colors duration-500 relative group ${
                location.pathname === '/services'
                  ? isScrolled ? 'text-sage-600' : 'text-sage-700'
                  : isScrolled ? 'text-stone-700 hover:text-sage-600' : 'text-stone-800 hover:text-stone-900'
              }`}
            >
              Services
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-sage-500 to-spa-500 transition-all duration-300 ${
                location.pathname === '/services' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link
              to="/book"
              className={`font-light transition-colors duration-500 relative group ${
                location.pathname === '/book'
                  ? isScrolled ? 'text-sage-600' : 'text-sage-700'
                  : isScrolled ? 'text-stone-700 hover:text-sage-600' : 'text-stone-800 hover:text-stone-900'
              }`}
            >
              Book Now
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-sage-500 to-spa-500 transition-all duration-300 ${
                location.pathname === '/book' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`font-light transition-colors duration-500 relative group ${
                    location.pathname === '/dashboard'
                      ? isScrolled ? 'text-sage-600' : 'text-sage-700'
                      : isScrolled ? 'text-stone-700 hover:text-sage-600' : 'text-stone-800 hover:text-stone-900'
                  }`}
                >
                  Dashboard
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-sage-500 to-spa-500 transition-all duration-300 ${
                    location.pathname === '/dashboard' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                {/* Temporarily allow all users to access admin */}
                {user && (
                  <Link
                    to="/admin"
                    className={`font-light transition-colors duration-500 relative group ${
                      location.pathname.startsWith('/admin')
                        ? isScrolled ? 'text-sage-600' : 'text-sage-700'
                        : isScrolled ? 'text-stone-700 hover:text-sage-600' : 'text-stone-800 hover:text-stone-900'
                    }`}
                  >
                    Admin
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-sage-500 to-spa-500 transition-all duration-300 ${
                      location.pathname.startsWith('/admin') ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}></span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="bg-gradient-to-r from-rose-400 to-rose-500 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 font-light"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="group bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="font-light">Sign In</span>
                <Sparkles className="h-3 w-3 text-gold-300 opacity-70" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-sage-50 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-stone-700" />
            ) : (
              <Menu className="h-6 w-6 text-stone-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-96 mt-4' : 'max-h-0'
        }`}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 p-4 space-y-3">
            <Link
              to="/services"
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 px-4 rounded-lg transition-all duration-200 ${
                location.pathname === '/services'
                  ? 'bg-sage-100 text-sage-700'
                  : 'text-stone-700 hover:bg-sage-50 hover:text-sage-700'
              }`}
            >
              Services
            </Link>
            <Link
              to="/book"
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 px-4 rounded-lg transition-all duration-200 ${
                location.pathname === '/book'
                  ? 'bg-sage-100 text-sage-700'
                  : 'text-stone-700 hover:bg-sage-50 hover:text-sage-700'
              }`}
            >
              Book Now
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg transition-all duration-200 ${
                    location.pathname === '/dashboard'
                      ? 'bg-sage-100 text-sage-700'
                      : 'text-stone-700 hover:bg-sage-50 hover:text-sage-700'
                  }`}
                >
                  Dashboard
                </Link>
                {/* Temporarily allow all users to access admin */}
                {user && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block py-3 px-4 rounded-lg transition-all duration-200 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-sage-100 text-sage-700'
                        : 'text-stone-700 hover:bg-sage-50 hover:text-sage-700'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left py-3 px-4 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 px-4 bg-gradient-to-r from-sage-600 to-sage-700 text-white rounded-lg text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar