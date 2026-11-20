import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'
import { getTransactions } from '../../services/dashboardService'

export function TransactionsPage() {
  const { formatAmount, globalSearch, setGlobalSearch, categories, theme, documents } =
    useDashboard()

  const [categoryFilter, setCategoryFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('date_desc')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getTransactions({
          search: globalSearch,
          category: categoryFilter,
          type: typeFilter === 'All' ? '' : typeFilter.toUpperCase(),
          sort: sortBy,
          page,
          limit: 20,
        })
        if (cancelled) return
        setRows(res?.items || [])
        setPagination(res?.pagination || { page: 1, total: 0, totalPages: 1 })
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load transactions.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [globalSearch, categoryFilter, typeFilter, sortBy, page, documents.length])

  const selectStyle = {
    backgroundColor: 'var(--dash-input)',
    borderColor: 'var(--dash-border)',
    color: 'var(--dash-text)',
  }

  const categoryOptions = ['All', 'Income', ...categories.map((c) => c.name)]

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--dash-muted)' }}
          />
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by merchant, description, or category..."
            className="w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
            style={selectStyle}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border px-3 py-2 text-xs focus:outline-none"
            style={selectStyle}
          >
            {Array.from(new Set(categoryOptions)).map((cat) => (
              <option
                key={cat}
                value={cat}
                style={{ backgroundColor: theme === 'dark' ? '#101310' : '#FFFFFF' }}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border px-3 py-2 text-xs focus:outline-none"
            style={selectStyle}
          >
            <option value="All">All Types</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expenses Only</option>
          </select>

          <div className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs" style={selectStyle}>
            <ArrowUpDown className="h-3.5 w-3.5" style={{ color: 'var(--dash-muted)' }} />
            <select
              aria-label="Sort transactions"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="bg-transparent focus:outline-none"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        {loading ? (
          <div className="p-10 text-center text-xs" style={{ color: 'var(--dash-muted)' }}>
            Loading transactions from PostgreSQL...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-xs text-[#FF6262]">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold">No transactions found</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>
              Upload a CSV, XLSX, or PDF statement or clear your filters to see transactions.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      backgroundColor: 'var(--dash-input)',
                      borderColor: 'var(--dash-border)',
                      color: 'var(--dash-muted)',
                    }}
                  >
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Merchant / Description</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                  {rows.map((tx) => {
                    const isIncome = tx.type === 'income'
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="cursor-pointer transition hover:opacity-90"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                          {tx.date}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold">{tx.merchant}</p>
                          <p className="truncate text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                            {tx.description}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="rounded-lg border px-2.5 py-1 text-[11px] font-medium"
                            style={{
                              backgroundColor: 'var(--dash-input)',
                              borderColor: 'var(--dash-border)',
                            }}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: isIncome
                                ? 'var(--dash-accent-bg)'
                                : 'rgba(255, 98, 98, 0.14)',
                              color: isIncome ? 'var(--dash-accent)' : '#FF6262',
                            }}
                          >
                            {tx.transactionType}
                          </span>
                        </td>
                        <td
                          className="whitespace-nowrap px-4 py-3.5 text-right font-mono font-bold tabular-nums"
                          style={{ color: isIncome ? 'var(--dash-accent)' : 'var(--dash-danger)' }}
                        >
                          {isIncome ? '+' : '-'}
                          {formatAmount(tx.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div
              className="flex items-center justify-between border-t px-4 py-3 text-xs"
              style={{ borderColor: 'var(--dash-border)', color: 'var(--dash-muted)' }}
            >
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 disabled:opacity-40"
                  style={{ borderColor: 'var(--dash-border)' }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 disabled:opacity-40"
                  style={{ borderColor: 'var(--dash-border)' }}
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Detail Drawer */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTx(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l p-6 shadow-2xl"
            style={{
              backgroundColor: 'var(--dash-bg-secondary)',
              borderColor: 'var(--dash-border)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--dash-border)' }}>
              <div>
                <p className="font-mono text-[11px]" style={{ color: 'var(--dash-accent)' }}>
                  {selectedTx.id.slice(0, 8)}…
                </p>
                <h3 className="text-lg font-bold">{selectedTx.merchant}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                aria-label="Close transaction drawer"
                className="rounded-lg p-1.5"
                style={{ color: 'var(--dash-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div
                className="rounded-2xl border p-4 text-center"
                style={{
                  backgroundColor: 'var(--dash-card)',
                  borderColor: 'var(--dash-border)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                  {selectedTx.type === 'income' ? 'Credit Amount' : 'Debit Amount'}
                </p>
                <p
                  className="mt-1 font-mono text-3xl font-bold tabular-nums"
                  style={{
                    color: selectedTx.type === 'income' ? 'var(--dash-accent)' : 'var(--dash-danger)',
                  }}
                >
                  {selectedTx.type === 'income' ? '+' : '-'}
                  {formatAmount(selectedTx.amount)}
                </p>
              </div>

              <dl className="space-y-3 text-xs">
                {[
                  ['Merchant', selectedTx.merchant],
                  ['Description', selectedTx.description],
                  ['Category', selectedTx.category],
                  ['Date', selectedTx.displayDate],
                  ['Type', selectedTx.transactionType],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-4 border-b pb-2.5"
                    style={{ borderColor: 'var(--dash-border)' }}
                  >
                    <dt style={{ color: 'var(--dash-muted)' }}>{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
