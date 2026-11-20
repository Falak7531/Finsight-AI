import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../../context/DashboardContext'

export function DocumentPanel({ isDrawer = false }) {
  const {
    documents,
    uploading,
    uploadError,
    setUploadError,
    handleUploadFiles,
    setPreviewDoc,
    setDocToDelete,
    downloadDocument,
    totalStorageMB,
    setMobileDocsOpen,
  } = useDashboard()

  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) {
      handleUploadFiles(e.dataTransfer.files)
    }
  }

  const storagePct = Math.min(100, Math.round((totalStorageMB / 100) * 100))

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Your Documents</h2>
            <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
              Statement & ledger workspace
            </p>
          </div>
          {isDrawer ? (
            <button
              type="button"
              onClick={() => setMobileDocsOpen(false)}
              aria-label="Close documents panel"
              className="rounded-lg p-1.5"
              style={{ color: 'var(--dash-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/dashboard/documents"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--dash-accent)' }}
            >
              View all
            </Link>
          )}
        </div>

        {/* Drag-and-Drop Upload Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="rounded-2xl border-2 border-dashed p-4 text-center transition-all"
          style={{
            backgroundColor: dragging
              ? 'var(--dash-accent-bg)'
              : 'var(--dash-card)',
            borderColor: dragging ? 'var(--dash-accent)' : 'var(--dash-border)',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.pdf"
            onChange={(e) => {
              handleUploadFiles(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
          <div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--dash-accent-bg)',
              color: 'var(--dash-accent)',
            }}
          >
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="mt-2.5 text-xs font-semibold">
            {uploading ? 'Processing statement...' : 'Upload your files'}
          </p>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: 'var(--dash-muted)' }}
          >
            Drag & drop CSV, XLSX, PDF up to 10MB
          </p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#050605] transition hover:opacity-95 disabled:opacity-60"
            style={{
              backgroundColor: 'var(--dash-accent)',
              boxShadow: 'var(--dash-glow)',
            }}
          >
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-2 rounded-xl border border-red-500/35 bg-red-500/10 p-2.5 text-[11px] text-red-300"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError('')}
              aria-label="Dismiss error"
              className="opacity-75 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Recent Uploaded Files */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold">Recent Documents</span>
            <span
              className="font-mono text-[10px]"
              style={{ color: 'var(--dash-muted)' }}
            >
              {documents.length} files
            </span>
          </div>

          {documents.length === 0 ? (
            <div
              className="rounded-xl border border-dashed p-5 text-center text-xs"
              style={{
                borderColor: 'var(--dash-border)',
                color: 'var(--dash-muted)',
              }}
            >
              No documents uploaded yet. Drop a statement above to preview.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => {
                const isPdf = doc.ext === 'PDF'
                return (
                  <div
                    key={doc.id}
                    onClick={() => setPreviewDoc(doc)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPreviewDoc(doc)
                      }
                    }}
                    className="group cursor-pointer rounded-xl border p-2.5 transition-colors"
                    style={{
                      backgroundColor: 'var(--dash-card)',
                      borderColor: 'var(--dash-border)',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: isPdf
                            ? 'rgba(255, 98, 98, 0.14)'
                            : 'var(--dash-accent-bg)',
                          color: isPdf ? '#FF6262' : 'var(--dash-accent)',
                        }}
                      >
                        {isPdf ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {doc.name}
                        </p>
                        <p
                          className="mt-0.5 text-[10px]"
                          style={{ color: 'var(--dash-muted)' }}
                        >
                          {doc.sizeLabel} · {doc.uploadedAt.split('·')[0].trim()}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold"
                            style={{
                              color:
                                doc.status === 'PROCESSED'
                                  ? 'var(--dash-accent)'
                                  : doc.status === 'FAILED'
                                    ? '#FF6262'
                                    : '#F2B84B',
                            }}
                          >
                            {doc.status === 'PROCESSED' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : doc.status === 'FAILED' ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {doc.status}
                          </span>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              title="Preview document"
                              aria-label={`Preview ${doc.name}`}
                              className="rounded-md p-1 opacity-75 transition hover:bg-white/10 hover:opacity-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocument(doc)}
                              title="Download document"
                              aria-label={`Download ${doc.name}`}
                              className="rounded-md p-1 opacity-75 transition hover:bg-white/10 hover:opacity-100"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocToDelete(doc)}
                              title="Delete document"
                              aria-label={`Delete ${doc.name}`}
                              className="rounded-md p-1 text-red-400 opacity-75 transition hover:bg-red-500/15 hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Storage Used + Supported Types */}
      <div
        className="mt-5 space-y-3 rounded-2xl border p-3.5"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Storage Used</span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--dash-accent)' }}>
              {storagePct}%
            </span>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--dash-input)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${storagePct}%`,
                backgroundColor: 'var(--dash-accent)',
              }}
            />
          </div>
          <p
            className="mt-1.5 font-mono text-[10px]"
            style={{ color: 'var(--dash-muted)' }}
          >
            {totalStorageMB} MB / 100 MB workspace storage
          </p>
        </div>

        <div
          className="border-t pt-2.5"
          style={{ borderColor: 'var(--dash-border)' }}
        >
          <p
            className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--dash-muted)' }}
          >
            File Types Supported
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className="rounded-md px-2 py-0.5 font-semibold"
              style={{
                backgroundColor: 'var(--dash-accent-bg)',
                color: 'var(--dash-accent)',
              }}
            >
              CSV
            </span>
            <span
              className="rounded-md px-2 py-0.5 font-semibold"
              style={{
                backgroundColor: 'rgba(184, 243, 107, 0.14)',
                color: 'var(--dash-accent-soft)',
              }}
            >
              XLSX
            </span>
            <span className="rounded-md bg-[#FF6262]/15 px-2 py-0.5 font-semibold text-[#FF6262]">
              PDF
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
