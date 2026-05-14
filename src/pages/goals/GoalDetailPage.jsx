import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import {
  ArrowLeft, MoreVertical, Pencil, Trash2, TrendingUp,
  Calendar, Wallet, AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import ProgressRing from '@/components/features/goals/ProgressRing'
import { getGoalType } from '@/lib/goals/types'
import {
  goalProgress, classifyHorizon, requiredMonthlyInvestment,
  inflationAdjustedTarget, buildProjectionSeries,
} from '@/lib/goals/calculations'
import { formatCurrency, formatDate } from '@/lib/format'
import { useGoal, useDeleteGoal } from '@/hooks/useGoals'
import { useTrackEvent } from '@/hooks/useTrackEvent'
import { cn } from '@/lib/utils'

// ── Custom Recharts tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-md px-3 py-2 text-sm">
      <p className="font-medium mb-1">Year {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-numeric">
          {entry.name}: {formatCurrency(entry.value, 'INR')}
        </p>
      ))}
    </div>
  )
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

// ── Delete confirmation dialog ───────────────────────────────────────────────
function DeleteDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this goal?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. All projection data for this goal will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', accent ?? 'text-muted-foreground')} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn('font-numeric font-semibold text-lg leading-tight', accent)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GoalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: goal, isLoading, error } = useGoal(id)
  const { mutateAsync: deleteGoal, isPending: deleting } = useDeleteGoal()
  const [showDelete, setShowDelete] = useState(false)
  const track = useTrackEvent()

  if (isLoading) return <DetailSkeleton />

  if (error || !goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <p className="font-semibold">Goal not found</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/app/goals"><ArrowLeft className="h-4 w-4 mr-1.5" />Back to goals</Link>
        </Button>
      </div>
    )
  }

  const type = getGoalType(goal.type)
  const Icon = type.icon
  const progress = goalProgress(goal.current_amount ?? 0, goal.target_amount)
  const horizon = classifyHorizon(goal.time_horizon_years)
  const cagr = goal.expected_cagr ?? 0.10
  const monthly = requiredMonthlyInvestment(
    goal.target_amount,
    goal.time_horizon_years,
    cagr,
    goal.current_amount ?? 0,
  )
  const inflAdj = inflationAdjustedTarget(goal.target_amount, goal.time_horizon_years)
  const chartData = buildProjectionSeries(goal)

  async function handleDelete() {
    try {
      await deleteGoal(goal.id)
      track('goal_deleted', { type: goal.type, name: goal.name })
      toast.success('Goal deleted.')
      navigate('/app/goals', { replace: true })
    } catch {
      toast.error('Could not delete goal. Please try again.')
    }
  }

  const HORIZON_COLOR = { short: 'bg-amber-100 text-amber-700 border-amber-200', medium: 'bg-sky-100 text-sky-700 border-sky-200', long: 'bg-emerald-100 text-emerald-700 border-emerald-200' }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link to="/app/goals"><ArrowLeft className="h-4 w-4" /> Goals</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => toast.info('Goal editing coming in a future update.')}
            >
              <Pencil className="h-4 w-4" /> Edit goal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive gap-2 cursor-pointer"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0', type.bgColor)}>
            <Icon className={cn('h-7 w-7', type.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold truncate">{goal.name}</h1>
              <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', HORIZON_COLOR[horizon])}>
                {horizon}-term
              </span>
              {goal.priority && (
                <Badge variant="outline" className="capitalize text-xs">{goal.priority} priority</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{type.label} · {goal.time_horizon_years} years</p>
          </div>
        </div>

        {/* Progress row */}
        <div className="flex items-center gap-4">
          <ProgressRing progress={progress} size={64} strokeWidth={5} />
          <div>
            <p className="font-numeric text-2xl font-bold">{formatCurrency(goal.target_amount, 'INR')}</p>
            <p className="text-sm text-muted-foreground">
              {goal.current_amount > 0
                ? `${formatCurrency(goal.current_amount, 'INR')} saved · ${Math.round(progress)}% of target`
                : 'No savings logged yet'}
            </p>
          </div>
        </div>

        {goal.target_date && (
          <>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Target date: {formatDate(goal.target_date)}
            </p>
          </>
        )}
      </div>

      {/* Key stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Required monthly SIP"
          value={monthly > 0 ? formatCurrency(monthly, 'INR') : '₹0'}
          sub={`At ${((goal.expected_cagr ?? 0.10) * 100).toFixed(1)}% CAGR`}
          accent="text-trust"
        />
        <StatCard
          icon={AlertTriangle}
          label="Inflation-adj. target"
          value={formatCurrency(inflAdj, 'INR')}
          sub="At 6% annual inflation"
        />
        <StatCard
          icon={Wallet}
          label="Current savings"
          value={formatCurrency(goal.current_amount ?? 0, 'INR')}
          sub={`${Math.round(progress)}% of target`}
          accent={progress >= 100 ? 'text-growth' : undefined}
        />
      </div>

      {/* Projection chart */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h2 className="font-semibold mb-1">Projection</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Projected portfolio value if you invest the required SIP every month.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `Yr ${v}`}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => {
                if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`
                if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`
                if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
                return `₹${v}`
              }}
              width={64}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
            />
            <ReferenceLine
              y={goal.target_amount}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              label={{ value: 'Target', position: 'right', fontSize: 10, fill: 'hsl(var(--destructive))' }}
            />
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#0F2A4A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Assumes {((goal.expected_cagr ?? 0.10) * 100).toFixed(1)}% annual return. This is an educational projection only — actual returns vary.
        </p>
      </div>

      {/* Inflation impact card */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Inflation impact</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          In {goal.time_horizon_years} years, {formatCurrency(goal.target_amount, 'INR')} will feel like{' '}
          <strong>{formatCurrency(inflAdj, 'INR')}</strong> in today&apos;s money (at 6% inflation).
          Consider increasing your target amount.
        </p>
      </div>

      {/* Delete dialog */}
      <DeleteDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
