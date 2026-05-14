import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, ShieldCheck, BarChart2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAuth } from '@/context/AuthContext'

const PREVIEWS = [
  { icon: Target, text: 'Set your first financial goal with a clear monthly target' },
  { icon: ShieldCheck, text: 'Discover your risk profile through a short questionnaire' },
  { icon: BarChart2, text: 'Get a personalised investment strategy for your goals' },
]

export default function WelcomeStep() {
  const navigate = useNavigate()
  const { setDirection } = useOnboardingStore()
  const { user } = useAuth()
  const btnRef = useRef(null)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || ''

  // Focus CTA on mount for keyboard navigation
  useEffect(() => { btnRef.current?.focus() }, [])

  function handleNext() {
    setDirection(1)
    navigate('/app/onboarding/step-2')
  }

  return (
    <div className="text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-trust/10 mb-5">
        <Target className="h-7 w-7 text-trust" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        {firstName ? `Welcome to FinPath, ${firstName}!` : 'Welcome to FinPath!'}
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        Let&apos;s take 2 minutes to set up your profile so we can give you the most relevant experience.
      </p>

      <ul className="space-y-3 mb-8 text-left">
        {PREVIEWS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-growth/10 mt-0.5">
              <Icon className="h-3.5 w-3.5 text-growth" />
            </span>
            <span className="text-sm text-muted-foreground leading-snug">{text}</span>
          </li>
        ))}
      </ul>

      <Button
        ref={btnRef}
        onClick={handleNext}
        className="w-full bg-trust hover:bg-trust/90 text-white gap-2"
        size="lg"
      >
        Let&apos;s start <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
