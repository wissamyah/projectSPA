import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys, staleTimes } from '../lib/queryClient'
import { handleAuthError, authRetryConfig } from '../utils/authErrorHandler'

interface Category {
  id: string
  name: string
  display_order: number
  created_at: string
}

// Fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      return handleAuthError<Category[]>(async () => {
        return await supabase
          .from('service_categories')
          .select('*')
          .order('display_order')
      })
    },
    staleTime: staleTimes.static, // 10 minutes (categories rarely change)
    ...authRetryConfig
  })
}

// Fetch a single category by ID
export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.category(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) return null

      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (error) throw error
      return data as Category
    },
    enabled: !!categoryId,
    staleTime: staleTimes.static,
  })
}