import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/lib/supabase/auth'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must include at least one number'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const passwordRules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Includes a number', met: /\d/.test(password) },
  ]

  async function onSubmit({ password }) {
    setSubmitting(true)
    const { error } = await updatePassword(password)

    if (error) {
      toast.error(error.message || 'Could not update password. Please try again.')
      setSubmitting(false)
      return
    }

    toast.success('Password updated! Please sign in.')
    navigate('/auth/login', { replace: true })
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-10"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <ul className="space-y-1 mt-1">
              {passwordRules.map(({ label, met }) => (
                <li key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-growth' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${met ? 'text-growth' : 'text-muted-foreground/40'}`} />
                  {label}
                </li>
              ))}
            </ul>
          )}
          {errors.password && !password.length && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirm')}
            aria-invalid={!!errors.confirm}
          />
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm.message}</p>
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
              Updating…
            </span>
          ) : (
            'Update Password'
          )}
        </Button>
      </form>
    </>
  )
}
