import { Info, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboard } from '../../context/DashboardContext'

export function ForecastsPage() {
  const { formatAmount, forecasts, theme } = useDashboard()

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#151A14' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#20251F' : '#DCE2DA'}`,
    borderRadius: '12px',
    fontSize: '12px',
    color: theme === 'dark' ? '#F5F7F3' : '#0C100B',
  }
  const axisColor = theme === 'dark' ? '#6F786E' : '#556054'
  const gridColor = theme === 'dark' ? 'rgba(32,37,31,0.75)' : 'rgba(205,214,203,0.7)'

  if (!forecasts?.hasData) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
        <p className="text-sm font-semibold">Insufficient historical data for forecasting</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>
          Upload at least one financial statement to compute baseline cash-flow projections from your actual history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)', color: 'var(--dash-muted)' }}>
        <Info className="h-4 w-4 shrink-0" style={{ color: 'var(--dash-accent)' }} />
        <span>{forecasts.method}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Projected 6-Month Net Cash Flow</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--dash-accent)' }}>
            {formatAmount(forecasts.projectedSavings6M)}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>Baseline rolling average</p>
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Estimated Avg Monthly Spend</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">
            {formatAmount(forecasts.projectedAvgExpense)}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>Based on persisted history</p>
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Method</p>
            <TrendingUp className="h-4 w-4" style={{ color: 'var(--dash-accent)' }} />
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold">Baseline Calculation</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>Not an AI prediction</p>
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Historical vs Projected Net Cash Flow</h2>
            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
              Solid line = persisted actuals; dashed line = baseline moving-average projection
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--dash-muted)' }}>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#8DFF00]" /> Historical</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-[#B8F36B]" /> Projected</span>
          </div>
        </div>

        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecasts.series} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8DFF00" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#8DFF00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B8F36B" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#B8F36B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val, name) => [
                  formatAmount(val),
                  name === 'actualCashFlow' ? 'Actual Cash Flow' : 'Projected Cash Flow',
                ]}
              />
              <Area type="monotone" dataKey="actualCashFlow" stroke="#8DFF00" strokeWidth={2.6} fill="url(#histGrad)" connectNulls={false} />
              <Area type="monotone" dataKey="predictedCashFlow" stroke="#B8F36B" strokeWidth={2.6} strokeDasharray="6 5" fill="url(#predGrad)" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
