import { AlertCircle, ArrowRight, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AuthButton } from './AuthButton'
import { AuthInput } from './AuthInput'
import { PasswordInput } from './PasswordInput'
import { SocialAuthButtons } from './SocialAuthButtons'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = (nextValues = { email, password }) => {
    const nextErrors = {}
    if (!nextValues.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!EMAIL_REGEX.test(nextValues.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    if (!nextValues.password) {
      nextErrors.password = 'Password is required.'
    }
    return nextErrors
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const validationErrors = validate()
    setErrors(validationErrors)
    setServerError('')

    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    try {
      await login({ email, password })
      const dest = location.state?.from?.pathname || '/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      setServerError(err.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white sm:text-[1.65rem]">
          Sign In
        </h2>
        <p className="mt-1.5 text-sm text-[#A1A1AA]">
          Enter your details to access your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          id="login-email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            const val = e.target.value
            setEmail(val)
            if (touched.email) setErrors(validate({ email: val, password }))
          }}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : ''}
          disabled={loading}
        />

        <PasswordInput
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            const val = e.target.value
            setPassword(val)
            if (touched.password) setErrors(validate({ email, password: val }))
          }}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : ''}
          disabled={loading}
        />

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#A1A1AA] select-none hover:text-[#E4E4E7]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#080A0E] accent-[#8BFF19]"
            />
            <span>Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-xs font-medium text-[#B8F36B] transition hover:text-[#8BFF19] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="pt-1">
          <AuthButton loading={loading} loadingText="Signing In...">
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </AuthButton>
        </div>
      </form>

      <SocialAuthButtons actionLabel="Continue" />

      <p className="mt-6 text-center text-sm text-[#A1A1AA]">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[#8BFF19] transition hover:text-[#B8F36B] hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  )
}
