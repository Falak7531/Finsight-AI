import fs from 'fs/promises'
import path from 'path'
import { parseFinancialStatement } from '../../utils/statementParser.js'
import { prisma } from '../config/prisma.js'
import { validateFileSignature } from '../middlewares/upload.js'

const RANGE_DAYS = {
  this_month: 31,
  last_3m: 92,
  last_6m: 185,
  ytd: 365,
  all: null,
}

function getDateCutoff(range) {
  const days = RANGE_DAYS[range]
  if (!days) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function toNum(decimalVal) {
  return Number(decimalVal || 0)
}

export const processStatement = async (file, userId) => {
  const ext = path.extname(file.originalname || '').replace('.', '').toUpperCase() || 'PDF'

  // 1. Validate magic bytes / non-empty signature
  try {
    validateFileSignature(file.path, ext)
  } catch (err) {
    await fs.unlink(file.path).catch(() => {})
    throw err
  }

  // 2. Create UploadedDocument metadata in PROCESSING state
  const doc = await prisma.uploadedDocument.create({
    data: {
      userId,
      originalName: file.originalname,
      storedFileName: file.filename,
      filePath: file.path,
      fileType: ext,
      fileSize: file.size,
      status: 'PROCESSING',
    },
  })

  try {
    // 3. Parse format-specific statement + AI analysis
    const parsed = await parseFinancialStatement(file.path, ext, userId)

    // 4. Persist Analytics + deduplicated Transactions + mark Document PROCESSED atomically
    const result = await prisma.$transaction(async (tx) => {
      const analytics = await tx.analytics.create({
        data: {
          userId,
          documentId: doc.id,
          fileName: file.originalname,
          fileUrl: file.path,
          totalIncome: parsed.totalIncome,
          totalExpense: parsed.totalExpense,
          totalSavings: parsed.totalSavings,
          categoryBreakdown: parsed.categoryBreakdown,
          monthlyBreakdown: parsed.monthlyBreakdown,
          topTransactions: parsed.topTransactions,
          aiInsights: parsed.aiInsights,
        },
      })

      let insertedCount = 0
      if (parsed.transactions.length > 0) {
        const created = await tx.transaction.createMany({
          data: parsed.transactions.map((t) => ({
            userId,
            analyticsId: analytics.id,
            merchant: t.merchant,
            description: t.description,
            amount: t.amount,
            transactionType: t.transactionType,
            category: t.category,
            transactionDate: t.transactionDate,
            dedupeHash: t.dedupeHash,
          })),
          skipDuplicates: true,
        })
        insertedCount = created.count
      }

      const updatedDoc = await tx.uploadedDocument.update({
        where: { id: doc.id },
        data: {
          status: 'PROCESSED',
          rowsParsed: parsed.transactions.length,
        },
      })

      return { analytics, updatedDoc, insertedCount }
    })

    return {
      id: result.analytics.id,
      documentId: result.updatedDoc.id,
      fileName: result.analytics.fileName,
      status: result.updatedDoc.status,
      rowsParsed: result.updatedDoc.rowsParsed,
      transactionsInserted: result.insertedCount,
      totalIncome: toNum(result.analytics.totalIncome),
      totalExpense: toNum(result.analytics.totalExpense),
      totalSavings: toNum(result.analytics.totalSavings),
      categoryBreakdown: result.analytics.categoryBreakdown,
      monthlyBreakdown: result.analytics.monthlyBreakdown,
      topTransactions: result.analytics.topTransactions,
      aiInsights: result.analytics.aiInsights,
    }
  } catch (error) {
    // Preserve FAILED document metadata and clean up file on disk
    await prisma.uploadedDocument
      .update({
        where: { id: doc.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Statement processing failed',
        },
      })
      .catch(() => {})
    await fs.unlink(file.path).catch(() => {})
    throw error
  }
}

export const getOverviewData = async (userId, range = 'all') => {
  const cutoff = getDateCutoff(range)
  const where = {
    userId,
    ...(cutoff ? { transactionDate: { gte: cutoff } } : {}),
  }

  const allUserTx = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { transactionDate: 'asc' },
  })

  if (allUserTx.length === 0) {
    // Also check if user has PDF analytics without individual rows
    const latestAnalytics = await prisma.analytics.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestAnalytics) {
      return {
        hasData: false,
        calculatedNetBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        incomeChange: 0,
        expenseChange: 0,
        transactionCount: 0,
      }
    }

    const inc = toNum(latestAnalytics.totalIncome)
    const exp = toNum(latestAnalytics.totalExpense)
    const sav = toNum(latestAnalytics.totalSavings)
    return {
      hasData: true,
      calculatedNetBalance: sav,
      monthlyIncome: inc,
      monthlyExpenses: exp,
      savingsRate: inc > 0 ? Number(((sav / inc) * 100).toFixed(1)) : 0,
      incomeChange: 0,
      expenseChange: 0,
      transactionCount: 0,
    }
  }

  // Cumulative net balance = all recorded income - all recorded expenses
  let cumulativeIncome = 0
  let cumulativeExpense = 0
  const byMonth = new Map()

  for (const tx of allUserTx) {
    const amt = toNum(tx.amount)
    const ym = tx.transactionDate.toISOString().slice(0, 7)
    if (!byMonth.has(ym)) byMonth.set(ym, { income: 0, expense: 0 })
    const bucket = byMonth.get(ym)

    if (tx.transactionType === 'INCOME') {
      cumulativeIncome += amt
      bucket.income += amt
    } else {
      cumulativeExpense += amt
      bucket.expense += amt
    }
  }

  const scopedTx = cutoff
    ? allUserTx.filter((t) => t.transactionDate >= cutoff)
    : allUserTx

  const activeTx = scopedTx.length > 0 ? scopedTx : allUserTx
  let periodIncome = 0
  let periodExpenses = 0
  for (const tx of activeTx) {
    const amt = toNum(tx.amount)
    if (tx.transactionType === 'INCOME') periodIncome += amt
    else periodExpenses += amt
  }

  const months = Array.from(byMonth.keys()).sort()
  let incomeChange = 0
  let expenseChange = 0
  if (months.length >= 2) {
    const curr = byMonth.get(months[months.length - 1])
    const prev = byMonth.get(months[months.length - 2])
    if (prev.income > 0) {
      incomeChange = Number((((curr.income - prev.income) / prev.income) * 100).toFixed(1))
    }
    if (prev.expense > 0) {
      expenseChange = Number((((curr.expense - prev.expense) / prev.expense) * 100).toFixed(1))
    }
  }

  const savingsRate =
    periodIncome > 0
      ? Number((((periodIncome - periodExpenses) / periodIncome) * 100).toFixed(1))
      : 0

  return {
    hasData: true,
    calculatedNetBalance: Number((cumulativeIncome - cumulativeExpense).toFixed(2)),
    monthlyIncome: Number(periodIncome.toFixed(2)),
    monthlyExpenses: Number(periodExpenses.toFixed(2)),
    savingsRate,
    incomeChange,
    expenseChange,
    transactionCount: activeTx.length,
  }
}

export const getTrendsData = async (userId, range = 'all') => {
  const cutoff = getDateCutoff(range)
  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      ...(cutoff ? { transactionDate: { gte: cutoff } } : {}),
    },
    orderBy: { transactionDate: 'asc' },
  })

  const map = new Map()
  for (const tx of txs) {
    const ym = tx.transactionDate.toISOString().slice(0, 7)
    if (!map.has(ym)) {
      map.set(ym, { monthKey: ym, income: 0, expenses: 0 })
    }
    const entry = map.get(ym)
    const amt = toNum(tx.amount)
    if (tx.transactionType === 'INCOME') entry.income += amt
    else entry.expenses += amt
  }

  return Array.from(map.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => {
      const [y, mo] = m.monthKey.split('-')
      const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
      })
      const income = Number(m.income.toFixed(2))
      const expenses = Number(m.expenses.toFixed(2))
      return {
        monthKey: m.monthKey,
        month: label,
        income,
        expenses,
        net: Number((income - expenses).toFixed(2)),
      }
    })
}

const CATEGORY_COLORS = ['#8DFF00', '#38BDF8', '#F2B84B', '#8B6CE8', '#FF6262', '#6F786E', '#A3E635', '#2DD4BF']

export const getCategoriesData = async (userId, range = 'all') => {
  const cutoff = getDateCutoff(range)
  const grouped = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      transactionType: 'EXPENSE',
      ...(cutoff ? { transactionDate: { gte: cutoff } } : {}),
    },
    _sum: { amount: true },
    _count: { _all: true },
  })

  const sorted = grouped
    .map((g) => ({
      name: g.category,
      value: Number(toNum(g._sum.amount).toFixed(2)),
      count: g._count._all,
    }))
    .sort((a, b) => b.value - a.value)

  const total = sorted.reduce((acc, c) => acc + c.value, 0)

  return sorted.map((c, idx) => ({
    ...c,
    share: total > 0 ? Number(((c.value / total) * 100).toFixed(1)) : 0,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }))
}

export const getTransactionsData = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25))
  const search = String(query.search || '').trim()
  const category = String(query.category || '').trim()
  const type = String(query.type || '').trim().toUpperCase()
  const sort = String(query.sort || 'date_desc')

  const where = { userId }
  if (search) {
    where.OR = [
      { merchant: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category && category !== 'All') {
    where.category = category
  }
  if (type === 'INCOME' || type === 'EXPENSE') {
    where.transactionType = type
  }
  if (query.startDate || query.endDate) {
    where.transactionDate = {}
    if (query.startDate) where.transactionDate.gte = new Date(query.startDate)
    if (query.endDate) where.transactionDate.lte = new Date(query.endDate)
  }

  let orderBy = { transactionDate: 'desc' }
  if (sort === 'date_asc') orderBy = { transactionDate: 'asc' }
  else if (sort === 'amount_desc') orderBy = { amount: 'desc' }
  else if (sort === 'amount_asc') orderBy = { amount: 'asc' }

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return {
    items: rows.map((r) => ({
      id: r.id,
      analyticsId: r.analyticsId,
      merchant: r.merchant,
      description: r.description,
      amount: toNum(r.amount),
      transactionType: r.transactionType,
      type: r.transactionType.toLowerCase(),
      category: r.category,
      date: r.transactionDate.toISOString().slice(0, 10),
      displayDate: r.transactionDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Completed',
      method: 'Statement Import',
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export const getInsightsData = async (userId) => {
  const [recentAnalytics, expenses] = await Promise.all([
    prisma.analytics.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.transaction.findMany({
      where: { userId, transactionType: 'EXPENSE' },
      orderBy: { transactionDate: 'desc' },
      take: 250,
    }),
  ])

  const insights = []

  // 1. Persisted AI insights from uploaded statements
  for (const rec of recentAnalytics) {
    const list = Array.isArray(rec.aiInsights) ? rec.aiInsights : []
    list.forEach((text, idx) => {
      insights.push({
        id: `ai-${rec.id}-${idx}`,
        source: 'ai',
        category: 'AI Observation',
        severity: 'info',
        title: String(text),
        summary: `Generated from uploaded statement "${rec.fileName}".`,
        explanation: 'Produced by FinSight AI analysis on your persisted statement data.',
        impact: `Statement: ${rec.fileName}`,
      })
    })
  }

  // 2. Real statistical outlier detection (z-score > 2.0) on persisted expenses
  if (expenses.length >= 4) {
    const vals = expenses.map((e) => toNum(e.amount))
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
    const std = Math.sqrt(variance)

    if (std > 0) {
      const outliers = expenses.filter((e) => (toNum(e.amount) - mean) / std > 2.0)
      if (outliers.length > 0) {
        const top = outliers[0]
        const z = ((toNum(top.amount) - mean) / std).toFixed(1)
        insights.unshift({
          id: `calc-outlier-${top.id}`,
          source: 'calculated',
          category: 'Unusual Transaction',
          severity: 'anomaly',
          title: `${outliers.length} statistical spending outlier${outliers.length > 1 ? 's' : ''} detected in your ledger.`,
          summary: `${top.merchant} (₹${toNum(top.amount).toLocaleString('en-IN')}) is ${z}σ above your recorded expense average (₹${Math.round(mean).toLocaleString('en-IN')}).`,
          explanation: 'Computed directly from your PostgreSQL transactions using mean + 2σ threshold.',
          impact: `Flagged count: ${outliers.length}`,
        })
      }
    }
  }

  return insights
}

export const getForecastsData = async (userId) => {
  const trends = await getTrendsData(userId, 'all')
  if (trends.length === 0) {
    return {
      hasData: false,
      method: 'Moving-average baseline (requires uploaded statements)',
      series: [],
      projectedAvgExpense: 0,
      projectedSavings6M: 0,
    }
  }

  const avgIncome = trends.reduce((s, m) => s + m.income, 0) / trends.length
  const avgExpense = trends.reduce((s, m) => s + m.expenses, 0) / trends.length
  const avgNet = avgIncome - avgExpense

  const historical = trends.map((m, idx) => ({
    month: m.month,
    actualCashFlow: m.net,
    predictedCashFlow: idx === trends.length - 1 ? m.net : null,
    actualExpense: m.expenses,
    predictedExpense: idx === trends.length - 1 ? m.expenses : null,
  }))

  const lastKey = trends[trends.length - 1].monthKey
  const [lastYear, lastMonth] = lastKey.split('-').map(Number)
  const projected = []

  for (let i = 1; i <= 4; i++) {
    const d = new Date(lastYear, lastMonth - 1 + i, 1)
    const label = `${d.toLocaleString('en-US', { month: 'short' })} (Est)`
    projected.push({
      month: label,
      actualCashFlow: null,
      predictedCashFlow: Number(avgNet.toFixed(2)),
      actualExpense: null,
      predictedExpense: Number(avgExpense.toFixed(2)),
    })
  }

  return {
    hasData: true,
    method: 'Baseline rolling-average projection from your persisted historical transactions (not an AI prediction)',
    projectedAvgExpense: Number(avgExpense.toFixed(2)),
    projectedSavings6M: Number((avgNet * 6).toFixed(2)),
    series: [...historical, ...projected],
  }
}

export const getDocumentsByUserId = async (userId) => {
  const docs = await prisma.uploadedDocument.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      analytics: {
        select: {
          id: true,
          totalIncome: true,
          totalExpense: true,
          totalSavings: true,
          topTransactions: true,
        },
      },
    },
  })

  return docs.map((d) => ({
    id: d.id,
    analyticsId: d.analytics?.id || null,
    name: d.originalName,
    ext: d.fileType,
    fileSize: d.fileSize,
    sizeMB: Number((d.fileSize / (1024 * 1024)).toFixed(2)),
    sizeLabel:
      d.fileSize >= 1024 * 1024
        ? `${(d.fileSize / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(d.fileSize / 1024))} KB`,
    uploadedAt: d.createdAt.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: d.status,
    errorMessage: d.errorMessage,
    rowsParsed: d.rowsParsed,
    previewRows: Array.isArray(d.analytics?.topTransactions)
      ? d.analytics.topTransactions.map((t) => ({
          date: t.date || '-',
          desc: t.merchant || t.description || 'Transaction',
          cat: t.category || 'Other',
          amount: `-₹${Number(t.amount || 0).toLocaleString('en-IN')}`,
        }))
      : [],
  }))
}

export const getDocumentByIdForUser = async (userId, documentId) => {
  const doc = await prisma.uploadedDocument.findFirst({
    where: { id: documentId, userId },
    include: { analytics: true },
  })
  return doc
}

export const deleteDocumentForUser = async (userId, documentId) => {
  const doc = await prisma.uploadedDocument.findFirst({
    where: { id: documentId, userId },
  })
  if (!doc) return null

  await prisma.uploadedDocument.delete({ where: { id: doc.id } })
  if (doc.filePath) {
    await fs.unlink(doc.filePath).catch(() => {})
  }
  return doc
}

export const getAnalyticsByUserId = async (userId) => {
  return prisma.analytics.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      documentId: true,
      fileName: true,
      totalIncome: true,
      totalExpense: true,
      totalSavings: true,
      createdAt: true,
    },
  })
}

export const getAnalyticsById = async (userId, analyticsId) => {
  return prisma.analytics.findFirst({
    where: { id: analyticsId, userId },
  })
}
