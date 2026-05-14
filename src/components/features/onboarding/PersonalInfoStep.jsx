import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAuth } from '@/context/AuthContext'
import { upsertProfile } from '@/lib/supabase/auth'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  age: z.coerce
    .number({ invalid_type_error: 'Enter a valid age' })
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18')
    .max(100, 'Age must be 100 or under'),
})

export default function PersonalInfoStep() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fullName, age, setData, setDirection } = useOnboardingStore()
  const [saving, setSaving] = useState(false)
  const firstInputRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName, age: age || '' },
  })

  // Focus first input on mount
  useEffect(() => { firstInputRef.current?.focus() }, [])

  async function onSubmit(values) {
    setSaving(true)
    setData({ fullName: values.fullName, age: values.age })

    if (user) {
      const { error } = await upsertProfile(user.id, {
        full_name: values.fullName,
        age: values.age,
      })
      if (error) {
        toast.error('Could not save — please try again.')
        setSaving(false)
        return
      }
    }

    setDirection(1)
    navigate('/app/onboarding/step-3')
  }

  function handleBack() {
    setDirection(-1)
    navigate('/app/onboarding/step-1')
  }

  return (
    <>
      <h2 className="text-xl font-bold tracking-tight mb-1">Tell us about yourself</h2>
      <p className="text-sm text-muted-foreground mb-6">
        We use this to tailor goal calculations and investment suggestions to your stage of life.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Priya Sharma"
            autoComplete="name"
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            {...register('fullName')}
            ref={(el) => {
              register('fullName').ref(el)
              firstInputRef.current = el
            }}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-xs text-destructive" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="28"
            min={18}
            max={100}
            aria-describedby={errors.age ? 'age-error' : 'age-hint'}
            {...register('age')}
          />
          <p id="age-hint" className="text-xs text-muted-foreground">Must be between 18 and 100</p>
          {errors.age && (
            <p id="age-error" className="text-xs text-destructive" role="alert">
              {errors.age.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-trust hover:bg-trust/90 text-white gap-2"
            disabled={saving}
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
      </form>
    </>
  )
}
