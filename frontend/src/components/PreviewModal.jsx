import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Info, X } from 'lucide-react'
import { useEffect } from 'react'
import { GITHUB_REPO_URL } from '../data/sampleFinanceData'

export function PreviewModal({ isOpen, mode, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const isLogin = mode === 'login'

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8BFF19]/30 bg-[#8BFF19]/10 px-3 py-1 text-xs font-medium text-[#8BFF19]">
                <Info className="h-3.5 w-3.5" />
                Product Showcase Preview
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-full p-1.5 text-[#9CA3AF] transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3
              id="preview-modal-title"
              className="mt-4 text-xl font-bold text-white"
            >
              {isLogin
                ? 'Workspace Login Coming Soon'
                : 'Explore the FinSight Analytics Preview'}
            </h3>

            <p className="mt-2.5 text-sm leading-relaxed text-[#9CA3AF]">
              {isLogin
                ? 'Live user authentication is not enabled in this landing page preview. Explore the interactive INR dashboard mockup right below or follow the project on GitHub.'
                : 'Account onboarding and CSV import workflows are being connected to the FinSight backend. Inspect the live interactive dashboard preview below to experience FinSight.'}
            </p>

            <div className="mt-5 rounded-xl border border-white/8 bg-[#111417] p-3.5 text-xs leading-relaxed text-[#9CA3AF]">
              <span className="font-semibold text-white">Illustrative data:</span>{' '}
              All charts, INR figures, and AI summaries on this page are sample demonstration visuals.
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a
                href="#dashboard"
                onClick={onClose}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#8BFF19] px-5 py-2.5 text-sm font-semibold text-[#050505] transition hover:bg-[#9eff3d]"
              >
                Explore Dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/[0.07]"
              >
                GitHub
                <ExternalLink className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
