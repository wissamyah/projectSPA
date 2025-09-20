import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Lock, User, Mail, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

const Setup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
      // Create the user account
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
        setSuccess(true)

        // Show success message
        setTimeout(() => {
          navigate('/auth')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Setup error:', error)
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md w-full border border-white/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-light text-stone-800 mb-2">Account Created!</h2>
            <p className="text-stone-600 mb-2">
              Your account has been successfully created.
            </p>
            <div className="bg-sage-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-stone-700">
                <strong>Email:</strong> {formData.email}
              </p>
            </div>
            <p className="text-sm text-stone-500 mb-6">
              Please check your email for verification link.
            </p>
            <div className="text-xs text-stone-400">
              Redirecting to login in 3 seconds...
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sage-100 to-spa-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-sage-600" />
          </div>
          <h1 className="text-3xl font-light text-stone-800 mb-2">Initial Setup</h1>
          <p className="text-stone-600 text-sm">Create your first account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
              placeholder="admin@spa.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="Min. 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
              placeholder="Confirm your password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {/* Info Notice */}
          <div className="bg-gradient-to-r from-sage-50 to-spa-50 border border-sage-200 rounded-xl p-4">
            <p className="text-xs text-stone-700">
              <strong className="text-sage-700">Note:</strong> This creates a regular user account. Admin privileges must be granted separately by running the setup script.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Setup