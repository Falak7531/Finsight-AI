import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-x-clip pt-12 pb-10 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16"
    >
      {/* Subtle architectural grid fading toward edges */}
      <div
        aria-hidden="true"
        className="bg-clario-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_20%,#000_40%,transparent_100%)]"
      />

      {/* Subtle top-center ambient neon lime aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 h-[320px] w-[540px] -translate-x-1/2 rounded-full bg-[#8BFF19]/[0.07] blur-[120px]"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Small neon-green pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full border border-[#8BFF19]/30 bg-[#8BFF19]/[0.08] px-4 py-1.5 text-xs font-medium tracking-wide text-[#8BFF19]"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8BFF19] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8BFF19]" />
          </span>
          AI-Powered Financial Intelligence
        </motion.div>

        {/* Large, elegant, centered white headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
          className="mx-auto mt-7 max-w-4xl text-4xl font-bold tracking-[-0.035em] text-white sm:text-6xl lg:text-[4.25rem] lg:leading-[1.06]"
        >
          Take Control of Your Money.
          <br className="hidden sm:inline" />{' '}
          <span className="text-white/95">Understand Every Move.</span>
        </motion.h1>

        {/* Centered muted grey subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#9CA3AF] sm:text-lg sm:leading-relaxed"
        >
          Your financial data, finally making sense. Track spending, uncover
          patterns, and gain intelligent insights with FinSight.
        </motion.p>

        {/* Rounded neon-green CTA button with subtle green glow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: 'easeOut' }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-[#8BFF19] px-8 py-3.5 text-sm font-semibold text-[#050505] shadow-[0_0_36px_rgba(139,255,25,0.34)] transition duration-200 hover:bg-[#9eff3d] hover:shadow-[0_0_48px_rgba(139,255,25,0.48)] active:scale-[0.98]"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-[#E5E7EB] transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
          >
            Open Live Dashboard
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
