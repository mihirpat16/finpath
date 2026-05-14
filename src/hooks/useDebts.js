import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchDebts, addDebt, updateDebt, deleteDebt } from '@/lib/supabase/debts'

function throwOnError(res) {
  if (res.error) throw res.error
  return res.data
}

export function useDebts() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['debts', user?.id],
    queryFn: () => fetchDebts(user.id).then(throwOnError),
    enabled: !!user?.id,
  })
}

export function useAddDebt() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (debt) => addDebt(user.id, debt).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', user?.id] }),
  })
}

export function useUpdateDebt() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => updateDebt(id, patch).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', user?.id] }),
  })
}

export function useDeleteDebt() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteDebt(id).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', user?.id] }),
  })
}
