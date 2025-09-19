import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Lock, User, Mail, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

const Setup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [setupComplete, setSetupComplete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkExistingAdmin()
  }, [])

  const checkExistingAdmin = async () => {
    try {
      // Check if setup has been completed by looking for a specific key in localStorage
      // This is a simple approach for initial setup
      const setupCompleted = localStorage.getItem('spa_admin_setup_completed')

      if (setupCompleted === 'true') {
        setSetupComplete(true)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Create admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Mark setup as complete
        localStorage.setItem('spa_admin_setup_completed', 'true')
        localStorage.setItem('spa_admin_email', formData.email)

        setSuccess(true)

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/auth')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Setup error:', error)
      setError(error.message || 'Failed to create admin account')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-stone-600 mt-4">Checking setup status...</p>
        </div>
      </div>
    )
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md w-full border border-white/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sage-100 to-spa-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-sage-600" />
            </div>
            <h2 className="text-2xl font-light text-stone-800 mb-2">Setup Complete</h2>
            <p className="text-stone-600 mb-6">
              The system has already been configured with an admin account.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white py-3 rounded-full hover:shadow-lg transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md w-full border border-white/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-light text-stone-800 mb-2">Admin Account Created!</h2>
            <p className="text-stone-600 mb-2">
              Your admin account has been successfully created.
            </p>
            <p className="text-sm text-stone-500 mb-6">
              Please check your email for verification link.
            </p>
            <div className="text-sm text-stone-600">
              Redirecting to login...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md w-full border border-white/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-100 to-amber-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-gold-600" />
          </div>
          <h1 className="text-3xl font-light text-stone-800 mb-2">Initial Setup</h1>
          <p className="text-stone-600">Create your admin account to get started</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="Create a strong password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
            <p className="text-xs text-stone-600">
              <strong className="text-gold-700">Important:</strong> This setup page can only be used once.
              After creating the first admin account, this page will be disabled for security.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white py-3 rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Create Admin Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-stone-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth')}
              className="text-sage-600 hover:text-sage-700 font-medium"
            >
              Go to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Setup