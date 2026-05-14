import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Shield, Gem, Building2, Wallet, ChevronDown, ChevronRight,
  AlertTriangle, Info, Save, CheckCircle2, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useGoals } from '@/hooks/useGoals'
import { useSavePortfolio } from '@/hooks/usePortfolio'
import { buildPortfolio } from '@/lib/recommendations/engine'
import { RISK_PROFILES } from '@/lib/risk/scoring'
import { allocationToSlices } from '@/lib/risk/allocation'
import { requiredMonthlyInvestment, projectedValue } from '@/lib/goals/calculations'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Asset class metadata ─────────────────────────────────────────────────────
const CLASS_META = {
  equity:       { label: 'Equity',       icon: TrendingUp, color: '#0F2A4A', bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-200 dark:border-blue-900'   },
  debt:         { label: 'Debt',         icon: Shield,     color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900' },
  gold:         { label: 'Gold',         icon: Gem,        color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-200 dark:border-amber-900'  },
  alternatives: { label: 'Alternatives', icon: Building2,  color: '#8B5CF6', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-900' },
  cash:         { label: 'Cash',         icon: Wallet,     color: '#94A3B8', bg: 'bg-slate-50 dark:bg-slate-900',     border: 'border-slate-200 dark:border-slate-700'  },
}

const CLASS_ORDER = ['equity', 'debt', 'gold', 'alternatives', 'cash']

// ── Donut tooltip ────────────────────────────────────────────────────────────
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-md px-3 py-2 text-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p className="font-numeric text-trust">{payload[0].value}%</p>
    </div>
  )
}

// ── Risk rating dots ─────────────────────────────────────────────────────────
function RiskDots({ rating }) {
  return (
    <div className="flex items-center gap-0.5" title={`Risk ${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 w-2 rounded-full',
            i < rating ? 'bg-trust' : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}

// ── Instrument card ──────────────────────────────────────────────────────────
function InstrumentCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const { instrument, allocation_pct, suggested_monthly_amount } = item
  const meta = CLASS_META[item.asset_class] ?? CLASS_META.cash

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Main row */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-snug">{instrument.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-muted">
                {instrument.ticker}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                {instrument.sub_class?.replace('-', ' ')}
              </Badge>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-numeric font-bold text-sm">{allocation_pct}%</p>
            <p className="text-xs text-muted-foreground font-numeric">{formatCurrency(suggested_monthly_amount, 'INR')}/mo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskDots rating={instrument.risk_rating} />
          <span className="text-xs text-muted-foreground">Risk {instrument.risk_rating}/5</span>
        </div>
      </div>

      <Separator />

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border text-center py-2.5">
        <div className="px-2">
          <p className="text-[10px] text-muted-foreground">Exp. Ratio</p>
          <p className="font-numeric text-xs font-semibold mt-0.5">
            {(instrument.expense_ratio * 100).toFixed(2)}%
          </p>
        </div>
        <div className="px-2">
          <p className="text-[10px] text-muted-foreground">3yr CAGR</p>
          <p className="font-numeric text-xs font-semibold mt-0.5 text-growth">
            {instrument.three_year_cagr
              ? `${(instrument.three_year_cagr * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div className="px-2">
          <p className="text-[10px] text-muted-foreground">5yr CAGR</p>
          <p className="font-numeric text-xs font-semibold mt-0.5 text-growth">
            {instrument.five_year_cagr
              ? `${(instrument.five_year_cagr * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>

      <Separator />

      {/* Expandable "why" */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="font-medium">Why this fund?</span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{item.rationale}</p>
        </div>
      )}
    </div>
  )
}

// ── Asset class section (collapsible) ────────────────────────────────────────
function AssetClassSection({ cls, items, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = CLASS_META[cls] ?? CLASS_META.cash
  const Icon = meta.icon
  const totalAlloc = items.reduce((s, i) => s + i.allocation_pct, 0)
  const totalMonthly = items.reduce((s, i) => s + i.suggested_monthly_amount, 0)

  return (
    <div className={cn('rounded-2xl border overflow-hidden', meta.border)}>
      {/* Section header */}
      <button
        type="button"
        className={cn('w-full flex items-center justify-between p-4 text-left', meta.bg)}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${meta.color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: meta.color }} />
          </div>
          <div>
            <p className="font-semibold text-sm">{meta.label}</p>
            <p className="text-xs text-muted-foreground">
              {items.length} instrument{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-numeric font-bold text-sm">{totalAlloc.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground font-numeric">{formatCurrency(totalMonthly, 'INR')}/mo</p>
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Instrument cards */}
      {open && (
        <div className="p-4 grid gap-3 sm:grid-cols-2 bg-card">
          {items.map((item) => (
            <InstrumentCard key={item.instrument.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Worked example table ─────────────────────────────────────────────────────
function WorkedExample({ portfolio, totalMonthly }) {
  const base = totalMonthly > 0 ? totalMonthly : 10000

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <h2 className="font-semibold mb-1">Portfolio Growth Projection</h2>
      <p className="text-xs text-muted-foreground mb-5">
        Based on {formatCurrency(base, 'INR')}/month invested. Assumes each fund maintains its historical CAGR.
      </p>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs min-w-[540px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-2 pl-2 font-medium text-muted-foreground">Instrument</th>
              <th className="text-right pb-2 font-medium text-muted-foreground">Monthly</th>
              <th className="text-right pb-2 font-medium text-muted-foreground">After 1yr</th>
              <th className="text-right pb-2 font-medium text-muted-foreground">After 5yr</th>
              <th className="text-right pb-2 pr-2 font-medium text-muted-foreground">After 10yr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {portfolio.map((item) => {
              const cagr = item.instrument.five_year_cagr ?? item.instrument.three_year_cagr ?? 0.07
              const monthly = item.suggested_monthly_amount
              return (
                <tr key={item.instrument.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pl-2">
                    <p className="font-medium truncate max-w-[180px]">{item.instrument.name}</p>
                    <p className="text-muted-foreground capitalize">{item.asset_class}</p>
                  </td>
                  <td className="text-right py-2.5 font-numeric">{formatCurrency(monthly, 'INR')}</td>
                  <td className="text-right py-2.5 font-numeric text-foreground">
                    {formatCurrency(projectedValue(monthly, 1, cagr), 'INR')}
                  </td>
                  <td className="text-right py-2.5 font-numeric text-growth">
                    {formatCurrency(projectedValue(monthly, 5, cagr), 'INR')}
                  </td>
                  <td className="text-right py-2.5 pr-2 font-numeric text-growth font-semibold">
                    {formatCurrency(projectedValue(monthly, 10, cagr), 'INR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td className="pt-2.5 pl-2 text-xs">Total</td>
              <td className="text-right pt-2.5 font-numeric text-xs">{formatCurrency(base, 'INR')}</td>
              <td className="text-right pt-2.5 font-numeric text-xs">
                {formatCurrency(
                  portfolio.reduce((s, i) => s + projectedValue(i.suggested_monthly_amount, 1, i.instrument.five_year_cagr ?? i.instrument.three_year_cagr ?? 0.07), 0),
                  'INR',
                )}
              </td>
              <td className="text-right pt-2.5 font-numeric text-xs text-growth">
                {formatCurrency(
                  portfolio.reduce((s, i) => s + projectedValue(i.suggested_monthly_amount, 5, i.instrument.five_year_cagr ?? i.instrument.three_year_cagr ?? 0.07), 0),
                  'INR',
                )}
              </td>
              <td className="text-right pt-2.5 pr-2 font-numeric text-xs text-growth">
                {formatCurrency(
                  portfolio.reduce((s, i) => s + projectedValue(i.suggested_monthly_amount, 10, i.instrument.five_year_cagr ?? i.instrument.three_year_cagr ?? 0.07), 0),
                  'INR',
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Projections use each fund's historical CAGR. Actual returns will vary. Past performance is not indicative of future results.
      </p>
    </div>
  )
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}

// ── No profile placeholder ────────────────────────────────────────────────────
function NoProfileCard() {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-trust/10 mb-4">
        <ShieldCheck className="h-7 w-7 text-trust" />
      </div>
      <h2 className="font-semibold text-lg mb-2">Complete your Risk Profile first</h2>
      <p className="text-sm text-muted-foreground mb-6">
        We use your risk quiz results to generate a personalised investment strategy. Take the 10-question quiz — it only takes 3 minutes.
      </p>
      <Button asChild className="bg-trust hover:bg-trust/90 text-white">
        <Link to="/app/risk">Take the Risk Quiz</Link>
      </Button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const [saved, setSaved] = useState(false)
  const { data: profile, isLoading: profileLoading } = useRiskProfile()
  const { data: goals, isLoading: goalsLoading } = useGoals()
  const { mutateAsync: savePortfolio, isPending: saving } = useSavePortfolio()

  const isLoading = profileLoading || goalsLoading

  const totalMonthly = useMemo(() => {
    if (!goals?.length) return 0
    return goals.reduce(
      (sum, g) =>
        sum + requiredMonthlyInvestment(g.target_amount, g.time_horizon_years, g.expected_cagr, g.current_amount ?? 0),
      0,
    )
  }, [goals])

  const portfolio = useMemo(() => {
    if (!profile?.profile_key || !profile?.allocation) return []
    return buildPortfolio({
      allocation: profile.allocation,
      riskBucket: profile.profile_key,
      monthlyCapacity: totalMonthly > 0 ? totalMonthly : 10000,
    })
  }, [profile, totalMonthly])

  const grouped = useMemo(() => {
    return CLASS_ORDER.reduce((acc, cls) => {
      const items = portfolio.filter((i) => i.asset_class === cls)
      if (items.length) acc[cls] = items
      return acc
    }, {})
  }, [portfolio])

  const donutSlices = useMemo(() => {
    if (!profile?.allocation) return []
    return allocationToSlices(profile.allocation)
  }, [profile])

  const rp = profile ? RISK_PROFILES[profile.profile_key] : null
  const activeGoalCount = goals?.length ?? 0

  async function handleSave() {
    if (!portfolio.length) return
    const monthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    try {
      await savePortfolio({
        name: `My Portfolio — ${monthName}`,
        items: portfolio.map((item) => ({
          instrument_id: item.instrument.id,
          asset_class: item.asset_class,
          allocation_pct: item.allocation_pct,
          monthly_amount: item.suggested_monthly_amount,
        })),
      })
      setSaved(true)
      toast.success('Portfolio saved!')
    } catch {
      toast.error('Could not save portfolio. Please try again.')
    }
  }

  if (isLoading) return <PageSkeleton />
  if (!profile) return <NoProfileCard />

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Personalised Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Based on your{' '}
          <span className={cn('font-medium', rp ? 'text-foreground' : '')}>
            {rp?.label ?? '—'} risk profile
          </span>{' '}
          and{' '}
          <span className="font-medium text-foreground">{activeGoalCount}</span>{' '}
          active {activeGoalCount === 1 ? 'goal' : 'goals'}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong className="text-amber-800 dark:text-amber-300">Educational use only.</strong>{' '}
          These suggestions are based on historical data and your risk profile. They are not personalised financial
          advice. Consult a SEBI-registered investment advisor before making investment decisions.
        </p>
      </div>

      {/* Allocation summary */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h2 className="font-semibold mb-4">Allocation Overview</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut */}
          <div className="flex-shrink-0">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={donutSlices}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutSlices.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <p className="text-xs text-muted-foreground">Total monthly investment required</p>
              <p className="font-numeric text-2xl font-bold mt-0.5">
                {formatCurrency(totalMonthly > 0 ? totalMonthly : 10000, 'INR')}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              {totalMonthly === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No goals added yet — showing example with ₹10,000/month.{' '}
                  <Link to="/app/goals/new" className="underline hover:text-foreground">Add a goal</Link>
                </p>
              )}
            </div>

            <Separator />

            <ul className="space-y-1.5">
              {donutSlices.map((s) => (
                <li key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-numeric font-semibold">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Instrument sections grouped by asset class */}
      {Object.entries(grouped).map(([cls, items]) => (
        <AssetClassSection key={cls} cls={cls} items={items} />
      ))}

      {/* Worked example table */}
      {portfolio.length > 0 && (
        <WorkedExample portfolio={portfolio} totalMonthly={totalMonthly} />
      )}

      {/* Save CTA card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-trust/10 flex-shrink-0">
            <Info className="h-5 w-5 text-trust" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Save this portfolio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Saving records your current recommendations so you can track changes over time.
              You can retake the risk quiz anytime to generate an updated portfolio.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button
                className={cn(
                  'gap-2',
                  saved ? 'bg-growth hover:bg-growth/90' : 'bg-trust hover:bg-trust/90',
                  'text-white',
                )}
                onClick={handleSave}
                disabled={saving || saved || !portfolio.length}
              >
                {saved ? (
                  <><CheckCircle2 className="h-4 w-4" />Portfolio Saved</>
                ) : saving ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</>
                ) : (
                  <><Save className="h-4 w-4" />Save this portfolio</>
                )}
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/risk">Update risk profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
