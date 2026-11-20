import { API_BASE_URL, apiRequest } from './apiClient'

export async function getOverview(range = 'all') {
  const res = await apiRequest(`/analytic/overview?range=${encodeURIComponent(range)}`)
  return res.data
}

export async function getTrends(range = 'all') {
  const res = await apiRequest(`/analytic/trends?range=${encodeURIComponent(range)}`)
  return res.data || []
}

export async function getCategories(range = 'all') {
  const res = await apiRequest(`/analytic/categories?range=${encodeURIComponent(range)}`)
  return res.data || []
}

export async function getCashflow(range = 'all') {
  const res = await apiRequest(`/analytic/cashflow?range=${encodeURIComponent(range)}`)
  return res.data || []
}

export async function getTransactions(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'All') {
      qs.set(k, String(v))
    }
  })
  const queryStr = qs.toString() ? `?${qs.toString()}` : ''
  const res = await apiRequest(`/analytic/transactions${queryStr}`)
  return res.data
}

export async function getInsights() {
  const res = await apiRequest('/analytic/insights')
  return res.data || []
}

export async function getForecasts() {
  const res = await apiRequest('/analytic/forecasts')
  return res.data
}

export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('statement', file)
  return apiRequest('/analytic/upload', {
    method: 'POST',
    body: formData,
  })
}

export async function getDocuments() {
  const res = await apiRequest('/analytic/documents')
  return res.data || []
}

export async function deleteDocument(documentId) {
  return apiRequest(`/analytic/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  })
}

export function getDocumentDownloadUrl(documentId) {
  return `${API_BASE_URL}/analytic/documents/${encodeURIComponent(documentId)}/download`
}

export async function getBudgets(month, year) {
  const qs = new URLSearchParams()
  if (month) qs.set('month', String(month))
  if (year) qs.set('year', String(year))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const res = await apiRequest(`/budgets${suffix}`)
  return res.data || []
}

export async function saveBudget({ category, monthlyLimit, month, year }) {
  const res = await apiRequest('/budgets', {
    method: 'POST',
    body: { category, monthlyLimit, month, year },
  })
  return res.data
}

export async function deleteBudget(budgetId) {
  return apiRequest(`/budgets/${encodeURIComponent(budgetId)}`, {
    method: 'DELETE',
  })
}

export function triggerFileDownload(filename, content, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
