import { supabase } from './client'

export async function createPortfolio(userId, name) {
  return supabase
    .from('portfolios')
    .insert({ user_id: userId, name, is_active: true })
    .select('id')
    .single()
}

export async function addPositions(portfolioId, positions) {
  return supabase
    .from('portfolio_positions')
    .insert(positions.map((p) => ({ ...p, portfolio_id: portfolioId })))
}

export async function fetchActivePortfolio(userId) {
  return supabase
    .from('portfolios')
    .select('*, portfolio_positions(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}
