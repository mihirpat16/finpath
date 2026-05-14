import { supabase } from './client'

export async function fetchGoals(userId) {
  return supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function fetchGoal(id) {
  return supabase.from('goals').select('*').eq('id', id).single()
}

export async function createGoal(data) {
  return supabase.from('goals').insert(data).select().single()
}

export async function updateGoal(id, data) {
  return supabase
    .from('goals')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteGoal(id) {
  return supabase.from('goals').delete().eq('id', id)
}
