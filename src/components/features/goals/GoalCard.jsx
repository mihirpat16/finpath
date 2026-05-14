import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import ProgressRing from './ProgressRing'
import { getGoalType } from '@/lib/goals/types'
import { goalProgress, classifyHorizon } from '@/lib/goals/calculations'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const PRIORITY_DOT = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
}

const HORIZON_BADGE = {
  short: { label: 'Short-term', variant: 'secondary' },
  medium: { label: 'Medium-term', variant: 'secondary' },
  long: { label: 'Long-term', variant: 'secondary' },
}

const HORIZON_COLOR = {
  short: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
  medium: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900',
  long: 'text-growth bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900',
}

export default function GoalCard({ goal }) {
  const type = getGoalType(goal.type)
  const Icon = type.icon
  const progress = goalProgress(goal.current_amount ?? 0, goal.target_amount)
  const horizon = classifyHorizon(goal.time_horizon_years)

  return (
    <Link
      to={`/app/goals/${goal.id}`}
      className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-trust/30 transition-all duration-200 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0', type.bgColor)}>
            <Icon className={cn('h-5 w-5', type.iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate group-hover:text-trust transition-colors">
              {goal.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{type.label}</p>
          </div>
        </div>

        {/* Priority dot */}
        {goal.priority && (
          <div
            className={cn('h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0', PRIORITY_DOT[goal.priority])}
            title={`${goal.priority} priority`}
          />
        )}
      </div>

      {/* Progress row */}
      <div className="flex items-center gap-3">
        <ProgressRing progress={progress} size={48} strokeWidth={4} />
        <div className="min-w-0 flex-1">
          <p className="font-numeric text-lg font-semibold leading-tight">
            {formatCurrency(goal.target_amount, goal.currency ?? 'INR')}
          </p>
          <p className="text-xs text-muted-foreground">
            {progress > 0
              ? `${Math.round(progress)}% saved`
              : 'Not started'}
          </p>
        </div>
      </div>

      {/* Footer badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          HORIZON_COLOR[horizon],
        )}>
          {HORIZON_BADGE[horizon].label}
        </span>
        <Badge variant="outline" className="text-xs">
          {goal.time_horizon_years}yr
        </Badge>
      </div>
    </Link>
  )
}
