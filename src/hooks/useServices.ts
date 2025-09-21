import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys, staleTimes } from '../lib/queryClient'
import { handleAuthError, authRetryConfig } from '../utils/authErrorHandler'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  category_id?: string
  is_active: boolean
  created_at: string
}

// Fetch all active services
export function useServices() {
  return useQuery({
    queryKey: queryKeys.servicesActive(),
    queryFn: async () => {
      return handleAuthError<Service[]>(async () => {
        return await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name')
      })
    },
    staleTime: staleTimes.static, // 10 minutes
    ...authRetryConfig
  })
}

// Fetch services with categories
export function useServicesWithCategories() {
  return useQuery({
    queryKey: [...queryKeys.services(), 'withCategories'],
    queryFn: async () => {
      return handleAuthError(async () => {
        return await supabase
          .from('services')
          .select(`
            *,
            category:service_categories(*)
          `)
          .eq('is_active', true)
          .order('name')
      })
    },
    staleTime: staleTimes.static, // 10 minutes
    ...authRetryConfig
  })
}

// Fetch services with staff assignments
export function useServicesWithStaff() {
  return useQuery({
    queryKey: queryKeys.servicesWithStaff(),
    queryFn: async () => {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (servicesError) throw servicesError

      // Get staff assignments for each service
      const servicesWithStaff = await Promise.all(
        services.map(async (service) => {
          const { data: staffServices } = await supabase
            .from('staff_services')
            .select('staff_id, staff(id, name)')
            .eq('service_id', service.id)

          return {
            ...service,
            staff: staffServices?.map(ss => ss.staff).filter(Boolean) || []
          }
        })
      )

      return servicesWithStaff
    },
    staleTime: staleTimes.semiStatic, // 2 minutes
  })
}

// Fetch a single service by ID
export function useService(serviceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.service(serviceId || ''),
    queryFn: async () => {
      if (!serviceId) return null

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (error) throw error
      return data as Service
    },
    enabled: !!serviceId,
    staleTime: staleTimes.static,
  })
}

// Mutations for services (used in admin)
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate all service queries
      queryClient.invalidateQueries({ queryKey: queryKeys.services() })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate specific service and list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.service(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.services() })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services() })
    },
  })
}