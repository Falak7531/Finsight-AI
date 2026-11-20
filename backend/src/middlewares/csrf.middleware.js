const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

/**
 * Origin verification middleware for cookie-authenticated state-changing requests.
 * Rejects cross-site browser requests whose Origin header is not in ALLOWED_ORIGINS.
 */
export const csrfOriginGuard = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const origin = req.get('origin')
  if (!origin) {
    // Non-browser clients (e.g., curl/server-to-server) do not send Origin
    return next()
  }

  const normalized = origin.replace(/\/$/, '')
  if (!ALLOWED_ORIGINS.includes(normalized)) {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin state-changing request rejected.',
    })
  }

  return next()
}

export { ALLOWED_ORIGINS }
