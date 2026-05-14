import { supabase } from './client'

// Creates a new anonymous session and stores the user's display name.
export async function signInAnonymously(fullName) {
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) return { data: null, error }

  // Store the name in user_metadata so the rest of the app can read it.
  const { error: updateError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  })

  return { data, error: updateError ?? null }
}

export async function signOut() {
  return supabase.auth.signOut()
}

// Upsert profile fields for the current user
export async function upsertProfile(userId, data) {
  return supabase
    .from('profiles')
    .upsert({ id: userId, ...data, updated_at: new Date().toISOString() })
}

// Returns true if a profiles row exists for the current user
export async function hasProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}
