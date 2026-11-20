import { Outlet } from 'react-router-dom'
import { DashboardProvider, useDashboard } from '../../context/DashboardContext'
import { ConfirmDialog } from './ConfirmDialog'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'
import { DocumentPanel } from './DocumentPanel'
import { DocumentPreviewModal } from './DocumentPreviewModal'

function DashboardShell() {
  const {
    theme,
    mobileDocsOpen,
    setMobileDocsOpen,
    previewDoc,
    setPreviewDoc,
    docToDelete,
    setDocToDelete,
    confirmDeleteDocument,
    downloadDocument,
  } = useDashboard()

  return (
    <div
      className="finsight-dashboard flex min-h-screen w-full"
      data-dash-theme={theme}
    >
      {/* Left Fixed/Collapsible Sidebar */}
      <DashboardSidebar />

      {/* Center Content Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Persistent Right Document Workspace (Desktop xl+) */}
      <aside
        aria-label="Document Workspace"
        className="hidden w-[308px] shrink-0 border-l xl:block"
        style={{
          backgroundColor: 'var(--dash-bg-secondary)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          <DocumentPanel />
        </div>
      </aside>

      {/* Mobile / Tablet Slide-Over Document Drawer */}
      {mobileDocsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileDocsOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="h-full w-[320px] max-w-[90vw] overflow-y-auto border-l shadow-2xl"
            style={{
              backgroundColor: 'var(--dash-bg-secondary)',
              borderColor: 'var(--dash-border)',
            }}
          >
            <DocumentPanel isDrawer />
          </aside>
        </div>
      )}

      {/* Document Preview Drawer */}
      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={downloadDocument}
        onDelete={(doc) => setDocToDelete(doc)}
      />

      {/* Destructive Action Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(docToDelete)}
        title="Delete Document?"
        description={
          docToDelete
            ? `Are you sure you want to remove "${docToDelete.name}" from your FinSight workspace? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete File"
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  )
}

export function DashboardLayout() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  )
}
