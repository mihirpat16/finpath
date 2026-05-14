import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight, RotateCcw, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useQuizStore } from '@/stores/quizStore'
import { RISK_PROFILES } from '@/lib/risk/scoring'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Clock, text: '10 questions · takes about 3 minutes' },
  { icon: ShieldCheck, text: 'Personalised risk bucket and allocation' },
  { icon: CheckCircle2, text: 'Powered by your financial situation, not just preferences' },
]

function ProfileSummaryCard({ profile }) {
  const rp = RISK_PROFILES[profile.profile_key]
  if (!rp) return null

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-trust/10 flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-trust" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your current risk profile</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-bold text-lg">{rp.label}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                rp.tagColor,
              )}
            >
              {rp.cagrRange} target
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {rp.description}
      </p>

      <div className="flex gap-2 pt-1">
        <Button asChild className="flex-1 bg-trust hover:bg-trust/90 text-white">
          <Link to="/app/risk/results">View full results</Link>
        </Button>
        <Button asChild variant="outline" className="gap-1.5">
          <Link to="/app/risk/quiz">
            <RotateCcw className="h-3.5 w-3.5" />
            Retake
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function RiskQuizPage() {
  const navigate = useNavigate()
  const reset = useQuizStore((s) => s.reset)
  const { data: profile, isLoading } = useRiskProfile()

  function handleStart() {
    reset()
    navigate('/app/risk/quiz')
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Risk Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Understand your risk tolerance and get a personalised investment strategy.
        </p>
      </div>

      {/* If profile already exists, show summary */}
      {profile && <ProfileSummaryCard profile={profile} />}

      {/* Start / retake card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-trust/10 mb-4">
          <ShieldCheck className="h-6 w-6 text-trust" />
        </div>

        <h2 className="font-semibold text-lg mb-1">
          {profile ? 'Retake the quiz' : 'Take the Risk Quiz'}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {profile
            ? 'Your financial situation may have changed. Retaking the quiz updates your profile and recommendations.'
            : 'Answer 10 questions about your finances and goals. We\'ll determine your risk tolerance and suggest an optimal asset allocation.'}
        </p>

        <ul className="space-y-2.5 mb-6">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 text-trust flex-shrink-0" />
              {text}
            </li>
          ))}
        </ul>

        <Button
          className="w-full bg-trust hover:bg-trust/90 text-white gap-2"
          onClick={handleStart}
        >
          {profile ? 'Retake Quiz' : 'Start Quiz'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        This quiz is for educational purposes only and does not constitute financial advice.
      </p>
    </div>
  )
}
