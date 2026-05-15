import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, Zap, TrendingUp, Target, IndianRupee, Calendar, Sparkles } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useGoals } from '@/hooks/useGoals'
import { requiredMonthlyInvestment, projectedValue, totalProjected } from '@/lib/goals/calculations'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Calculation helpers ────────────────────────────────────────────────────────
function runScenario(goal, adjustments) {
  const cagr = Math.max(0.01, (goal.expected_cagr ?? 0.10) + adjustments.cagrDelta / 100)
  const years = Math.max(1, (goal.time_horizon_years ?? 10) + adjustments.yearsDelta)
  const lumpSum = (goal.current_amount ?? 0) + adjustments.lumpSum
  const baseMonthly = requiredMonthlyInvestment(goal.target_amount, years, cagr, lumpSum)
  const monthly = Math.max(0, baseMonthly + adjustments.sipBoost)
  const corpus = totalProjected(monthly, years, cagr, lumpSum)
  const gap = goal.target_amount - corpus
  return { monthly, corpus, gap, years, cagr }
}

function buildSeries(goal, adjustments, maxYears) {
  const base = runScenario(goal, { cagrDelta: 0, yearsDelta: 0, lumpSum: 0, sipBoost: 0 })
  const scenario = runScenario(goal, adjustments)
  const cagr0 = goal.expected_cagr ?? 0.10
  const baseMonthly = requiredMonthlyInvestment(goal.target_amount, goal.time_horizon_years ?? 10, cagr0, goal.current_amount ?? 0)

  return Array.from({ length: maxYears + 1 }, (_, year) => ({
    year,
    current: Math.round(totalProjected(baseMonthly, year, cagr0, goal.current_amount ?? 0)),
    scenario: Math.round(totalProjected(scenario.monthly, year, scenario.cagr, (goal.current_amount ?? 0) + adjustments.lumpSum)),
    target: Math.round(goal.target_amount),
  }))
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs space-y-1.5">
      <p className="font-semibold text-foreground">Year {label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold font-numeric" style={{ color: p.color }}>{formatCurrency(p.value, 'INR')}</span>
        </div>
      ))}
    </div>
  )
}

// ── Comparison card ───────────────────────────────────────────────────────────
function CompareCard({ label, current, scenario, format = v => formatCurrency(v, 'INR'), higherIsBetter = true }) {
  const diff = scenario - current
  const pct = current !== 0 ? ((diff / Math.abs(current)) * 100).toFixed(1) : null
  const improved = higherIsBetter ? diff > 0 : diff < 0
  const neutral = Math.abs(diff) < 1

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Current plan</p>
          <p className="text-sm font-bold font-numeric text-foreground">{format(current)}</p>
        </div>
        <div className={cn('rounded-lg p-3', neutral ? 'bg-muted/40' : improved ? 'bg-growth/10 border border-growth/30' : 'bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800')}>
          <p className="text-[10px] text-muted-foreground mb-1">New scenario</p>
          <p className={cn('text-sm font-bold font-numeric', neutral ? 'text-foreground' : improved ? 'text-growth' : 'text-rose-600')}>{format(scenario)}</p>
        </div>
      </div>
      {!neutral && pct !== null && (
        <div className={cn('text-xs font-medium flex items-center gap-1', improved ? 'text-growth' : 'text-rose-500')}>
          <span>{improved ? '▲' : '▼'}</span>
          <span>{Math.abs(Number(pct))}% {improved ? 'better' : 'worse'} than current plan</span>
        </div>
      )}
    </div>
  )
}

// ── Slider with label ─────────────────────────────────────────────────────────
function AdjSlider({ label, value, min, max, step, onChange, format, icon: Icon, description }) {
  const neutral = value === 0
  return (
    <div className="space-y-2.5 p-4 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-trust flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <span className={cn(
          'text-base font-bold font-numeric px-2 py-0.5 rounded-lg flex-shrink-0',
          neutral ? 'text-muted-foreground bg-muted/40'
            : value > 0 ? 'text-growth bg-growth/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/30',
        )}>
          {value > 0 ? '+' : ''}{format(value)}
        </span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{format(min)}</span>
        <button className="text-trust hover:underline text-[11px]" onClick={() => onChange(0)}>Reset</button>
        <span>+{format(max)}</span>
      </div>
    </div>
  )
}

// ── Goal type label ───────────────────────────────────────────────────────────
const GOAL_LABELS = {
  retirement: '🏖️ Retirement',
  home: '🏠 Buy Home',
  education: '🎓 Education',
  emergency: '🛡️ Emergency Fund',
  vehicle: '🚗 Vehicle',
  wedding: '💍 Wedding',
  travel: '✈️ Travel',
  business: '💼 Business',
  other: '🎯 Goal',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SimulatorPage() {
  const { data: goals = [], isLoading } = useGoals()
  const [selectedId, setSelectedId] = useState(null)
  const [adj, setAdj] = useState({ sipBoost: 0, cagrDelta: 0, yearsDelta: 0, lumpSum: 0 })

  const goal = useMemo(() => goals.find(g => g.id === selectedId) ?? goals[0] ?? null, [goals, selectedId])

  const baseCAGR = goal?.expected_cagr ?? 0.10
  const baseYears = goal?.time_horizon_years ?? 10
  const baseMonthly = goal
    ? requiredMonthlyInvestment(goal.target_amount, baseYears, baseCAGR, goal.current_amount ?? 0)
    : 0

  const current = useMemo(() => goal ? runScenario(goal, { cagrDelta: 0, yearsDelta: 0, lumpSum: 0, sipBoost: 0 }) : null, [goal])
  const scenario = useMemo(() => goal ? runScenario(goal, adj) : null, [goal, adj])
  const chartData = useMemo(() => {
    if (!goal) return []
    const maxYears = Math.max(baseYears, baseYears + adj.yearsDelta) + 2
    return buildSeries(goal, adj, Math.min(maxYears, 35))
  }, [goal, adj, baseYears])

  const hasChange = adj.sipBoost !== 0 || adj.cagrDelta !== 0 || adj.yearsDelta !== 0 || adj.lumpSum !== 0

  function set(key, val) { setAdj(prev => ({ ...prev, [key]: val })) }

  function resetAll() { setAdj({ sipBoost: 0, cagrDelta: 0, yearsDelta: 0, lumpSum: 0 }) }

  return (
    <>
      <Helmet>
        <title>Scenario Simulator — FinPath</title>
      </Helmet>

      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/app/goals" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Zap className="h-5 w-5 text-trust" /> Scenario Simulator
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">What if you change your SIP, returns, or timeline?</p>
            </div>
          </div>
          {hasChange && (
            <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              Reset all
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-10 text-center space-y-3">
            <Target className="h-8 w-8 mx-auto text-amber-500" />
            <h3 className="font-semibold">No goals yet</h3>
            <p className="text-sm text-muted-foreground">Create at least one financial goal to use the simulator.</p>
            <Link to="/app/goals/new" className="inline-block mt-1 text-sm text-trust font-medium hover:underline">
              Create your first goal →
            </Link>
          </div>
        ) : (
          <>
            {/* Goal selector */}
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">Simulating goal:</p>
              <Select value={selectedId ?? goal?.id} onValueChange={v => { setSelectedId(v); resetAll() }}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {GOAL_LABELS[g.type] ?? '🎯'} {g.name} — {formatCurrency(g.target_amount, 'INR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {goal && (
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left: sliders */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-trust/20 bg-gradient-to-br from-trust/5 to-background p-4 space-y-1">
                    <h3 className="font-semibold text-sm text-trust flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> What-if adjustments
                    </h3>
                    <p className="text-xs text-muted-foreground">Drag sliders and see projections update live for <strong>{goal.name}</strong></p>
                  </div>

                  <AdjSlider
                    label="Monthly SIP boost"
                    icon={IndianRupee}
                    description="Add to your current required SIP"
                    value={adj.sipBoost}
                    min={-Math.round(baseMonthly * 0.5)}
                    max={50000}
                    step={500}
                    onChange={v => set('sipBoost', v)}
                    format={v => `₹${Math.abs(v).toLocaleString('en-IN')}`}
                  />

                  <AdjSlider
                    label="Expected return (CAGR)"
                    icon={TrendingUp}
                    description={`Current: ${(baseCAGR * 100).toFixed(1)}% → New: ${((baseCAGR * 100) + adj.cagrDelta).toFixed(1)}%`}
                    value={adj.cagrDelta}
                    min={-4}
                    max={6}
                    step={0.5}
                    onChange={v => set('cagrDelta', v)}
                    format={v => `${v > 0 ? '+' : ''}${v}%`}
                  />

                  <AdjSlider
                    label="Timeline adjustment"
                    icon={Calendar}
                    description={`Current: ${baseYears}yr → New: ${baseYears + adj.yearsDelta}yr`}
                    value={adj.yearsDelta}
                    min={-5}
                    max={10}
                    step={1}
                    onChange={v => set('yearsDelta', v)}
                    format={v => `${v > 0 ? '+' : ''}${v}yr`}
                  />

                  <AdjSlider
                    label="One-time lump sum"
                    icon={IndianRupee}
                    description="Extra investment added today"
                    value={adj.lumpSum}
                    min={0}
                    max={1000000}
                    step={10000}
                    onChange={v => set('lumpSum', v)}
                    format={v => `₹${(v / 1000).toFixed(0)}K`}
                  />

                  {/* Scenario summary badge */}
                  {hasChange && scenario && (
                    <div className={cn(
                      'rounded-xl border p-4 space-y-2',
                      scenario.gap <= 0 ? 'border-growth/40 bg-growth/5' : 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/20',
                    )}>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        {scenario.gap <= 0 ? <span className="text-growth">✓ Goal achieved!</span> : <span className="text-amber-600">⚠ Gap remaining</span>}
                      </p>
                      <p className={cn('text-lg font-bold font-numeric', scenario.gap <= 0 ? 'text-growth' : 'text-amber-600')}>
                        {scenario.gap <= 0
                          ? `Surplus: ${formatCurrency(Math.abs(scenario.gap), 'INR')}`
                          : `Shortfall: ${formatCurrency(scenario.gap, 'INR')}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Projected corpus: <span className="font-semibold text-foreground">{formatCurrency(scenario.corpus, 'INR')}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: results */}
                <div className="lg:col-span-3 space-y-5">
                  {/* Goal snapshot */}
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{GOAL_LABELS[goal.type] ?? '🎯'} {goal.name}</h3>
                      <Badge variant="outline" className="capitalize text-xs">{goal.type}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Target', value: formatCurrency(goal.target_amount, 'INR') },
                        { label: 'Timeline', value: `${baseYears} years` },
                        { label: 'Required SIP', value: formatCurrency(baseMonthly, 'INR') + '/mo' },
                      ].map(m => (
                        <div key={m.label} className="rounded-lg bg-muted/30 p-2.5">
                          <p className="text-[10px] text-muted-foreground">{m.label}</p>
                          <p className="text-xs font-bold font-numeric mt-0.5 text-trust">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparison cards */}
                  {current && scenario && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <CompareCard
                        label="Monthly SIP required"
                        current={current.monthly}
                        scenario={scenario.monthly}
                        higherIsBetter={false}
                        format={v => `${formatCurrency(v, 'INR')}/mo`}
                      />
                      <CompareCard
                        label={`Projected corpus in ${scenario.years}yr`}
                        current={current.corpus}
                        scenario={scenario.corpus}
                        higherIsBetter={true}
                      />
                      <CompareCard
                        label="Gap from target"
                        current={current.gap}
                        scenario={scenario.gap}
                        higherIsBetter={false}
                        format={v => (v <= 0 ? `+${formatCurrency(Math.abs(v), 'INR')} surplus` : formatCurrency(v, 'INR'))}
                      />
                      <CompareCard
                        label="Expected CAGR"
                        current={current.cagr * 100}
                        scenario={scenario.cagr * 100}
                        higherIsBetter={true}
                        format={v => `${v.toFixed(1)}%`}
                      />
                    </div>
                  )}

                  {/* Projection chart */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-trust" /> Wealth Projection
                      {hasChange && <Badge className="text-[10px] bg-trust text-white px-1.5 py-0 ml-1">Scenario active</Badge>}
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={v => `Yr ${v}`} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : `${(v / 1e5).toFixed(0)}L`} width={45} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={goal.target_amount} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: 'Target', fontSize: 10, fill: '#F59E0B' }} />
                        <Line type="monotone" dataKey="current" name="Current plan" stroke="#94a3b8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="scenario" name="New scenario" stroke="#10B981" strokeWidth={2.5} dot={false} strokeDasharray={hasChange ? undefined : '4 4'} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Dashed amber line = target · Green = scenario · Gray = current plan
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
