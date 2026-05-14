import { supabase } from './client'

export async function fetchHoldings(userId) {
  return supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
}

export async function addHolding(userId, holding) {
  return supabase
    .from('holdings')
    .insert({ user_id: userId, ...holding })
    .select()
    .single()
}

export async function updateHolding(id, patch) {
  return supabase
    .from('holdings')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteHolding(id) {
  return supabase.from('holdings').delete().eq('id', id)
}
