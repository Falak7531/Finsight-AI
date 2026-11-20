import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { AIInsightsPage } from './pages/dashboard/AIInsightsPage'
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage'
import { BudgetsPage } from './pages/dashboard/BudgetsPage'
import { DocumentsPage } from './pages/dashboard/DocumentsPage'
import { ForecastsPage } from './pages/dashboard/ForecastsPage'
import { OverviewPage } from './pages/dashboard/OverviewPage'
import { ReportsPage } from './pages/dashboard/ReportsPage'
import { SettingsPage } from './pages/dashboard/SettingsPage'
import { TransactionsPage } from './pages/dashboard/TransactionsPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected FinSight-AI 3-Column Financial Intelligence Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="insights" element={<AIInsightsPage />} />
            <Route path="forecasts" element={<ForecastsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
