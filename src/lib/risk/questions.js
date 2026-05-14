export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    text: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve capital — I cannot afford any losses', score: 1 },
      { label: 'Generate steady income with modest growth', score: 2 },
      { label: 'Balance growth and income equally', score: 3 },
      { label: 'Long-term growth, accepting short-term volatility', score: 4 },
      { label: 'Maximum returns — I accept high risk', score: 5 },
    ],
  },
  {
    id: 'q2',
    text: 'If your portfolio dropped 25% in three months, what would you do?',
    options: [
      { label: 'Sell everything immediately to stop further losses', score: 1 },
      { label: 'Sell some holdings to reduce my exposure', score: 2 },
      { label: 'Hold steady and wait for recovery', score: 3 },
      { label: 'Buy a little more at the lower price', score: 4 },
      { label: 'Buy aggressively — this is a great opportunity', score: 5 },
    ],
  },
  {
    id: 'q3',
    text: 'How long until you will need most of this money?',
    options: [
      { label: 'Less than 1 year', score: 1 },
      { label: '1–3 years', score: 2 },
      { label: '3–5 years', score: 3 },
      { label: '5–10 years', score: 4 },
      { label: 'More than 10 years', score: 5 },
    ],
  },
  {
    id: 'q4',
    text: 'How stable is your primary income?',
    options: [
      { label: 'Very unstable — irregular freelance or business income', score: 1 },
      { label: 'Somewhat unstable — occasional income gaps', score: 2 },
      { label: 'Moderately stable with some variability', score: 3 },
      { label: 'Stable salaried employment', score: 4 },
      { label: 'Very stable with multiple income sources', score: 5 },
    ],
  },
  {
    id: 'q5',
    text: 'What percentage of your monthly income is left after essential expenses?',
    options: [
      { label: 'Less than 5% — barely covering basics', score: 1 },
      { label: '5–15%', score: 2 },
      { label: '15–30%', score: 3 },
      { label: '30–50%', score: 4 },
      { label: 'More than 50% — I save heavily', score: 5 },
    ],
  },
  {
    id: 'q6',
    text: 'How would you describe your investing experience?',
    options: [
      { label: 'None — completely new to investing', score: 1 },
      { label: 'Beginner — I have a savings account or fixed deposits', score: 2 },
      { label: 'Intermediate — I invest in mutual funds or stocks', score: 3 },
      { label: 'Experienced — I actively manage a diversified portfolio', score: 4 },
      { label: 'Expert — I invest across multiple asset classes including derivatives', score: 5 },
    ],
  },
  {
    id: 'q7',
    text: 'How much of your monthly income goes toward loan or debt repayments?',
    options: [
      { label: 'More than 50% — heavily in debt', score: 1 },
      { label: '30–50% of my income', score: 2 },
      { label: '10–30% of my income', score: 3 },
      { label: 'Less than 10% — minimal debt', score: 4 },
      { label: 'Completely debt-free', score: 5 },
    ],
  },
  {
    id: 'q8',
    text: 'Do you have financial dependents (children, parents, spouse)?',
    options: [
      { label: 'Yes — I am the sole earner for 4 or more dependents', score: 1 },
      { label: 'Yes — I support 2–3 dependents', score: 2 },
      { label: 'Yes — I support 1 dependent', score: 3 },
      { label: 'No dependents currently, but planning for some', score: 4 },
      { label: 'No dependents and no plans', score: 5 },
    ],
  },
  {
    id: 'q9',
    text: 'Do you have an emergency fund (3–6 months of expenses)?',
    options: [
      { label: 'No emergency fund at all', score: 1 },
      { label: 'Less than 1 month of expenses saved', score: 2 },
      { label: '1–3 months of expenses saved', score: 3 },
      { label: '3–6 months of expenses saved', score: 4 },
      { label: 'More than 6 months saved — fully cushioned', score: 5 },
    ],
  },
  {
    id: 'q10',
    text: 'Which statement best describes your attitude toward investment losses?',
    options: [
      { label: 'I cannot accept any loss — even 5% would cause serious distress', score: 1 },
      { label: 'I can tolerate up to 10% loss if recovery is expected soon', score: 2 },
      { label: 'I can handle 10–20% loss over a 1–2 year recovery period', score: 3 },
      { label: 'Short-term losses of 20–40% are fine for long-term gains', score: 4 },
      { label: 'I can endure 40%+ drawdowns — I focus purely on long-term returns', score: 5 },
    ],
  },
]
