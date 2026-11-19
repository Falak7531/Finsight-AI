import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../Logo'

function SpendingIllustration({ variant = 'login' }) {
  const points =
    variant === 'login'
      ? [
          { x: 16, y: 74, label: 'W1', val: '₹4.6k' },
          { x: 108, y: 58, label: 'W2', val: '₹5.8k' },
          { x: 200, y: 32, label: 'W3', val: '₹7.5k' },
          { x: 292, y: 40, label: 'W4', val: '₹6.9k' },
        ]
      : [
          { x: 16, y: 68, label: 'Feb', val: '₹22.0k' },
          { x: 108, y: 54, label: 'Mar', val: '₹23.2k' },
          { x: 200, y: 50, label: 'Apr', val: '₹23.4k' },
          { x: 292, y: 30, label: 'May', val: '₹24.8k' },
        ]

  const path = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = points[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const area = `${path} L ${points[points.length - 1].x} 94 L ${points[0].x} 94 Z`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1015] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8BFF19]/60 to-transparent"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#A1A1AA]">
            {variant === 'login' ? 'Monthly Spending' : 'Monthly Financial Overview'}
          </p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="tabular-nums font-mono text-2xl font-bold text-white">
              ₹24,850
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#8BFF19]/12 px-2 py-0.5 font-mono text-[11px] font-medium text-[#8BFF19]">
              <TrendingUp className="h-3 w-3" />
              82.8% of ₹30k
            </span>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-[#050505] px-2.5 py-1 font-mono text-[10px] text-[#A1A1AA]">
          Illustrative
        </span>
      </div>

      {variant === 'signup' && (
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-white/[0.06] bg-[#080A0E] px-3 py-2">
            <p className="text-[11px] text-[#A1A1AA]">Total Income</p>
            <p className="tabular-nums mt-0.5 font-mono text-sm font-semibold text-white">
              ₹68,500
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#080A0E] px-3 py-2">
            <p className="text-[11px] text-[#A1A1AA]">Net Saved</p>
            <p className="tabular-nums mt-0.5 font-mono text-sm font-semibold text-[#8BFF19]">
              ₹43,650 (63.7%)
            </p>
          </div>
        </div>
      )}

      {/* Smooth neon-green chart */}
      <div className="mt-4">
        <svg
          viewBox="0 0 308 98"
          className="h-[92px] w-full overflow-visible"
          role="img"
          aria-label="Illustrative FinSight monthly spending chart"
        >
          <defs>
            <linearGradient id={`authGrad-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8BFF19" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#8BFF19" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[28, 60].map((y) => (
            <line
              key={y}
              x1="12"
              y1={y}
              x2="296"
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 4"
            />
          ))}

          <motion.path
            d={area}
            fill={`url(#authGrad-${variant})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          />
          <motion.path
            d={path}
            fill="none"
            stroke="#8BFF19"
            strokeWidth="2.4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
          {points.map((pt, idx) => (
            <circle
              key={pt.label}
              cx={pt.x}
              cy={pt.y}
              r={idx === points.length - 1 ? 4.5 : 3}
              fill={idx === points.length - 1 ? '#8BFF19' : '#0D1015'}
              stroke="#8BFF19"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div className="mt-1 flex items-center justify-between px-1 font-mono text-[10.5px] text-[#71717A]">
          {points.map((pt) => (
            <span key={pt.label}>
              {pt.label} · {pt.val}
            </span>
          ))}
        </div>
      </div>

      {/* Mini AI Insight Footer */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#8BFF19]/20 bg-[#8BFF19]/[0.06] px-3 py-2.5 text-xs text-[#D4D4D8]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#8BFF19]" />
        <span className="truncate">
          Dining represents 33.9% of recorded monthly spend.
        </span>
      </div>
    </div>
  )
}

export function AuthLayout({
  variant = 'login',
  panelTitle,
  panelDescription,
  benefits = [],
  children,
}) {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      {/* Subtle architectural background & ambient glow */}
      <div
        aria-hidden="true"
        className="bg-clario-grid pointer-events-none fixed inset-0 opacity-45 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,#000_40%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 left-1/4 h-[360px] w-[480px] rounded-full bg-[#8BFF19]/[0.08] blur-[130px]"
      />

      {/* Mobile Top Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-4 py-4 lg:hidden">
        <Link
          to="/"
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BFF19]"
        >
          <Logo />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0D1015] px-3.5 py-1.5 text-xs font-medium text-[#A1A1AA] transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl items-center px-4 py-8 sm:px-6 lg:min-h-screen lg:px-8 lg:py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Promotional Panel (Desktop & Large Tablet) */}
          <motion.section
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="hidden lg:col-span-6 lg:flex lg:flex-col lg:justify-between"
          >
            <div>
              <Link
                to="/"
                className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BFF19]"
              >
                <Logo />
              </Link>

              <h1 className="mt-8 text-4xl font-bold tracking-tight text-white xl:text-[2.75rem] xl:leading-[1.1]">
                {panelTitle}
              </h1>
              <p className="mt-3.5 max-w-md text-base leading-relaxed text-[#A1A1AA]">
                {panelDescription}
              </p>

              <div className="mt-8 max-w-md">
                <SpendingIllustration variant={variant} />
              </div>

              <ul className="mt-7 space-y-3">
                {benefits.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-[#D4D4D8]"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8BFF19]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-10 text-xs text-[#71717A]">
              FinSight is a financial tracking and analytics platform, not a
              banking service or financial advisor.
            </p>
          </motion.section>

          {/* Right Authentication Form Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
            className="mx-auto w-full max-w-md lg:col-span-6 lg:max-w-[460px]"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1015] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.75)] sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8BFF19]/50 to-transparent"
              />
              {children}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
