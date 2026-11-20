import { AlertTriangle, CheckCircle2, Edit3, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Rent',
  'Utilities',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other',
]

export function BudgetsPage() {
  const { budgets, saveBudgetLimit, removeBudget, formatAmount } = useDashboard()
  const [editingId, setEditingId] = useState(null)
  const [draftLimit, setDraftLimit] = useState('')
  const [newCategory, setNewCategory] = useState('Food & Dining')
  const [newLimit, setNewLimit] = useState('5000')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const overspentCount = budgets.filter((b) => b.spent > b.limit).length

  const handleAddBudget = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await saveBudgetLimit(newCategory, Number(newLimit))
    } catch (err) {
      setError(err.message || 'Failed to save budget.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async (category) => {
    setError('')
    try {
      await saveBudgetLimit(category, Number(draftLimit))
      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Failed to update budget.')
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Total Monthly Budget</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{formatAmount(totalLimit)}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-accent)' }}>{overallPct}% utilized overall</p>
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Tracked Category Spend</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{formatAmount(totalSpent)}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>
            {formatAmount(Math.max(0, totalLimit - totalSpent))} remaining headroom
          </p>
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Overspending Warnings</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums" style={{ color: overspentCount > 0 ? '#FF6262' : 'var(--dash-accent)' }}>
            {overspentCount} {overspentCount === 1 ? 'Category' : 'Categories'}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)' }}>Persisted in PostgreSQL</p>
        </div>
      </div>

      {/* Add / Upsert Budget Form */}
      <form
        onSubmit={handleAddBudget}
        className="flex flex-wrap items-end gap-3 rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}
      >
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
            Category
          </label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
            style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
            Monthly Limit (INR)
          </label>
          <input
            type="number"
            min="100"
            step="100"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 font-mono text-xs focus:outline-none"
            style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#050605] disabled:opacity-60"
          style={{ backgroundColor: 'var(--dash-accent)', boxShadow: 'var(--dash-glow)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save Budget'}
        </button>

        {error && <p className="w-full text-xs text-[#FF6262]">{error}</p>}
      </form>

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-xs" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)', color: 'var(--dash-muted)' }}>
          No monthly budgets configured yet. Add a category limit above to start tracking utilization against your uploaded transactions.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0
            const exceeded = b.spent > b.limit
            const warning = !exceeded && pct >= 85
            const isEditing = editingId === b.id

            return (
              <div
                key={b.id}
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: 'var(--dash-card)',
                  borderColor: exceeded ? 'rgba(255, 98, 98, 0.45)' : 'var(--dash-border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${b.color}20`, color: b.color }}>
                      <PiggyBank className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">{b.category}</h3>
                      <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                        {formatAmount(b.spent)} spent of {formatAmount(b.limit)}
                      </p>
                    </div>
                  </div>

                  {exceeded ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF6262]">
                      <AlertTriangle className="h-3 w-3" />
                      Over by {formatAmount(b.spent - b.limit)}
                    </span>
                  ) : warning ? (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                      Near Limit ({pct}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: 'var(--dash-accent-bg)', color: 'var(--dash-accent)' }}>
                      <CheckCircle2 className="h-3 w-3" />
                      On Track
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--dash-input)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: exceeded ? '#FF6262' : warning ? '#F2B84B' : b.color,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold tabular-nums">{pct}% used</span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="100"
                          step="100"
                          value={draftLimit}
                          onChange={(e) => setDraftLimit(e.target.value)}
                          className="w-24 rounded-lg border px-2 py-1 font-mono text-xs focus:outline-none"
                          style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-accent)', color: 'var(--dash-text)' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(b.category)}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#050605]"
                          style={{ backgroundColor: 'var(--dash-accent)' }}
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(b.id)
                            setDraftLimit(String(b.limit))
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: 'var(--dash-accent)' }}
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBudget(b.id)}
                          aria-label={`Delete ${b.category} budget`}
                          className="text-red-400 hover:opacity-80"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
