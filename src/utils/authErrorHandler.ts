import { supabase } from '../lib/supabase'

export async function handleAuthError<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 1
): Promise<T> {
  let retryCount = 0

  while (retryCount <= maxRetries) {
    const { data, error } = await queryFn()

    if (!error && data !== null) {
      return data
    }

    if (error) {
      // Check if it's an auth-related error
      const isAuthError =
        error.message?.includes('JWT') ||
        error.message?.includes('token') ||
        error.message?.includes('expired') ||
        error.code === 'PGRST301' || // JWT expired
        error.code === '401' ||
        error.message?.includes('Invalid user')

      if (isAuthError && retryCount < maxRetries) {
        console.log('Auth error detected, attempting to refresh session...')

        // Try to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

        if (session && !refreshError) {
          console.log('Session refreshed successfully, retrying query...')
          retryCount++
          continue // Retry the query
        } else {
          console.error('Failed to refresh session:', refreshError)
          throw error
        }
      } else {
        throw error
      }
    }

    throw new Error('Unexpected null data')
  }

  throw new Error('Max retries exceeded')
}

// Retry configuration for React Query
export const authRetryConfig = {
  retry: (failureCount: number, error: any) => {
    // Check if it's an auth error
    const isAuthError =
      error?.message?.includes('JWT') ||
      error?.message?.includes('token') ||
      error?.message?.includes('expired') ||
      error?.code === 'PGRST301' ||
      error?.code === '401'

    if (isAuthError) {
      return failureCount < 3 // Retry up to 3 times for auth errors
    }

    return failureCount < 1 // Default retry once for other errors
  },
  retryDelay: (attemptIndex: number) => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * 2 ** attemptIndex, 4000)
  }
}