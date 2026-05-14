import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight, Eye, EyeOff, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail } from '@/lib/supabase/auth'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/app/dashboard" replace />

  async function onSubmit({ fullName, email, password }) {
    setSubmitting(true)
    const { data, error } = await signUpWithEmail(fullName, email, password)

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.')
      } else {
        toast.error(error.message || 'Could not create account. Please try again.')
      }
      setSubmitting(false)
      return
    }

    if (data.session) {
      // Email confirmation disabled — go straight to onboarding
      navigate('/app/onboarding/step-1', { replace: true })
    } else {
      // Email confirmation required — show check-email screen
      setEmailSent(true)
      setSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-growth/10 mx-auto">
          <CheckCircle2 className="h-7 w-7 text-growth" />
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We sent a confirmation link to your email address. Click it to activate your account and get started.
        </p>
        <p className="text-xs text-muted-foreground">
          Already confirmed?{' '}
          <Link to="/auth/login" className="text-trust underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Start your financial planning journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" type="text" placeholder="Priya Sharma" autoFocus {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="priya@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-trust hover:bg-trust/90 text-white gap-2 mt-1" disabled={submitting}>
          {submitting
            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating account…</>
            : <>Create account <ArrowRight className="h-4 w-4" /></>
          }
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-trust font-medium hover:underline">Sign in</Link>
      </p>
    </>
  )
}
