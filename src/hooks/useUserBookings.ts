import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys, staleTimes } from '../lib/queryClient'
import { handleAuthError, authRetryConfig } from '../utils/authErrorHandler'

// Fetch bookings for current user
export function useUserBookings(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userBookings(userId || ''),
    queryFn: async () => {
      if (!userId) return []

      return handleAuthError(async () => {
        return await supabase
          .from('bookings')
          .select(`
            *,
            service:services(name, duration, price),
            staff:staff(name, email)
          `)
          .eq('user_id', userId)
          .order('booking_date', { ascending: false })
          .order('booking_time', { ascending: false })
      })
    },
    enabled: !!userId,
    staleTime: staleTimes.dynamic, // 30 seconds
    ...authRetryConfig
  })
}