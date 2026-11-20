import fs from 'fs'
import {
  deleteDocumentForUser,
  getAnalyticsById,
  getAnalyticsByUserId,
  getCategoriesData,
  getDocumentByIdForUser,
  getDocumentsByUserId,
  getForecastsData,
  getInsightsData,
  getOverviewData,
  getTransactionsData,
  getTrendsData,
  processStatement,
} from '../services/analytic.service.js'

export const uploadStatement = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a PDF, CSV, or XLSX statement under the "statement" field.',
      })
    }

    const result = await processStatement(req.file, req.user.userId)
    return res.status(201).json({
      success: true,
      message: 'Statement processed successfully',
      data: result,
    })
  } catch (err) {
    return next(err)
  }
}

export const getOverview = async (req, res, next) => {
  try {
    const data = await getOverviewData(req.user.userId, req.query.range)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getTrends = async (req, res, next) => {
  try {
    const data = await getTrendsData(req.user.userId, req.query.range)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getCategories = async (req, res, next) => {
  try {
    const data = await getCategoriesData(req.user.userId, req.query.range)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getCashflow = async (req, res, next) => {
  try {
    const data = await getTrendsData(req.user.userId, req.query.range)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getInsights = async (req, res, next) => {
  try {
    const data = await getInsightsData(req.user.userId)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getForecasts = async (req, res, next) => {
  try {
    const data = await getForecastsData(req.user.userId)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getTransactions = async (req, res, next) => {
  try {
    const data = await getTransactionsData(req.user.userId, req.query)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getDocuments = async (req, res, next) => {
  try {
    const data = await getDocumentsByUserId(req.user.userId)
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return next(err)
  }
}

export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await getDocumentByIdForUser(req.user.userId, req.params.id)
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }
    return res.status(200).json({ success: true, data: doc })
  } catch (err) {
    return next(err)
  }
}

export const downloadDocument = async (req, res, next) => {
  try {
    const doc = await getDocumentByIdForUser(req.user.userId, req.params.id)
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }
    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Stored file is no longer available on disk',
      })
    }
    return res.download(doc.filePath, doc.originalName)
  } catch (err) {
    return next(err)
  }
}

export const deleteDocument = async (req, res, next) => {
  try {
    const deleted = await deleteDocumentForUser(req.user.userId, req.params.id)
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }
    return res.status(200).json({
      success: true,
      message: 'Document and associated analytics deleted successfully',
    })
  } catch (err) {
    return next(err)
  }
}

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await getAnalyticsByUserId(req.user.userId)
    return res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data,
    })
  } catch (err) {
    return next(err)
  }
}

export const getAnalyticsByID = async (req, res, next) => {
  try {
    const data = await getAnalyticsById(req.user.userId, req.params.id)
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Analytics record not found',
      })
    }
    return res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data,
    })
  } catch (err) {
    return next(err)
  }
}
