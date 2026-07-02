// Vercel serverless function — server-side proxy for Yahoo Finance
// Browser can't call Yahoo Finance directly (no CORS header).
// This function runs on Vercel's servers where CORS doesn't apply.
export default async function handler(req, res) {
  const { symbol } = req.query
  if (!symbol) return res.status(400).json({ error: 'symbol required' })

  // Allow only safe characters
  const clean = symbol.replace(/[^A-Z0-9.\-]/gi, '').toUpperCase()
  if (!clean) return res.status(400).json({ error: 'Invalid symbol' })

  const yahooSymbol = clean.endsWith('.NS') || clean.endsWith('.BO') ? clean : `${clean}.NS`

  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Yahoo Finance HTTP ${upstream.status}` })
    }

    const data = await upstream.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta?.regularMarketPrice) {
      return res.status(404).json({ error: `No price data for ${yahooSymbol}` })
    }

    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60')
    res.json({
      symbol: clean,
      price,
      prevClose,
      change: price - prevClose,
      changePct: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
      currency: meta.currency ?? 'INR',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
