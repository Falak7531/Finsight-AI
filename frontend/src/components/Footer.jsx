import { ExternalLink } from 'lucide-react'
import { GITHUB_REPO_URL } from '../data/sampleFinanceData'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#050505] pt-14 pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 pb-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <a href="#home" aria-label="FinSight Home">
              <Logo />
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#9CA3AF]">
              AI-powered financial intelligence that turns raw everyday
              transactions into clear spending summaries, category trends, and
              unusual pattern highlights.
            </p>
            <p className="mt-3 font-mono text-xs text-[#8BFF19]">
              Your Money. Your Insights. Your Control.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#9CA3AF]">
              <li>
                <a href="#home" className="transition hover:text-[#8BFF19]">
                  Home
                </a>
              </li>
              <li>
                <a href="#dashboard" className="transition hover:text-[#8BFF19]">
                  Dashboard Preview
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition hover:text-[#8BFF19]"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#9CA3AF]">
              <li>
                <a href="#features" className="transition hover:text-[#8BFF19]">
                  Features
                </a>
              </li>
              <li>
                <a href="#about" className="transition hover:text-[#8BFF19]">
                  About
                </a>
              </li>
              <li>
                <a href="#about" className="transition hover:text-[#8BFF19]">
                  AI Insights
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">
              Project
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#9CA3AF]">
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-[#8BFF19]"
                >
                  GitHub Repository
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.07] pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs leading-relaxed text-[#71717A]">
              FinSight is a financial tracking and analytics platform, not a
              banking service or financial advisor.
            </p>
            <p className="shrink-0 text-xs text-[#71717A]">
              © {new Date().getFullYear()} FinSight. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
