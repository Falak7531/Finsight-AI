import { prisma } from '../config/prisma.js'

const COLORS = ['#8DFF00', '#38BDF8', '#F2B84B', '#8B6CE8', '#FF6262', '#6F786E']

export const getBudgetsForUser = async (userId, month, year) => {
  const now = new Date()
  const targetMonth = Number(month) || now.getMonth() + 1
  const targetYear = Number(year) || now.getFullYear()

  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1))
  const end = new Date(Date.UTC(targetYear, targetMonth, 1))

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month: targetMonth, year: targetYear },
      orderBy: { category: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        transactionType: 'EXPENSE',
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
  ])

  const spendMap = new Map(
    expenses.map((e) => [e.category, Number(e._sum.amount || 0)])
  )

  return budgets.map((b, idx) => ({
    id: b.id,
    category: b.category,
    limit: Number(b.monthlyLimit),
    spent: Number((spendMap.get(b.category) || 0).toFixed(2)),
    month: b.month,
    year: b.year,
    color: COLORS[idx % COLORS.length],
  }))
}

export const upsertBudgetForUser = async (
  userId,
  { category, monthlyLimit, month, year }
) => {
  const cat = String(category || '').trim()
  const limit = Number(monthlyLimit)
  if (!cat) {
    throw Object.assign(new Error('Category is required.'), { status: 400 })
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    throw Object.assign(new Error('Monthly limit must be a positive number.'), {
      status: 400,
    })
  }

  const now = new Date()
  const targetMonth = Number(month) || now.getMonth() + 1
  const targetYear = Number(year) || now.getFullYear()

  const record = await prisma.budget.upsert({
    where: {
      userId_category_month_year: {
        userId,
        category: cat,
        month: targetMonth,
        year: targetYear,
      },
    },
    update: { monthlyLimit: limit },
    create: {
      userId,
      category: cat,
      monthlyLimit: limit,
      month: targetMonth,
      year: targetYear,
    },
  })

  return {
    id: record.id,
    category: record.category,
    limit: Number(record.monthlyLimit),
    month: record.month,
    year: record.year,
  }
}

export const deleteBudgetForUser = async (userId, budgetId) => {
  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  })
  if (!existing) return null
  await prisma.budget.delete({ where: { id: existing.id } })
  return existing
}
