import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Flower2, Menu, X, User, Sparkles, Shield, Home, Calendar, Briefcase, LogOut, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check if we're on a page that needs fully transparent navbar
  const transparentPages = ['/', '/book', '/services', '/dashboard', '/admin']
  const isTransparentPage = transparentPages.includes(location.pathname) || location.pathname.startsWith('/admin')


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    await signOut()
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
                {/* Show admin link only to admin users */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`font-light transition-colors duration-500 relative group flex items-center gap-1 ${
                      location.pathname.startsWith('/admin')
                        ? isScrolled ? 'text-sage-600' : 'text-sage-700'
                        : isScrolled ? 'text-stone-700 hover:text-sage-600' : 'text-stone-800 hover:text-stone-900'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
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
            className="md:hidden relative z-50 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-stone-700" />
            ) : (
              <Menu className="h-6 w-6 text-stone-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
        isMenuOpen ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Slide-in Menu */}
        <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-500 ease-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Menu Header */}
          <div className="relative bg-gradient-to-br from-sage-50 to-spa-50 px-6 pt-20 pb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-full">
                <Flower2 className="h-8 w-8 text-sage-600" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-stone-800">Serenity Spa</h2>
                <p className="text-sm text-stone-600">Wellness & Beauty</p>
              </div>
            </div>
            {user && (
              <div className="mt-6 p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                <p className="text-sm text-stone-600">Welcome back,</p>
                <p className="text-lg font-medium text-stone-800">{user.email}</p>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="px-6 py-6 space-y-2">
            <Link
              to="/services"
              onClick={() => setIsMenuOpen(false)}
              className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                location.pathname === '/services'
                  ? 'bg-gradient-to-r from-sage-100 to-spa-100 shadow-md'
                  : 'hover:bg-sage-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  location.pathname === '/services' ? 'bg-sage-200' : 'bg-stone-100'
                }`}>
                  <Briefcase className="h-5 w-5 text-stone-700" />
                </div>
                <span className={`font-medium ${
                  location.pathname === '/services' ? 'text-sage-700' : 'text-stone-700'
                }`}>Services</span>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                location.pathname === '/services' ? 'text-sage-600' : 'text-stone-400'
              }`} />
            </Link>

            <Link
              to="/book"
              onClick={() => setIsMenuOpen(false)}
              className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                location.pathname === '/book'
                  ? 'bg-gradient-to-r from-sage-100 to-spa-100 shadow-md'
                  : 'hover:bg-sage-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  location.pathname === '/book' ? 'bg-sage-200' : 'bg-stone-100'
                }`}>
                  <Calendar className="h-5 w-5 text-stone-700" />
                </div>
                <span className={`font-medium ${
                  location.pathname === '/book' ? 'text-sage-700' : 'text-stone-700'
                }`}>Book Now</span>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                location.pathname === '/book' ? 'text-sage-600' : 'text-stone-400'
              }`} />
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    location.pathname === '/dashboard'
                      ? 'bg-gradient-to-r from-sage-100 to-spa-100 shadow-md'
                      : 'hover:bg-sage-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      location.pathname === '/dashboard' ? 'bg-sage-200' : 'bg-stone-100'
                    }`}>
                      <Home className="h-5 w-5 text-stone-700" />
                    </div>
                    <span className={`font-medium ${
                      location.pathname === '/dashboard' ? 'text-sage-700' : 'text-stone-700'
                    }`}>Dashboard</span>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                    location.pathname === '/dashboard' ? 'text-sage-600' : 'text-stone-400'
                  }`} />
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-gradient-to-r from-sage-100 to-spa-100 shadow-md'
                        : 'hover:bg-sage-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        location.pathname.startsWith('/admin') ? 'bg-sage-200' : 'bg-stone-100'
                      }`}>
                        <Shield className="h-5 w-5 text-stone-700" />
                      </div>
                      <span className={`font-medium ${
                        location.pathname.startsWith('/admin') ? 'text-sage-700' : 'text-stone-700'
                      }`}>Admin Panel</span>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                      location.pathname.startsWith('/admin') ? 'text-sage-600' : 'text-stone-400'
                    }`} />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-stone-100 bg-white">
            {user ? (
              <button
                onClick={() => {
                  handleSignOut()
                  setIsMenuOpen(false)
                }}
                className="w-full group flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="w-full group flex items-center justify-center space-x-2 bg-gradient-to-r from-sage-600 to-sage-700 text-white py-4 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Sign In</span>
                <Sparkles className="h-4 w-4 text-gold-300" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar