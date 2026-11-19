import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Compass,
  GitCompareArrows,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const BREAKDOWN_CARDS = [
  {
    id: 'pattern',
    icon: TrendingUp,
    label: 'Spending Pattern',
    metric: '5 weekend spikes',
    detail:
      '58% of recorded dining transactions occurred between Friday evening and Sunday night, averaging ₹980 per order.',
  },
  {
    id: 'comparison',
    icon: GitCompareArrows,
    label: 'Category Comparison',
    metric: '₹8,420 vs ₹6,680',
    detail:
      'Food & Dining rose by +26.0% compared with the prior month and accounts for 33.9% of total recorded spending.',
  },
  {
    id: 'action',
    icon: Compass,
    label: 'Suggested Action',
    metric: 'Set ₹7,000 alert',
    detail:
      'Consider enabling a weekly dining check-in or trimming 2 high-ticket delivery orders to stay within your monthly target.',
  },
]

export function AIInsightSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050505] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[340px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8BFF19]/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8BFF19]/25 bg-[#8BFF19]/[0.08] px-3.5 py-1 text-xs font-medium text-[#8BFF19]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Intelligence Showcase · Illustrative Example
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Your Financial Data. Explained Intelligently.
          </h2>
          <p className="mt-3.5 text-base leading-relaxed text-[#9CA3AF]">
            FinSight translates raw transaction logs into clear, grounded
            explanations so you immediately understand what changed and why.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="relative mt-12 overflow-hidden rounded-2xl border border-[#8BFF19]/25 bg-[#0B0D0E] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)] sm:p-8 lg:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8BFF19]/65 to-transparent"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8BFF19]/15 text-[#8BFF19] ring-1 ring-[#8BFF19]/30">
                <Lightbulb className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  FinSight Intelligence Summary
                </p>
                <p className="font-mono text-xs text-[#71717A]">
                  Generated from illustrative monthly transaction patterns
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111417] px-3 py-1 font-mono text-[11px] text-[#9CA3AF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8BFF19]" />
              Illustrative Preview
            </span>
          </div>

          <blockquote className="mt-6 rounded-xl border border-white/[0.07] bg-[#111417] p-5 sm:p-6">
            <p className="text-lg font-medium leading-relaxed text-white sm:text-xl">
              “Your food and dining expenses increased this month compared with
              your previous month. Dining represents a significant share of your
              recorded spending.”
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#8BFF19]/15 px-3 py-1 font-semibold text-[#8BFF19]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +26.0% MoM · Food & Dining
              </span>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[#9CA3AF]">
                33.9% of ₹24,850 total spend
              </span>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[#D1D5DB]">
                18 recorded transactions
              </span>
            </div>
          </blockquote>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {BREAKDOWN_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.id}
                  className="rounded-xl border border-white/[0.07] bg-[#080A0B] p-5 transition-colors hover:border-white/15"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-[#9CA3AF] uppercase">
                      {card.label}
                    </span>
                    <Icon className="h-4 w-4 text-[#8BFF19]" />
                  </div>
                  <p className="tabular-nums mt-3 font-mono text-base font-bold text-white">
                    {card.metric}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#9CA3AF]">
                    {card.detail}
                  </p>
                </div>
              )
            })}
          </div>

          <p className="mt-5 text-center font-mono text-[11px] text-[#71717A]">
            Note: The example above is illustrative sample output demonstrating
            how FinSight presents transaction-grounded insights.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
