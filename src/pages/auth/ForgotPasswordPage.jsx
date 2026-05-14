import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/supabase/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit({ email }) {
    setSubmitting(true)
    const { error } = await requestPasswordReset(email)

    if (error) {
      toast.error(error.message || 'Could not send reset email. Try again.')
      setSubmitting(false)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-growth/10 mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-growth" />
        </div>
        <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to your email. It expires in 1 hour.
        </p>
        <Link
          to="/auth/login"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium underline hover:text-trust"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-trust hover:bg-trust/90 text-white"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending…
            </span>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember it?{' '}
        <Link to="/auth/login" className="font-medium text-foreground underline hover:text-trust">
          Back to Sign In
        </Link>
      </p>
    </>
  )
}
