import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'

export function DocumentsPage() {
  const {
    documents,
    handleUploadFiles,
    setPreviewDoc,
    setDocToDelete,
    downloadDocument,
  } = useDashboard()

  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = documents.filter((doc) => {
    if (statusFilter !== 'All' && doc.status !== statusFilter) return false
    if (query.trim() && !doc.name.toLowerCase().includes(query.trim().toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--dash-muted)' }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter documents by filename..."
            className="w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
            style={{
              backgroundColor: 'var(--dash-input)',
              borderColor: 'var(--dash-border)',
              color: 'var(--dash-text)',
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['All', 'PROCESSED', 'PROCESSING', 'FAILED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
              style={{
                backgroundColor:
                  statusFilter === st ? 'var(--dash-accent-bg)' : 'var(--dash-input)',
                borderColor:
                  statusFilter === st ? 'var(--dash-accent)' : 'var(--dash-border)',
                color:
                  statusFilter === st ? 'var(--dash-accent)' : 'var(--dash-muted)',
              }}
            >
              {st}
            </button>
          ))}

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
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#0B140E]"
            style={{ backgroundColor: 'var(--dash-accent)' }}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Full File Library Table */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: 'var(--dash-card)',
          borderColor: 'var(--dash-border)',
        }}
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: 'var(--dash-muted)' }}>
            No documents match your filter. Upload a CSV, XLSX, or PDF statement to get started.
          </div>
        ) : (
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
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold">Parsed Rows</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                {filtered.map((doc) => {
                  const isPdf = doc.ext === 'PDF'
                  return (
                    <tr key={doc.id}>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-3 text-left hover:underline"
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
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
                          <div>
                            <p className="font-semibold">{doc.name}</p>
                            <p className="text-[11px]" style={{ color: 'var(--dash-muted)' }}>
                              {doc.ext} · {doc.sizeLabel} · {doc.account}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5" style={{ color: 'var(--dash-muted)' }}>
                        {doc.uploadedAt}
                      </td>
                      <td className="px-4 py-3.5 font-mono tabular-nums">
                        {doc.rowsParsed}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor:
                              doc.status === 'PROCESSED'
                                ? 'var(--dash-accent-bg)'
                                : doc.status === 'FAILED'
                                  ? 'rgba(255, 98, 98, 0.16)'
                                  : 'rgba(242, 184, 75, 0.16)',
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
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            title="Preview"
                            className="rounded-lg border p-1.5 transition hover:opacity-85"
                            style={{ borderColor: 'var(--dash-border)' }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDocument(doc)}
                            title="Download"
                            className="rounded-lg border p-1.5 transition hover:opacity-85"
                            style={{ borderColor: 'var(--dash-border)' }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            title="Delete"
                            className="rounded-lg border border-red-500/30 p-1.5 text-red-400 transition hover:bg-red-500/15"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
