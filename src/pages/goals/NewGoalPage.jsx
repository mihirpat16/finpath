import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Pencil, ShieldCheck, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { GOAL_TYPES, getGoalType } from '@/lib/goals/types'
import { requiredMonthlyInvestment, inflationAdjustedTarget } from '@/lib/goals/calculations'
import { buildPortfolio, weightedPortfolioReturn } from '@/lib/recommendations/engine'
import { useCreateGoal } from '@/hooks/useGoals'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useTrackEvent } from '@/hooks/useTrackEvent'

// ── Slide animation ──────────────────────────────────────────────────────────
const slide = {
  enter: (d) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: (d) => ({ x: d > 0 ? -48 : 48, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }),
}

// ── Derive weighted CAGR from risk profile ───────────────────────────────────
// Uses the allocation already saved in the risk profile row (includes age/short-term adjustments)
function deriveRiskCagr(riskProfile) {
  if (!riskProfile?.profile_key || !riskProfile?.allocation) return null
  const positions = buildPortfolio({
    allocation: riskProfile.allocation,
    riskBucket: riskProfile.profile_key,
  })
  return weightedPortfolioReturn(positions)
}

const PROFILE_COLORS = {
  conservative: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  moderate: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  growth: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
  aggressive: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
}

// ── Risk Profile Gate — shown when no quiz taken yet ────────────────────────
function RiskProfileGate() {
  const navigate = useNavigate()
  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold mb-2">Complete your risk quiz first</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          FinPath uses your risk profile to determine a realistic expected return rate
          for your goals. The 10-question quiz takes under 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-trust hover:bg-trust/90 text-white gap-2"
            onClick={() => navigate('/app/risk/quiz')}
          >
            <ShieldCheck className="h-4 w-4" /> Take the risk quiz
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/goals">Back to goals</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Risk Profile Badge — shown in review ─────────────────────────────────────
function RiskBadge({ riskProfile, cagr }) {
  if (!riskProfile) return null
  const key = riskProfile.profile_key
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  const colorClass = PROFILE_COLORS[key] ?? 'text-muted-foreground bg-muted border-border'

  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${colorClass}`}>
      <ShieldCheck className="h-4 w-4 flex-shrink-0" />
      <div className="text-sm">
        <span className="font-semibold">{label} risk profile</span>
        <span className="text-muted-foreground"> · </span>
        <span>{(cagr * 100).toFixed(1)}% weighted return from your recommended portfolio</span>
      </div>
    </div>
  )
}

// ── Thousands-formatted currency input ──────────────────────────────────────
function AmountInput({ value, onChange, placeholder, id, ariaDescribedBy }) {
  const [display, setDisplay] = useState(value ? Number(value).toLocaleString('en-IN') : '')

  function handleChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    const num = digits ? parseInt(digits, 10) : 0
    setDisplay(num ? num.toLocaleString('en-IN') : '')
    onChange(num)
  }

  useEffect(() => {
    setDisplay(value ? Number(value).toLocaleString('en-IN') : '')
  }, [value])

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">₹</span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-8"
        aria-describedby={ariaDescribedBy}
      />
    </div>
  )
}

// ── Priority segmented control ──────────────────────────────────────────────
const PRIORITIES = [
  { value: 'low', label: 'Low', activeClass: 'bg-slate-600 text-white' },
  { value: 'medium', label: 'Medium', activeClass: 'bg-amber-500 text-white' },
  { value: 'high', label: 'High', activeClass: 'bg-rose-500 text-white' },
]

function PriorityPicker({ value, onChange }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Priority">
      {PRIORITIES.map(({ value: v, label, activeClass }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 py-2 text-sm font-medium transition-colors',
            value === v ? activeClass : 'bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Step 1: Goal type grid ───────────────────────────────────────────────────
function TypeStep({ selected, onSelect, onNext }) {
  const firstRef = useRef(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-1">What are you saving for?</h2>
      <p className="text-sm text-muted-foreground mb-6">Choose the goal that best describes your objective.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {GOAL_TYPES.map(({ value, label, icon: Icon, iconColor, bgColor }, idx) => {
          const isSelected = selected === value
          return (
            <button
              key={value}
              type="button"
              ref={idx === 0 ? firstRef : undefined}
              onClick={() => onSelect(value)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust focus-visible:ring-offset-2',
                isSelected
                  ? 'border-trust bg-trust/5 shadow-sm'
                  : 'border-border bg-card hover:border-trust/40 hover:bg-muted/30',
              )}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-growth">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </span>
              )}
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bgColor)}>
                <Icon className={cn('h-5 w-5', iconColor)} />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </button>
          )
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!selected}
        className="w-full bg-trust hover:bg-trust/90 text-white gap-2"
        size="lg"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Zod schema for step 2 ────────────────────────────────────────────────────
const detailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name too long'),
  targetAmount: z.number({ invalid_type_error: 'Enter a target amount' }).min(1000, 'Minimum ₹1,000'),
  timeHorizon: z.number().int().min(1, 'Minimum 1 year').max(40, 'Maximum 40 years'),
  currentSavings: z.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']),
})

// ── Step 2: Goal details ─────────────────────────────────────────────────────
function DetailsStep({ defaultName, onNext, onBack }) {
  const firstRef = useRef(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: defaultName, targetAmount: 0, timeHorizon: 5, currentSavings: 0, priority: 'medium' },
  })

  const horizon = watch('timeHorizon')

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <h2 className="text-xl font-bold tracking-tight mb-1">Goal details</h2>
      <p className="text-sm text-muted-foreground mb-6">Tell us more about this goal so we can calculate your plan.</p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Goal name</Label>
          <Input
            id="name"
            placeholder={defaultName}
            {...register('name')}
            ref={(el) => { register('name').ref(el); firstRef.current = el }}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="text-xs text-destructive" role="alert">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="targetAmount">Target amount</Label>
          <Controller
            name="targetAmount"
            control={control}
            render={({ field }) => (
              <AmountInput
                id="targetAmount"
                value={field.value}
                onChange={field.onChange}
                placeholder="50,00,000"
                ariaDescribedBy={errors.targetAmount ? 'target-error' : undefined}
              />
            )}
          />
          {errors.targetAmount && <p id="target-error" className="text-xs text-destructive" role="alert">{errors.targetAmount.message}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Time horizon</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={40}
                className="w-16 h-8 text-sm text-center px-2"
                value={horizon}
                onChange={(e) => {
                  const v = Math.min(40, Math.max(1, parseInt(e.target.value) || 1))
                  setValue('timeHorizon', v)
                }}
              />
              <span className="text-sm text-muted-foreground">yr</span>
            </div>
          </div>
          <Controller
            name="timeHorizon"
            control={control}
            render={({ field }) => (
              <Slider
                min={1} max={40} step={1}
                value={[field.value]}
                onValueChange={([v]) => field.onChange(v)}
                className="py-1"
              />
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 yr</span><span>40 yr</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentSavings">
            Current savings towards this goal{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Controller
            name="currentSavings"
            control={control}
            render={({ field }) => (
              <AmountInput id="currentSavings" value={field.value} onChange={field.onChange} placeholder="0" />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => <PriorityPicker value={field.value} onChange={field.onChange} />}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button type="button" variant="outline" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button type="submit" className="flex-1 bg-trust hover:bg-trust/90 text-white gap-2">
          Review goal <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

// ── Step 3: Review + save ────────────────────────────────────────────────────
function ReviewStep({ goalType, formData, riskProfile, riskCagr, onBack, onSave, saving }) {
  const btnRef = useRef(null)
  useEffect(() => { btnRef.current?.focus() }, [])

  const type = getGoalType(goalType)
  const Icon = type.icon

  const monthly = requiredMonthlyInvestment(
    formData.targetAmount,
    formData.timeHorizon,
    riskCagr,
    formData.currentSavings,
  )
  const inflAdj = inflationAdjustedTarget(formData.targetAmount, formData.timeHorizon)

  const rows = [
    { label: 'Goal type', value: type.label },
    { label: 'Goal name', value: formData.name },
    { label: 'Target amount', value: formatCurrency(formData.targetAmount, 'INR') },
    { label: 'Time horizon', value: `${formData.timeHorizon} year${formData.timeHorizon !== 1 ? 's' : ''}` },
    { label: 'Current savings', value: formatCurrency(formData.currentSavings, 'INR') },
    { label: 'Priority', value: <span className="capitalize">{formData.priority}</span> },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0', type.bgColor)}>
          <Icon className={cn('h-6 w-6', type.iconColor)} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Review your goal</h2>
          <p className="text-sm text-muted-foreground">Confirm everything looks right before saving.</p>
        </div>
      </div>

      {/* Risk profile source badge */}
      <div className="mb-4">
        <RiskBadge riskProfile={riskProfile} cagr={riskCagr} />
      </div>

      {/* Summary rows */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden mb-4">
        {rows.map(({ label, value }, idx) => (
          <div key={label}>
            {idx > 0 && <Separator />}
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick insights */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Est. monthly SIP</p>
          <p className="font-numeric font-semibold text-trust text-lg">{formatCurrency(monthly, 'INR')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Inflation-adj. target</p>
          <p className="font-numeric font-semibold text-lg">{formatCurrency(inflAdj, 'INR')}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mb-5">
        Monthly SIP is estimated using{' '}
        <span className="font-semibold">{(riskCagr * 100).toFixed(1)}% p.a.</span>
        {' '}— the weighted return of your {riskProfile?.profile_key} risk portfolio. Actual returns vary.
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="gap-1.5" onClick={onBack}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
        <Button
          ref={btnRef}
          type="button"
          className="flex-1 bg-trust hover:bg-trust/90 text-white"
          onClick={onSave}
          disabled={saving}
        >
          {saving
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</span>
            : 'Create goal'
          }
        </Button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NewGoalPage() {
  const navigate = useNavigate()
  const { mutateAsync: createGoal, isPending: saving } = useCreateGoal()
  const { data: riskProfile, isLoading: riskLoading } = useRiskProfile()
  const track = useTrackEvent()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [goalType, setGoalType] = useState('')
  const [formData, setFormData] = useState(null)

  const defaultGoalName = goalType ? getGoalType(goalType).label : 'My goal'

  // Derive CAGR from risk profile — computed once, passed through all steps
  const riskCagr = riskProfile ? deriveRiskCagr(riskProfile) : null

  function goTo(next) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  function handleDetails(data) {
    setFormData(data)
    goTo(3)
  }

  async function handleSave() {
    const targetDate = new Date()
    targetDate.setFullYear(targetDate.getFullYear() + formData.timeHorizon)

    try {
      const goal = await createGoal({
        type: goalType,
        name: formData.name,
        target_amount: formData.targetAmount,
        currency: 'INR',
        time_horizon_years: formData.timeHorizon,
        target_date: targetDate.toISOString().split('T')[0],
        current_amount: formData.currentSavings,
        priority: formData.priority,
        expected_cagr: riskCagr,
        inflation_adjusted: true,
      })
      track('goal_created', { type: goalType, target_amount: formData.targetAmount, time_horizon_years: formData.timeHorizon })
      toast.success('Goal created!')
      navigate(`/app/goals/${goal.id}`)
    } catch (err) {
      toast.error(err?.message || 'Could not save goal. Please try again.')
    }
  }

  const STEP_LABELS = ['Goal type', 'Details', 'Review']

  // Loading state
  if (riskLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  // Gate: no risk profile yet
  if (!riskProfile) {
    return <RiskProfileGate />
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header + progress */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">New Goal</h1>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Step {step} of 3</span>
          <span className="text-xs text-muted-foreground">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="h-full bg-trust rounded-full"
                animate={{ width: s <= step ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={slide} initial="enter" animate="center" exit="exit">
            {step === 1 && (
              <TypeStep selected={goalType} onSelect={setGoalType} onNext={() => goTo(2)} />
            )}
            {step === 2 && (
              <DetailsStep
                defaultName={defaultGoalName}
                onNext={handleDetails}
                onBack={() => goTo(1)}
              />
            )}
            {step === 3 && formData && (
              <ReviewStep
                goalType={goalType}
                formData={formData}
                riskProfile={riskProfile}
                riskCagr={riskCagr}
                onBack={() => goTo(2)}
                onSave={handleSave}
                saving={saving}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        All projections are estimates. Past returns do not guarantee future performance.
      </p>
    </div>
  )
}
