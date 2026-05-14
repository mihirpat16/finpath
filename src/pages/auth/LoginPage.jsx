import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail } from '@/lib/supabase/auth'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/app/dashboard" replace />

  async function onSubmit({ email, password }) {
    setSubmitting(true)
    const { error } = await signInWithEmail(email, password)

    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('Incorrect email or password. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email address first. Check your inbox.')
      } else {
        toast.error(error.message || 'Could not sign in. Please try again.')
      }
      setSubmitting(false)
      return
    }

    navigate('/app/dashboard', { replace: true })
  }

  return (
    <>
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in to your FinPath account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="priya@example.com" autoFocus autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/auth/forgot-password" className="text-xs text-trust hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              autoComplete="current-password"
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
            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Signing in…</>
            : <>Sign in <ArrowRight className="h-4 w-4" /></>
          }
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to FinPath?{' '}
        <Link to="/auth/register" className="text-trust font-medium hover:underline">Create account</Link>
      </p>
    </>
  )
}
