import { useState, useEffect } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import { TrendingUp, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { to: '/#features', label: 'Features' },
    { to: '/#how-it-works', label: 'How it works' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-lg shadow-trust/5 border-b border-trust/10'
          : 'bg-white/70 backdrop-blur-xl border-b border-white/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-20 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="FinPath home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-trust text-white shadow-sm">
            <TrendingUp className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter text-trust">FinPath</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Marketing navigation">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className="text-sm font-semibold text-slate-600 hover:text-trust transition-colors"
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="ghost" className="text-trust font-semibold" asChild>
            <Link to="/auth/login">Sign In</Link>
          </Button>
          <Button
            size="sm"
            className="bg-trust hover:bg-trust/90 text-white rounded-full px-6 font-bold shadow-md shadow-trust/20"
            asChild
          >
            <Link to="/auth/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-trust"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-trust/10 px-4 py-6 space-y-4">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-semibold text-slate-600 hover:text-trust py-2"
            >
              {label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-trust/10">
            <Button variant="ghost" className="w-full text-trust font-semibold" asChild>
              <Link to="/auth/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
            </Button>
            <Button className="w-full bg-trust text-white rounded-full font-bold" asChild>
              <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-trust text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="FinPath home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-growth text-white">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter">FinPath</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Goal-based financial planning for India. Educational tool — not personalised investment advice.
            </p>
            <p className="mt-4 text-xs text-white/40">
              © {new Date().getFullYear()} FinPath. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white/90 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/#features" className="hover:text-growth transition-colors">Features</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-growth transition-colors">How it works</Link></li>
              <li><Link to="/auth/register" className="hover:text-growth transition-colors">Get Started Free</Link></li>
              <li><Link to="/auth/login" className="hover:text-growth transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white/90 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/disclosures" className="hover:text-growth transition-colors">Disclosures</Link></li>
              <li><Link to="/privacy" className="hover:text-growth transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-growth transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white/90 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/about" className="hover:text-growth transition-colors">About FinPath</Link></li>
              <li><Link to="/contact" className="hover:text-growth transition-colors">Contact & Support</Link></li>
              <li><Link to="/about#info" className="hover:text-growth transition-colors">Info & Disclaimers</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            Not SEBI registered. Not personalised investment advice. For educational purposes only.
          </p>
          <div className="flex gap-4">
            <Link to="/disclosures" className="hover:text-white transition-colors">Disclosures</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
