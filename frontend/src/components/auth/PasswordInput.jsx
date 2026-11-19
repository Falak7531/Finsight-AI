import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' }
  if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B' }
  if (score === 3) return { score: 3, label: 'Good', color: '#B8F36B' }
  return { score: 4, label: 'Strong', color: '#8BFF19' }
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '••••••••',
  autoComplete,
  error,
  showStrength = false,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false)
  const strength = showStrength ? getStrength(value) : null

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium tracking-wide text-[#D4D4D8]"
      >
        {label}
      </label>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#71717A]"
        />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-[#080A0E] py-3 pr-11 pl-10 text-sm text-white placeholder-[#52525B] transition-all duration-200 focus:outline-none ${
            error
              ? 'border-red-500/70 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
              : 'border-white/10 hover:border-white/20 focus:border-[#8BFF19]/70 focus:ring-2 focus:ring-[#8BFF19]/20'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-[#71717A] transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BFF19]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="h-1 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor:
                    level <= strength.score
                      ? strength.color
                      : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>
          <p className="mt-1 flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>Use 8+ chars with uppercase, number & symbol</span>
            <span
              className="font-mono font-medium"
              style={{ color: strength.color }}
            >
              {strength.label}
            </span>
          </p>
        </div>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  )
}
