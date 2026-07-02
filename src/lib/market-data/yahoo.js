// NSE stock prices via our own Vercel serverless proxy (/api/stock-price)
// Yahoo Finance blocks direct browser requests (no CORS header).
// The proxy at /api/stock-price fetches server-side and returns JSON.

export async function fetchNSEQuote(nseSymbol) {
  const symbol = nseSymbol.replace(/\.NS$/i, '') // strip .NS if already present
  const url = `/api/stock-price?symbol=${encodeURIComponent(symbol)}`

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Stock price fetch failed (HTTP ${res.status})`)
  }

  const data = await res.json()
  if (!data.price) throw new Error(`No price returned for ${nseSymbol}`)

  return {
    current_price: data.price,
    previous_close: data.prevClose,
    day_change: data.change,
    day_change_percent: data.changePct,
    currency: data.currency ?? 'INR',
    last_updated: new Date().toISOString(),
  }
}
