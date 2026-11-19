import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.07] bg-[#050505]/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        {/* Left: FinSight Logo */}
        <Link
          to="/"
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BFF19]"
        >
          <Logo />
        </Link>

        {/* Center: Minimal Navigation Links */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-[#9CA3AF] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right: Rounded CTA Links */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            to="/login"
            className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-2 text-sm font-medium text-[#E5E7EB] transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-[#8BFF19] px-5 py-2 text-sm font-semibold text-[#050505] shadow-[0_0_24px_rgba(139,255,25,0.28)] transition hover:bg-[#9eff3d] active:scale-[0.98]"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.03] p-2.5 text-[#E5E7EB] transition hover:border-white/25 hover:text-white md:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/8 bg-[#08090A]/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 pt-3 pb-5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#D1D5DB] transition hover:bg-white/[0.05] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2.5 border-t border-white/8 pt-4">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/[0.07]"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-full bg-[#8BFF19] px-4 py-2.5 text-center text-sm font-semibold text-[#050505] transition hover:bg-[#9eff3d]"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
