import { motion } from 'framer-motion'
import { Cpu, FileSpreadsheet, LayoutDashboard } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: FileSpreadsheet,
    title: 'Add Your Transactions',
    description:
      'Import a supported transaction CSV or enter transactions manually to create your personal financial ledger.',
    meta: 'CSV import · Manual entry',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Let FinSight Analyze',
    description:
      'Transactions are organized and analyzed to identify spending patterns, category shifts, and unusual spikes.',
    meta: 'Categorize · Detect patterns',
  },
  {
    number: '03',
    icon: LayoutDashboard,
    title: 'Understand Your Finances',
    description:
      'Explore dashboards, spending summaries, and personalized insights built to clarify everyday financial decisions.',
    meta: 'Dashboards · Clear insights',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-white/[0.06] bg-[#08090A] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-white/10 bg-[#111417] px-3.5 py-1 text-xs font-medium text-[#8BFF19]">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            From Transactions to Intelligence in Three Steps.
          </h2>
          <p className="mt-3.5 text-base text-[#9CA3AF]">
            Go from raw transaction exports to structured clarity in minutes.
          </p>
        </motion.div>

        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-14 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-[#8BFF19]/15 via-[#8BFF19]/55 to-[#8BFF19]/15 lg:block"
          />

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-7">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: idx * 0.1 }}
                  className="relative flex flex-col rounded-2xl border border-white/[0.08] bg-[#0B0D0E] p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-[#8BFF19]/30 bg-[#050505] text-[#8BFF19] shadow-[0_0_24px_rgba(139,255,25,0.14)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold tracking-widest text-[#71717A]">
                      STEP {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#9CA3AF]">
                    {step.description}
                  </p>

                  <div className="mt-6 border-t border-white/[0.07] pt-4 font-mono text-xs text-[#8BFF19]">
                    {step.meta}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
