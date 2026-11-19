import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  LayoutGrid,
  PieChart,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import {
  DASHBOARD_AI_INSIGHTS,
  DASHBOARD_PERIODS,
  DASHBOARD_TRANSACTIONS,
  formatINR,
} from '../data/sampleFinanceData'

function InteractiveTrendChart({ points }) {
  const [activeIdx, setActiveIdx] = useState(points.length - 1)
  const safeIdx = Math.min(activeIdx, points.length - 1)

  const width = 620
  const height = 215
  const padLeft = 52
  const padRight = 20
  const padTop = 24
  const padBottom = 34

  const values = points.map((p) => p.value)
  const maxVal = Math.max(...values) * 1.14
  const minVal = 0

  const coords = points.map((p, i) => {
    const x =
      padLeft +
      (i / Math.max(points.length - 1, 1)) * (width - padLeft - padRight)
    const y =
      height -
      padBottom -
      ((p.value - minVal) / (maxVal - minVal || 1)) *
        (height - padTop - padBottom)
    return { ...p, x, y }
  })

  const linePath = coords.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`
    const prev = coords[idx - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padBottom} L ${coords[0].x} ${height - padBottom} Z`

  const yTicks = [0, 0.33, 0.66, 1].map((r) => ({
    val: Math.round((maxVal * r) / 500) * 500,
    y: height - padBottom - r * (height - padTop - padBottom),
  }))

  const activePoint = coords[safeIdx]

  return (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">Spending Trends</p>
          <p className="text-xs text-[#71717A]">
            Hover or tap points to inspect illustrative INR spend
          </p>
        </div>
        {activePoint && (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8BFF19]/30 bg-[#050505] px-3 py-1 font-mono text-xs">
            <span className="text-[#9CA3AF]">{activePoint.label}</span>
            <span className="font-semibold text-[#8BFF19]">
              {formatINR(activePoint.value)}
            </span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[215px] w-full select-none"
        role="img"
        aria-label="Illustrative spending trends line chart"
      >
        <defs>
          <linearGradient id="clarioLimeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8BFF19" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#8BFF19" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t.y}>
            <line
              x1={padLeft}
              y1={t.y}
              x2={width - padRight}
              y2={t.y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 4"
            />
            <text
              x={padLeft - 10}
              y={t.y + 4}
              textAnchor="end"
              fill="#71717A"
              fontSize="10.5"
              fontFamily="JetBrains Mono, monospace"
            >
              ₹{t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
            </text>
          </g>
        ))}

        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padTop}
            x2={activePoint.x}
            y2={height - padBottom}
            stroke="rgba(139,255,25,0.28)"
            strokeDasharray="3 3"
          />
        )}

        <motion.path
          key={areaPath}
          d={areaPath}
          fill="url(#clarioLimeArea)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        />

        <motion.path
          key={linePath}
          d={linePath}
          fill="none"
          stroke="#8BFF19"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />

        {coords.map((pt, idx) => {
          const isActive = idx === safeIdx
          return (
            <g
              key={pt.label}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => setActiveIdx(idx)}
              className="cursor-pointer"
            >
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              {isActive && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  fill="#8BFF19"
                  fillOpacity="0.16"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 5 : 3.5}
                fill={isActive ? '#8BFF19' : '#0B0D0E'}
                stroke="#8BFF19"
                strokeWidth="2"
              />
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                fill={isActive ? '#FFFFFF' : '#71717A'}
                fontSize="10.5"
                fontFamily="JetBrains Mono, monospace"
              >
                {pt.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const SIDEBAR_ITEMS = [
  { icon: LayoutGrid, label: 'Overview', active: true },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: PieChart, label: 'Categories', active: false },
  { icon: CreditCard, label: 'Ledger', active: false },
  { icon: Sparkles, label: 'AI Insights', active: false },
]

export function DashboardPreview() {
  const [periodKey, setPeriodKey] = useState('month')
  const activePeriod = DASHBOARD_PERIODS[periodKey]
  const budgetPct = Math.round(
    (activePeriod.totalSpent / activePeriod.monthlyBudget) * 1000
  ) / 10

  return (
    <section
      id="dashboard"
      className="relative px-4 pt-2 pb-24 sm:px-6 sm:pb-28 lg:px-8 lg:pb-32"
    >
      <div className="relative mx-auto max-w-6xl">
        {/* Clario-inspired neon-green ambient radial halo directly behind the dashboard top edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 left-1/2 h-56 w-[82%] -translate-x-1/2 rounded-full bg-[#8BFF19]/[0.18] blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-px left-1/2 h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#8BFF19]/80 to-transparent"
        />

        {/* Main Obsidian Dashboard Frame */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D0E] shadow-[0_30px_110px_rgba(0,0,0,0.85)]"
        >
          {/* Top Application Chrome */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] bg-[#080A0B] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-xs font-semibold tracking-wide text-white">
                FinSight Analytics
              </span>
              <span className="hidden rounded-full border border-[#8BFF19]/25 bg-[#8BFF19]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[#8BFF19] sm:inline-block">
                Illustrative INR Data
              </span>
            </div>

            {/* Period Switcher */}
            <div
              role="tablist"
              aria-label="Select sample reporting period"
              className="inline-flex rounded-full border border-white/8 bg-[#050505] p-1"
            >
              {Object.values(DASHBOARD_PERIODS).map((p) => {
                const selected = p.id === periodKey
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setPeriodKey(p.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      selected
                        ? 'bg-[#8BFF19] text-[#050505] font-semibold'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Workspace Body: Minimal Sidebar + Main Grid */}
          <div className="grid lg:grid-cols-12">
            {/* Compact App Sidebar (Desktop) */}
            <aside className="hidden border-r border-white/[0.06] bg-[#080A0B]/70 p-4 lg:col-span-2 lg:flex lg:flex-col lg:justify-between">
              <div className="space-y-1">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium ${
                        item.active
                          ? 'bg-[#8BFF19]/12 text-[#8BFF19] ring-1 ring-[#8BFF19]/25'
                          : 'text-[#71717A]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-xl border border-white/8 bg-[#111417] p-3">
                <p className="font-mono text-[10px] tracking-wider text-[#8BFF19] uppercase">
                  Budget Status
                </p>
                <p className="tabular-nums mt-1 font-mono text-sm font-bold text-white">
                  {budgetPct}% used
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#8BFF19]"
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                  />
                </div>
              </div>
            </aside>

            {/* Main Analytics Canvas */}
            <div className="p-5 sm:p-6 lg:col-span-10">
              {/* Top KPI Row: Monthly Spending, Total Income, Net Savings */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-[#111417] p-4">
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span>Monthly Spending</span>
                    <Wallet className="h-4 w-4 text-[#8BFF19]" />
                  </div>
                  <p className="tabular-nums mt-2 font-mono text-2xl font-bold text-white">
                    {formatINR(activePeriod.totalSpent)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#9CA3AF]">
                      Budget {formatINR(activePeriod.monthlyBudget)}
                    </span>
                    <span className="font-mono font-medium text-[#8BFF19]">
                      {activePeriod.spendDelta}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#111417] p-4">
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span>Total Income</span>
                    <ArrowDownLeft className="h-4 w-4 text-[#8BFF19]" />
                  </div>
                  <p className="tabular-nums mt-2 font-mono text-2xl font-bold text-white">
                    {formatINR(activePeriod.totalIncome)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#9CA3AF]">Recorded inflows</span>
                    <span className="font-mono font-medium text-[#4ADE80]">
                      {activePeriod.incomeDelta}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#8BFF19]/20 bg-[#111417] p-4">
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span>Net Balance Saved</span>
                    <TrendingUp className="h-4 w-4 text-[#8BFF19]" />
                  </div>
                  <p className="tabular-nums mt-2 font-mono text-2xl font-bold text-[#8BFF19]">
                    {formatINR(activePeriod.netSavings)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#9CA3AF]">Savings rate</span>
                    <span className="font-mono font-semibold text-white">
                      {activePeriod.savingsRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Spending Trends + AI Financial Insights */}
              <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="rounded-xl border border-white/8 bg-[#111417] p-5 lg:col-span-7">
                  <InteractiveTrendChart points={activePeriod.trend} />
                </div>

                <div className="flex flex-col rounded-xl border border-white/8 bg-[#111417] p-5 lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#8BFF19]" />
                      <h3 className="text-sm font-semibold text-white">
                        AI Financial Insights
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-[#71717A] uppercase">
                      Illustrative
                    </span>
                  </div>

                  <div className="mt-3.5 flex flex-1 flex-col gap-2.5">
                    {DASHBOARD_AI_INSIGHTS.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/[0.06] bg-[#080A0B] p-3"
                      >
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            item.tone === 'lime'
                              ? 'bg-[#8BFF19]/15 text-[#8BFF19]'
                              : item.tone === 'amber'
                                ? 'bg-amber-400/15 text-amber-300'
                                : 'bg-emerald-400/15 text-emerald-300'
                          }`}
                        >
                          {item.tag}
                        </span>
                        <p className="mt-1.5 text-xs font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-[#9CA3AF]">
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Category Breakdown + Recent Transactions */}
              <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="rounded-xl border border-white/8 bg-[#111417] p-5 lg:col-span-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Category Breakdown
                    </h3>
                    <span className="font-mono text-xs text-[#71717A]">
                      {budgetPct}% of cap
                    </span>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    {activePeriod.categories.map((cat) => {
                      const pct = Math.round((cat.spent / cat.budget) * 100)
                      const exceeded = pct > 100
                      return (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="font-medium text-[#E5E7EB]">
                                {cat.name}
                              </span>
                            </div>
                            <div className="tabular-nums flex items-center gap-2 font-mono">
                              <span className="text-white">
                                {formatINR(cat.spent)}
                              </span>
                              <span className="text-[#71717A]">
                                ({cat.share}%)
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                            <motion.div
                              key={`${periodKey}-${cat.name}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pct, 100)}%` }}
                              transition={{ duration: 0.55, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: exceeded
                                  ? '#FBBF24'
                                  : cat.color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#111417] p-5 lg:col-span-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Recent Transactions
                    </h3>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#8BFF19]">
                      Live-style sample
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>

                  <div className="mt-3.5 divide-y divide-white/[0.06]">
                    {DASHBOARD_TRANSACTIONS.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-xs font-semibold text-white">
                              {tx.merchant}
                            </p>
                            {tx.unusual && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Unusual
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#71717A]">
                            {tx.category} · {tx.mode} · {tx.date}
                          </p>
                        </div>
                        <span
                          className={`tabular-nums shrink-0 font-mono text-xs font-semibold ${
                            tx.type === 'credit'
                              ? 'text-[#8BFF19]'
                              : 'text-white'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}
                          {formatINR(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
