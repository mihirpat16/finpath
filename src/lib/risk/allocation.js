export const BASE_ALLOCATIONS = {
  conservative: { equity: 20, debt: 65, gold: 10, cash: 5 },
  moderate:     { equity: 50, debt: 35, gold: 10, cash: 5 },
  growth:       { equity: 70, debt: 20, gold: 7,  cash: 3 },
  aggressive:   { equity: 85, debt: 8,  gold: 5,  cash: 2 },
}

// -1% equity per year over age 50, capped at -20%.
// -10% equity if the user's shortest goal is under 3 years.
// Removed equity is added to debt to keep total at 100%.
export function computeAllocation(profileKey, age = 30, shortTermGoal = false) {
  const base = { ...(BASE_ALLOCATIONS[profileKey] ?? BASE_ALLOCATIONS.moderate) }

  let reduction = 0
  if (age > 50) reduction += Math.min(age - 50, 20)
  if (shortTermGoal) reduction += 10

  const actualReduction = Math.min(reduction, base.equity - 5) // keep at least 5% equity
  return {
    ...base,
    equity: base.equity - actualReduction,
    debt: base.debt + actualReduction,
  }
}

// Returns an array suitable for Recharts PieChart/Cell rendering.
export function allocationToSlices(allocation) {
  return [
    { name: 'Equity', value: allocation.equity, color: '#0F2A4A' },
    { name: 'Debt',   value: allocation.debt,   color: '#10B981' },
    { name: 'Gold',   value: allocation.gold,   color: '#F59E0B' },
    { name: 'Cash',   value: allocation.cash,   color: '#94A3B8' },
  ].filter((s) => s.value > 0)
}
