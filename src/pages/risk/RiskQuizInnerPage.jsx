import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { QUIZ_QUESTIONS } from '@/lib/risk/questions'
import { scoreQuiz, getRiskProfile } from '@/lib/risk/scoring'
import { computeAllocation } from '@/lib/risk/allocation'
import { useQuizStore } from '@/stores/quizStore'
import { useSaveRiskProfile } from '@/hooks/useRiskProfile'
import { useAuth } from '@/context/AuthContext'
import { useTrackEvent } from '@/hooks/useTrackEvent'
import { cn } from '@/lib/utils'

const TOTAL = QUIZ_QUESTIONS.length

const variants = {
  enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

export default function RiskQuizInnerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const { answers, direction, setAnswer, setDirection, getTotalScore, reset } = useQuizStore()
  const { mutateAsync: saveProfile } = useSaveRiskProfile()
  const track = useTrackEvent()

  const question = QUIZ_QUESTIONS[currentIndex]
  const selected = answers[question.id]
  const isLast = currentIndex === TOTAL - 1
  const answeredCount = Object.keys(answers).length
  const progress = ((currentIndex + (selected ? 1 : 0)) / TOTAL) * 100

  function goBack() {
    if (currentIndex === 0) {
      navigate('/app/risk')
      return
    }
    setDirection(-1)
    setCurrentIndex((i) => i - 1)
  }

  function goNext() {
    if (!selected) return
    setDirection(1)
    setCurrentIndex((i) => i + 1)
  }

  function selectOption(score) {
    setAnswer(question.id, score)
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitting(true)

    try {
      const totalScore = getTotalScore()
      const profile = getRiskProfile(totalScore)
      const allocation = computeAllocation(
        profile.key,
        user?.user_metadata?.age ?? 30,
      )

      await saveProfile({
        totalScore,
        profileKey: profile.key,
        answers,
        allocation,
      })

      track('quiz_completed', { profile: profile.key, score: totalScore })
      toast.success('Risk profile saved!')
      reset()
      navigate('/app/risk/results', { replace: true })
    } catch {
      toast.error('Could not save your profile. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Question {currentIndex + 1} of {TOTAL}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-trust"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question + options */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <h2 className="text-lg font-semibold leading-snug mb-5">{question.text}</h2>

            <ul className="space-y-2.5">
              {question.options.map((opt) => {
                const isSelected = selected === opt.score
                return (
                  <li key={opt.score}>
                    <button
                      type="button"
                      onClick={() => selectOption(opt.score)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm transition-all duration-150',
                        isSelected
                          ? 'border-trust bg-trust/5 text-foreground'
                          : 'border-border bg-card hover:border-trust/40 hover:bg-muted/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          isSelected
                            ? 'border-trust bg-trust'
                            : 'border-border',
                        )}
                      >
                        {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </span>
                      <span className="leading-snug">{opt.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={goBack} className="gap-1.5" disabled={submitting}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {isLast ? (
          <Button
            className="flex-1 bg-trust hover:bg-trust/90 text-white gap-2"
            onClick={handleSubmit}
            disabled={!selected || submitting}
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                Get my profile
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            className="flex-1 bg-trust hover:bg-trust/90 text-white gap-2"
            onClick={goNext}
            disabled={!selected}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
