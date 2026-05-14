/**
 * portfolioReturns — compute gain/loss metrics from holdings.
 * holdings: array of DB rows (units, avg_buy_price, total_invested, current_price, asset_class)
 * currentPrices: optional map { holdingId → price } for mock refresh
 */
export function portfolioReturns(holdings, currentPrices = {}) {
  const rows = holdings.map((h) => {
    const price = currentPrices[h.id] ?? h.current_price ?? h.avg_buy_price
    const currentValue = h.units * price
    const invested = h.total_invested ?? h.units * h.avg_buy_price
    return { ...h, currentValue, invested, price }
  })

  const totalCurrentValue = rows.reduce((s, r) => s + r.currentValue, 0)
  const totalInvested = rows.reduce((s, r) => s + r.invested, 0)
  const absoluteGain = totalCurrentValue - totalInvested
  const returnPct = totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0

  return { rows, totalCurrentValue, totalInvested, absoluteGain, returnPct }
}

/**
 * assetClassDrift — compare current allocation vs target.
 * Returns [{assetClass, currentPct, targetPct, drift}] sorted by |drift| desc.
 */
export function assetClassDrift(holdings, targetAllocation = {}) {
  const { rows, totalCurrentValue } = portfolioReturns(holdings)
  if (totalCurrentValue === 0) return []

  const byClass = {}
  for (const r of rows) {
    byClass[r.asset_class] = (byClass[r.asset_class] ?? 0) + r.currentValue
  }

  return Object.entries(byClass)
    .map(([assetClass, value]) => {
      const currentPct = (value / totalCurrentValue) * 100
      const targetPct = targetAllocation[assetClass] ?? 0
      const drift = currentPct - targetPct
      return { assetClass, currentPct, targetPct, drift }
    })
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
}
