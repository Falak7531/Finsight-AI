import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../../context/DashboardContext'

export function AIInsightsPage() {
  const { insights } = useDashboard()
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--dash-card)', borderColor: 'rgba(141, 255, 0, 0.24)' }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--dash-accent-bg)', color: 'var(--dash-accent)' }}>
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold">Persisted Financial Intelligence</p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--dash-muted)' }}>
              Combines AI-generated observations persisted from your uploaded statements with statistical outlier detection computed directly over PostgreSQL transactions.
            </p>
          </div>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <p className="text-sm font-semibold">No insights generated yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>
            Upload a CSV, XLSX, or PDF statement to generate real AI observations and anomaly flags.
          </p>
          <Link
            to="/dashboard/documents"
            className="mt-4 inline-flex rounded-xl px-4 py-2 text-xs font-semibold text-[#050605]"
            style={{ backgroundColor: 'var(--dash-accent)' }}
          >
            Upload Statement
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((item) => {
            const isOpen = expandedId === item.id
            const Icon =
              item.severity === 'positive'
                ? CheckCircle2
                : item.severity === 'anomaly'
                  ? AlertTriangle
                  : Info
            const badgeColor =
              item.severity === 'positive'
                ? '#8DFF00'
                : item.severity === 'anomaly'
                  ? '#FF6262'
                  : '#B8F36B'

            return (
              <article
                key={item.id}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}>
                          {item.source === 'ai' ? 'AI Generated' : 'Calculated Metric'}
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                          {item.impact}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--dash-muted)' }}>
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)' }}
                  >
                    {isOpen ? 'Hide Details' : 'Source Details'}
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 rounded-xl border p-4 text-xs leading-relaxed" style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)', color: 'var(--dash-muted)' }}>
                    {item.explanation}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
