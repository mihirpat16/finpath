import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { hasProfile } from '@/lib/supabase/auth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function finish() {
      // Exchange the code in the URL for a session
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        navigate('/auth/login?error=callback_failed', { replace: true })
        return
      }

      const profileExists = await hasProfile(data.session.user.id)
      navigate(profileExists ? '/app/dashboard' : '/app/onboarding', { replace: true })
    }

    finish()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-trust border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Completing sign in…</p>
      </div>
    </div>
  )
}
