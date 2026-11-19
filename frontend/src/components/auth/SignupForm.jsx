import { AlertCircle, ArrowRight, CheckCircle2, Info, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../services/authService'
import { AuthButton } from './AuthButton'
import { AuthInput } from './AuthInput'
import { PasswordInput } from './PasswordInput'
import { SocialAuthButtons } from './SocialAuthButtons'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignupForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const validate = (
    vals = { name, email, password, confirmPassword }
  ) => {
    const nextErrors = {}

    if (!vals.name.trim()) {
      nextErrors.name = 'Full name is required.'
    } else if (vals.name.trim().length < 2) {
      nextErrors.name = 'Please enter at least 2 characters.'
    }

    if (!vals.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!EMAIL_REGEX.test(vals.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!vals.password) {
      nextErrors.password = 'Password is required.'
    } else if (vals.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.'
    }

    if (!vals.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (vals.confirmPassword !== vals.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    return nextErrors
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    })
    const validationErrors = validate()
    setErrors(validationErrors)
    setFeedback(null)

    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    try {
      const result = await signUp({ name, email, password })
      setFeedback(result)
      if (result.status === 'success' && result.mode === 'backend') {
        setTimeout(() => navigate('/login'), 1400)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white sm:text-[1.65rem]">
          Create Account
        </h2>
        <p className="mt-1.5 text-sm text-[#A1A1AA]">
          Fill in your details to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          id="signup-name"
          label="Full Name"
          type="text"
          icon={User}
          placeholder="Aarav Sharma"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            const val = e.target.value
            setName(val)
            if (touched.name)
              setErrors(validate({ name: val, email, password, confirmPassword }))
          }}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : ''}
          disabled={loading}
        />

        <AuthInput
          id="signup-email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            const val = e.target.value
            setEmail(val)
            if (touched.email)
              setErrors(validate({ name, email: val, password, confirmPassword }))
          }}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : ''}
          disabled={loading}
        />

        <PasswordInput
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          showStrength
          value={password}
          onChange={(e) => {
            const val = e.target.value
            setPassword(val)
            if (touched.password || touched.confirmPassword)
              setErrors(validate({ name, email, password: val, confirmPassword }))
          }}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : ''}
          disabled={loading}
        />

        <PasswordInput
          id="signup-confirm-password"
          label="Confirm Password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            const val = e.target.value
            setConfirmPassword(val)
            if (touched.confirmPassword)
              setErrors(validate({ name, email, password, confirmPassword: val }))
          }}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : ''}
          disabled={loading}
        />

        {feedback && (
          <div
            role="status"
            className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-relaxed ${
              feedback.status === 'error'
                ? 'border-red-500/35 bg-red-500/10 text-red-200'
                : feedback.status === 'success'
                  ? 'border-[#8BFF19]/40 bg-[#8BFF19]/12 text-[#ECFCCB]'
                  : 'border-[#B8F36B]/30 bg-[#B8F36B]/[0.08] text-[#E4E4E7]'
            }`}
          >
            {feedback.status === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            ) : feedback.status === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8BFF19]" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B8F36B]" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="pt-1">
          <AuthButton loading={loading} loadingText="Creating Account...">
            <span>Create Account</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </AuthButton>
        </div>
      </form>

      <SocialAuthButtons actionLabel="Sign up" />

      <p className="mt-6 text-center text-sm text-[#A1A1AA]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#8BFF19] transition hover:text-[#B8F36B] hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  )
}
