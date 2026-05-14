import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Pencil, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAuth } from '@/context/AuthContext'
import { upsertProfile } from '@/lib/supabase/auth'

const EXPERIENCE_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export default function ConfirmationStep() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fullName, age, experienceLevel, setDirection, reset } = useOnboardingStore()
  const [saving, setSaving] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => { btnRef.current?.focus() }, [])

  function goEdit(step) {
    setDirection(-1)
    navigate(`/app/onboarding/step-${step}`)
  }

  function handleBack() {
    setDirection(-1)
    navigate('/app/onboarding/step-3')
  }

  async function handleFinish() {
    if (!fullName || !age || !experienceLevel) {
      toast.error('Some information is missing. Please go back and fill in all fields.')
      return
    }

    setSaving(true)

    if (user) {
      const { error } = await upsertProfile(user.id, {
        full_name: fullName,
        age: Number(age),
        experience_level: experienceLevel,
      })
      if (error) {
        toast.error('Could not save your profile. Please try again.')
        setSaving(false)
        return
      }
    }

    toast.success('Profile saved! Now let\'s set your first goal.')
    reset()
    navigate('/app/goals/new', { replace: true })
  }

  const rows = [
    { label: 'Full name', value: fullName || '—', editStep: 2 },
    { label: 'Age', value: age ? `${age} years old` : '—', editStep: 2 },
    {
      label: 'Experience',
      value: experienceLevel ? EXPERIENCE_LABELS[experienceLevel] : '—',
      editStep: 3,
    },
  ]

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-growth/10">
          <CheckCircle2 className="h-5 w-5 text-growth" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Looking good!</h2>
          <p className="text-sm text-muted-foreground">Here&apos;s what we have for you. Edit anything before we continue.</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden mb-6">
        {rows.map(({ label, value, editStep }, idx) => (
          <div key={label}>
            {idx > 0 && <Separator />}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-medium text-sm">
                  {label === 'Experience' && value !== '—' ? (
                    <Badge variant="secondary" className="font-normal">{value}</Badge>
                  ) : value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goEdit(editStep)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Edit ${label}`}
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="gap-1.5" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          ref={btnRef}
          type="button"
          className="flex-1 bg-trust hover:bg-trust/90 text-white"
          onClick={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </span>
          ) : (
            'Looks good — set my first goal'
          )}
        </Button>
      </div>
    </>
  )
}
