const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export const API_BASE_URL = RAW_BASE.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, signal } = options
  const isFormData = body instanceof FormData

  const finalHeaders = { ...headers }
  if (!isFormData && body !== undefined && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: finalHeaders,
      body: isFormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
      signal,
    })
  } catch {
    throw new ApiError(
      'Unable to reach the FinSight backend server. Make sure the backend is running.',
      0
    )
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : null

  if (!response.ok) {
    const msg =
      payload?.message || `Request failed with status ${response.status}`
    throw new ApiError(msg, response.status, payload)
  }

  return payload
}
