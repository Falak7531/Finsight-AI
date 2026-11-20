import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  X,
} from 'lucide-react'

export function DocumentPreviewModal({ doc, onClose, onDownload, onDelete }) {
  if (!doc) return null

  const StatusIcon =
    doc.status === 'PROCESSED'
      ? CheckCircle2
      : doc.status === 'FAILED'
        ? AlertCircle
        : Clock

  const statusColor =
    doc.status === 'PROCESSED'
      ? '#8DFF00'
      : doc.status === 'FAILED'
        ? '#FF6262'
        : '#F2B84B'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-preview-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col border-l p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--dash-bg-secondary)',
          borderColor: 'var(--dash-border)',
          color: 'var(--dash-text)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--dash-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  doc.ext === 'PDF'
                    ? 'rgba(255, 98, 98, 0.14)'
                    : 'var(--dash-accent-bg)',
                color: doc.ext === 'PDF' ? '#FF6262' : 'var(--dash-accent)',
              }}
            >
              {doc.ext === 'PDF' ? (
                <FileText className="h-5 w-5" />
              ) : (
                <FileSpreadsheet className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <h3 id="doc-preview-title" className="truncate text-base font-bold">
                {doc.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                {doc.ext} · {doc.sizeLabel} · Uploaded {doc.uploadedAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="rounded-lg p-1.5 transition hover:bg-white/5"
            style={{ color: 'var(--dash-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Processing Status Card */}
          <div
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--dash-card)',
              borderColor: 'var(--dash-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--dash-muted)' }}>
                Processing Status
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor,
                }}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {doc.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div
                className="rounded-lg border p-2.5"
                style={{
                  backgroundColor: 'var(--dash-input)',
                  borderColor: 'var(--dash-border)',
                }}
              >
                <p className="font-mono text-lg font-bold tabular-nums">
                  {doc.rowsParsed}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                  Rows Parsed
                </p>
              </div>
              <div
                className="rounded-lg border p-2.5"
                style={{
                  backgroundColor: 'var(--dash-input)',
                  borderColor: 'var(--dash-border)',
                }}
              >
                <p className="font-mono text-lg font-bold tabular-nums">
                  {doc.anomaliesFound}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                  Outliers Found
                </p>
              </div>
              <div
                className="rounded-lg border p-2.5"
                style={{
                  backgroundColor: 'var(--dash-input)',
                  borderColor: 'var(--dash-border)',
                }}
              >
                <p className="font-mono text-lg font-bold tabular-nums">
                  {doc.ext}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                  Format
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs" style={{ color: 'var(--dash-muted)' }}>
              Source account: <span className="font-medium" style={{ color: 'var(--dash-text)' }}>{doc.account}</span>
            </p>
          </div>

          {/* Sample Extracted Rows */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-muted)' }}>
                Extracted Preview (Illustrative)
              </h4>
              <span className="font-mono text-[10px]" style={{ color: 'var(--dash-accent)' }}>
                Demo Parser Output
              </span>
            </div>

            {doc.previewRows && doc.previewRows.length > 0 ? (
              <div
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: 'var(--dash-border)' }}
              >
                <table className="w-full text-left text-xs">
                  <thead style={{ backgroundColor: 'var(--dash-input)', color: 'var(--dash-muted)' }}>
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Description</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                    {doc.previewRows.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: 'var(--dash-card)' }}>
                        <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                          {row.date}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{row.desc}</p>
                          <p className="text-[10px]" style={{ color: 'var(--dash-muted)' }}>{row.cat}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="rounded-xl border border-dashed p-6 text-center text-xs"
                style={{
                  borderColor: 'var(--dash-border)',
                  color: 'var(--dash-muted)',
                }}
              >
                {doc.status === 'Processing'
                  ? 'Parsing document rows... Preview will appear once extraction finishes.'
                  : doc.status === 'Failed'
                    ? 'Parsing failed. Verify file formatting and re-upload.'
                    : 'No tabular preview rows available for this document.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--dash-border)' }}
        >
          <button
            type="button"
            onClick={() => onDelete(doc)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>

          <button
            type="button"
            onClick={() => onDownload(doc)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#0B140E] transition hover:opacity-95"
            style={{ backgroundColor: 'var(--dash-accent)' }}
          >
            <Download className="h-3.5 w-3.5" />
            Download Copy
          </button>
        </div>
      </div>
    </div>
  )
}
