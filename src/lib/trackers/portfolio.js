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
 * assetClassDrift — compare current allocation vs target using live prices.
 * Returns [{assetClass, currentPct, targetPct, drift, currentValue}] sorted by |drift| desc.
 */
export function assetClassDrift(holdings, targetAllocation = {}, currentPrices = {}) {
  const { rows, totalCurrentValue } = portfolioReturns(holdings, currentPrices)
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
      return { assetClass, currentPct, targetPct, drift, currentValue: value }
    })
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
}

/**
 * rebalancingSuggestions — compute ₹ amounts to buy/sell per asset class.
 * Returns [{assetClass, currentPct, targetPct, drift, currentValue, targetValue, delta}]
 * delta > 0 = need to buy, delta < 0 = need to sell
 */
export function rebalancingSuggestions(holdings, targetAllocation = {}, currentPrices = {}) {
  const { rows, totalCurrentValue } = portfolioReturns(holdings, currentPrices)
  if (totalCurrentValue === 0 || !Object.keys(targetAllocation).length) return []

  const byClass = {}
  for (const r of rows) {
    byClass[r.asset_class] = (byClass[r.asset_class] ?? 0) + r.currentValue
  }

  // Include all asset classes that appear in either holdings or target
  const allClasses = new Set([...Object.keys(byClass), ...Object.keys(targetAllocation)])

  return [...allClasses]
    .map(assetClass => {
      const currentValue = byClass[assetClass] ?? 0
      const currentPct = (currentValue / totalCurrentValue) * 100
      const targetPct = targetAllocation[assetClass] ?? 0
      const targetValue = (targetPct / 100) * totalCurrentValue
      const delta = targetValue - currentValue
      const drift = currentPct - targetPct
      return { assetClass, currentPct, targetPct, drift, currentValue, targetValue, delta }
    })
    .filter(s => targetAllocation[s.assetClass] > 0 || s.currentValue > 0)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
}
