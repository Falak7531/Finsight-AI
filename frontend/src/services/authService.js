import { ApiError, apiRequest } from './apiClient'

async function confirmSession(result) {
  try {
    const session = await getCurrentUser()
    return { ...result, user: session.user }
  } catch (err) {
    if (err.status === 401) {
      throw new ApiError(
        'Your session cookie could not be saved or sent. Please allow cookies for this site and try again.',
        401
      )
    }
    throw err
  }
}

export async function register({ name, email, password }) {
  const result = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      userName: name.trim(),
      userEmail: email.trim().toLowerCase(),
      userPassword: password,
    },
  })
  return confirmSession(result)
}

export async function login({ email, password }) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      userEmail: email.trim().toLowerCase(),
      userPassword: password,
    },
  })
  return confirmSession(result)
}

export async function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}

export async function getCurrentUser() {
  return apiRequest('/auth/me', { method: 'GET' })
}

export async function updateProfile({ name }) {
  return apiRequest('/auth/profile', {
    method: 'PATCH',
    body: { name: name.trim() },
  })
}

export async function requestPasswordReset({ email }) {
  return {
    status: 'demo',
    message: `Password recovery email delivery is not configured yet for ${email.trim().toLowerCase()}. No email was sent.`,
  }
}

export function getOAuthNotice(provider) {
  return `${provider} OAuth is not configured yet. Please sign in or create an account with your email and password.`
}
