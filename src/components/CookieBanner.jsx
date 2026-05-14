import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'finpath_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-4 md:right-auto md:max-w-sm"
    >
      <div className="m-3 md:m-0 rounded-2xl border border-border bg-card shadow-lg p-5 flex flex-col gap-3">
        <p className="text-sm leading-relaxed">
          We use a single functional cookie to remember your preferences.
          No tracking or advertising cookies. &nbsp;
          <Link to="/privacy" className="underline hover:text-foreground text-muted-foreground">
            Privacy policy
          </Link>
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="bg-trust hover:bg-trust/90 text-white flex-1" onClick={accept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}
