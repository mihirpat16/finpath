import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInAnonymously } from '@/lib/supabase/auth'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  // Already authenticated — send to app
  if (user) return <Navigate to="/app/dashboard" replace />

  async function onSubmit({ fullName }) {
    setSubmitting(true)
    const { error } = await signInAnonymously(fullName)

    if (error) {
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    navigate('/app/onboarding/step-1', { replace: true })
  }

  return (
    <>
      {/* Brand mark */}
      <div className="flex justify-center mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-trust text-white shadow-lg">
          <TrendingUp className="h-7 w-7" />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to FinPath</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your personal financial planning companion
        </p>
      </div>

      {/* Name form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">What should we call you?</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="e.g. Priya Sharma"
            autoComplete="given-name"
            autoFocus
            {...register('fullName')}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-trust hover:bg-trust/90 text-white gap-2"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Setting up…
            </>
          ) : (
            <>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        No account or email needed. Your progress is saved automatically.
      </p>
    </>
  )
}
