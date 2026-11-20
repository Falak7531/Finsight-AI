import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'

const PRIMARY_NAV = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Analytics', to: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Transactions', to: '/dashboard/transactions', icon: ArrowLeftRight },
  { label: 'Budgets', to: '/dashboard/budgets', icon: PiggyBank },
  { label: 'AI Insights', to: '/dashboard/insights', icon: Sparkles },
  { label: 'Forecasts', to: '/dashboard/forecasts', icon: TrendingUp },
  { label: 'Reports', to: '/dashboard/reports', icon: FileBarChart2 },
]

const DATA_NAV = [
  { label: 'My Documents', to: '/dashboard/documents', icon: FolderOpen },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
]

function SidebarBrand({ collapsed }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 focus:outline-none"
      title="Back to FinSight-AI Home"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
        style={{
          backgroundColor: 'var(--dash-accent-bg)',
          borderColor: 'rgba(141, 255, 0, 0.28)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M5 24L13 16L19 20L30 9"
            stroke="#8DFF00"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="30" cy="9" r="3" fill="#A4FF32" />
        </svg>
      </span>
      {!collapsed && (
        <span className="font-display text-base font-bold tracking-tight">
          FinSight<span style={{ color: 'var(--dash-accent)' }}>·AI</span>
        </span>
      )}
    </Link>
  )
}

export function DashboardSidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    profile,
  } = useDashboard()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const renderLinks = (items, isMobile = false) =>
    items.map((item) => {
      const Icon = item.icon
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => isMobile && setMobileSidebarOpen(false)}
          title={sidebarCollapsed && !isMobile ? item.label : undefined}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              sidebarCollapsed && !isMobile ? 'justify-center px-2' : ''
            } ${isActive ? 'font-semibold' : 'opacity-80 hover:opacity-100'}`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--dash-accent-bg)' : 'transparent',
            color: isActive ? 'var(--dash-accent)' : 'var(--dash-muted)',
            border: isActive
              ? '1px solid rgba(141, 255, 0, 0.22)'
              : '1px solid transparent',
          })}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {(!sidebarCollapsed || isMobile) && (
            <span className="truncate">{item.label}</span>
          )}
        </NavLink>
      )
    })

  const sidebarBody = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between p-3.5">
      <div>
        {/* Brand + Collapse */}
        <div className="flex items-center justify-between px-1 pb-5 pt-1">
          <SidebarBrand collapsed={sidebarCollapsed && !isMobile} />
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
              className="rounded-lg p-1.5"
              style={{ color: 'var(--dash-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="rounded-lg border p-1 transition hover:opacity-100 opacity-75"
              style={{
                borderColor: 'var(--dash-border)',
                color: 'var(--dash-muted)',
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav aria-label="Dashboard Navigation" className="space-y-1">
          {renderLinks(PRIMARY_NAV, isMobile)}
        </nav>

        {/* Data Section */}
        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: 'var(--dash-border)' }}
        >
          {(!sidebarCollapsed || isMobile) && (
            <p
              className="mb-2 px-3 font-mono text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--dash-muted)' }}
            >
              Workspace
            </p>
          )}
          <div className="space-y-1">{renderLinks(DATA_NAV, isMobile)}</div>
        </div>
      </div>

      {/* Bottom AI Card + Profile */}
      <div className="space-y-3 pt-4">
        {(!sidebarCollapsed || isMobile) && (
          <div
            className="rounded-2xl border p-3.5"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">AI Assistant</span>
              <span
                className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase"
                style={{
                  backgroundColor: 'var(--dash-accent-bg)',
                  color: 'var(--dash-accent)',
                }}
              >
                Demo
              </span>
            </div>
            <p
              className="mt-1.5 text-[11px] leading-relaxed"
              style={{ color: 'var(--dash-muted)' }}
            >
              Explore simulated spending patterns and anomaly explanations.
            </p>
            <Link
              to="/dashboard/insights"
              onClick={() => isMobile && setMobileSidebarOpen(false)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#050605] transition hover:opacity-95"
              style={{
                backgroundColor: 'var(--dash-accent)',
                boxShadow: 'var(--dash-glow)',
              }}
            >
              Ask FinSight AI
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div
          className={`flex items-center gap-2 rounded-xl border p-2.5 ${
            sidebarCollapsed && !isMobile ? 'flex-col justify-center' : ''
          }`}
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
          }}
        >
          <Link
            to="/dashboard/settings"
            onClick={() => isMobile && setMobileSidebarOpen(false)}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#050605]"
              style={{ backgroundColor: 'var(--dash-accent)' }}
            >
              {profile.fullName.charAt(0).toUpperCase()}
            </span>
            {(!sidebarCollapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{profile.fullName}</p>
                <p
                  className="truncate text-[10px]"
                  style={{ color: 'var(--dash-muted)' }}
                >
                  {profile.email}
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-1.5 transition hover:bg-red-500/15 hover:text-[#FF6262]"
            style={{ color: 'var(--dash-muted)' }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={`hidden shrink-0 border-r transition-all duration-200 lg:block ${
          sidebarCollapsed ? 'w-[76px]' : 'w-[244px]'
        }`}
        style={{
          backgroundColor: 'var(--dash-bg-secondary)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {sidebarBody(false)}
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="h-full w-[268px] border-r shadow-2xl"
            style={{
              backgroundColor: 'var(--dash-bg-secondary)',
              borderColor: 'var(--dash-border)',
            }}
          >
            {sidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  )
}
