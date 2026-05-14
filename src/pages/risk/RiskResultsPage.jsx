import { Link, useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  ShieldCheck, TrendingDown, Activity, Target,
  ArrowLeft, RotateCcw, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useQuizStore } from '@/stores/quizStore'
import { RISK_PROFILES } from '@/lib/risk/scoring'
import { allocationToSlices } from '@/lib/risk/allocation'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'

// ── Donut chart tooltip ──────────────────────────────────────────────────────
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-md px-3 py-2 text-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p className="font-numeric text-trust">{payload[0].value}%</p>
    </div>
  )
}

// ── Metric tile ──────────────────────────────────────────────────────────────
function MetricTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
      <p className="font-numeric font-bold text-lg leading-tight">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function ResultsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RiskResultsPage() {
  const navigate = useNavigate()
  const reset = useQuizStore((s) => s.reset)
  const { data: profile, isLoading, error } = useRiskProfile()

  if (isLoading) return <ResultsSkeleton />

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <p className="font-semibold mb-1">No risk profile found</p>
        <p className="text-sm text-muted-foreground mb-4">
          Take the quiz to generate your personalised risk profile.
        </p>
        <Button asChild className="bg-trust hover:bg-trust/90 text-white">
          <Link to="/app/risk">Take the Quiz</Link>
        </Button>
      </div>
    )
  }

  const rp = RISK_PROFILES[profile.profile_key] ?? RISK_PROFILES.moderate
  const slices = allocationToSlices(profile.allocation ?? {})

  function handleRetake() {
    reset()
    navigate('/app/risk/quiz')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back nav */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link to="/app/risk"><ArrowLeft className="h-4 w-4" /> Risk Profile</Link>
      </Button>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-trust/10">
            <ShieldCheck className="h-7 w-7 text-trust" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{rp.label}</h1>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  rp.tagColor,
                )}
              >
                {rp.volatility} volatility
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Score: <span className="font-medium font-numeric text-foreground">{profile.total_score}</span>
              {' · '}
              Assessed {formatDate(profile.created_at)}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <p className="text-sm text-muted-foreground leading-relaxed">{rp.description}</p>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-3 gap-3">
        <MetricTile
          icon={TrendingDown}
          label="Max Drawdown"
          value={rp.maxDrawdown}
          sub="Historical worst"
        />
        <MetricTile
          icon={Activity}
          label="Target CAGR"
          value={rp.cagrRange}
          sub="Annual return"
        />
        <MetricTile
          icon={Target}
          label="Volatility"
          value={rp.volatility}
          sub="Risk level"
        />
      </div>

      {/* Allocation donut */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h2 className="font-semibold mb-1">Recommended Allocation</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Suggested portfolio split based on your risk profile and age.
        </p>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={240} className="md:max-w-[240px]">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={108}
                paddingAngle={3}
                dataKey="value"
              >
                {slices.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <ul className="space-y-3 flex-1">
            {slices.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm">{s.name}</span>
                </div>
                <span className="font-numeric font-semibold text-sm">{s.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Strategy sections */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
        <h2 className="font-semibold">Your Investment Strategy</h2>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Recommended approach
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{rp.strategy}</p>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Best suited for
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{rp.suitableFor}</p>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Key considerations
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Review your risk profile annually or whenever your financial situation changes significantly —
            such as a new job, major expense, or life event. Your risk tolerance naturally evolves over time.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong className="text-amber-800 dark:text-amber-300">Disclaimer:</strong>{' '}
          This risk profile is generated for educational purposes only. It does not constitute
          financial advice. Consult a SEBI-registered financial advisor before making investment decisions.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 pb-4">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={handleRetake}
        >
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>
        <Button asChild className="flex-1 bg-trust hover:bg-trust/90 text-white">
          <Link to="/app/goals">View My Goals</Link>
        </Button>
      </div>
    </div>
  )
}
