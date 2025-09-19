import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, Lock, User, Loader, Sparkles, Heart, Flower2, Droplets } from 'lucide-react'
import { useModal } from '../contexts/ModalContext'

const Auth = () => {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const { showAlert } = useModal()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName
            }
          }
        })
        
        if (error) throw error
        
        await showAlert('Check your email for the confirmation link!', 'success')
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        if (error) throw error
        
        navigate('/dashboard')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-sage-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-sage-100/30 to-gold-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-cream-100/30 to-sage-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <Flower2 className="absolute top-20 right-10 h-12 w-12 text-sage-200/40 animate-float" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute bottom-20 left-10 h-10 w-10 text-gold-300/40 animate-float" style={{ animationDelay: '1s' }} />
        <Heart className="absolute top-1/2 right-20 h-8 w-8 text-rose-200/40 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-gold-400 rounded-full blur-lg opacity-60 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-4 shadow-xl">
                <Droplets className="h-12 w-12 text-sage-600" />
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-display bg-gradient-to-r from-sage-700 to-sage-500 bg-clip-text text-transparent">
            {isSignUp ? 'Join Our Sanctuary' : 'Welcome Back'}
          </h2>
          <p className="mt-3 text-sage-600 font-light">
            {isSignUp ? 'Begin your journey to relaxation and renewal' : 'Continue your wellness journey with us'}
          </p>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-sage-100/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-sage-700 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-sage-400 group-focus-within:text-sage-600 transition-colors" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={isSignUp}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-3 bg-cream-50/50 border border-sage-200 rounded-xl placeholder-sage-400 text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent focus:bg-white transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-sage-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-sage-400 group-focus-within:text-sage-600 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 bg-cream-50/50 border border-sage-200 rounded-xl placeholder-sage-400 text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent focus:bg-white transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-sage-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-sage-400 group-focus-within:text-sage-600 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 bg-cream-50/50 border border-sage-200 rounded-xl placeholder-sage-400 text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="relative w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-700 hover:to-sage-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-400 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span>Begin Your Journey</span>
                      </>
                    ) : (
                      <>
                        <Heart className="h-5 w-5 mr-2" />
                        <span>Welcome Back</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sage-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-sage-500 font-light">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center px-4 py-3 border border-sage-200 rounded-xl shadow-sm text-sm font-medium text-sage-700 bg-white hover:bg-cream-50 hover:border-sage-300 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setFormData({ email: '', password: '', fullName: '' })
              }}
              className="group text-sm text-sage-600 hover:text-sage-800 font-light transition-colors"
            >
              {isSignUp ? (
                <span className="flex items-center justify-center gap-2">
                  Already have an account?
                  <span className="font-medium group-hover:underline">Sign in</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Don't have an account?
                  <span className="font-medium group-hover:underline">Join us</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth