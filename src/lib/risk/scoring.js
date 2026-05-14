export const RISK_PROFILES = {
  conservative: {
    key: 'conservative',
    label: 'Conservative',
    minScore: 10,
    maxScore: 20,
    color: '#3B82F6',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-200',
    cagrRange: '6–8%',
    maxDrawdown: '~10%',
    volatility: 'Low',
    description:
      'Capital preservation is your top priority. You prefer predictable, stable returns over growth — even if it means missing out during bull markets.',
    strategy:
      'Focus on debt mutual funds, fixed deposits, and government bonds. A small equity allocation via large-cap index funds provides mild inflation protection.',
    suitableFor:
      'Retirees, investors nearing their goal date, or anyone whose primary concern is protecting accumulated savings.',
  },
  moderate: {
    key: 'moderate',
    label: 'Moderate',
    minScore: 21,
    maxScore: 30,
    color: '#10B981',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cagrRange: '9–11%',
    maxDrawdown: '~25%',
    volatility: 'Medium',
    description:
      'You seek a balance between growth and security. You can tolerate moderate market fluctuations in exchange for reasonable long-term wealth creation.',
    strategy:
      'A hybrid approach — balanced mutual funds, large-cap equity, and high-quality debt instruments. Index funds and hybrid funds work well here.',
    suitableFor:
      'Salaried professionals building a corpus for medium-term goals like buying a home or funding children\'s education.',
  },
  growth: {
    key: 'growth',
    label: 'Growth',
    minScore: 31,
    maxScore: 40,
    color: '#F59E0B',
    tagColor: 'bg-amber-100 text-amber-700 border-amber-200',
    cagrRange: '12–15%',
    maxDrawdown: '~40%',
    volatility: 'High',
    description:
      'Long-term wealth creation is your primary objective. You accept significant short-term volatility — including major drawdowns — in pursuit of above-average returns.',
    strategy:
      'Predominantly equity-oriented across large, mid, and small-cap funds. International funds and sector ETFs can add diversification and alpha potential.',
    suitableFor:
      'Young professionals with a long investment horizon, stable income, and no immediate large financial obligations.',
  },
  aggressive: {
    key: 'aggressive',
    label: 'Aggressive',
    minScore: 41,
    maxScore: 50,
    color: '#EF4444',
    tagColor: 'bg-red-100 text-red-700 border-red-200',
    cagrRange: '15–20%+',
    maxDrawdown: '~60%',
    volatility: 'Very High',
    description:
      'Maximum returns are your goal. You have the experience, knowledge, and financial cushion to withstand extreme market volatility without panic.',
    strategy:
      'High concentration in equity — small caps, momentum strategies, sector bets, and potentially direct stock picking. Active monitoring is essential.',
    suitableFor:
      'Experienced investors with high income, no immediate large expenses, substantial emergency funds, and a 10+ year investment horizon.',
  },
}

export function scoreQuiz(answers) {
  return Object.values(answers).reduce((sum, score) => sum + score, 0)
}

export function getRiskProfile(totalScore) {
  return (
    Object.values(RISK_PROFILES).find(
      (p) => totalScore >= p.minScore && totalScore <= p.maxScore,
    ) ?? RISK_PROFILES.moderate
  )
}
