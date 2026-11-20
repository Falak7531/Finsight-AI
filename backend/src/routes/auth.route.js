import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  logoutController,
  meController,
  signInController,
  signUpController,
  updateProfileController,
} from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = express.Router()

// Session probes and user data must never be served from a stale cache.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
})

router.post('/register', authLimiter, signUpController)
router.post('/login', authLimiter, signInController)
router.post('/logout', logoutController)
router.get('/me', authMiddleware, meController)
router.patch('/profile', authMiddleware, updateProfileController)

export default router
