import { INSTRUMENTS, CASH_INSTRUMENT } from './catalog'

const RISK_ORDER = ['conservative', 'moderate', 'growth', 'aggressive']

// For Growth/Aggressive profiles, carve out some equity as alternatives (REITs/commodities).
function adjustAllocation(allocation, riskBucket) {
  const adj = { ...allocation }
  if (riskBucket === 'growth' && adj.equity >= 15) {
    adj.equity -= 5
    adj.alternatives = 5
  } else if (riskBucket === 'aggressive' && adj.equity >= 20) {
    adj.equity -= 10
    adj.alternatives = 10
  }
  return adj
}

function pickForClass(assetClass, classPct, userRiskIdx, monthlyCapacity) {
  const candidates = INSTRUMENTS.filter((i) => {
    if (i.asset_class !== assetClass) return false
    return RISK_ORDER.indexOf(i.min_risk_bucket) <= userRiskIdx
  })

  if (!candidates.length) return []

  // Min 2 instruments when allocation > 15%; no single instrument > 25% of portfolio
  const needMin2 = classPct > 15
  const minCount = Math.max(needMin2 ? 2 : 1, Math.ceil(classPct / 25))

  const sorted = [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const bCagr = b.five_year_cagr ?? b.three_year_cagr ?? 0
    const aCagr = a.five_year_cagr ?? a.three_year_cagr ?? 0
    return bCagr - aCagr
  })

  const picked = sorted.slice(0, Math.min(minCount, sorted.length))
  const allocPer = classPct / picked.length

  return picked.map((instrument) => ({
    instrument,
    asset_class: assetClass,
    allocation_pct: Math.round(allocPer * 10) / 10,
    suggested_monthly_amount: Math.round((monthlyCapacity * allocPer) / 100),
    rationale: instrument.why_recommended,
  }))
}

/**
 * Computes the weighted average expected return of a portfolio.
 * positions: array returned by buildPortfolio()
 * Returns a decimal (e.g. 0.115 for 11.5%)
 */
export function weightedPortfolioReturn(positions) {
  const total = positions.reduce((s, p) => s + p.allocation_pct, 0)
  if (total === 0) return 0
  return positions.reduce((sum, p) => {
    const cagr = p.instrument.five_year_cagr ?? p.instrument.three_year_cagr ?? 0
    return sum + (p.allocation_pct / total) * cagr
  }, 0)
}

/**
 * Builds a personalised portfolio recommendation list.
 *
 * @param {object} params
 * @param {{ equity, debt, gold, cash }} params.allocation  — output of computeAllocation()
 * @param {'conservative'|'moderate'|'growth'|'aggressive'} params.riskBucket
 * @param {number} params.monthlyCapacity  — total monthly ₹ available to invest
 * @returns {{ instrument, asset_class, allocation_pct, suggested_monthly_amount, rationale }[]}
 */
export function buildPortfolio({ allocation, riskBucket, monthlyCapacity = 10000 }) {
  const userRiskIdx = RISK_ORDER.indexOf(riskBucket)
  const adj = adjustAllocation(allocation, riskBucket)
  const result = []

  for (const cls of ['equity', 'debt', 'gold', 'alternatives']) {
    const pct = adj[cls] ?? 0
    if (pct <= 0) continue
    result.push(...pickForClass(cls, pct, userRiskIdx, monthlyCapacity))
  }

  // Cash: always a single line item
  const cashPct = adj.cash ?? 0
  if (cashPct > 0) {
    result.push({
      instrument: CASH_INSTRUMENT,
      asset_class: 'cash',
      allocation_pct: cashPct,
      suggested_monthly_amount: Math.round((monthlyCapacity * cashPct) / 100),
      rationale: CASH_INSTRUMENT.why_recommended,
    })
  }

  return result
}
