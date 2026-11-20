import { AlertTriangle, X } from 'lucide-react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--dash-bg-secondary)',
          borderColor: 'var(--dash-border)',
          color: 'var(--dash-text)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 id="confirm-dialog-title" className="text-base font-bold">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="rounded-lg p-1.5 opacity-70 transition hover:bg-white/5 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: 'var(--dash-muted)' }}
        >
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-90"
            style={{
              borderColor: 'var(--dash-border)',
              color: 'var(--dash-text)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#FF6262] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#eb5252]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
