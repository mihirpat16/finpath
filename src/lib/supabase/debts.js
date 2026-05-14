import { supabase } from './client'

export async function fetchDebts(userId) {
  return supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
}

export async function addDebt(userId, debt) {
  return supabase
    .from('debts')
    .insert({ user_id: userId, ...debt })
    .select()
    .single()
}

export async function updateDebt(id, patch) {
  return supabase
    .from('debts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteDebt(id) {
  return supabase.from('debts').delete().eq('id', id)
}
