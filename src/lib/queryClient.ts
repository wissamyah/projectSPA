import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until data is considered stale
      staleTime: 30 * 1000, // 30 seconds default

      // Cache time: how long to keep unused data in cache
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

      // Retry failed requests
      retry: 1,

      // Refetch on window focus (good for real-time updates)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: 'always',

      // Network mode - continue fetching in background
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
})

// Query key factory for consistent keys
export const queryKeys = {
  all: ['supabase'] as const,

  // Services
  services: () => [...queryKeys.all, 'services'] as const,
  servicesActive: () => [...queryKeys.services(), 'active'] as const,
  servicesWithStaff: () => [...queryKeys.services(), 'withStaff'] as const,
  service: (id: string) => [...queryKeys.services(), id] as const,

  // Categories
  categories: () => [...queryKeys.all, 'categories'] as const,
  category: (id: string) => [...queryKeys.categories(), id] as const,

  // Staff
  staff: () => [...queryKeys.all, 'staff'] as const,
  staffActive: () => [...queryKeys.staff(), 'active'] as const,
  staffForService: (serviceId: string) => [...queryKeys.staff(), 'service', serviceId] as const,
  staffMember: (id: string) => [...queryKeys.staff(), id] as const,

  // Bookings
  bookings: () => [...queryKeys.all, 'bookings'] as const,
  bookingsByDate: (date: string) => [...queryKeys.bookings(), 'date', date] as const,
  bookingsByDateRange: (start: string, end: string) => [...queryKeys.bookings(), 'range', start, end] as const,
  bookingsByStaff: (staffId: string, date?: string) => [...queryKeys.bookings(), 'staff', staffId, date] as const,
  bookingsPending: () => [...queryKeys.bookings(), 'pending'] as const,
  booking: (id: string) => [...queryKeys.bookings(), id] as const,

  // Archived bookings
  archivedBookings: () => [...queryKeys.all, 'archived'] as const,

  // Business settings
  businessSettings: () => [...queryKeys.all, 'settings'] as const,

  // User specific
  userBookings: (userId: string) => [...queryKeys.all, 'user', userId, 'bookings'] as const,

  // Availability
  availability: (date: string, serviceId?: string, staffId?: string) =>
    [...queryKeys.all, 'availability', date, serviceId, staffId].filter(Boolean) as const,
}

// Custom stale times for different data types
export const staleTimes = {
  static: 10 * 60 * 1000, // 10 minutes - for services, categories
  semiStatic: 2 * 60 * 1000, // 2 minutes - for staff list
  dynamic: 30 * 1000, // 30 seconds - for bookings
  realtime: 0, // Always fresh - for availability checks
}