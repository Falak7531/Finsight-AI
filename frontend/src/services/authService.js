import { apiRequest } from './apiClient'

export async function register({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: {
      userName: name.trim(),
      userEmail: email.trim().toLowerCase(),
      userPassword: password,
    },
  })
}

export async function login({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: {
      userEmail: email.trim().toLowerCase(),
      userPassword: password,
    },
  })
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
