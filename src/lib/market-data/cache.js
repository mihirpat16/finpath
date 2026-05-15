import { supabase } from '@/lib/supabase/client'
import { fetchQuote, fetchMultipleQuotes } from './finnhub'

const CACHE_TTL_MINUTES = 15

// Mutual fund NAV via mfapi.in (free, CORS-enabled, no API key needed)
// Ticker format for MFs is stored as MF:{schemeCode} in holdings.ticker
async function fetchMFNav(schemeCode) {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('MF NAV fetch failed')
  const json = await res.json()
  const nav = parseFloat(json.data?.[0]?.nav)
  if (isNaN(nav)) throw new Error('Invalid NAV data')
  return {
    ticker: `MF:${schemeCode}`,
    current_price: nav,
    previous_close: parseFloat(json.data?.[1]?.nav ?? nav),
    day_change: nav - parseFloat(json.data?.[1]?.nav ?? nav),
    day_change_percent: json.data?.[1]?.nav
      ? ((nav - parseFloat(json.data[1].nav)) / parseFloat(json.data[1].nav)) * 100
      : 0,
    currency: 'INR',
    last_updated: new Date().toISOString(),
  }
}

// Dispatch to correct source based on ticker format:
// MF:{schemeCode}  → mfapi.in (AMFI NAV)
// STK:{symbol}     → Finnhub (NSE:SYMBOL)
// NSE:SYMBOL       → Finnhub directly
async function fetchFresh(ticker) {
  if (ticker.startsWith('MF:')) {
    const schemeCode = ticker.slice(3)
    return fetchMFNav(schemeCode)
  }
  // For STK: prefix, convert to Finnhub NSE format
  const finnhubTicker = ticker.startsWith('STK:')
    ? `NSE:${ticker.slice(4)}`
    : ticker
  return fetchQuote(finnhubTicker).then(r => ({ ...r, ticker })) // keep original ticker key
}

/**
 * Get price for a single ticker, using Supabase cache when fresh.
 */
export async function getPrice(ticker) {
  const { data: cached } = await supabase
    .from('instrument_prices')
    .select('*')
    .eq('ticker', ticker)
    .maybeSingle()

  if (cached) {
    const ageMinutes = (Date.now() - new Date(cached.last_updated).getTime()) / 60000
    if (ageMinutes < CACHE_TTL_MINUTES) return { ...cached, fromCache: true }
  }

  try {
    const fresh = await fetchFresh(ticker)
    await supabase.from('instrument_prices').upsert(fresh, { onConflict: 'ticker' })
    return { ...fresh, fromCache: false }
  } catch (err) {
    if (cached) return { ...cached, fromCache: true, stale: true, fetch_error: err.message }
    throw err
  }
}

/**
 * Get prices for multiple tickers, only fetching stale or missing ones.
 */
export async function getPrices(tickers) {
  if (!tickers || tickers.length === 0) return []
  const uniqueTickers = [...new Set(tickers.filter(Boolean))]
  if (uniqueTickers.length === 0) return []

  // Load all cached rows in one query
  const { data: cachedRows = [] } = await supabase
    .from('instrument_prices')
    .select('*')
    .in('ticker', uniqueTickers)

  const cachedMap = new Map(cachedRows.map(r => [r.ticker, r]))
  const staleOrMissing = []
  const results = []

  for (const ticker of uniqueTickers) {
    const cached = cachedMap.get(ticker)
    if (cached) {
      const ageMin = (Date.now() - new Date(cached.last_updated).getTime()) / 60000
      if (ageMin < CACHE_TTL_MINUTES) {
        results.push({ ...cached, fromCache: true })
        continue
      }
    }
    staleOrMissing.push(ticker)
  }

  if (staleOrMissing.length > 0) {
    // Split MF tickers and stock tickers
    const mfTickers = staleOrMissing.filter(t => t.startsWith('MF:'))
    const stockTickers = staleOrMissing.filter(t => !t.startsWith('MF:'))

    const allFetched = []

    // Fetch MF NAVs (mfapi.in — no rate limit concern)
    if (mfTickers.length > 0) {
      const mfResults = await Promise.allSettled(mfTickers.map(t => fetchMFNav(t.slice(3)).then(r => ({ ...r, ticker: t }))))
      mfResults.forEach((r, i) => {
        if (r.status === 'fulfilled') allFetched.push({ success: true, data: r.value })
        else allFetched.push({ success: false, ticker: mfTickers[i], error: r.reason.message })
      })
    }

    // Fetch stock prices via Finnhub
    if (stockTickers.length > 0) {
      const finnhubSymbols = stockTickers.map(t => t.startsWith('STK:') ? `NSE:${t.slice(4)}` : t)
      const stockResults = await fetchMultipleQuotes(finnhubSymbols)
      stockResults.forEach((r, i) => {
        if (r.success) allFetched.push({ success: true, data: { ...r.data, ticker: stockTickers[i] } })
        else allFetched.push({ success: false, ticker: stockTickers[i], error: r.error })
      })
    }

    const successful = allFetched.filter(r => r.success).map(r => r.data)
    if (successful.length > 0) {
      await supabase.from('instrument_prices').upsert(successful, { onConflict: 'ticker' })
    }

    successful.forEach(d => results.push({ ...d, fromCache: false }))

    allFetched.filter(r => !r.success).forEach(failure => {
      const cached = cachedMap.get(failure.ticker)
      if (cached) results.push({ ...cached, fromCache: true, stale: true, fetch_error: failure.error })
      else results.push({ ticker: failure.ticker, current_price: null, fetch_error: failure.error })
    })
  }

  return results
}
