import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys, staleTimes } from '../lib/queryClient'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  is_active: boolean
  created_at: string
}

// Fetch all active staff
export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staffActive(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as Staff[]
    },
    staleTime: staleTimes.semiStatic, // 2 minutes
  })
}

// Fetch staff for a specific service
export function useStaffForService(serviceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staffForService(serviceId || ''),
    queryFn: async () => {
      if (!serviceId) return []

      const { data, error } = await supabase
        .from('staff_services')
        .select('staff:staff_id(*)')
        .eq('service_id', serviceId)

      if (error) throw error
      return data?.map(item => item.staff).filter(Boolean) as Staff[]
    },
    enabled: !!serviceId,
    staleTime: staleTimes.semiStatic,
  })
}

// Fetch a single staff member
export function useStaffMember(staffId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.staffMember(staffId || ''),
    queryFn: async () => {
      if (!staffId) return null

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single()

      if (error) throw error
      return data as Staff
    },
    enabled: !!staffId,
    staleTime: staleTimes.semiStatic,
  })
}

// Mutations for staff (used in admin)
export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (staff: Omit<Staff, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('staff')
        .insert(staff)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Staff> & { id: string }) => {
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffMember(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
  })
}