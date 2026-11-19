const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Integration-ready authentication service for FinSight.
 *
 * Backend inspection summary:
 * - POST /api/auth/signup exists in backend/src/routes/auth.routes.js
 *   (expects { name, email, password } -> 201 { message, user }),
 *   but is currently awaiting backend route/controller wiring and CORS setup.
 * - POST /api/auth/login, POST /api/auth/forgot-password, and OAuth providers
 *   are not yet implemented in the backend.
 *
 * Never stores plaintext passwords in localStorage or pretends auth succeeded.
 */
export async function signUp({ name, email, password }) {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        return {
          status: 'success',
          mode: 'backend',
          message:
            data.message ||
            'Account created successfully. You can now sign in.',
          user: data.user || null,
        }
      }

      return {
        status: 'error',
        mode: 'backend',
        message:
          data.message ||
          `Registration failed (HTTP ${response.status}). Please try again.`,
      }
    } catch {
      return {
        status: 'demo',
        mode: 'frontend-preview',
        message:
          'Frontend Preview Mode: Form validation passed, but the FinSight backend (/api/auth/signup) is currently unreachable. No account was created.',
      }
    }
  }

  await delay(550)
  return {
    status: 'demo',
    mode: 'frontend-preview',
    message:
      'Frontend Preview Mode: Your details passed client-side validation. Live account creation awaits backend API connection (POST /api/auth/signup). No data was saved.',
  }
}

export async function signIn({ email, rememberMe }) {
  await delay(550)
  return {
    status: 'demo',
    mode: 'frontend-preview',
    message: `Frontend Preview Mode: Credentials format verified for ${email.trim().toLowerCase()}${rememberMe ? ' (Remember me selected)' : ''}. Live sign-in is awaiting backend /api/auth/login integration — no session was created.`,
  }
}

export async function requestPasswordReset({ email }) {
  await delay(550)
  return {
    status: 'demo',
    mode: 'frontend-preview',
    message: `Frontend Demonstration State: Email format validated for ${email.trim().toLowerCase()}. No reset email was sent because a password-recovery mail service is not connected yet.`,
  }
}

export function getOAuthNotice(provider) {
  return `${provider} OAuth is not configured in this environment yet. Once OAuth credentials are connected on the backend, this button will initiate secure ${provider} sign-in.`
}
