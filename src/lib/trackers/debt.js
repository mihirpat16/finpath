/**
 * Monthly interest-based payoff calculations.
 * Rates stored as percentages (e.g. 12 = 12% p.a.).
 */

export function monthsToPayoff(principalRemaining, interestRate, monthlyPayment) {
  if (principalRemaining <= 0) return 0
  const r = interestRate / 100 / 12
  if (r === 0) return Math.ceil(principalRemaining / monthlyPayment)
  if (monthlyPayment <= principalRemaining * r) return Infinity
  return Math.ceil(
    -Math.log(1 - (principalRemaining * r) / monthlyPayment) / Math.log(1 + r)
  )
}

export function totalInterestPaid(principalRemaining, interestRate, monthlyPayment) {
  const months = monthsToPayoff(principalRemaining, interestRate, monthlyPayment)
  if (!isFinite(months)) return Infinity
  return Math.max(0, monthlyPayment * months - principalRemaining)
}

export function avalancheOrder(debts) {
  return [...debts].sort((a, b) => b.interest_rate - a.interest_rate)
}

export function snowballOrder(debts) {
  return [...debts].sort((a, b) => a.principal_remaining - b.principal_remaining)
}

/**
 * Returns [{month, totalBalance}] for a LineChart.
 * Simulates minimum payments on all debts + any extra focused on
 * the strategy-ordered first debt (debt avalanche / snowball).
 */
export function payoffTimeline(debts, strategy = 'avalanche', extraMonthly = 0) {
  if (!debts.length) return []

  const ordered = strategy === 'avalanche' ? avalancheOrder(debts) : snowballOrder(debts)
  let balances = ordered.map((d) => ({
    id: d.id,
    balance: d.principal_remaining,
    rate: d.interest_rate / 100 / 12,
    minPayment: d.monthly_payment,
  }))

  const points = [{ month: 0, totalBalance: balances.reduce((s, d) => s + d.balance, 0) }]
  const MAX_MONTHS = 360

  for (let m = 1; m <= MAX_MONTHS; m++) {
    let extra = extraMonthly

    balances = balances
      .map((d, idx) => {
        const interest = d.balance * d.rate
        let payment = d.minPayment
        if (idx === 0 && extra > 0) {
          payment += extra
          extra = 0
        }
        const newBalance = Math.max(0, d.balance + interest - payment)
        return { ...d, balance: newBalance }
      })
      .filter((d) => d.balance > 0)

    const total = balances.reduce((s, d) => s + d.balance, 0)
    points.push({ month: m, totalBalance: Math.round(total) })
    if (total <= 0) break
  }

  return points
}
