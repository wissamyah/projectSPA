import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys, staleTimes } from '../lib/queryClient'

interface Booking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_uuid: string
  staff_id: string
  booking_date: string
  booking_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

// Fetch bookings by date
export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: queryKeys.bookingsByDate(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(name, duration, price),
          staff:staff_id(name, email)
        `)
        .eq('booking_date', date)
        .order('booking_time')

      if (error) throw error
      return data
    },
    staleTime: staleTimes.dynamic, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
  })
}

// Fetch bookings by date range
export function useBookingsByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.bookingsByDateRange(startDate, endDate),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(name, duration, price),
          staff:staff_id(name, email)
        `)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .order('booking_date')
        .order('booking_time')

      if (error) throw error
      return data
    },
    staleTime: staleTimes.dynamic,
  })
}

// Fetch pending bookings (for admin dashboard)
export function usePendingBookings() {
  return useQuery({
    queryKey: queryKeys.bookingsPending(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, duration, price),
          staff:staff(name, email)
        `)
        .eq('status', 'pending')
        .order('booking_date')
        .order('booking_time')

      if (error) throw error
      return data
    },
    staleTime: staleTimes.dynamic,
    refetchInterval: 30000, // Refetch every 30 seconds for admin dashboard
  })
}

// Check availability for a specific date, service, and staff
export function useAvailability(date: string, serviceId?: string, staffId?: string) {
  return useQuery({
    queryKey: queryKeys.availability(date, serviceId, staffId),
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('booking_time, service:service_uuid(duration), staff_id')
        .eq('booking_date', date)
        .neq('status', 'cancelled')

      if (staffId) {
        query = query.eq('staff_id', staffId)
      }

      const { data, error } = await query

      if (error) throw error

      // Process data to return available time slots
      const bookedSlots = data?.map(booking => ({
        time: booking.booking_time,
        duration: booking.service?.duration || 60,
        staffId: booking.staff_id
      })) || []

      return { bookedSlots }
    },
    enabled: !!date,
    staleTime: staleTimes.realtime, // Always fresh for availability
  })
}

// Create a new booking
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookingsByDate(data.booking_date)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability(data.booking_date)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookingsPending()
      })
    },
    // Optimistic update
    onMutate: async (newBooking) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.bookingsByDate(newBooking.booking_date)
      })

      // Snapshot previous value
      const previousBookings = queryClient.getQueryData(
        queryKeys.bookingsByDate(newBooking.booking_date)
      )

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.bookingsByDate(newBooking.booking_date),
        (old: any) => {
          if (!old) return [newBooking]
          return [...old, { ...newBooking, id: 'temp-' + Date.now() }]
        }
      )

      return { previousBookings }
    },
    onError: (err, newBooking, context) => {
      // Rollback on error
      if (context?.previousBookings) {
        queryClient.setQueryData(
          queryKeys.bookingsByDate(newBooking.booking_date),
          context.previousBookings
        )
      }
    },
  })
}

// Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking['status'] }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate all booking queries
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() })
    },
  })
}

// Reschedule booking
export function useRescheduleBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      newDate,
      newTime
    }: {
      id: string;
      newDate: string;
      newTime: string
    }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newDate,
          booking_time: newTime
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() })
      queryClient.invalidateQueries({ queryKey: queryKeys.availability() })
    },
  })
}

// Cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() })
    },
  })
}