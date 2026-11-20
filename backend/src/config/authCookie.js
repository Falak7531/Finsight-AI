// Host-only: never share cookies across unrelated onrender.com tenants.
export const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  }
}

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000
