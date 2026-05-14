import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const LENGTH = 6

export default function OtpInput({ onComplete, disabled }) {
  const [values, setValues] = useState(Array(LENGTH).fill(''))
  const refs = useRef([])

  function notify(next) {
    const code = next.join('')
    if (!next.includes('') && code.length === LENGTH) onComplete?.(code)
  }

  function handleChange(idx, e) {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[idx] = digit
    setValues(next)
    if (digit && idx < LENGTH - 1) refs.current[idx + 1]?.focus()
    notify(next)
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...values]
      if (next[idx]) {
        next[idx] = ''
        setValues(next)
      } else if (idx > 0) {
        next[idx - 1] = ''
        setValues(next)
        refs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < LENGTH - 1) {
      refs.current[idx + 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return
    const next = Array(LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setValues(next)
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
    notify(next)
  }

  return (
    <div className="flex gap-2.5 justify-center" role="group" aria-label="One-time password">
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={(el) => { refs.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          className={cn(
            'w-11 h-13 rounded-xl border-2 text-center text-xl font-bold transition-all duration-150',
            'focus:outline-none focus:border-trust focus:bg-trust/5',
            val ? 'border-trust/50 bg-trust/5 text-trust' : 'border-border bg-card text-foreground',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          style={{ height: '3.25rem' }}
        />
      ))}
    </div>
  )
}
