import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import {
  deleteBudgetForUser,
  getBudgetsForUser,
  upsertBudgetForUser,
} from '../services/budget.service.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const data = await getBudgetsForUser(
      req.user.userId,
      req.query.month,
      req.query.year
    )
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = await upsertBudgetForUser(req.user.userId, req.body || {})
    return res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data,
    })
  } catch (err) {
    return next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteBudgetForUser(req.user.userId, req.params.id)
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      })
    }
    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    })
  } catch (err) {
    return next(err)
  }
})

export default router
