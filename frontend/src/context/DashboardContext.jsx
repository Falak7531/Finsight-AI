import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { formatMoney } from '../data/dashboardData'
import * as dashboardService from '../services/dashboardService'
import { useAuth } from './AuthContext'

const DashboardContext = createContext(null)

const ALLOWED_EXTENSIONS = ['CSV', 'XLSX', 'PDF']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB (aligned with backend Multer limit)

// eslint-disable-next-line react-refresh/only-export-components
export const LIVE_DATE_RANGES = [
  { id: 'all', label: 'All Recorded Data', shortLabel: 'All Time' },
  { id: 'this_month', label: 'Last 30 Days', shortLabel: '30 Days' },
  { id: 'last_3m', label: 'Last 3 Months', shortLabel: '3 Months' },
  { id: 'last_6m', label: 'Last 6 Months', shortLabel: '6 Months' },
  { id: 'ytd', label: 'Last 12 Months', shortLabel: '12 Months' },
]

export function DashboardProvider({ children }) {
  const { user, updateUserProfile } = useAuth()

  // 1. Client preference state
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('finsight_dash_theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [currency, setCurrency] = useState('INR')
  const [dateRange, setDateRange] = useState('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    overspendAlerts: true,
    unusualSpendFlags: true,
    documentProcessing: true,
    monthlyDigest: false,
  })

  // 2. Temporary UI state
  const [globalSearch, setGlobalSearch] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [docToDelete, setDocToDelete] = useState(null)

  // 3. Server state (from PostgreSQL via Express API)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [categories, setCategories] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [insights, setInsights] = useState([])
  const [forecasts, setForecasts] = useState(null)
  const [documents, setDocuments] = useState([])
  const [budgets, setBudgets] = useState([])
  const [notifications, setNotifications] = useState([])

  // Guard against stale async responses overwriting newer fetches
  const fetchCounterRef = useRef(0)

  const refreshDashboard = useCallback(async () => {
    if (!user) return
    const reqId = ++fetchCounterRef.current
    setLoading(true)
    setApiError('')

    try {
      const [ov, tr, cats, txs, ins, fc, docs, buds] = await Promise.all([
        dashboardService.getOverview(dateRange),
        dashboardService.getTrends(dateRange),
        dashboardService.getCategories(dateRange),
        dashboardService.getTransactions({ page: 1, limit: 10, sort: 'date_desc' }),
        dashboardService.getInsights(),
        dashboardService.getForecasts(),
        dashboardService.getDocuments(),
        dashboardService.getBudgets(),
      ])

      if (reqId !== fetchCounterRef.current) return

      setOverview(ov)
      setTrends(tr)
      setCategories(cats)
      setRecentTransactions(txs?.items || [])
      setInsights(ins)
      setForecasts(fc)
      setDocuments(docs)
      setBudgets(buds)

      // Derive real notifications from overspent budgets & recent processed docs
      const nextNotifs = []
      buds
        .filter((b) => b.spent > b.limit)
        .forEach((b) => {
          nextNotifs.push({
            id: `n-bud-${b.id}`,
            title: `${b.category} budget exceeded`,
            body: `Spent ${formatMoney(b.spent, currency)} against your ${formatMoney(b.limit, currency)} cap.`,
            time: 'Active',
            unread: true,
          })
        })
      if (docs[0]) {
        nextNotifs.push({
          id: `n-doc-${docs[0].id}`,
          title: `${docs[0].name} (${docs[0].status})`,
          body: `${docs[0].rowsParsed} transactions parsed in PostgreSQL.`,
          time: docs[0].uploadedAt,
          unread: false,
        })
      }
      setNotifications(nextNotifs)
    } catch (err) {
      if (reqId !== fetchCounterRef.current) return
      setApiError(err.message || 'Failed to load financial data from server.')
    } finally {
      if (reqId === fetchCounterRef.current) {
        setLoading(false)
      }
    }
  }, [user, dateRange, currency])

  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('finsight_dash_theme', next)
      } catch {
        // ignore
      }
      return next
    })
  }

  const handleUploadFiles = async (fileList) => {
    setUploadError('')
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        const ext = (file.name.split('.').pop() || '').toUpperCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          setUploadError(
            `"${file.name}" is unsupported. Please upload PDF, CSV, or XLSX files (max 10 MB).`
          )
          continue
        }
        if (file.size === 0) {
          setUploadError(`"${file.name}" is empty.`)
          continue
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          setUploadError(`"${file.name}" exceeds the 10 MB upload limit.`)
          continue
        }

        try {
          await dashboardService.uploadDocument(file)
        } catch (err) {
          setUploadError(err.message || `Failed to process "${file.name}".`)
        }
      }
      await refreshDashboard()
    } finally {
      setUploading(false)
    }
  }

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return
    try {
      await dashboardService.deleteDocument(docToDelete.id)
      if (previewDoc?.id === docToDelete.id) setPreviewDoc(null)
      setDocToDelete(null)
      await refreshDashboard()
    } catch (err) {
      setUploadError(err.message || 'Failed to delete document.')
      setDocToDelete(null)
    }
  }

  const downloadDocument = (doc) => {
    const url = dashboardService.getDocumentDownloadUrl(doc.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const saveBudgetLimit = async (category, monthlyLimit) => {
    await dashboardService.saveBudget({ category, monthlyLimit })
    await refreshDashboard()
  }

  const removeBudget = async (budgetId) => {
    await dashboardService.deleteBudget(budgetId)
    await refreshDashboard()
  }

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const formatAmount = useCallback(
    (val) => formatMoney(val, currency),
    [currency]
  )

  const activeRangeObj = useMemo(
    () =>
      LIVE_DATE_RANGES.find((r) => r.id === dateRange) || LIVE_DATE_RANGES[0],
    [dateRange]
  )

  const totalStorageMB = useMemo(() => {
    const sumBytes = documents.reduce((acc, d) => acc + (d.fileSize || 0), 0)
    return Number((sumBytes / (1024 * 1024)).toFixed(2))
  }, [documents])

  const profile = useMemo(
    () => ({
      fullName: user?.name || 'FinSight User',
      email: user?.email || '',
      plan: 'Connected Account',
    }),
    [user]
  )

  const value = {
    theme,
    setTheme,
    toggleTheme,
    currency,
    setCurrency,
    formatAmount,
    dateRange,
    setDateRange,
    activeRangeObj,
    globalSearch,
    setGlobalSearch,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    mobileDocsOpen,
    setMobileDocsOpen,
    loading,
    apiError,
    refreshDashboard,
    overview,
    trends,
    categories,
    transactions: recentTransactions,
    insights,
    forecasts,
    documents,
    uploading,
    uploadError,
    setUploadError,
    handleUploadFiles,
    previewDoc,
    setPreviewDoc,
    docToDelete,
    setDocToDelete,
    confirmDeleteDocument,
    downloadDocument,
    totalStorageMB,
    budgets,
    saveBudgetLimit,
    removeBudget,
    notifications,
    markAllNotificationsRead,
    profile,
    updateUserProfile,
    notifPrefs,
    setNotifPrefs,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
