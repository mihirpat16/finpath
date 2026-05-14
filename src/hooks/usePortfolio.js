import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { createPortfolio, addPositions, fetchActivePortfolio } from '@/lib/supabase/portfolios'

export function useActivePortfolio() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: () => fetchActivePortfolio(user.id),
    enabled: !!user?.id,
    select: (res) => res.data,
  })
}

export function useSavePortfolio() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, items }) => {
      const { data, error } = await createPortfolio(user.id, name)
      if (error) throw error
      const { error: posError } = await addPositions(data.id, items)
      if (posError) throw posError
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', user?.id] }),
  })
}
