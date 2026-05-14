import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

export function useTrackEvent() {
  const { user } = useAuth()
  return useCallback(
    async (eventName, properties = {}) => {
      if (!user?.id) return
      try {
        await supabase.from('user_events').insert({
          user_id: user.id,
          event_name: eventName,
          properties,
          page: window.location.pathname,
        })
      } catch {
        // tracking must never break the app
      }
    },
    [user?.id],
  )
}
