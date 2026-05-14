import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, ArrowLeft, ArrowRight, Sprout, LineChart, BarChart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAuth } from '@/context/AuthContext'
import { upsertProfile } from '@/lib/supabase/auth'

const OPTIONS = [
  {
    value: 'beginner',
    icon: Sprout,
    label: 'Beginner',
    description: "I'm new to investing or have just started. I want to learn the basics.",
  },
  {
    value: 'intermediate',
    icon: LineChart,
    label: 'Intermediate',
    description: "I've been investing for 1–5 years and understand mutual funds, SIPs, and basic diversification.",
  },
  {
    value: 'advanced',
    icon: BarChart,
    label: 'Advanced',
    description: "I actively manage my portfolio and understand complex products like direct equity, derivatives, or REITs.",
  },
]

export default function ExperienceStep() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { experienceLevel, setData, setDirection } = useOnboardingStore()
  const [selected, setSelected] = useState(experienceLevel || '')
  const [saving, setSaving] = useState(false)
  const firstCardRef = useRef(null)

  // Focus first card on mount
  useEffect(() => { firstCardRef.current?.focus() }, [])

  async function handleContinue() {
    if (!selected) {
      toast.error('Please select your experience level.')
      return
    }

    setSaving(true)
    setData({ experienceLevel: selected })

    if (user) {
      const { error } = await upsertProfile(user.id, { experience_level: selected })
      if (error) {
        toast.error('Could not save — please try again.')
        setSaving(false)
        return
      }
    }

    setDirection(1)
    navigate('/app/onboarding/step-4')
  }

  function handleBack() {
    setDirection(-1)
    navigate('/app/onboarding/step-2')
  }

  return (
    <>
      <h2 className="text-xl font-bold tracking-tight mb-1">
        How much investing experience do you have?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Be honest — there&apos;s no wrong answer. This helps us calibrate explanations and recommendations.
      </p>

      <div
        role="radiogroup"
        aria-label="Investment experience level"
        className="space-y-3 mb-6"
      >
        {OPTIONS.map(({ value, icon: Icon, label, description }, idx) => {
          const isSelected = selected === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              ref={idx === 0 ? firstCardRef : undefined}
              onClick={() => setSelected(value)}
              className={cn(
                'relative w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust focus-visible:ring-offset-2',
                isSelected
                  ? 'border-trust bg-trust/5 shadow-sm'
                  : 'border-border bg-card hover:border-trust/40 hover:bg-muted/30'
              )}
            >
              {/* Selected checkmark badge */}
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-growth">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              )}

              <div className="flex items-start gap-3 pr-6">
                <span className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                  isSelected ? 'bg-trust/15 text-trust' : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className={cn('font-semibold text-sm', isSelected && 'text-trust')}>{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="gap-1.5" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          type="button"
          className="flex-1 bg-trust hover:bg-trust/90 text-white gap-2"
          onClick={handleContinue}
          disabled={saving || !selected}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </span>
          ) : (
            <>Continue <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </>
  )
}
