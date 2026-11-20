import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { ALLOWED_ORIGINS, csrfOriginGuard } from './middlewares/csrf.middleware.js'
import analyticRoutes from './routes/analytic.route.js'
import authRoutes from './routes/auth.route.js'
import budgetRoutes from './routes/budget.route.js'

const app = express()

// Render terminates public traffic at its reverse proxy. Trust only the nearest
// hop, rather than arbitrary client-supplied forwarding chains.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

// 1. CORS (explicit origin + credentials for httpOnly cookie auth)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true)
      }
      return callback(Object.assign(new Error('Origin not allowed by CORS'), { status: 403 }))
    },
    credentials: true,
  })
)

// 2. Body & Cookie Parsers
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

// 3. CSRF origin guard on state-changing requests
app.use(csrfOriginGuard)

// 4. Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' })
})

// 5. API Routes
app.use('/api/auth', authRoutes)
app.use('/api/analytic', analyticRoutes)
app.use('/api/budgets', budgetRoutes)

// 6. 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
})

// 7. Centralized Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File exceeds the maximum allowed size of 10 MB.',
    })
  }

  // Invalid UUID parameter in PostgreSQL/Prisma
  if (err.code === 'P2023' || /invalid input syntax for type uuid/i.test(err.message || '')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier format.',
    })
  }

  const status = err.status || err.statusCode || 500
  if (status >= 500) {
    console.error('[FinSight API Error]', err)
  }

  return res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : err.message,
  })
})

export default app
