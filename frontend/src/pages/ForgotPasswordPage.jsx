import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] px-4 py-12 text-white sm:px-6">
      {/* Subtle architectural background & ambient glow */}
      <div
        aria-hidden="true"
        className="bg-clario-grid pointer-events-none fixed inset-0 opacity-45 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000_40%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 left-1/2 h-[300px] w-[480px] -translate-x-1/2 rounded-full bg-[#8BFF19]/[0.08] blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-7 flex justify-center">
          <Link
            to="/"
            className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BFF19]"
          >
            <Logo />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1015] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.75)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8BFF19]/50 to-transparent"
          />
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-xs text-[#71717A]">
          FinSight is a financial tracking and analytics platform, not a banking
          service or financial advisor.
        </p>
      </motion.div>
    </div>
  )
}
