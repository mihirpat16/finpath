import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchHoldings, addHolding, updateHolding, deleteHolding } from '@/lib/supabase/holdings'

function throwOnError(res) {
  if (res.error) throw res.error
  return res.data
}

export function useHoldings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['holdings', user?.id],
    queryFn: () => fetchHoldings(user.id).then(throwOnError),
    enabled: !!user?.id,
  })
}

export function useAddHolding() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (holding) => addHolding(user.id, holding).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holdings', user?.id] }),
  })
}

export function useUpdateHolding() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => updateHolding(id, patch).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holdings', user?.id] }),
  })
}

export function useDeleteHolding() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteHolding(id).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holdings', user?.id] }),
  })
}
