import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Database, Key, RefreshCw, Check, X } from 'lucide-react'

const DebugAuth = () => {
  const { user, role, isAdmin, refreshRole } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkEverything()
  }, [user])

  const checkEverything = async () => {
    if (!user) {
      setDebugInfo({ error: 'No user logged in' })
      setLoading(false)
      return
    }

    const info: any = {
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      currentRole: role,
      isAdmin: isAdmin,
      localStorage: {
        adminEmail: localStorage.getItem('spa_admin_email'),
        setupCompleted: localStorage.getItem('spa_admin_setup_completed')
      },
      database: {}
    }

    // Check database profile
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        info.database.error = error.message
        info.database.exists = false
      } else {
        info.database.profile = profile
        info.database.exists = true
      }
    } catch (e: any) {
      info.database.error = e.message
    }

    setDebugInfo(info)
    setLoading(false)
  }

  const fixAdminRole = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Step 1: Set in localStorage
      localStorage.setItem('spa_admin_email', user.email || '')
      localStorage.setItem('spa_admin_setup_completed', 'true')

      // Step 2: Update/create database profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          role: 'admin',
          full_name: user.user_metadata?.full_name || user.email,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Database error:', error)
      }

      // Step 3: Refresh role
      await refreshRole()

      // Step 4: Recheck everything
      await checkEverything()

      alert('Admin role has been fixed! Please refresh the page.')
    } catch (error) {
      console.error('Fix error:', error)
      alert('Error fixing admin role. Check console.')
    } finally {
      setLoading(false)
    }
  }

  const clearAdminStatus = () => {
    localStorage.removeItem('spa_admin_email')
    localStorage.removeItem('spa_admin_setup_completed')
    localStorage.removeItem('spa_admin_id')
    alert('Admin status cleared from localStorage. Please refresh.')
    checkEverything()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-4">Auth Debug - Not Logged In</h1>
            <p>Please log in first to debug authentication.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-spa-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Auth Debug Tool
            </h1>
            <button
              onClick={checkEverything}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-stone-600 mt-4">Checking...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  Current Status
                  {isAdmin ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="h-5 w-5" /> Admin
                    </span>
                  ) : (
                    <span className="text-orange-600 flex items-center gap-1">
                      <X className="h-5 w-5" /> Not Admin
                    </span>
                  )}
                </h2>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>User ID:</strong> {user.id}</div>
                  <div><strong>Current Role:</strong> {role || 'none'}</div>
                  <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* LocalStorage Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  LocalStorage
                </h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Admin Email:</strong> {debugInfo.localStorage?.adminEmail || 'Not set'}
                    {debugInfo.localStorage?.adminEmail === user.email && (
                      <span className="ml-2 text-green-600">✓ Matches current user</span>
                    )}
                  </div>
                  <div>
                    <strong>Setup Completed:</strong> {debugInfo.localStorage?.setupCompleted || 'Not set'}
                  </div>
                </div>
              </div>

              {/* Database Info */}
              <div className="bg-purple-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Profile
                </h2>
                {debugInfo.database?.exists ? (
                  <div className="space-y-2 text-sm">
                    <div><strong>Role in DB:</strong> {debugInfo.database?.profile?.role || 'none'}</div>
                    <div><strong>Full Name:</strong> {debugInfo.database?.profile?.full_name || 'not set'}</div>
                    <div><strong>Created:</strong> {new Date(debugInfo.database?.profile?.created_at).toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="text-red-600">No profile found in database</p>
                    {debugInfo.database?.error && (
                      <p className="text-xs mt-1">Error: {debugInfo.database.error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t pt-6 space-y-3">
                <h2 className="text-lg font-semibold mb-3">Actions</h2>

                {!isAdmin && (
                  <button
                    onClick={fixAdminRole}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                  >
                    Fix: Make Me Admin
                  </button>
                )}

                <button
                  onClick={clearAdminStatus}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                >
                  Clear Admin Status (Reset)
                </button>

              </div>

              {/* Raw Debug Data */}
              <details className="border-t pt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                  Show Raw Debug Data
                </summary>
                <pre className="mt-4 bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DebugAuth