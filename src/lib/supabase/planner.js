import { supabase } from './client'

export async function fetchPlannerSettings(userId) {
  const { data, error } = await supabase
    .from('planner_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertPlannerSettings(settings) {
  const { data, error } = await supabase
    .from('planner_settings')
    .upsert(settings, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchExpenses(userId, year) {
  const { data, error } = await supabase
    .from('planner_expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
  if (error) throw error
  return data ?? []
}

export async function upsertExpense(expense) {
  const { data, error } = await supabase
    .from('planner_expenses')
    .upsert(expense, { onConflict: 'user_id,year,month,category' })
    .select()
    .single()
  if (error) throw error
  return data
}
