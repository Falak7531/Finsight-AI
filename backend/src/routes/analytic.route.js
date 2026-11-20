import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  deleteDocument,
  downloadDocument,
  getAnalytics,
  getAnalyticsByID,
  getCashflow,
  getCategories,
  getDocumentById,
  getDocuments,
  getForecasts,
  getInsights,
  getOverview,
  getTransactions,
  getTrends,
  uploadStatement,
} from '../controllers/analytic.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/upload.js'

const router = express.Router()

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many uploads. Please wait a few minutes before uploading again.',
  },
})

// All analytics & document routes require authentication
router.use(authMiddleware)

// Static routes MUST be registered before dynamic /:id
router.post('/upload', uploadLimiter, upload.single('statement'), uploadStatement)
router.get('/overview', getOverview)
router.get('/trends', getTrends)
router.get('/categories', getCategories)
router.get('/cashflow', getCashflow)
router.get('/insights', getInsights)
router.get('/forecasts', getForecasts)
router.get('/transactions', getTransactions)

router.get('/documents', getDocuments)
router.get('/documents/:id', getDocumentById)
router.get('/documents/:id/download', downloadDocument)
router.delete('/documents/:id', deleteDocument)

// Analysis collection & single item routes
router.get('/', getAnalytics)
router.get('/:id', getAnalyticsByID)

export default router
