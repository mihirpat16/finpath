import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import {
  fetchGoals, fetchGoal, createGoal, updateGoal, deleteGoal,
} from '@/lib/supabase/goals'

function throwOnError({ data, error }) {
  if (error) throw error
  return data
}

export function useGoals() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => fetchGoals(user.id).then(throwOnError),
    enabled: !!user,
  })
}

export function useGoal(id) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => fetchGoal(id).then(throwOnError),
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      createGoal({ ...data, user_id: user.id }).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => updateGoal(id, data).then(throwOnError),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: ['goal', id] })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteGoal(id).then(({ error }) => { if (error) throw error }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}
