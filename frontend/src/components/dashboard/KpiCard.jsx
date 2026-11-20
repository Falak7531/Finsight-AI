import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

export function KpiCard({
  label,
  valueText,
  changePct,
  positiveIsGood = true,
  icon: Icon,
  sparkline = [],
}) {
  const isUp = changePct >= 0
  const isGood = positiveIsGood ? isUp : !isUp
  const strokeColor = isGood ? '#8DFF00' : '#FF6262'
  const gradId = `kpi-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--dash-card)',
        borderColor: 'var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: isGood
                ? 'var(--dash-accent-bg)'
                : 'rgba(255, 98, 98, 0.14)',
              borderColor: isGood
                ? 'rgba(141, 255, 0, 0.22)'
                : 'rgba(255, 98, 98, 0.25)',
              color: strokeColor,
            }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--dash-muted)' }}
            >
              {label}
            </p>
            <p className="tabular-nums mt-0.5 font-mono text-xl font-bold tracking-tight sm:text-[1.45rem]">
              {valueText}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-xs">
        <span
          className="inline-flex items-center gap-0.5 font-mono font-semibold"
          style={{ color: strokeColor }}
        >
          {isUp ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {Math.abs(changePct)}%
        </span>
        <span style={{ color: 'var(--dash-muted)' }}>vs last month</span>
      </div>

      {/* Mini Sparkline */}
      <div className="mt-3 h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
