import { Outlet, Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-trust text-white shadow-md">
          <TrendingUp className="h-5 w-5" />
        </div>
        <span className="text-xl font-semibold text-trust dark:text-foreground">FinPath</span>
      </Link>

      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card shadow-md p-8">
        <Outlet />
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        FinPath is an educational tool only. Nothing here constitutes personalized financial advice.{' '}
        <Link to="/disclosures" className="underline hover:text-foreground transition-colors">
          Read our full disclosures.
        </Link>
      </p>
    </div>
  )
}
