import { supabase } from './client'

export async function fetchEntries(userId) {
  return supabase
    .from('net_worth_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function addEntry(userId, entry) {
  return supabase
    .from('net_worth_entries')
    .insert({ user_id: userId, ...entry })
    .select()
    .single()
}

export async function updateEntry(id, patch) {
  return supabase
    .from('net_worth_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteEntry(id) {
  return supabase.from('net_worth_entries').delete().eq('id', id)
}

export async function fetchSnapshots(userId, limit = 12) {
  return supabase
    .from('net_worth_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true })
    .limit(limit)
}

export async function upsertCurrentMonthSnapshot(userId, { totalAssets, totalLiabilities }) {
  const snapshotDate = new Date().toISOString().slice(0, 7) + '-01'
  return supabase.from('net_worth_snapshots').upsert(
    {
      user_id: userId,
      snapshot_date: snapshotDate,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: totalAssets - totalLiabilities,
    },
    { onConflict: 'user_id,snapshot_date' }
  )
}
