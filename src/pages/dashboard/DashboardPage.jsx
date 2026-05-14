import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  TrendingUp, Target, ShieldCheck, PieChart as PieIcon,
  RefreshCw, ArrowRight, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useGoals } from '@/hooks/useGoals'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useNetWorthEntries, useNetWorthSnapshots } from '@/hooks/useNetWorth'
import { useHoldings } from '@/hooks/useHoldings'
import { portfolioReturns, assetClassDrift } from '@/lib/trackers/portfolio'
import { projectedValue, requiredMonthlyInvestment } from '@/lib/goals/calculations'
import { formatCurrency, formatCompact, formatDate } from '@/lib/format'
import ProgressRing from '@/components/features/goals/ProgressRing'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

const ALLOC_COLORS = {
  equity: '#0F2A4A', debt: '#10B981', gold: '#F59E0B',
  alternatives: '#8B5CF6', cash: '#6B7280',
}
const ALLOC_LABELS = {
  equity: 'Equity', debt: 'Debt', gold: 'Gold', alternatives: 'Alt', cash: 'Cash',
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function CardSkeleton({ className = '' }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}><Skeleton className="h-6 w-32 mb-3" /><Skeleton className="h-8 w-48" /></div>
}

// ─── Greeting Row ─────────────────────────────────────────────────────────────
function GreetingRow({ user, riskProfile }) {
  const navigate = useNavigate()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'
  const needsReeval = daysSince(riskProfile?.created_at) > 90

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      {needsReeval && (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 self-start sm:self-auto"
          onClick={() => navigate('/app/risk/quiz')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-evaluate my plan
        </Button>
      )}
    </div>
  )
}

// ─── Net Worth Hero ───────────────────────────────────────────────────────────
function NetWorthHero({ entries, snapshots, loading }) {
  const assets = entries.filter((e) => e.type === 'asset').reduce((s, e) => s + Number(e.value), 0)
  const liabilities = entries.filter((e) => e.type === 'liability').reduce((s, e) => s + Number(e.value), 0)
  const netWorth = assets - liabilities

  const lastMonth = snapshots[snapshots.length - 2]?.net_worth ?? netWorth
  const lastYear = snapshots[0]?.net_worth ?? netWorth
  const deltaMonth = netWorth - lastMonth
  const deltaYear = netWorth - lastYear

  const sparkData = snapshots.slice(-6).map((s) => ({
    m: new Date(s.snapshot_date).toLocaleDateString('en-IN', { month: 'short' }),
    v: s.net_worth,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 col-span-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          {loading
            ? <Skeleton className="h-10 w-48" />
            : <p className="text-4xl font-bold font-numeric tracking-tight">{formatCurrency(netWorth)}</p>
          }
          <div className="flex gap-4 mt-2">
            {[
              { label: 'vs last month', delta: deltaMonth },
              { label: 'vs last year', delta: deltaYear },
            ].map(({ label, delta }) => (
              <span key={label} className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={`font-numeric font-semibold ${delta >= 0 ? 'text-growth' : 'text-rose-500'}`}>
                  {delta >= 0 ? '+' : ''}{formatCompact(delta)}
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {sparkData.length > 1 && (
          <div className="w-full sm:w-64 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length
                      ? <div className="rounded-lg border bg-card px-2 py-1 text-xs shadow">{formatCompact(payload[0].value)}</div>
                      : null
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, iconColor, title, primary, secondary, to, loading, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="col-span-12 sm:col-span-4"
    >
      <Link
        to={to}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
      >
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{title}</p>
          {loading
            ? <Skeleton className="h-6 w-28 mb-1" />
            : <p className="text-xl font-bold font-numeric">{primary}</p>
          }
          {loading
            ? <Skeleton className="h-3 w-20" />
            : <p className="text-xs text-muted-foreground">{secondary}</p>
          }
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Goal Progress Panel ──────────────────────────────────────────────────────
function GoalProgressPanel({ goals, loading }) {
  const top3 = useMemo(() => {
    if (!goals) return []
    return [...goals]
      .filter((g) => g.status === 'active')
      .slice(0, 3)
  }, [goals])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="col-span-12 lg:col-span-8 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Goal Progress</h2>
        <Link to="/app/goals" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          All goals <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading
        ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 mb-3 rounded-xl" />)
        : top3.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">No active goals yet</p>
              <Button asChild size="sm" className="bg-trust hover:bg-trust/90 text-white gap-1.5">
                <Link to="/app/goals/new"><Target className="h-3.5 w-3.5" /> Set a goal</Link>
              </Button>
            </div>
          )
          : top3.map((goal) => {
            const yearsLeft = Math.max(0, (new Date(goal.target_date) - Date.now()) / (1000 * 60 * 60 * 24 * 365))
            const _cagr1 = goal.expected_cagr ?? 0.10
            const _monthly1 = requiredMonthlyInvestment(goal.target_amount, goal.time_horizon_years, _cagr1, goal.current_amount ?? 0)
            const projected = projectedValue(_monthly1, yearsLeft, _cagr1)
            const pct = goal.target_amount > 0 ? Math.min(100, (projected / goal.target_amount) * 100) : 0
            const onTrack = pct >= 95

            return (
              <Link key={goal.id} to={`/app/goals/${goal.id}`}>
                <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded-xl px-2 -mx-2 transition-colors">
                  <div className="relative flex-shrink-0">
                    <ProgressRing progress={pct} size={44} strokeWidth={3} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(goal.target_amount)} by {new Date(goal.target_date).getFullYear()}</p>
                  </div>
                  <Badge variant={onTrack ? 'default' : 'secondary'} className={`text-xs flex-shrink-0 ${onTrack ? 'bg-growth/10 text-growth border-growth/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                    {onTrack ? '✓ On track' : 'Off track'}
                  </Badge>
                </div>
              </Link>
            )
          })
      }
    </motion.div>
  )
}

// ─── Allocation Snapshot ──────────────────────────────────────────────────────
function AllocationSnapshot({ holdings, riskProfile, loading }) {
  const { rows, totalCurrentValue } = useMemo(() => portfolioReturns(holdings), [holdings])
  const targetAllocation = riskProfile?.allocation ?? {}

  const actualDonut = Object.entries(
    rows.reduce((acc, r) => { acc[r.asset_class] = (acc[r.asset_class] ?? 0) + r.currentValue; return acc }, {})
  ).map(([k, v]) => ({ name: ALLOC_LABELS[k] ?? k, value: v, color: ALLOC_COLORS[k] ?? '#999' }))

  const targetDonut = Object.entries(targetAllocation).map(([k, v]) => ({
    name: ALLOC_LABELS[k] ?? k, value: v, color: ALLOC_COLORS[k] ?? '#999',
  }))

  const drifts = assetClassDrift(holdings, targetAllocation)
  const hasDrift = drifts.some((d) => Math.abs(d.drift) > 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="col-span-12 lg:col-span-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">Allocation</h2>
        {hasDrift && (
          <Link to="/app/trackers/portfolio" className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Rebalance
          </Link>
        )}
      </div>

      {loading
        ? <Skeleton className="h-32 rounded-xl" />
        : (
          <div className="flex gap-4 justify-center">
            {[
              { label: 'Actual', data: actualDonut },
              { label: 'Target', data: targetDonut },
            ].map(({ label, data }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={data.length ? data : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]}
                      cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={2}>
                      {(data.length ? data : [{ color: '#e2e8f0' }]).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )
      }

      {targetDonut.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          <Link to="/app/risk" className="underline">Take the risk quiz</Link> to see target allocation
        </p>
      )}

      <div className="mt-3 space-y-1">
        {Object.entries(ALLOC_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: ALLOC_COLORS[key] }} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Performance Chart ─────────────────────────────────────────────────────────
function PerformanceChart({ snapshots, holdings, loading }) {
  const { totalCurrentValue, totalInvested } = useMemo(() => portfolioReturns(holdings), [holdings])

  const chartData = snapshots.map((s) => ({
    month: new Date(s.snapshot_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    netWorth: s.net_worth,
    assets: s.total_assets,
    liabilities: s.total_liabilities,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="col-span-12 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Performance Overview</h2>
        <div className="flex gap-2 text-xs">
          {[
            { key: 'netWorth', label: 'Net Worth', color: '#0F2A4A' },
            { key: 'assets', label: 'Assets', color: '#10B981' },
            { key: 'liabilities', label: 'Liabilities', color: '#f43f5e' },
          ].map(({ key, label, color }) => (
            <span key={key} className="flex items-center gap-1 text-muted-foreground">
              <span className="h-2 w-4 rounded-full inline-block" style={{ background: color }} />{label}
            </span>
          ))}
        </div>
      </div>

      {loading || chartData.length < 2
        ? (
          <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
            {loading ? <Skeleton className="h-48 w-full rounded-xl" /> : 'Not enough data yet — add net worth entries to see the trend.'}
          </div>
        )
        : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip
                formatter={(v, name) => [formatCurrency(v), name]}
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              />
              <Line type="monotone" dataKey="netWorth" stroke="#0F2A4A" strokeWidth={2} dot={false} name="Net Worth" />
              <Line type="monotone" dataKey="assets" stroke="#10B981" strokeWidth={2} dot={false} name="Assets" />
              <Line type="monotone" dataKey="liabilities" stroke="#f43f5e" strokeWidth={2} dot={false} name="Liabilities" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )
      }
    </motion.div>
  )
}

// ─── Insights Feed ────────────────────────────────────────────────────────────
function computeInsights({ goals, riskProfile, holdings, snapshots }) {
  const insights = []

  // Risk reassessment
  if (daysSince(riskProfile?.created_at) > 90) {
    insights.push({
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10',
      title: 'Time to reassess your risk profile',
      body: `Your last assessment was over 90 days ago. Markets and life circumstances change.`,
      cta: 'Retake quiz',
      to: '/app/risk/quiz',
    })
  }

  // Drift
  if (holdings.length && riskProfile?.allocation) {
    const drifts = assetClassDrift(holdings, riskProfile.allocation)
    const worst = drifts.find((d) => Math.abs(d.drift) > 5)
    if (worst) {
      insights.push({
        icon: AlertTriangle,
        color: 'text-amber-500 bg-amber-500/10',
        title: `${worst.assetClass.charAt(0).toUpperCase() + worst.assetClass.slice(1)} allocation drifted ${worst.drift > 0 ? '+' : ''}${worst.drift.toFixed(1)}%`,
        body: `Current: ${worst.currentPct.toFixed(1)}% vs target ${worst.targetPct.toFixed(1)}%. Consider rebalancing.`,
        cta: 'Review portfolio',
        to: '/app/trackers/portfolio',
      })
    }
  }

  // Goal insights
  if (goals?.length) {
    const active = goals.filter((g) => g.status === 'active')
    active.forEach((goal) => {
      const yearsLeft = Math.max(0.1, (new Date(goal.target_date) - Date.now()) / (1000 * 60 * 60 * 24 * 365))
      const _cagr2 = goal.expected_cagr ?? 0.10
      const _monthly2 = requiredMonthlyInvestment(goal.target_amount, goal.time_horizon_years, _cagr2, goal.current_amount ?? 0)
      const projected = projectedValue(_monthly2, yearsLeft, _cagr2)
      const pct = goal.target_amount > 0 ? (projected / goal.target_amount) * 100 : 0
      if (pct > 110) {
        insights.push({
          icon: CheckCircle2,
          color: 'text-growth bg-growth/10',
          title: `"${goal.name}" is ahead of schedule`,
          body: `You're on track to reach ${Math.round(pct)}% of your goal. Consider increasing your target.`,
          cta: 'View goal',
          to: `/app/goals/${goal.id}`,
        })
      }
    })
  }

  // No goals
  if (!goals?.length) {
    insights.push({
      icon: Target,
      color: 'text-trust bg-trust/10',
      title: 'Set your first financial goal',
      body: "Define what you're saving for and FinPath will calculate exactly how much to invest monthly.",
      cta: 'Set a goal',
      to: '/app/goals/new',
    })
  }

  return insights.slice(0, 3)
}

function InsightsFeed({ goals, riskProfile, holdings, snapshots, loading }) {
  const insights = useMemo(
    () => computeInsights({ goals: goals ?? [], riskProfile, holdings: holdings ?? [], snapshots: snapshots ?? [] }),
    [goals, riskProfile, holdings, snapshots]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="col-span-12"
    >
      <h2 className="font-semibold text-sm mb-3">Insights</h2>
      {loading
        ? <div className="grid sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        : (
          <div className="grid sm:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <Link key={i} to={ins.to} className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${ins.color}`}>
                  <ins.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1 leading-snug">{ins.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
                </div>
                <span className="text-xs font-medium text-trust flex items-center gap-1">
                  {ins.cta} <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        )
      }
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const { data: goals, isLoading: goalsLoading } = useGoals()
  const { data: riskProfile, isLoading: riskLoading } = useRiskProfile()
  const { data: entries = [], isLoading: nwLoading } = useNetWorthEntries()
  const { data: snapshots = [] } = useNetWorthSnapshots()
  const { data: holdings = [], isLoading: holdingsLoading } = useHoldings()

  const loading = goalsLoading || riskLoading || nwLoading || holdingsLoading

  const assets = entries.filter((e) => e.type === 'asset').reduce((s, e) => s + Number(e.value), 0)
  const liabilities = entries.filter((e) => e.type === 'liability').reduce((s, e) => s + Number(e.value), 0)

  const { totalCurrentValue, returnPct } = useMemo(() => portfolioReturns(holdings), [holdings])
  const activeGoals = goals?.filter((g) => g.status === 'active') ?? []
  const onTrackCount = activeGoals.filter((goal) => {
    const yearsLeft = Math.max(0.1, (new Date(goal.target_date) - Date.now()) / (1000 * 60 * 60 * 24 * 365))
    const _cagr3 = goal.expected_cagr ?? 0.10
    const _monthly3 = requiredMonthlyInvestment(goal.target_amount, goal.time_horizon_years, _cagr3, goal.current_amount ?? 0)
    const projected = projectedValue(_monthly3, yearsLeft, _cagr3)
    return goal.target_amount > 0 && (projected / goal.target_amount) >= 0.95
  }).length

  return (
    <>
      <Helmet>
        <title>Dashboard — FinPath</title>
        <meta name="description" content="Your FinPath financial dashboard — net worth, goals, and investment overview." />
      </Helmet>

      <div className="grid grid-cols-12 gap-4 sm:gap-5">
        {/* Row 1: Greeting */}
        <div className="col-span-12">
          <GreetingRow user={user} riskProfile={riskProfile} />
        </div>

        {/* Row 2: Net Worth Hero */}
        <NetWorthHero entries={entries} snapshots={snapshots} loading={nwLoading} />

        {/* Row 3: KPI Cards */}
        <KPICard
          icon={TrendingUp}
          iconColor="text-trust bg-trust/10"
          title="Portfolio Value"
          primary={loading ? '—' : formatCurrency(totalCurrentValue)}
          secondary={loading ? '' : `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}% return`}
          to="/app/trackers/portfolio"
          loading={loading}
          delay={0.05}
        />
        <KPICard
          icon={Target}
          iconColor="text-growth bg-growth/10"
          title="Active Goals"
          primary={loading ? '—' : `${activeGoals.length} goal${activeGoals.length !== 1 ? 's' : ''}`}
          secondary={loading ? '' : activeGoals.length ? `${onTrackCount} of ${activeGoals.length} on track` : 'No goals yet'}
          to="/app/goals"
          loading={loading}
          delay={0.1}
        />
        <KPICard
          icon={ShieldCheck}
          iconColor="text-amber-500 bg-amber-500/10"
          title="Risk Profile"
          primary={loading ? '—' : riskProfile ? (riskProfile.profile_key?.charAt(0).toUpperCase() + riskProfile.profile_key?.slice(1)) : 'Not assessed'}
          secondary={loading ? '' : riskProfile ? `Assessed ${formatDate(riskProfile.created_at)}` : 'Take the quiz'}
          to="/app/risk"
          loading={loading}
          delay={0.15}
        />

        {/* Row 4: Goals + Allocation */}
        <GoalProgressPanel goals={goals} loading={goalsLoading} />
        <AllocationSnapshot holdings={holdings} riskProfile={riskProfile} loading={loading} />

        {/* Row 5: Performance Chart */}
        <PerformanceChart snapshots={snapshots} holdings={holdings} loading={nwLoading} />

        {/* Row 6: Insights */}
        <InsightsFeed goals={goals} riskProfile={riskProfile} holdings={holdings} snapshots={snapshots} loading={loading} />
      </div>
    </>
  )
}
