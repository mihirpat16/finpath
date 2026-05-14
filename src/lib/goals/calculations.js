// ── Horizon classification ──────────────────────────────────────────────────
export function classifyHorizon(years) {
  if (years < 3) return 'short'
  if (years <= 7) return 'medium'
  return 'long'
}

// ── Inflation adjustment ────────────────────────────────────────────────────
export function inflationAdjustedTarget(amount, years, inflationRate = 0.06) {
  return amount * Math.pow(1 + inflationRate, years)
}

// ── Required monthly SIP to hit target ─────────────────────────────────────
// expectedCAGR is a decimal (e.g. 0.10 for 10%)
export function requiredMonthlyInvestment(target, years, expectedCAGR, currentSavings = 0) {
  const monthlyRate = expectedCAGR / 12
  const months = years * 12
  const futureValueOfCurrent = currentSavings * Math.pow(1 + expectedCAGR, years)
  const remaining = target - futureValueOfCurrent
  if (remaining <= 0) return 0
  if (monthlyRate === 0) return remaining / months
  return (remaining * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1)
}

// ── Projected FV of regular monthly contributions ──────────────────────────
export function projectedValue(monthlyAmount, years, expectedCAGR) {
  const monthlyRate = expectedCAGR / 12
  const months = years * 12
  if (monthlyRate === 0) return monthlyAmount * months
  return (monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate
}

// ── Total projected portfolio value (contributions + existing savings) ──────
export function totalProjected(monthlyAmount, years, expectedCAGR, currentSavings = 0) {
  const contributions = projectedValue(monthlyAmount, years, expectedCAGR)
  const grownSavings = currentSavings * Math.pow(1 + expectedCAGR, years)
  return contributions + grownSavings
}

// ── Generate year-by-year data for Recharts projection chart ───────────────
export function buildProjectionSeries(goal) {
  const { time_horizon_years, current_amount, target_amount } = goal
  const expected_cagr = goal.expected_cagr ?? 0.10
  const monthly = requiredMonthlyInvestment(
    target_amount,
    time_horizon_years,
    expected_cagr,
    current_amount,
  )
  return Array.from({ length: time_horizon_years + 1 }, (_, year) => ({
    year,
    projected: Math.round(totalProjected(monthly, year, expected_cagr, current_amount)),
    target: Math.round(target_amount),
  }))
}

// ── Simple progress percentage ──────────────────────────────────────────────
export function goalProgress(currentAmount, targetAmount) {
  if (targetAmount <= 0) return 0
  return Math.min((currentAmount / targetAmount) * 100, 100)
}
