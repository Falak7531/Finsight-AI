import { Download, FileBarChart2, FileJson } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext'
import { triggerFileDownload } from '../../services/dashboardService'

export function ReportsPage() {
  const { formatAmount, trends, activeRangeObj } = useDashboard()

  const downloadCsvReport = (row) => {
    const rate = row.income > 0 ? ((row.net / row.income) * 100).toFixed(1) : '0.0'
    const csv = [
      'Month,Income,Expenses,NetSavings,SavingsRate',
      `"${row.month}",${row.income},${row.expenses},${row.net},"${rate}%"`,
    ].join('\n')
    triggerFileDownload(`FinSight_Report_${row.monthKey}.csv`, csv)
  }

  const downloadJsonReport = (row) => {
    triggerFileDownload(
      `FinSight_Report_${row.monthKey}.json`,
      JSON.stringify({ source: 'postgresql', range: activeRangeObj.id, ...row }, null, 2),
      'application/json'
    )
  }

  if (trends.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
        <p className="text-sm font-semibold">No monthly reports available yet</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>
          Upload a financial statement to generate downloadable CSV and JSON monthly summaries.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...trends].reverse().map((row) => {
        const rate = row.income > 0 ? `${((row.net / row.income) * 100).toFixed(1)}%` : '0.0%'
        return (
          <div
            key={row.monthKey}
            className="flex flex-col justify-between rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--dash-accent-bg)', color: 'var(--dash-accent)' }}>
                    <FileBarChart2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{row.month} Summary</h3>
                    <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                      Calculated from persisted transactions
                    </p>
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--dash-accent-bg)', color: 'var(--dash-accent)' }}>
                  Ready
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border p-2.5" style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--dash-muted)' }}>Income</p>
                  <p className="mt-0.5 font-mono text-xs font-bold tabular-nums">{formatAmount(row.income)}</p>
                </div>
                <div className="rounded-xl border p-2.5" style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--dash-muted)' }}>Expenses</p>
                  <p className="mt-0.5 font-mono text-xs font-bold tabular-nums text-[#FF6262]">{formatAmount(row.expenses)}</p>
                </div>
                <div className="rounded-xl border p-2.5" style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--dash-muted)' }}>Savings Rate</p>
                  <p className="mt-0.5 font-mono text-xs font-bold tabular-nums" style={{ color: 'var(--dash-accent)' }}>{rate}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--dash-border)' }}>
              <button
                type="button"
                onClick={() => downloadCsvReport(row)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#050605] transition hover:opacity-95"
                style={{ backgroundColor: 'var(--dash-accent)' }}
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => downloadJsonReport(row)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                style={{ borderColor: 'var(--dash-border)', backgroundColor: 'var(--dash-input)' }}
              >
                <FileJson className="h-3.5 w-3.5" />
                JSON
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
