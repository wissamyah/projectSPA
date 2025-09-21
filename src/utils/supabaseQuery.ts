import { supabase } from '../lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'

// Enhanced error detection
export function isAuthError(error: any): boolean {
  if (!error) return false

  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code || ''

  return (
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid user') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorCode === 'PGRST301' || // JWT expired
    errorCode === '401' ||
    errorCode === 'PGRST3' || // JWT malformed
    error?.status === 401 ||
    error?.status === 403
  )
}

// Refresh session and retry
async function refreshAndRetry(): Promise<boolean> {
  console.log('[SUPABASE] Auth error detected, refreshing session...')

  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error('[SUPABASE] Failed to refresh session:', error)
      return false
    }

    if (session) {
      console.log('[SUPABASE] Session refreshed successfully')
      return true
    }

    console.log('[SUPABASE] No session after refresh')
    return false
  } catch (error) {
    console.error('[SUPABASE] Unexpected error during refresh:', error)
    return false
  }
}

// Wrapper for Supabase queries with automatic retry on auth errors
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: {
    maxRetries?: number
    onError?: (error: any) => void
    retryDelay?: number
  }
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const maxRetries = options?.maxRetries ?? 2
  const retryDelay = options?.retryDelay ?? 1000
  let lastError: PostgrestError | null = null

  // Check current session before executing query
  const { data: { session } } = await supabase.auth.getSession()
  console.log('[SUPABASE] Current session status:', session ? 'Active' : 'None')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SUPABASE] Executing query (attempt ${attempt + 1}/${maxRetries + 1})`)
      const startTime = Date.now()

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout after 10 seconds`))
        }, 10000)
      })

      // Race between query and timeout
      const result = await Promise.race([
        queryFn(),
        timeoutPromise
      ]) as { data: T | null; error: PostgrestError | null }

      const duration = Date.now() - startTime
      console.log(`[SUPABASE] Query completed in ${duration}ms`)

      if (!result.error) {
        console.log('[SUPABASE] Query successful, data:', result.data ? 'Present' : 'Null')
        return result
      }

      lastError = result.error
      console.error(`[SUPABASE] Query error:`, result.error?.message || result.error)

      // Check if it's an auth error and we have retries left
      if (isAuthError(result.error) && attempt < maxRetries) {
        console.log('[SUPABASE] Auth error detected, attempting refresh...')

        const refreshed = await refreshAndRetry()

        if (refreshed) {
          // Wait a bit before retrying to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue // Retry the query
        } else {
          console.error('[SUPABASE] Failed to refresh, stopping retries')
          break
        }
      }

      // Not an auth error or no retries left
      if (options?.onError) {
        options.onError(result.error)
      }

      return result
    } catch (error: any) {
      console.error('[SUPABASE] Unexpected error:', error?.message || error)

      // Check if it's a timeout error
      if (error?.message?.includes('timeout')) {
        console.error('[SUPABASE] Query timed out after 10 seconds')
        lastError = { message: 'Query timeout', code: 'TIMEOUT' } as PostgrestError
      } else {
        lastError = error as PostgrestError
      }

      if (attempt === maxRetries) {
        if (options?.onError) {
          options.onError(error)
        }
        return { data: null, error: lastError }
      }

      // Wait before retrying
      console.log(`[SUPABASE] Waiting ${retryDelay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  return { data: null, error: lastError }
}

// Batch query helper with auth retry
export async function executeBatchQueries<T extends Record<string, any>>(
  queries: Record<string, () => Promise<{ data: any; error: PostgrestError | null }>>
): Promise<{ data: T | null; errors: Record<string, PostgrestError> }> {
  const results: any = {}
  const errors: Record<string, PostgrestError> = {}
  let hasAuthError = false

  // First pass - try all queries
  for (const [key, queryFn] of Object.entries(queries)) {
    const result = await executeQuery(queryFn)

    if (result.error) {
      errors[key] = result.error
      if (isAuthError(result.error)) {
        hasAuthError = true
      }
    } else {
      results[key] = result.data
    }
  }

  // If we had auth errors, refresh and retry failed queries
  if (hasAuthError) {
    const refreshed = await refreshAndRetry()

    if (refreshed) {
      for (const [key, error] of Object.entries(errors)) {
        if (isAuthError(error)) {
          const result = await executeQuery(queries[key], { maxRetries: 0 })

          if (result.error) {
            errors[key] = result.error
          } else {
            results[key] = result.data
            delete errors[key]
          }
        }
      }
    }
  }

  return {
    data: Object.keys(errors).length === 0 ? results as T : null,
    errors
  }
}

// Helper to create a monitored query that logs its state
export function createMonitoredQuery<T>(
  name: string,
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
) {
  return async () => {
    console.log(`[QUERY: ${name}] Starting...`)

    const result = await executeQuery(queryFn, {
      onError: (error) => {
        console.error(`[QUERY: ${name}] Failed:`, error)
      }
    })

    if (result.data) {
      console.log(`[QUERY: ${name}] Success`)
    }

    return result
  }
}