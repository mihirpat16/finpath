export const IDEAL = { expenses: 25, emiRent: 20, donations: 3, vacation: 12, investments: 40 }

export const INV_RATES = {
  equityMF: 12.22, ppfEpf: 7.71, nps: 8.0, directStocks: 12.22, emergencyLiquid: 5.64,
}

export const CAGR = 12
export const INFLATION = 6
export const EMERGENCY_MONTHS = 12

export function investmentPct(s) {
  return Math.max(0, 100 - (s.expenses_pct || 0) - (s.emi_rent_pct || 0) - (s.donations_pct || 0) - (s.vacation_pct || 0))
}

export function emergencyLiquidPct(s) {
  return Math.max(0, 100 - (s.equity_mf_pct || 0) - (s.ppf_epf_pct || 0) - (s.nps_pct || 0) - (s.direct_stocks_pct || 0))
}

export function fv(monthly, years, annualRatePct) {
  if (!monthly || monthly <= 0) return 0
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * (Math.pow(1 + r, n) - 1) / r
}

export function lifetimeEarnings(monthly, growthPct, years) {
  let total = 0
  for (let y = 0; y < years; y++) total += monthly * 12 * Math.pow(1 + growthPct / 100, y)
  return total
}

export function buildDashboard(s) {
  const invPct = investmentPct(s)
  const emLiqPct = emergencyLiquidPct(s)
  const monthly = Number(s.monthly_salary) || 0
  const monthlyInvest = (monthly * invPct) / 100
  const years = s.projection_years || 15

  const budgetRows = [
    { label: 'Expenses / Needs', emoji: '🛒', pct: s.expenses_pct, ideal: IDEAL.expenses },
    { label: 'EMI / Rent', emoji: '🏠', pct: s.emi_rent_pct, ideal: IDEAL.emiRent },
    { label: 'Donations', emoji: '💝', pct: s.donations_pct, ideal: IDEAL.donations },
    { label: 'Vacation / Leisure', emoji: '✈️', pct: s.vacation_pct, ideal: IDEAL.vacation },
    { label: 'Investments', emoji: '📈', pct: invPct, ideal: IDEAL.investments },
  ].map(r => ({ ...r, monthly: Math.round((monthly * r.pct) / 100), annual: Math.round((monthly * r.pct * 12) / 100) }))

  const investRows = [
    { label: 'Equity Mutual Funds', emoji: '📊', pct: s.equity_mf_pct, rate: INV_RATES.equityMF },
    { label: 'PPF / EPF', emoji: '🏦', pct: s.ppf_epf_pct, rate: INV_RATES.ppfEpf },
    { label: 'NPS', emoji: '🎯', pct: s.nps_pct, rate: INV_RATES.nps },
    { label: 'Direct Stocks', emoji: '📉', pct: s.direct_stocks_pct, rate: INV_RATES.directStocks },
    { label: 'Emergency / Liquid', emoji: '💧', pct: emLiqPct, rate: INV_RATES.emergencyLiquid },
  ].map(r => {
    const mo = Math.round((monthlyInvest * r.pct) / 100)
    return { ...r, monthly: mo, annual: mo * 12, corpus: Math.round(fv(mo, years, r.rate)) }
  })

  const totalCorpus = investRows.reduce((acc, r) => acc + r.corpus, 0)
  const realRet = ((1 + CAGR / 100) / (1 + INFLATION / 100) - 1) * 100

  return {
    annualSalary: monthly * 12,
    monthlyInvest: Math.round(monthlyInvest),
    invPct,
    realReturn: realRet.toFixed(1),
    budgetRows,
    investRows,
    totalCorpus: Math.round(totalCorpus),
    totalInvested: Math.round(monthlyInvest * 12 * years),
    lifetimeEarnings: Math.round(lifetimeEarnings(monthly, s.salary_growth_rate || 6, years)),
    equitySIP15yr: investRows[0].corpus,
    ppfEpf15yr: investRows[1].corpus,
    emergencyFundTarget: Math.round((monthly * (s.expenses_pct || 0)) / 100 * EMERGENCY_MONTHS),
    allocationCheck: Math.round(s.expenses_pct + s.emi_rent_pct + s.donations_pct + s.vacation_pct + invPct),
  }
}
