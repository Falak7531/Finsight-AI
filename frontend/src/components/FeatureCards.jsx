import { motion } from 'framer-motion'
import { Activity, BarChart3, FolderKanban, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    id: 'tracking',
    icon: FolderKanban,
    badge: 'Categorization',
    title: 'Smart Expense Tracking',
    description:
      'Organize and categorize transactions effortlessly across food, bills, commute, and shopping so every rupee is accounted for.',
    points: [
      'Clean categorization for everyday UPI and bill spend',
      'Instant breakdown of recurring vs discretionary costs',
    ],
  },
  {
    id: 'insights',
    icon: Sparkles,
    badge: 'Plain-Language AI',
    title: 'AI-Powered Insights',
    description:
      'Turn raw transaction history into concise, readable summaries and practical suggestions grounded directly in your spending data.',
    points: [
      'Monthly narratives without spreadsheet formulas',
      'Clear context behind category spikes and shifts',
    ],
  },
  {
    id: 'unusual',
    icon: Activity,
    badge: 'Pattern Awareness',
    title: 'Unusual Spending Detection',
    description:
      'Highlight transactions that stand out from your normal spending habits—surfacing unexpected jumps without falsely claiming fraud detection.',
    points: [
      'Compares new transactions against your category baseline',
      'Transparent outlier flags with supporting numbers',
    ],
  },
  {
    id: 'overview',
    icon: BarChart3,
    badge: 'Visual Analytics',
    title: 'Financial Overview',
    description:
      'Monitor monthly income, expenses, savings pace, and multi-month spending trajectories from one distraction-free dark workspace.',
    points: [
      'Interactive monthly, quarterly, and 6-month trend views',
      'Real-time budget utilization bars in INR',
    ],
  },
]

export function FeatureCards() {
  return (
    <section
      id="features"
      className="relative border-t border-white/[0.06] bg-[#050505] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#8BFF19]/25 bg-[#8BFF19]/[0.08] px-3.5 py-1 text-xs font-medium text-[#8BFF19]">
            Core Capabilities
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Everything You Need to Understand Your Money.
          </h2>
          <p className="mt-3.5 text-base leading-relaxed text-[#9CA3AF]">
            Built for students, young professionals, and first-time budget
            planners who want clarity instead of clutter.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.article
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0B0D0E] p-6 transition-colors duration-300 hover:border-[#8BFF19]/35 sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#8BFF19]/25 bg-[#111417] text-[#8BFF19] transition-colors duration-300 group-hover:border-[#8BFF19]/50 group-hover:bg-[#8BFF19]/12">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-white/8 bg-[#111417] px-3 py-1 font-mono text-[11px] text-[#9CA3AF]">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-relaxed text-[#9CA3AF]">
                    {feature.description}
                  </p>
                </div>

                <ul className="mt-6 space-y-2 border-t border-white/[0.07] pt-4">
                  {feature.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2.5 text-xs text-[#D1D5DB]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8BFF19]" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
