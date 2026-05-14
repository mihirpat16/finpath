import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, CreditCard, PieChart, ArrowRight } from 'lucide-react'

const TRACKERS = [
  {
    to: '/app/trackers/net-worth',
    icon: TrendingUp,
    title: 'Net Worth',
    description: 'Track your assets and liabilities over time. See your wealth trend month by month.',
    color: 'text-trust bg-trust/10',
    accent: 'border-trust/20',
  },
  {
    to: '/app/trackers/debt',
    icon: CreditCard,
    title: 'Debt Tracker',
    description: 'Manage loans and credit cards. Compare Avalanche vs Snowball payoff strategies.',
    color: 'text-rose-500 bg-rose-500/10',
    accent: 'border-rose-500/20',
  },
  {
    to: '/app/trackers/portfolio',
    icon: PieChart,
    title: 'Investment Portfolio',
    description: 'Log holdings, monitor returns, and check if your allocation has drifted.',
    color: 'text-growth bg-growth/10',
    accent: 'border-growth/20',
  },
]

export default function TrackersHubPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Trackers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitor every dimension of your financial health.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {TRACKERS.map(({ to, icon: Icon, title, description, color, accent }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Link
              to={to}
              className={`flex flex-col gap-4 rounded-2xl border ${accent} bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Open tracker <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
