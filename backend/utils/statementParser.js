import crypto from 'crypto'
import { parse as parseCsvSync } from 'csv-parse/sync'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { callAI } from './AI.js'
import { extractPdfText } from './pdfParser.js'

const KEYWORD_CATEGORIES = [
  ['Food & Dining', ['swiggy', 'zomato', 'blinkit', 'restaurant', 'cafe', 'coffee', 'bakery', 'dining', 'pizza', 'burger', 'food', 'grocer']],
  ['Transportation', ['uber', 'ola', 'rapido', 'metro', 'irctc', 'petrol', 'fuel', 'parking', 'toll', 'fastag', 'flight', 'indigo']],
  ['Rent', ['rent', 'landlord', 'residency', 'apartment', 'housing', 'maintenance']],
  ['Utilities', ['bescom', 'electricity', 'airtel', 'jio', 'broadband', 'fiber', 'water', 'gas', 'recharge', 'bill', 'utility']],
  ['Shopping', ['amazon', 'flipkart', 'myntra', 'croma', 'zudio', 'mall', 'store', 'mart', 'electronics', 'clothing']],
  ['Entertainment', ['bookmyshow', 'netflix', 'spotify', 'prime', 'hotstar', 'movie', 'cinema', 'game']],
  ['Healthcare', ['apollo', 'pharma', 'medical', 'hospital', 'clinic', 'doctor', 'lab', 'health']],
  ['Education', ['coursera', 'udemy', 'tuition', 'college', 'university', 'book', 'exam', 'school']],
]

export function inferCategory(text, type) {
  if (type === 'INCOME') return 'Income'
  const lower = String(text || '').toLowerCase()
  for (const [category, keywords] of KEYWORD_CATEGORIES) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return 'Other'
}

function parseNumeric(val) {
  if (val === null || val === undefined || val === '') return NaN
  if (typeof val === 'number') return val
  const cleaned = String(val)
    .replace(/[₹$,\s]/g, '')
    .replace(/\(([^)]+)\)/, '-$1')
  return Number(cleaned)
}

function parseDateValue(val) {
  if (!val) return new Date()
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val
  if (typeof val === 'number' && val > 20000 && val < 80000) {
    // Excel serial date
    const utcDays = Math.floor(val - 25569)
    return new Date(utcDays * 86400 * 1000)
  }
  const str = String(val).trim()
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2]) - 1
    let year = Number(dmy[3])
    if (year < 100) year += 2000
    const d = new Date(Date.UTC(year, month, day))
    if (!Number.isNaN(d.getTime())) return d
  }
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function findColumnKey(row, candidates) {
  const keys = Object.keys(row)
  for (const cand of candidates) {
    const match = keys.find((k) => k.toLowerCase().trim() === cand)
    if (match) return match
  }
  for (const cand of candidates) {
    const match = keys.find((k) => k.toLowerCase().includes(cand))
    if (match) return match
  }
  return null
}

function normalizeTabularRows(rows, userId) {
  const transactions = []
  const seenInBatch = new Map()

  for (const row of rows) {
    const dateKey = findColumnKey(row, ['date', 'transaction_date', 'txn_date', 'initiated_at', 'value date'])
    const descKey = findColumnKey(row, ['description', 'narration', 'particulars', 'merchant', 'details', 'note'])
    const merchantKey = findColumnKey(row, ['merchant', 'merchant_name', 'payee', 'counterparty'])
    const amountKey = findColumnKey(row, ['amount', 'txn_amount', 'value'])
    const debitKey = findColumnKey(row, ['debit', 'withdrawal', 'dr', 'outflow'])
    const creditKey = findColumnKey(row, ['credit', 'deposit', 'cr', 'inflow'])
    const typeKey = findColumnKey(row, ['type', 'transaction_type', 'dr/cr', 'txn_type'])
    const catKey = findColumnKey(row, ['category', 'biller_category'])

    const description = String((descKey && row[descKey]) || (merchantKey && row[merchantKey]) || '').trim()
    const merchant = String((merchantKey && row[merchantKey]) || description || 'Unknown').trim().slice(0, 120)

    let amount = NaN
    let transactionType = 'EXPENSE'

    const debitVal = debitKey ? parseNumeric(row[debitKey]) : NaN
    const creditVal = creditKey ? parseNumeric(row[creditKey]) : NaN
    const rawAmt = amountKey ? parseNumeric(row[amountKey]) : NaN

    if (Number.isFinite(creditVal) && creditVal > 0) {
      amount = creditVal
      transactionType = 'INCOME'
    } else if (Number.isFinite(debitVal) && debitVal > 0) {
      amount = debitVal
      transactionType = 'EXPENSE'
    } else if (Number.isFinite(rawAmt) && rawAmt !== 0) {
      const typeStr = String((typeKey && row[typeKey]) || '').toUpperCase()
      if (typeStr.includes('INCOME') || typeStr === 'CR' || typeStr === 'CREDIT') {
        transactionType = 'INCOME'
        amount = Math.abs(rawAmt)
      } else if (typeStr.includes('EXPENSE') || typeStr === 'DR' || typeStr === 'DEBIT') {
        transactionType = 'EXPENSE'
        amount = Math.abs(rawAmt)
      } else if (rawAmt > 0 && /salary|stipend|payroll|freelance|interest|refund|credit/i.test(description)) {
        transactionType = 'INCOME'
        amount = rawAmt
      } else if (rawAmt < 0) {
        transactionType = 'EXPENSE'
        amount = Math.abs(rawAmt)
      } else {
        transactionType = 'EXPENSE'
        amount = rawAmt
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) continue

    const transactionDate = parseDateValue(dateKey ? row[dateKey] : null)
    const rawCat = catKey ? String(row[catKey] || '').trim() : ''
    const category = rawCat || inferCategory(`${merchant} ${description}`, transactionType)

    const dateIso = transactionDate.toISOString().slice(0, 10)
    const baseKey = `${userId}|${dateIso}|${merchant.toLowerCase()}|${amount.toFixed(2)}|${transactionType}`
    const occurrence = (seenInBatch.get(baseKey) || 0) + 1
    seenInBatch.set(baseKey, occurrence)

    const dedupeHash = crypto
      .createHash('sha256')
      .update(`${baseKey}|${occurrence}`)
      .digest('hex')

    transactions.push({
      merchant: merchant || 'Transaction',
      description: description || merchant || 'Financial transaction',
      amount: Number(amount.toFixed(2)),
      transactionType,
      category,
      transactionDate,
      dedupeHash,
    })
  }

  return transactions
}

export function aggregateTransactions(transactions) {
  let totalIncome = 0
  let totalExpense = 0
  const categoryBreakdown = {}
  const monthlyBreakdown = {}

  for (const tx of transactions) {
    const ym = tx.transactionDate.toISOString().slice(0, 7)
    if (tx.transactionType === 'INCOME') {
      totalIncome += tx.amount
    } else {
      totalExpense += tx.amount
      categoryBreakdown[tx.category] = Number(
        ((categoryBreakdown[tx.category] || 0) + tx.amount).toFixed(2)
      )
      monthlyBreakdown[ym] = Number(
        ((monthlyBreakdown[ym] || 0) + tx.amount).toFixed(2)
      )
    }
  }

  const topTransactions = transactions
    .filter((t) => t.transactionType === 'EXPENSE')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      merchant: t.merchant,
      amount: t.amount,
      category: t.category,
      date: t.transactionDate.toISOString().slice(0, 10),
      description: t.description,
    }))

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpense: Number(totalExpense.toFixed(2)),
    totalSavings: Number((totalIncome - totalExpense).toFixed(2)),
    categoryBreakdown,
    monthlyBreakdown,
    topTransactions,
  }
}

function buildFallbackInsights(summary) {
  const insights = []
  const cats = Object.entries(summary.categoryBreakdown || {}).sort((a, b) => b[1] - a[1])
  if (cats.length > 0 && summary.totalExpense > 0) {
    const [topCat, topAmt] = cats[0]
    const pct = ((topAmt / summary.totalExpense) * 100).toFixed(1)
    insights.push(`${topCat} is your largest expense category at ₹${topAmt.toLocaleString('en-IN')} (${pct}% of recorded spending).`)
  }
  if (summary.totalIncome > 0) {
    const rate = (((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)
    insights.push(`Calculated savings rate for this statement is ${rate}% (Net: ₹${summary.totalSavings.toLocaleString('en-IN')}).`)
  }
  if (summary.topTransactions?.length > 0) {
    const biggest = summary.topTransactions[0]
    insights.push(`Largest single expense recorded: ${biggest.merchant} for ₹${Number(biggest.amount).toLocaleString('en-IN')}.`)
  }
  return insights.length > 0
    ? insights
    : ['Statement parsed and stored successfully. Upload additional months to unlock deeper trend comparisons.']
}

export async function parseFinancialStatement(filePath, ext, userId) {
  if (ext === 'CSV' || ext === 'XLSX') {
    let rawRows = []
    if (ext === 'CSV') {
      const content = fs.readFileSync(filePath, 'utf-8')
      rawRows = parseCsvSync(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })
    } else {
      const fileBuf = fs.readFileSync(filePath)
      const workbook = XLSX.read(fileBuf, { type: 'buffer' })
      const firstSheet = workbook.SheetNames[0]
      if (!firstSheet) {
        throw Object.assign(new Error('XLSX workbook contains no sheets.'), { status: 400 })
      }
      rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' })
    }

    const transactions = normalizeTabularRows(rawRows, userId)
    if (transactions.length === 0) {
      throw Object.assign(
        new Error('No valid financial transactions were found. Ensure the file has Date, Description, and Amount (or Debit/Credit) columns.'),
        { status: 400 }
      )
    }

    const summary = aggregateTransactions(transactions)

    // Optionally enrich with Groq AI insights using structured summary text (never raw binary)
    let aiInsights = buildFallbackInsights(summary)
    if (process.env.GROQ_API_KEY) {
      try {
        const compactSummary = JSON.stringify({
          total_income: summary.totalIncome,
          total_expense: summary.totalExpense,
          total_savings: summary.totalSavings,
          category_breakdown: summary.categoryBreakdown,
          monthly_breakdown: summary.monthlyBreakdown,
          sample_transactions: transactions.slice(0, 25).map((t) => ({
            date: t.transactionDate.toISOString().slice(0, 10),
            merchant: t.merchant,
            amount: t.amount,
            type: t.transactionType,
            category: t.category,
          })),
        })
        const aiResult = await callAI(compactSummary)
        if (Array.isArray(aiResult?.ai_insights) && aiResult.ai_insights.length > 0) {
          aiInsights = aiResult.ai_insights
        }
      } catch (aiErr) {
        console.warn('Groq AI enrichment unavailable; using calculated insights:', aiErr.message)
      }
    }

    return {
      ...summary,
      aiInsights,
      transactions,
    }
  }

  // PDF Path: extract text -> Groq AI structured JSON
  const statementText = await extractPdfText(filePath)
  if (!statementText || !statementText.trim()) {
    throw Object.assign(new Error('Unable to extract readable text from the PDF statement.'), { status: 400 })
  }

  let aiData
  try {
    aiData = await callAI(statementText)
  } catch (err) {
    throw Object.assign(
      new Error(`AI PDF statement analysis failed: ${err.message}`),
      { status: 502 }
    )
  }

  const rawTop = Array.isArray(aiData.top_transactions) ? aiData.top_transactions : []
  const pdfTransactions = rawTop
    .filter((t) => Number(t.amount) > 0)
    .map((t, idx) => {
      const txDate = parseDateValue(t.date)
      const merchant = String(t.merchant || t.description || 'PDF Transaction').slice(0, 120)
      const amount = Number(Number(t.amount).toFixed(2))
      const dedupeHash = crypto
        .createHash('sha256')
        .update(`${userId}|${txDate.toISOString().slice(0, 10)}|${merchant.toLowerCase()}|${amount.toFixed(2)}|EXPENSE|${idx + 1}`)
        .digest('hex')
      return {
        merchant,
        description: String(t.description || merchant),
        amount,
        transactionType: 'EXPENSE',
        category: String(t.category || 'Other'),
        transactionDate: txDate,
        dedupeHash,
      }
    })

  return {
    totalIncome: Number(aiData.total_income || 0),
    totalExpense: Number(aiData.total_expense || 0),
    totalSavings: Number(aiData.total_savings ?? Number(aiData.total_income || 0) - Number(aiData.total_expense || 0)),
    categoryBreakdown: aiData.category_breakdown || {},
    monthlyBreakdown: aiData.monthly_breakdown || {},
    topTransactions: rawTop,
    aiInsights: Array.isArray(aiData.ai_insights) ? aiData.ai_insights : [],
    transactions: pdfTransactions,
  }
}
