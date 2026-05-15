const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY

if (!API_KEY) {
  console.warn('VITE_FINNHUB_API_KEY not set — live prices will not work')
}

/**
 * Fetch a single quote from Finnhub.
 * For NSE stocks use format: NSE:RELIANCE
 * For BSE stocks use format: BSE:RELIANCE
 * For mutual fund NAV, use mfapi.in instead (see cache.js)
 */
export async function fetchQuote(ticker) {
  if (!API_KEY) throw new Error('Finnhub API key not configured. Add VITE_FINNHUB_API_KEY to your .env file.')

  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${API_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit exceeded — try again in a minute')
    if (res.status === 401) throw new Error('Invalid Finnhub API key')
    throw new Error(`Finnhub error: ${res.status}`)
  }

  const data = await res.json()

  // Finnhub returns { c, pc, d, dp, t, h, l, o }
  // c = current, pc = previous close, d = change, dp = change %, t = timestamp
  if (data.c === 0 && data.pc === 0) {
    throw new Error(`No data for ticker "${ticker}" — symbol may be invalid or market may be closed`)
  }

  return {
    ticker,
    current_price: data.c,
    previous_close: data.pc,
    day_change: data.d,
    day_change_percent: data.dp,
    currency: 'INR',
    last_updated: new Date().toISOString(),
  }
}

/**
 * Fetch multiple quotes in parallel.
 * Finnhub free tier has no batch endpoint — each ticker is a separate call.
 * Returns array: { success, data } | { success: false, ticker, error }
 */
export async function fetchMultipleQuotes(tickers) {
  const results = await Promise.allSettled(tickers.map(fetchQuote))
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? { success: true, data: r.value }
      : { success: false, ticker: tickers[i], error: r.reason.message }
  )
}
