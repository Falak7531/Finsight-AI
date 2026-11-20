import { Activity, ShieldCheck, TrendingUp, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboard } from '../../context/DashboardContext'

export function AnalyticsPage() {
  const { formatAmount, overview, trends, categories, budgets, theme } = useDashboard()

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#151A14' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#20251F' : '#DCE2DA'}`,
    borderRadius: '12px',
    fontSize: '12px',
    color: theme === 'dark' ? '#F5F7F3' : '#0C100B',
  }
  const axisColor = theme === 'dark' ? '#6F786E' : '#556054'
  const gridColor = theme === 'dark' ? 'rgba(32,37,31,0.75)' : 'rgba(205,214,203,0.7)'

  const inc = overview?.monthlyIncome || 0
  const exp = overview?.monthlyExpenses || 0
  const expenseRatio = inc > 0 ? ((exp / inc) * 100).toFixed(1) : '0.0'
  const withinBudget = budgets.filter((b) => b.spent <= b.limit).length

  const healthMetrics = [
    {
      label: 'Savings Ratio',
      value: `${overview?.savingsRate || 0}%`,
      status: (overview?.savingsRate || 0) >= 20 ? 'Healthy' : 'Low',
      note: 'Calculated from DB',
      icon: TrendingUp,
    },
    {
      label: 'Expense-to-Income',
      value: `${expenseRatio}%`,
      status: Number(expenseRatio) <= 75 ? 'Optimal' : 'High',
      note: 'Recorded period ratio',
      icon: Activity,
    },
    {
      label: 'Tracked Categories',
      value: `${categories.length}`,
      status: 'Active',
      note: 'Distinct expense groups',
      icon: ShieldCheck,
    },
    {
      label: 'Budget Adherence',
      value: budgets.length > 0 ? `${withinBudget} / ${budgets.length}` : 'None',
      status: withinBudget === budgets.length ? 'On Track' : 'Watchlist',
      note: 'Persisted budgets',
      icon: Wallet,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthMetrics.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.label}
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: 'var(--dash-card)',
                borderColor: 'var(--dash-border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
                  {m.label}
                </span>
                <Icon className="h-4 w-4" style={{ color: 'var(--dash-accent)' }} />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{m.value}</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span
                  className="rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    backgroundColor:
                      m.status === 'Watchlist' || m.status === 'High' || m.status === 'Low'
                        ? 'rgba(242, 184, 75, 0.16)'
                        : 'var(--dash-accent-bg)',
                    color:
                      m.status === 'Watchlist' || m.status === 'High' || m.status === 'Low'
                        ? '#F2B84B'
                        : 'var(--dash-accent)',
                  }}
                >
                  {m.status}
                </span>
                <span style={{ color: 'var(--dash-muted)' }}>{m.note}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Income, Expenses & Net Savings Trend</h2>
            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
              Calculated from your persisted PostgreSQL transactions
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--dash-muted)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#8DFF00]" /> Income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#FF6262]" /> Expenses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B8F36B]" /> Net Savings
            </span>
          </div>
        </div>

        <div className="h-[270px] w-full">
          {trends.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs" style={{ color: 'var(--dash-muted)' }}>
              Upload a statement to populate historical trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => [
                    formatAmount(val),
                    name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net Savings',
                  ]}
                />
                <Bar dataKey="income" fill="#8DFF00" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="expenses" fill="#FF6262" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#B8F36B"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#B8F36B' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div
          className="rounded-2xl border p-5 lg:col-span-6"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold">Category-wise Expense Breakdown</h2>
          <div className="h-[240px] w-full">
            {categories.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs" style={{ color: 'var(--dash-muted)' }}>
                No expense categories recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 16, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke={gridColor} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <YAxis type="category" dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={95} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatAmount(v), 'Spent']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {categories.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5 lg:col-span-6"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold">Monthly Comparison</h2>
          {trends.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
              No monthly comparison rows available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--dash-border)', color: 'var(--dash-muted)' }}>
                    <th className="pb-2.5 font-medium">Month</th>
                    <th className="pb-2.5 text-right font-medium">Income</th>
                    <th className="pb-2.5 text-right font-medium">Expenses</th>
                    <th className="pb-2.5 text-right font-medium">Net Saved</th>
                    <th className="pb-2.5 text-right font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                  {trends.map((row) => {
                    const rate = row.income > 0 ? ((row.net / row.income) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={row.monthKey}>
                        <td className="py-2.5 font-semibold">{row.month}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">{formatAmount(row.income)}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-[#FF6262]">{formatAmount(row.expenses)}</td>
                        <td className="py-2.5 text-right font-mono font-semibold tabular-nums" style={{ color: 'var(--dash-accent)' }}>
                          {formatAmount(row.net)}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums" style={{ color: 'var(--dash-muted)' }}>
                          {rate}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
