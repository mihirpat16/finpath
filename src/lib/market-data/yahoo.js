// Free NSE stock price via Yahoo Finance — no API key required
// Symbol format: HDFCBANK → HDFCBANK.NS (auto-appended)

export async function fetchNSEQuote(nseSymbol) {
  const symbol = nseSymbol.endsWith('.NS') || nseSymbol.endsWith('.BO')
    ? nseSymbol
    : `${nseSymbol}.NS`

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })

  if (!res.ok) throw new Error(`Yahoo Finance: HTTP ${res.status}`)

  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta

  if (!meta) throw new Error(`No result for ${symbol}`)

  const price = meta.regularMarketPrice
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price

  if (!price || price === 0) throw new Error(`Zero price returned for ${symbol}`)

  return {
    current_price: price,
    previous_close: prevClose,
    day_change: price - prevClose,
    day_change_percent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
    currency: 'INR',
    last_updated: new Date().toISOString(),
  }
}
