import { Link } from 'react-router-dom'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import GoalCard from '@/components/features/goals/GoalCard'
import { useGoals } from '@/hooks/useGoals'

function GoalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-trust/10 mb-5">
        <Target className="h-10 w-10 text-trust/60" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Set your first financial goal and FinPath will show you exactly how much to invest each month.
      </p>
      <Button asChild className="bg-trust hover:bg-trust/90 text-white gap-2">
        <Link to="/app/goals/new">
          <Plus className="h-4 w-4" /> Create your first goal
        </Link>
      </Button>
    </div>
  )
}

export default function GoalsListPage() {
  const { data: goals, isLoading, error } = useGoals()

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goals?.length
              ? `${goals.length} goal${goals.length !== 1 ? 's' : ''} in progress`
              : 'Define what you\'re saving for'}
          </p>
        </div>
        <Button asChild size="sm" className="bg-trust hover:bg-trust/90 text-white gap-2">
          <Link to="/app/goals/new">
            <Plus className="h-4 w-4" /> New Goal
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6">
          Failed to load goals. Please refresh the page.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <GoalCardSkeleton key={i} />)
          : goals?.length
            ? goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            : <EmptyState />
        }
      </div>
    </div>
  )
}
