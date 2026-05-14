import { Outlet, Link, NavLink } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { TrendingUp, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="FinPath home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-trust text-white">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold text-trust dark:text-foreground">FinPath</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground" aria-label="Marketing navigation">
          <NavLink to="/#features" className="hover:text-foreground transition-colors">Features</NavLink>
          <NavLink to="/#how-it-works" className="hover:text-foreground transition-colors">How it works</NavLink>
          <NavLink to="/about" className="hover:text-foreground transition-colors">About</NavLink>
          <NavLink to="/contact" className="hover:text-foreground transition-colors">Contact</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" className="bg-trust hover:bg-trust/90 text-white" asChild>
            <Link to="/auth/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3" aria-label="FinPath home">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-trust text-white">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="font-semibold text-trust dark:text-foreground">FinPath</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Goal-based financial planning for India. Educational tool — not personalized advice.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link to="/#how-it-works" className="hover:text-foreground transition-colors">How it works</Link></li>
            <li><Link to="/auth/register" className="hover:text-foreground transition-colors">Get Started</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/disclosures" className="hover:text-foreground transition-colors">Disclosures</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Info</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mt-10 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} FinPath. All information is for educational purposes only.
          Not SEBI registered. Not personalized investment advice. &nbsp;·&nbsp;
          <Link to="/disclosures" className="underline hover:text-foreground">Disclosures</Link>
          &nbsp;·&nbsp;
          <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>
          &nbsp;·&nbsp;
          <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
        </p>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Special thanks to <span className="font-medium text-foreground">Vishwa Makwana</span> — without her this would not have been possible.
        </p>
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
