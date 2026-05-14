import { supabase } from './client'

export async function saveRiskProfile({ userId, totalScore, profileKey, answers, allocation }) {
  return supabase
    .from('risk_profiles')
    .insert({
      user_id: userId,
      total_score: totalScore,
      profile_key: profileKey,
      answers,
      allocation,
    })
    .select()
    .single()
}

export async function fetchLatestRiskProfile(userId) {
  return supabase
    .from('risk_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}
