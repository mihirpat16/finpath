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

// ── Detailed expense line items ───────────────────────────────────────────────
export async function fetchExpenseItems(userId, year) {
  const { data, error } = await supabase
    .from('planner_expense_items')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('entry_date', { ascending: true })
  if (error) {
    if (error.code === '42P01') return [] // table not created yet — fail silently
    throw error
  }
  return data ?? []
}

export async function addExpenseItem(item) {
  const { data, error } = await supabase
    .from('planner_expense_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpenseItem(id) {
  const { error } = await supabase
    .from('planner_expense_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}
