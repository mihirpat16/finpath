import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import {
  fetchPlannerSettings, upsertPlannerSettings,
  fetchExpenses, upsertExpense,
  fetchExpenseItems, addExpenseItem, deleteExpenseItem,
} from '@/lib/supabase/planner'

export function usePlannerSettings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['planner-settings', user?.id],
    queryFn: () => fetchPlannerSettings(user.id),
    enabled: !!user?.id,
  })
}

export function useSavePlannerSettings() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings) => upsertPlannerSettings({ ...settings, user_id: user.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planner-settings', user?.id] }),
  })
}

export function usePlannerExpenses(year) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['planner-expenses', user?.id, year],
    queryFn: () => fetchExpenses(user.id, year),
    enabled: !!user?.id && !!year,
  })
}

export function useSaveExpense() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (expense) => upsertExpense({ ...expense, user_id: user.id }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['planner-expenses', user?.id, vars.year] }),
  })
}

export function useExpenseItems(year) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['expense-items', user?.id, year],
    queryFn: () => fetchExpenseItems(user.id, year),
    enabled: !!user?.id && !!year,
  })
}

export function useAddExpenseItem() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (item) => addExpenseItem({ ...item, user_id: user.id }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['expense-items', user?.id, vars.year] }),
  })
}

export function useDeleteExpenseItem() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => deleteExpenseItem(id),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['expense-items', user?.id, vars.year] }),
  })
}
