import {
  Bell,
  Calendar,
  FolderOpen,
  Menu,
  Moon,
  Search,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LIVE_DATE_RANGES, useDashboard } from '../../context/DashboardContext'

const PAGE_TITLES = {
  '/dashboard': {
    title: 'Welcome back',
    subtitle: 'Live financial intelligence from your uploaded statements',
  },
  '/dashboard/analytics': {
    title: 'Financial Analytics',
    subtitle: 'Income trends, category comparisons, and financial health metrics',
  },
  '/dashboard/transactions': {
    title: 'Transactions Ledger',
    subtitle: 'Search, filter, sort, and inspect every recorded financial entry',
  },
  '/dashboard/budgets': {
    title: 'Monthly Budgets',
    subtitle: 'Track category ceilings, utilization progress, and overspending alerts',
  },
  '/dashboard/insights': {
    title: 'AI Financial Insights',
    subtitle: 'Simulated pattern analysis, outlier flags, and savings suggestions',
  },
  '/dashboard/forecasts': {
    title: 'Cash Flow Forecasts',
    subtitle: 'Historical performance vs simulated future cash-flow projections',
  },
  '/dashboard/reports': {
    title: 'Performance Reports',
    subtitle: 'Monthly summaries and downloadable CSV/JSON financial statements',
  },
  '/dashboard/documents': {
    title: 'My Documents',
    subtitle: 'Complete statement library, parser status, and file management',
  },
  '/dashboard/settings': {
    title: 'Workspace Settings',
    subtitle: 'Manage profile, currency, theme, and notification preferences',
  },
}

export function DashboardHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const {
    theme,
    toggleTheme,
    dateRange,
    setDateRange,
    globalSearch,
    setGlobalSearch,
    setMobileSidebarOpen,
    setMobileDocsOpen,
    notifications,
    markAllNotificationsRead,
    profile,
  } = useDashboard()

  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = notifications.filter((n) => n.unread).length
  const meta = PAGE_TITLES[pathname] || PAGE_TITLES['/dashboard']

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (pathname !== '/dashboard/transactions') {
      navigate('/dashboard/transactions')
    }
  }

  return (
    <header
      className="sticky top-0 z-30 border-b px-4 py-3.5 backdrop-blur-md sm:px-6"
      style={{
        backgroundColor:
          theme === 'dark'
            ? 'rgba(9, 11, 9, 0.9)'
            : 'rgba(255, 255, 255, 0.92)',
        borderColor: 'var(--dash-border)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile Menu + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border lg:hidden"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
              color: 'var(--dash-text)',
            }}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              {pathname === '/dashboard'
                ? `Good morning, ${profile.fullName.split(' ')[0]}`
                : meta.title}
            </h1>
            <p
              className="truncate text-xs"
              style={{ color: 'var(--dash-muted)' }}
            >
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date Selector, Search, Notifications, Theme, Docs Toggle, Profile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Date-Range Selector */}
          <div
            className="relative hidden items-center rounded-xl border px-2.5 py-1.5 sm:inline-flex"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
            }}
          >
            <Calendar
              className="mr-2 h-3.5 w-3.5 shrink-0"
              style={{ color: 'var(--dash-accent)' }}
            />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="cursor-pointer bg-transparent pr-1 text-xs font-medium focus:outline-none"
              style={{ color: 'var(--dash-text)' }}
            >
              {LIVE_DATE_RANGES.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  style={{
                    backgroundColor: theme === 'dark' ? '#101310' : '#FFFFFF',
                    color: theme === 'dark' ? '#F5F7F3' : '#0C100B',
                  }}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: 'var(--dash-muted)' }}
            />
            <input
              type="search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search transactions..."
              aria-label="Search transactions"
              className="w-44 rounded-xl border py-1.5 pr-3 pl-8 text-xs transition-all focus:w-56 focus:outline-none"
              style={{
                backgroundColor: 'var(--dash-card)',
                borderColor: 'var(--dash-border)',
                color: 'var(--dash-text)',
              }}
            />
          </form>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Toggle notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition hover:opacity-90"
              style={{
                backgroundColor: 'var(--dash-card)',
                borderColor: 'var(--dash-border)',
                color: 'var(--dash-text)',
              }}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold text-[#0B140E]"
                  style={{ backgroundColor: 'var(--dash-accent)' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl border p-3 shadow-2xl"
                style={{
                  backgroundColor: 'var(--dash-bg-secondary)',
                  borderColor: 'var(--dash-border)',
                }}
              >
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="text-xs font-bold">Notifications</span>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium hover:underline"
                    style={{ color: 'var(--dash-accent)' }}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border p-2.5 text-xs"
                      style={{
                        backgroundColor: 'var(--dash-card)',
                        borderColor: n.unread
                          ? 'rgba(141, 255, 0, 0.28)'
                          : 'var(--dash-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{n.title}</span>
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: 'var(--dash-muted)' }}
                        >
                          {n.time}
                        </span>
                      </div>
                      <p
                        className="mt-1 text-[11px] leading-relaxed"
                        style={{ color: 'var(--dash-muted)' }}
                      >
                        {n.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
              color: 'var(--dash-accent)',
            }}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Right Document Drawer Trigger on < xl screens */}
          <button
            type="button"
            onClick={() => setMobileDocsOpen(true)}
            aria-label="Open documents workspace"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium xl:hidden"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
              color: 'var(--dash-text)',
            }}
          >
            <FolderOpen className="h-4 w-4" style={{ color: 'var(--dash-accent)' }} />
            <span className="hidden sm:inline">Docs</span>
          </button>

          {/* Profile Pill */}
          <Link
            to="/dashboard/settings"
            className="hidden items-center gap-2 rounded-xl border px-2.5 py-1.5 transition hover:opacity-95 sm:inline-flex"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
            }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-[#0B140E]"
              style={{ backgroundColor: 'var(--dash-accent)' }}
            >
              {profile.fullName.charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold">{profile.fullName}</p>
              <p
                className="text-[10px]"
                style={{ color: 'var(--dash-accent)' }}
              >
                {profile.plan}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
