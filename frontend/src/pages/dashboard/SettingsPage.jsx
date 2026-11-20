import { CheckCircle2, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'
import { CURRENCIES } from '../../data/dashboardData'

export function SettingsPage() {
  const {
    profile,
    updateUserProfile,
    currency,
    setCurrency,
    theme,
    setTheme,
    notifPrefs,
    setNotifPrefs,
  } = useDashboard()

  const [fullName, setFullName] = useState(profile.fullName)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    setErrMsg('')
    try {
      await updateUserProfile({ name: fullName })
      setSavedMsg('Profile saved to PostgreSQL & display preferences updated')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err) {
      setErrMsg(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-5">
      <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
        <h2 className="text-sm font-bold">Profile Settings</h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--dash-muted)' }}>
          Name updates are persisted to PostgreSQL via PATCH /api/auth/profile.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none"
              style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
              Email Address (Account ID)
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border px-3.5 py-2.5 text-xs opacity-65"
              style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
        <h2 className="text-sm font-bold">Appearance & Currency</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
              Display Currency
            </label>
            <div className="flex gap-2">
              {Object.values(CURRENCIES).map((c) => {
                const active = currency === c.code
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className="flex-1 rounded-xl border px-3 py-2 font-mono text-xs font-semibold transition"
                    style={{
                      backgroundColor: active ? 'var(--dash-accent)' : 'var(--dash-input)',
                      borderColor: active ? 'var(--dash-accent)' : 'var(--dash-border)',
                      color: active ? '#050605' : 'var(--dash-text)',
                    }}
                  >
                    {c.symbol} {c.code}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
              Dashboard Theme
            </label>
            <div className="flex gap-2">
              {[
                { id: 'dark', label: 'Obsidian Dark', icon: Moon },
                { id: 'light', label: 'Clean Light', icon: Sun },
              ].map((t) => {
                const Icon = t.icon
                const active = theme === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition"
                    style={{
                      backgroundColor: active ? 'var(--dash-accent)' : 'var(--dash-input)',
                      borderColor: active ? 'var(--dash-accent)' : 'var(--dash-border)',
                      color: active ? '#050605' : 'var(--dash-text)',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}>
        <h2 className="text-sm font-bold">Notification Preferences (Local UI)</h2>
        <div className="mt-4 space-y-3">
          {[
            ['overspendAlerts', 'Budget overspending alerts', 'Notify when a category exceeds 85% or 100% of its monthly cap.'],
            ['unusualSpendFlags', 'Unusual transaction notifications', 'Highlight statistical outlier transactions in your feed.'],
            ['documentProcessing', 'Document upload status', 'Show updates when CSV, XLSX, or PDF files finish parsing.'],
            ['monthlyDigest', 'Monthly summary digest', 'Prepare a monthly performance summary at cycle close.'],
          ].map(([key, title, desc]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3.5"
              style={{ backgroundColor: 'var(--dash-input)', borderColor: 'var(--dash-border)' }}
            >
              <div>
                <p className="text-xs font-semibold">{title}</p>
                <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>{desc}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(notifPrefs[key])}
                onChange={(e) => setNotifPrefs((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="h-4 w-4 accent-[#8DFF00]"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-5 py-2.5 text-xs font-semibold text-[#050605] transition hover:opacity-95 disabled:opacity-60"
          style={{ backgroundColor: 'var(--dash-accent)', boxShadow: 'var(--dash-glow)' }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {savedMsg && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--dash-accent)' }}>
            <CheckCircle2 className="h-4 w-4" />
            {savedMsg}
          </span>
        )}
        {errMsg && <span className="text-xs text-[#FF6262]">{errMsg}</span>}
      </div>
    </form>
  )
}
