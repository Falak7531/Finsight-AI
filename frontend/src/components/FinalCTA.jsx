import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050505] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl border border-[#8BFF19]/25 bg-[#0B0D0E] px-6 py-16 text-center shadow-[0_24px_90px_rgba(0,0,0,0.75)] sm:px-12 sm:py-20"
        >
          {/* Neon lime ambient horizon lighting */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[#8BFF19]/[0.16] blur-[110px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8BFF19]/75 to-transparent"
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="font-mono text-xs font-semibold tracking-widest text-[#8BFF19] uppercase">
              Your Money. Your Insights. Your Control.
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Take Control of Your Financial Story.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#9CA3AF] sm:text-lg">
              Start understanding your money with clarity, context, and
              intelligent insights.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-[#8BFF19] px-8 py-3.5 text-sm font-semibold text-[#050505] shadow-[0_0_36px_rgba(139,255,25,0.34)] transition hover:bg-[#9eff3d] hover:shadow-[0_0_48px_rgba(139,255,25,0.48)] active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-[#E5E7EB] transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
