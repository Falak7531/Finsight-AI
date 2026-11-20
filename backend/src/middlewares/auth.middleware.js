import { verifyToken } from '../../utils/tokens.js'

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    })
  }

  const decoded = verifyToken(token)
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in again.',
    })
  }

  req.user = decoded
  return next()
}
