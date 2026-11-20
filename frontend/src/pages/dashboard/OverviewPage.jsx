import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  Lightbulb,
  Percent,
  RefreshCw,
  Sparkles,
  UploadCloud,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { KpiCard } from '../../components/dashboard/KpiCard'
import { useDashboard } from '../../context/DashboardContext'

export function OverviewPage() {
  const {
    formatAmount,
    activeRangeObj,
    overview,
    trends,
    categories,
    transactions,
    insights,
    loading,
    apiError,
    refreshDashboard,
    theme,
  } = useDashboard()

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#151A14' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#20251F' : '#DCE2DA'}`,
    borderRadius: '12px',
    fontSize: '12px',
    color: theme === 'dark' ? '#F5F7F3' : '#0C100B',
  }
  const axisColor = theme === 'dark' ? '#6F786E' : '#556054'
  const gridColor =
    theme === 'dark' ? 'rgba(32,37,31,0.75)' : 'rgba(205,214,203,0.7)'

  if (loading && !overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-36 animate-pulse rounded-2xl border"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
            }}
          />
        ))}
      </div>
    )
  }

  if (apiError) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border p-10 text-center"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'rgba(255, 98, 98, 0.35)',
        }}
      >
        <AlertCircle className="h-8 w-8 text-[#FF6262]" />
        <h2 className="mt-3 text-base font-bold">Could not load financial data</h2>
        <p className="mt-1 max-w-md text-xs" style={{ color: 'var(--dash-muted)' }}>
          {apiError}
        </p>
        <button
          type="button"
          onClick={refreshDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#050605]"
          style={{ backgroundColor: 'var(--dash-accent)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    )
  }

  if (!overview?.hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: 'var(--dash-accent-bg)',
            color: 'var(--dash-accent)',
          }}
        >
          <UploadCloud className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold">
          Upload Your First Financial Statement
        </h2>
        <p
          className="mt-2 max-w-md text-xs leading-relaxed"
          style={{ color: 'var(--dash-muted)' }}
        >
          No transactions are persisted in your account yet. Upload a CSV, XLSX,
          or PDF bank statement using the Document Workspace panel on the right
          to populate real KPIs, charts, transactions, and AI insights.
        </p>
        <Link
          to="/dashboard/documents"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-[#050605]"
          style={{
            backgroundColor: 'var(--dash-accent)',
            boxShadow: 'var(--dash-glow)',
          }}
        >
          Go to My Documents
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  const totalCategorySpend = categories.reduce((s, c) => s + c.value, 0)
  const incomeSpark = trends.map((t) => ({ v: t.income }))
  const expenseSpark = trends.map((t) => ({ v: t.expenses }))
  const netSpark = trends.map((t) => ({ v: t.net }))

  return (
    <div className="space-y-5">
      {/* KPI Cards Row (Real Persisted Metrics) */}
      <section
        aria-label="Key Financial Metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Calculated Net Balance"
          valueText={formatAmount(overview.calculatedNetBalance)}
          changePct={overview.incomeChange}
          positiveIsGood={true}
          icon={Wallet}
          sparkline={netSpark}
        />
        <KpiCard
          label={`Income (${activeRangeObj.shortLabel})`}
          valueText={formatAmount(overview.monthlyIncome)}
          changePct={overview.incomeChange}
          positiveIsGood={true}
          icon={ArrowDownCircle}
          sparkline={incomeSpark}
        />
        <KpiCard
          label={`Expenses (${activeRangeObj.shortLabel})`}
          valueText={formatAmount(overview.monthlyExpenses)}
          changePct={overview.expenseChange}
          positiveIsGood={false}
          icon={ArrowUpCircle}
          sparkline={expenseSpark}
        />
        <KpiCard
          label="Savings Rate"
          valueText={`${overview.savingsRate}%`}
          changePct={overview.savingsRate >= 0 ? overview.savingsRate : 0}
          positiveIsGood={true}
          icon={Percent}
          sparkline={netSpark}
        />
      </section>

      {/* Row 2: Income vs Expenses + Expenses by Category Donut */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div
          className="rounded-2xl border p-5 lg:col-span-7"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold">Income vs Expenses</h2>
              <div
                className="mt-1 flex items-center gap-4 text-xs"
                style={{ color: 'var(--dash-muted)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#8DFF00]" />
                  Income
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF6262]" />
                  Expenses
                </span>
              </div>
            </div>
            <span
              className="rounded-lg border px-2.5 py-1 font-mono text-[11px]"
              style={{
                backgroundColor: 'var(--dash-input)',
                borderColor: 'var(--dash-border)',
                color: 'var(--dash-muted)',
              }}
            >
              {activeRangeObj.shortLabel}
            </span>
          </div>

          <div className="h-[230px] w-full">
            {trends.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs" style={{ color: 'var(--dash-muted)' }}>
                No monthly trend points in this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
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
                    formatter={(value, name) => [
                      formatAmount(value),
                      name === 'income' ? 'Income' : 'Expenses',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#8DFF00"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#8DFF00', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#FF6262"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#FF6262', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5 lg:col-span-5"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Expenses by Category</h2>
            <Link
              to="/dashboard/analytics"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--dash-accent)' }}
            >
              Details
            </Link>
          </div>

          {categories.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-xs" style={{ color: 'var(--dash-muted)' }}>
              No expense categories recorded in this range.
            </div>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-12">
              <div className="relative h-[200px] sm:col-span-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categories.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val) => [formatAmount(val), 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {formatAmount(totalCategorySpend)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--dash-muted)' }}>
                    Total
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 sm:col-span-6">
                {categories.slice(0, 6).map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span
                      className="font-mono text-[11px] tabular-nums"
                      style={{ color: 'var(--dash-muted)' }}
                    >
                      {cat.share}% ({formatAmount(cat.value)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Row 3: Cash Flow + Recent Transactions + AI Financial Insight */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div
          className="rounded-2xl border p-5 lg:col-span-4"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div className="mb-4">
            <h2 className="text-sm font-bold">Cash Flow Overview</h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--dash-muted)' }}>
              Monthly net cash flow
            </p>
          </div>
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 6, right: 4, left: -16, bottom: 0 }}>
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
                  formatter={(val) => [formatAmount(val), 'Net Cash Flow']}
                />
                <Bar dataKey="net" radius={[6, 6, 0, 0]} maxBarSize={24}>
                  {trends.map((entry) => (
                    <Cell
                      key={entry.monthKey}
                      fill={entry.net >= 0 ? '#8DFF00' : '#FF6262'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="rounded-2xl border p-5 lg:col-span-4"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-sm font-bold">Recent Transactions</h2>
            <Link
              to="/dashboard/transactions"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--dash-accent)' }}
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === 'income'
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2.5 border-b pb-2.5 last:border-b-0 last:pb-0"
                  style={{ borderColor: 'var(--dash-border)' }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {tx.merchant || tx.description}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                      {tx.category} · {tx.displayDate}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-mono text-xs font-semibold tabular-nums"
                    style={{
                      color: isIncome ? 'var(--dash-accent)' : 'var(--dash-danger)',
                    }}
                  >
                    {isIncome ? '+' : '-'}
                    {formatAmount(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="flex flex-col justify-between rounded-2xl border p-5 lg:col-span-4"
          style={{
            backgroundColor: 'var(--dash-card)',
            borderColor: 'var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--dash-accent)' }} />
                <h2 className="text-sm font-bold">AI Financial Insight</h2>
              </div>
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: 'var(--dash-accent-bg)',
                  color: 'var(--dash-accent)',
                }}
              >
                Persisted
              </span>
            </div>

            <div className="space-y-2.5">
              {insights.slice(0, 3).map((ins) => {
                const Icon =
                  ins.severity === 'positive'
                    ? CheckCircle2
                    : ins.severity === 'anomaly'
                      ? AlertTriangle
                      : Lightbulb
                const iconColor =
                  ins.severity === 'positive'
                    ? '#8DFF00'
                    : ins.severity === 'anomaly'
                      ? '#FF6262'
                      : '#F2B84B'
                return (
                  <div
                    key={ins.id}
                    className="flex items-start gap-2.5 rounded-xl border p-3"
                    style={{
                      backgroundColor: 'var(--dash-input)',
                      borderColor: 'var(--dash-border)',
                    }}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: iconColor }} />
                    <p className="text-xs leading-relaxed">{ins.title}</p>
                  </div>
                )
              })}
              {insights.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                  Upload a statement to generate AI financial insights.
                </p>
              )}
            </div>
          </div>

          <Link
            to="/dashboard/insights"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--dash-accent-bg)',
              borderColor: 'rgba(141, 255, 0, 0.25)',
              color: 'var(--dash-accent)',
            }}
          >
            View All Insights
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
