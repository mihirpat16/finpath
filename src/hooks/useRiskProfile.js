import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchLatestRiskProfile, saveRiskProfile } from '@/lib/supabase/riskProfiles'

export function useRiskProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['risk-profile', user?.id],
    queryFn: () => fetchLatestRiskProfile(user.id),
    enabled: !!user?.id,
    select: (res) => res.data,
  })
}

export function useSaveRiskProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => saveRiskProfile({ userId: user.id, ...payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk-profile', user?.id] }),
  })
}
