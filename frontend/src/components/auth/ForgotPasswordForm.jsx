import { ArrowLeft, ArrowRight, Info, KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../services/authService'
import { AuthButton } from './AuthButton'
import { AuthInput } from './AuthInput'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required.'
    if (!EMAIL_REGEX.test(val.trim())) return 'Please enter a valid email address.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    const err = validateEmail(email)
    setError(err)
    setFeedback(null)

    if (err) return

    setLoading(true)
    try {
      const result = await requestPasswordReset({ email })
      setFeedback(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#8BFF19]/30 bg-[#8BFF19]/10 text-[#8BFF19]">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-white sm:text-[1.65rem]">
          Forgot Your Password?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
          Enter the email address associated with your FinSight account and
          we&apos;ll prepare password recovery instructions once email delivery
          is connected.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          id="forgot-email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            const val = e.target.value
            setEmail(val)
            if (touched) setError(validateEmail(val))
          }}
          onBlur={() => {
            setTouched(true)
            setError(validateEmail(email))
          }}
          error={touched ? error : ''}
          disabled={loading}
        />

        {feedback && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-[#8BFF19]/30 bg-[#8BFF19]/[0.08] p-3.5 text-xs leading-relaxed text-[#E4E4E7]"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8BFF19]" />
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="pt-1">
          <AuthButton loading={loading} loadingText="Validating Request...">
            <span>Send Reset Link</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 border-t border-white/[0.08] pt-5 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A1A1AA] transition hover:text-[#8BFF19]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
