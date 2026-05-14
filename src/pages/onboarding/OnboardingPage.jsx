import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useOnboardingStore } from '@/stores/onboardingStore'

const TOTAL_STEPS = 4

const STEP_LABELS = ['Welcome', 'Personal Info', 'Experience', 'Confirm']

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: (dir) => ({
    x: dir > 0 ? -56 : 56,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
}

function getStep(pathname) {
  const match = pathname.match(/step-(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

export default function OnboardingPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { direction, initFromUser } = useOnboardingStore()

  const currentStep = getStep(location.pathname)
  const progressPct = (currentStep / TOTAL_STEPS) * 100

  // Pre-fill name from Supabase auth metadata
  useEffect(() => {
    if (user) initFromUser(user)
  }, [user, initFromUser])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start py-10 px-4">
      {/* Progress header */}
      <div className="w-full max-w-[560px] mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-muted-foreground">{STEP_LABELS[currentStep - 1]}</span>
        </div>

        {/* Segmented progress bar */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted"
            >
              <motion.div
                className="h-full bg-trust rounded-full"
                initial={{ width: 0 }}
                animate={{ width: i < currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Animated step container */}
      <div className="w-full max-w-[560px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
              <Outlet />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        Your information is used only to personalise your experience within FinPath.
        We do not share it with third parties.
      </p>
    </div>
  )
}
