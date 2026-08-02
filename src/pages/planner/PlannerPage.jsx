import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { toast } from 'sonner'
import {
  Save, Calculator, TrendingUp, Calendar, Receipt, Info,
  Shield, Target, Zap, Award, PiggyBank, Wallet, IndianRupee,
  Sparkles, BarChart3, ArrowUpRight, Plus, Trash2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { usePlannerSettings, useSavePlannerSettings, usePlannerExpenses, useSaveExpense, useExpenseItems, useAddExpenseItem, useDeleteExpenseItem } from '@/hooks/usePlanner'
import { useAuth } from '@/context/AuthContext'
import {
  buildDashboard, investmentPct, emergencyLiquidPct,
  IDEAL, fv, computeHealthScore,
} from '@/lib/planner/calculations'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const EXPENSE_CATS = [
  // Housing & Utilities
  { name: 'Rent / Housing', icon: '🏠' },
  { name: 'Electricity', icon: '⚡' },
  { name: 'Gas / LPG', icon: '🔥' },
  { name: 'Internet / Mobile', icon: '📶' },
  { name: 'Home Maintenance', icon: '🔧' },
  // Daily Needs
  { name: 'Grocery', icon: '🛒' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Dining Out', icon: '🍽️' },
  // Transport
  { name: 'Transport / Fuel', icon: '⛽' },
  { name: 'Vehicle Maintenance', icon: '🚗' },
  // Lifestyle
  { name: 'Clothes', icon: '👕' },
  { name: 'Accessories', icon: '👜' },
  { name: 'Personal Care', icon: '💆' },
  { name: 'Gym / Fitness', icon: '🏋️' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Vacation / Travel', icon: '✈️' },
  // Financial & Learning
  { name: 'Insurance', icon: '🛡️' },
  { name: 'Subscriptions', icon: '📺' },
  { name: 'Education', icon: '📚' },
  // Others
  { name: 'Electronics / Gadgets', icon: '📱' },
  { name: 'Festival / Gifts', icon: '🎁' },
  { name: 'Miscellaneous', icon: '📦' },
]

const DEFAULT = {
  monthly_salary: 0, salary_growth_rate: 6,
  expenses_pct: 25, emi_rent_pct: 20, donations_pct: 3, vacation_pct: 12,
  equity_mf_pct: 73, ppf_epf_pct: 12, nps_pct: 0, direct_stocks_pct: 5,
  life_insurance_pm: 1500, health_insurance_pm: 2500, projection_years: 15,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusColor(value, ideal) {
  const diff = Math.abs(value - ideal)
  if (diff <= 2) return { text: 'text-growth', badge: 'bg-growth/10 text-growth' }
  if (diff <= 5) return { text: 'text-amber-500', badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600' }
  return { text: 'text-destructive', badge: 'bg-destructive/10 text-destructive' }
}

// ── Score Ring (SVG circle) ───────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#0891B2' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Stacked Budget Bar ────────────────────────────────────────────────────────
function BudgetBar({ rows }) {
  const COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-amber-400', 'bg-pink-500', 'bg-emerald-500']
  return (
    <div className="space-y-3">
      <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
        {rows.map((r, i) => r.pct > 0 && (
          <div
            key={r.label}
            style={{ width: `${r.pct}%` }}
            className={cn('h-full transition-all duration-500', COLORS[i])}
            title={`${r.label}: ${r.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', COLORS[i])} />
            <span>{r.emoji} {r.label}</span>
            <span className="font-bold text-foreground">{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Enhanced Allocation Slider ─────────────────────────────────────────────────
function AllocSlider({ label, value, ideal, salary, onChange, max = 60, info }) {
  const col = statusColor(value, ideal)
  const monthlyAmt = Math.round((salary * value) / 100)
  return (
    <div className="space-y-2 p-4 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{label}</p>
          {info && <p className="text-xs text-muted-foreground mt-0.5">{info}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn('text-xl font-bold font-numeric', col.text)}>{value}%</span>
          {salary > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(monthlyAmt, 'INR')}/mo</p>}
        </div>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={max} step={1} />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Ideal: <span className="font-semibold text-foreground">{ideal}%</span></span>
        <span className={cn('font-medium px-1.5 py-0.5 rounded-full text-[11px]', col.badge)}>
          {value === ideal ? '✓ On target' : value < ideal ? `${ideal - value}% below` : `${value - ideal}% above`}
        </span>
      </div>
    </div>
  )
}

// ── Health Pillar Row ─────────────────────────────────────────────────────────
function HealthPillar({ label, score, max, icon: Icon }) {
  const pct = Math.round((score / max) * 100)
  const barColor = pct >= 80 ? 'bg-growth' : pct >= 50 ? 'bg-amber-400' : 'bg-destructive'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <span className="font-bold text-foreground">{score}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Setup Tab ─────────────────────────────────────────────────────────────────
function SetupTab({ settings, onSave, saving }) {
  const [form, setForm] = useState({ ...DEFAULT, ...settings })
  useEffect(() => { if (settings) setForm(f => ({ ...f, ...settings })) }, [settings])

  const invPct = investmentPct(form)
  const emLiqPct = emergencyLiquidPct(form)
  const budgetTotal = form.expenses_pct + form.emi_rent_pct + form.donations_pct + form.vacation_pct + invPct
  const invSubTotal = form.equity_mf_pct + form.ppf_epf_pct + form.nps_pct + form.direct_stocks_pct + emLiqPct
  const isBalanced = Math.round(budgetTotal) === 100
  const isInvBalanced = Math.round(invSubTotal) === 100
  const monthlyInvest = Math.round(((form.monthly_salary || 0) * invPct) / 100)

  function set(key, val) { setForm(prev => ({ ...prev, [key]: Number(val) })) }

  function handleSave() {
    if (!form.monthly_salary || form.monthly_salary <= 0) return toast.error('Please enter your monthly salary.')
    if (!isBalanced) return toast.error(`Budget total is ${Math.round(budgetTotal)}% — must equal 100%.`)
    if (!isInvBalanced) return toast.error(`Investment sub-total is ${Math.round(invSubTotal)}% — must equal 100%.`)
    onSave({ ...form, emergency_liquid_pct: emLiqPct })
  }

  const budgetBarRows = [
    { label: 'Expenses', emoji: '🛒', pct: form.expenses_pct },
    { label: 'EMI/Rent', emoji: '🏠', pct: form.emi_rent_pct },
    { label: 'Donations', emoji: '💝', pct: form.donations_pct },
    { label: 'Vacation', emoji: '✈️', pct: form.vacation_pct },
    { label: 'Investments', emoji: '📈', pct: invPct },
  ]

  return (
    <div className="max-w-2xl space-y-5">

      {/* Income */}
      <div className="rounded-2xl border border-trust/20 bg-gradient-to-br from-trust/5 to-background p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-trust">
          <IndianRupee className="h-4 w-4" /> Income Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Monthly Salary <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">₹</span>
              <Input
                type="number" min={0} className="pl-7 text-lg font-bold h-12"
                value={form.monthly_salary || ''}
                onChange={e => set('monthly_salary', e.target.value)}
                placeholder="50,000"
              />
            </div>
            {form.monthly_salary > 0 && (
              <p className="text-xs text-muted-foreground">
                Annual: <span className="font-semibold text-foreground">{formatCurrency(form.monthly_salary * 12, 'INR')}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Expected Annual Growth</Label>
              <span className="text-sm font-bold text-trust">{form.salary_growth_rate}%</span>
            </div>
            <Slider value={[form.salary_growth_rate]} onValueChange={([v]) => set('salary_growth_rate', v)} min={0} max={20} step={0.5} />
            <p className="text-xs text-muted-foreground">Typical for salaried professionals: 6–10%/year</p>
          </div>
        </div>
      </div>

      {/* Budget allocation */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-trust" /> Monthly Budget Allocation</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Adjust 4 sliders — investment fills the remainder automatically.</p>
        </div>
        <BudgetBar rows={budgetBarRows} />
        <div className="space-y-3 pt-1">
          <AllocSlider label="Expenses / Needs" value={form.expenses_pct} ideal={IDEAL.expenses} salary={form.monthly_salary} onChange={v => set('expenses_pct', v)} info="Groceries, utilities, daily needs" />
          <AllocSlider label="EMI / Rent" value={form.emi_rent_pct} ideal={IDEAL.emiRent} salary={form.monthly_salary} onChange={v => set('emi_rent_pct', v)} info="Home loan, vehicle, personal loans" />
          <AllocSlider label="Donations" value={form.donations_pct} ideal={IDEAL.donations} salary={form.monthly_salary} onChange={v => set('donations_pct', v)} max={20} info="Charity, family support" />
          <AllocSlider label="Vacation / Leisure" value={form.vacation_pct} ideal={IDEAL.vacation} salary={form.monthly_salary} onChange={v => set('vacation_pct', v)} info="Travel, dining, entertainment" />
        </div>

        {/* Investment auto box */}
        <div className={cn(
          'rounded-xl border p-4 flex items-center justify-between',
          invPct >= 38 ? 'border-growth/40 bg-gradient-to-r from-growth/10 to-growth/5'
            : invPct >= 20 ? 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/20'
              : 'border-destructive/30 bg-destructive/5',
        )}>
          <div className="flex items-center gap-3">
            <PiggyBank className={cn('h-5 w-5', invPct >= 38 ? 'text-growth' : invPct >= 20 ? 'text-amber-500' : 'text-destructive')} />
            <div>
              <p className="text-sm font-semibold">Investments (auto-calculated)</p>
              <p className="text-xs text-muted-foreground">Ideal target: {IDEAL.investments}% of income</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-2xl font-bold font-numeric', invPct >= 38 ? 'text-growth' : invPct >= 20 ? 'text-amber-500' : 'text-destructive')}>{invPct}%</p>
            {form.monthly_salary > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(monthlyInvest, 'INR')}/mo</p>}
          </div>
        </div>

        <div className={cn('flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2.5', isBalanced ? 'bg-growth/10 text-growth' : 'bg-destructive/10 text-destructive')}>
          <span className="text-base">{isBalanced ? '✓' : '✗'}</span>
          Total: {Math.round(budgetTotal)}% {isBalanced ? '— Perfectly balanced' : '— Must equal 100%'}
        </div>
      </div>

      {/* Investment sub-allocation */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-trust" /> Investment Sub-Allocation</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Split your <span className="font-semibold text-foreground">{formatCurrency(monthlyInvest, 'INR')}/mo</span> across asset classes.
          </p>
        </div>
        <div className="space-y-3">
          <AllocSlider label="Equity Mutual Funds (SIP)" value={form.equity_mf_pct} ideal={73} salary={monthlyInvest} onChange={v => set('equity_mf_pct', v)} max={100} info="12% expected CAGR — long-term wealth engine" />
          <AllocSlider label="PPF / EPF" value={form.ppf_epf_pct} ideal={12} salary={monthlyInvest} onChange={v => set('ppf_epf_pct', v)} max={100} info="7.7% guaranteed — tax-free, risk-free" />
          <AllocSlider label="NPS (National Pension)" value={form.nps_pct} ideal={0} salary={monthlyInvest} onChange={v => set('nps_pct', v)} max={40} info="8% expected return + Section 80CCD tax benefit" />
          <AllocSlider label="Direct Stocks" value={form.direct_stocks_pct} ideal={5} salary={monthlyInvest} onChange={v => set('direct_stocks_pct', v)} max={50} info="High risk, high reward — research required" />
        </div>

        <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-400">Emergency / Liquid Fund (auto)</p>
            <p className="text-xs text-muted-foreground">Liquid MFs, savings account — ~5.6% return</p>
          </div>
          <p className={cn('text-2xl font-bold font-numeric', emLiqPct < 0 ? 'text-destructive' : 'text-sky-600')}>{emLiqPct}%</p>
        </div>

        <div className={cn('flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2.5', isInvBalanced ? 'bg-growth/10 text-growth' : 'bg-destructive/10 text-destructive')}>
          <span className="text-base">{isInvBalanced ? '✓' : '✗'}</span>
          Total: {Math.round(invSubTotal)}% {isInvBalanced ? '— Balanced across all asset classes' : '— Must equal 100%'}
        </div>
      </div>

      {/* Protection & projection */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-50 to-background dark:from-slate-900/50 dark:to-background p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-trust" /> Protection & Projection</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Life Insurance (₹/month)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">₹</span>
              <Input type="number" min={0} className="pl-7" value={form.life_insurance_pm} onChange={e => set('life_insurance_pm', e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Recommended: ₹1,500/mo → ₹1 Cr term plan</p>
          </div>
          <div className="space-y-1.5">
            <Label>Health Insurance (₹/month)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">₹</span>
              <Input type="number" min={0} className="pl-7" value={form.health_insurance_pm} onChange={e => set('health_insurance_pm', e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Recommended: ₹2,500/mo family floater</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Projection Horizon</Label>
            <span className="text-lg font-bold text-trust">{form.projection_years} years</span>
          </div>
          <Slider value={[form.projection_years]} onValueChange={([v]) => set('projection_years', v)} min={5} max={30} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 yrs (short)</span>
            <span>15 yrs (ideal)</span>
            <span>30 yrs (long)</span>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg" className="bg-trust hover:bg-trust/90 text-white gap-2 w-full">
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & Build My Plan'}
      </Button>
    </div>
  )
}

// ── Personalized Tips ──────────────────────────────────────────────────────────
function PersonalizedTips({ settings, dash }) {
  const tips = useMemo(() => {
    const t = []
    if (dash.invPct < 30) t.push({
      icon: TrendingUp, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      title: 'Boost your savings rate',
      body: `You're investing ${dash.invPct}% of income. Aim for 40%+ — even 5% more per month compounds into lakhs over ${settings.projection_years} years.`,
    })
    if ((settings.emi_rent_pct || 0) > 35) t.push({
      icon: Target, colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
      title: 'High debt load detected',
      body: `EMI/Rent at ${settings.emi_rent_pct}% exceeds the 20% guideline. Consider prepaying loans early or refinancing for lower EMIs.`,
    })
    if ((settings.life_insurance_pm || 0) < 1000) t.push({
      icon: Shield, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      title: 'Add life insurance',
      body: "A ₹1 Cr term plan costs only ₹1,000–1,500/month. It's the most important financial protection for your family.",
    })
    if ((settings.health_insurance_pm || 0) < 1500) t.push({
      icon: Shield, colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
      title: 'Get health insurance',
      body: 'One hospitalisation can erase years of savings. A ₹10L family floater costs ~₹2,000–2,500/month and is non-negotiable.',
    })
    if ((settings.equity_mf_pct || 0) < 60 && dash.invPct > 20) t.push({
      icon: Sparkles, colorClass: 'text-growth bg-growth/10 border-growth/30',
      title: 'Increase equity exposure',
      body: `Equity MFs have delivered 12%+ CAGR over 10+ years. With a ${settings.projection_years}-year horizon, higher equity allocation can dramatically grow your corpus.`,
    })
    if (t.length === 0) t.push({
      icon: Award, colorClass: 'text-growth bg-growth/10 border-growth/30',
      title: 'Excellent financial discipline!',
      body: 'Your plan is well-balanced across all pillars. Keep investing consistently and review annually as your income and goals evolve.',
    })
    return t.slice(0, 3)
  }, [settings, dash])

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-trust" /> Personalized Insights</h3>
      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className={cn('rounded-xl border p-4 flex gap-3', tip.colorClass)}>
            <tip.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{tip.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ settings }) {
  const dash = useMemo(() => settings ? buildDashboard(settings) : null, [settings])
  const healthScore = useMemo(() => settings ? computeHealthScore(settings) : null, [settings])

  if (!settings) return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/20 dark:to-background p-10 text-center space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
        <Calculator className="h-7 w-7 text-amber-600" />
      </div>
      <h3 className="font-semibold text-lg">Setup required</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">Complete the <strong>Setup</strong> tab with your income and budget preferences to see your personalized financial dashboard.</p>
    </div>
  )

  const yr5 = Math.round(fv(dash.monthlyInvest, 5, 12))
  const yr10 = Math.round(fv(dash.monthlyInvest, 10, 12))

  const invRatioScore = dash.invPct >= 40 ? 30 : dash.invPct >= 30 ? 22 : dash.invPct >= 20 ? 14 : 7
  const emiScore = (settings.emi_rent_pct || 0) <= 20 ? 25 : (settings.emi_rent_pct || 0) <= 30 ? 15 : (settings.emi_rent_pct || 0) <= 40 ? 8 : 0
  const lifeIns = (settings.life_insurance_pm || 0) >= 1000 ? 10 : 0
  const healthIns = (settings.health_insurance_pm || 0) >= 1500 ? 10 : 0
  const expScore = (settings.expenses_pct || 0) <= 25 ? 15 : (settings.expenses_pct || 0) <= 35 ? 8 : 0
  const growthScore = (settings.salary_growth_rate || 0) >= 6 ? 10 : (settings.salary_growth_rate || 0) >= 3 ? 5 : 0

  return (
    <div className="space-y-6">

      {/* Corpus hero */}
      <div className="rounded-2xl bg-gradient-to-br from-trust via-trust/90 to-[#1a3a5c] p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-36 h-36 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Projected Wealth in {settings.projection_years} Years
          </p>
          <p className="text-4xl sm:text-5xl font-bold font-numeric mt-1.5 mb-4 tracking-tight">
            {formatCurrency(dash.totalCorpus, 'INR')}
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm border-t border-white/20 pt-4">
            {[
              { label: 'Total invested', value: formatCurrency(dash.totalInvested, 'INR') },
              { label: 'Wealth multiplier', value: dash.totalInvested > 0 ? `${(dash.totalCorpus / dash.totalInvested).toFixed(1)}×` : '—' },
              { label: 'Lifetime earnings', value: formatCurrency(dash.lifetimeEarnings, 'INR') },
            ].map(m => (
              <div key={m.label}>
                <p className="text-white/60 text-xs">{m.label}</p>
                <p className="font-semibold">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 key metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Monthly Investment', value: formatCurrency(dash.monthlyInvest, 'INR'), sub: `${dash.invPct}% of salary`, color: 'text-growth', icon: TrendingUp, iconColor: 'text-growth' },
          { label: 'Expected CAGR', value: '12%', sub: `Real return: ${dash.realReturn}% (post-inflation)`, color: 'text-trust', icon: ArrowUpRight, iconColor: 'text-trust' },
          { label: 'Annual Salary', value: formatCurrency(dash.annualSalary, 'INR'), sub: `${formatCurrency(settings.monthly_salary, 'INR')}/month`, color: 'text-foreground', icon: IndianRupee, iconColor: 'text-muted-foreground' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <m.icon className={cn('h-3.5 w-3.5', m.iconColor)} />
            </div>
            <p className={cn('text-base font-bold font-numeric leading-tight', m.color)}>{m.value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Financial Health Score */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-5"><Award className="h-4 w-4 text-trust" /> Financial Health Score</h3>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="flex-shrink-0">
            <ScoreRing score={healthScore} />
          </div>
          <div className="flex-1 space-y-3 w-full">
            <HealthPillar label="Investment ratio" score={invRatioScore} max={30} icon={TrendingUp} />
            <HealthPillar label="Debt management" score={emiScore} max={25} icon={Target} />
            <HealthPillar label="Life insurance" score={lifeIns} max={10} icon={Shield} />
            <HealthPillar label="Health insurance" score={healthIns} max={10} icon={Shield} />
            <HealthPillar label="Expense control" score={expScore} max={15} icon={Receipt} />
            <HealthPillar label="Salary growth" score={growthScore} max={10} icon={Zap} />
          </div>
        </div>
      </div>

      {/* Budget allocation */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-trust" /> Budget Allocation</h3>
        <BudgetBar rows={dash.budgetRows} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground">%</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground">Monthly</th>
                <th className="text-right py-2 text-xs font-medium text-muted-foreground">Annual</th>
              </tr>
            </thead>
            <tbody>
              {dash.budgetRows.map((r, i) => (
                <tr key={r.label} className={cn('border-b border-border/40 last:border-0', i === 4 && 'font-semibold bg-growth/5')}>
                  <td className="py-2 text-sm">{r.emoji} {r.label}</td>
                  <td className="py-2 text-right text-xs font-numeric text-muted-foreground">{r.pct}%</td>
                  <td className="py-2 text-right font-numeric font-medium">{formatCurrency(r.monthly, 'INR')}</td>
                  <td className="py-2 text-right font-numeric text-muted-foreground">{formatCurrency(r.annual, 'INR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wealth milestones */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Target className="h-4 w-4 text-trust" /> Wealth Milestones</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { yr: 5, corpus: yr5, gradient: 'from-sky-500 to-blue-600' },
            { yr: 10, corpus: yr10, gradient: 'from-violet-500 to-purple-700' },
            { yr: settings.projection_years, corpus: dash.totalCorpus, gradient: 'from-emerald-500 to-teal-700' },
          ].map(m => (
            <div key={m.yr} className={cn('rounded-xl bg-gradient-to-br p-4 text-white', m.gradient)}>
              <p className="text-white/70 text-xs font-medium">{m.yr}-Year Goal</p>
              <p className="text-xl font-bold font-numeric mt-1 leading-tight">{formatCurrency(m.corpus, 'INR')}</p>
              <p className="text-white/60 text-xs mt-1 font-numeric">
                {m.corpus >= 10000000 ? `${(m.corpus / 10000000).toFixed(1)} Cr` : `${(m.corpus / 100000).toFixed(0)} L`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Investment breakdown */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-trust/5 border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-trust" /> Investment Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Asset Class', '%', 'Monthly', 'Return', `${settings.projection_years}Y Corpus`].map((h, i) => (
                  <th key={h} className={cn('px-4 py-2.5 text-xs font-medium text-muted-foreground', i === 0 ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dash.investRows.map(r => (
                <tr key={r.label} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{r.emoji} {r.label}</td>
                  <td className="px-4 py-2.5 text-right font-numeric text-muted-foreground">{r.pct}%</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(r.monthly, 'INR')}</td>
                  <td className="px-4 py-2.5 text-right font-numeric text-muted-foreground">{r.rate}%</td>
                  <td className="px-4 py-2.5 text-right font-numeric font-bold text-growth">{formatCurrency(r.corpus, 'INR')}</td>
                </tr>
              ))}
              <tr className="bg-trust/5 font-bold border-t-2 border-trust/20">
                <td className="px-4 py-2.5" colSpan={2}>Total</td>
                <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(dash.monthlyInvest, 'INR')}</td>
                <td className="px-4 py-2.5" />
                <td className="px-4 py-2.5 text-right font-numeric text-growth">{formatCurrency(dash.totalCorpus, 'INR')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Protection overview */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-trust" /> Protection Coverage</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Life Insurance', value: formatCurrency(settings.life_insurance_pm, 'INR'), sub: '/month', ok: settings.life_insurance_pm >= 1000 },
            { label: 'Health Insurance', value: formatCurrency(settings.health_insurance_pm, 'INR'), sub: '/month', ok: settings.health_insurance_pm >= 1500 },
            { label: 'Annual Health Cost', value: formatCurrency(settings.health_insurance_pm * 12, 'INR'), sub: '/year', ok: true },
            { label: 'Emergency Target', value: formatCurrency(dash.emergencyFundTarget, 'INR'), sub: '12 months', ok: true },
          ].map(m => (
            <div key={m.label} className={cn('rounded-xl border p-3', m.ok ? 'border-growth/30 bg-growth/5' : 'border-destructive/30 bg-destructive/5')}>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={cn('text-sm font-bold font-numeric mt-0.5', m.ok ? 'text-growth' : 'text-destructive')}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <PersonalizedTips settings={settings} dash={dash} />
    </div>
  )
}

// ── Monthly Tab ───────────────────────────────────────────────────────────────
function MonthlyTab({ settings }) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const { data: expenses = [] } = usePlannerExpenses(year)
  const dash = useMemo(() => settings ? buildDashboard(settings) : null, [settings])
  const actualByMonth = useMemo(() => {
    const map = {}
    expenses.forEach(e => { map[e.month] = (map[e.month] || 0) + Number(e.amount) })
    return map
  }, [expenses])

  if (!settings) return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center space-y-2">
      <Info className="h-5 w-5 mx-auto text-amber-500" />
      <p className="text-sm text-muted-foreground">Complete the <strong>Setup</strong> tab first.</p>
    </div>
  )

  const budgetExpenses = Math.round((settings.monthly_salary * settings.expenses_pct) / 100)
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Monthly Overview</h3>
          <p className="text-xs text-muted-foreground">Budget plan vs your logged actuals</p>
        </div>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Month summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {MONTHS.map((m, i) => {
          const actual = actualByMonth[i + 1] || 0
          const variance = actual - budgetExpenses
          const hasData = actual > 0
          const isCurrent = year === CURRENT_YEAR && i + 1 === currentMonth
          return (
            <div key={m} className={cn(
              'rounded-xl border p-2.5 text-center space-y-1.5 transition-all',
              isCurrent ? 'border-trust bg-trust/5 shadow-sm' : 'border-border bg-card',
              hasData && variance > 0 ? 'border-destructive/40' : hasData && variance < 0 ? 'border-growth/40' : '',
            )}>
              <p className={cn('text-xs font-bold', isCurrent ? 'text-trust' : 'text-muted-foreground')}>{m}</p>
              {hasData ? (
                <>
                  <p className="text-xs font-bold font-numeric text-foreground leading-tight">{formatCurrency(actual, 'INR')}</p>
                  <p className={cn('text-[10px] font-semibold', variance > 0 ? 'text-destructive' : 'text-growth')}>
                    {variance > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(variance), 'INR')}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground">No data</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Full budget table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-trust/5 border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Full Budget Plan — {year}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 bg-muted/30 text-left px-4 py-2.5 font-medium text-muted-foreground min-w-[140px]">Category</th>
                {MONTHS.map(m => <th key={m} className="text-right px-3 py-2.5 font-medium text-muted-foreground">{m}</th>)}
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Annual</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border font-semibold bg-trust/5">
                <td className="sticky left-0 bg-trust/5 px-4 py-2">💰 Salary</td>
                {MONTHS.map((_, i) => <td key={i} className="px-3 py-2 text-right font-numeric">{formatCurrency(settings.monthly_salary, 'INR')}</td>)}
                <td className="px-4 py-2 text-right font-numeric">{formatCurrency(settings.monthly_salary * 12, 'INR')}</td>
              </tr>
              {dash.budgetRows.map(r => (
                <tr key={r.label} className="border-b border-border/40">
                  <td className="sticky left-0 bg-card px-4 py-2">{r.emoji} {r.label}</td>
                  {MONTHS.map((_, i) => <td key={i} className="px-3 py-2 text-right font-numeric text-muted-foreground">{formatCurrency(r.monthly, 'INR')}</td>)}
                  <td className="px-4 py-2 text-right font-numeric">{formatCurrency(r.annual, 'INR')}</td>
                </tr>
              ))}
              <tr className="border-b border-border/40">
                <td className="sticky left-0 bg-card px-4 py-2 font-semibold">📊 Actual Expenses</td>
                {MONTHS.map((_, i) => {
                  const actual = actualByMonth[i + 1] || 0
                  const v = actual - budgetExpenses
                  return (
                    <td key={i} className={cn('px-3 py-2 text-right font-numeric font-medium', actual === 0 ? 'text-muted-foreground' : v > 0 ? 'text-destructive' : 'text-growth')}>
                      {actual === 0 ? '—' : formatCurrency(actual, 'INR')}
                    </td>
                  )
                })}
                <td className="px-4 py-2 text-right font-numeric font-semibold">
                  {formatCurrency(Object.values(actualByMonth).reduce((a, b) => a + b, 0), 'INR')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Category Detail Dialog ────────────────────────────────────────────────────
// Entries stored in planner_expense_items (DB) — works across devices and
// picks up SMS-auto-added entries from the Vercel webhook.
function CategoryDetailDialog({ open, onOpenChange, category, year, month }) {
  const { mutateAsync: addItem, isPending: adding } = useAddExpenseItem()
  const { mutateAsync: deleteItem } = useDeleteExpenseItem()
  const { mutateAsync: saveExpense } = useSaveExpense()
  const { data: allItems = [] } = useExpenseItems(year)

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [particular, setParticular] = useState('')
  const [amount, setAmount] = useState('')

  const entries = useMemo(
    () => allItems
      .filter(e => e.month === month && e.category === category.name)
      .sort((a, b) => (a.entry_date ?? '').localeCompare(b.entry_date ?? '')),
    [allItems, month, category.name]
  )

  const total = entries.reduce((s, e) => s + Number(e.amount), 0)

  async function handleAdd() {
    if (!particular.trim()) { toast.error('Enter a particular / description'); return }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    const amt = Number(amount)
    try {
      await addItem({ year, month, category: category.name, entry_date: date, particular: particular.trim(), amount: amt, source: 'manual' })
      saveExpense({ year, month, category: category.name, amount: total + amt }).catch(() => {})
      setParticular('')
      setAmount('')
    } catch { toast.error('Could not save entry. Please try again.') }
  }

  async function handleDelete(entry) {
    try {
      await deleteItem({ id: entry.id, year })
      saveExpense({ year, month, category: category.name, amount: Math.max(0, total - Number(entry.amount)) }).catch(() => {})
    } catch { toast.error('Could not delete entry.') }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{category.icon}</span> {category.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 3 input fields */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Particular</Label>
              <Input
                placeholder="e.g. Groceries from D-Mart"
                value={particular}
                onChange={e => setParticular(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">₹</span>
                <Input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="pl-7 h-9"
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={adding} className="w-full bg-trust hover:bg-trust/90 text-white gap-2">
              <Plus className="h-4 w-4" /> {adding ? 'Saving…' : 'Add Entry'}
            </Button>
          </div>

          {/* Entries table with auto-total */}
          {entries.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-medium">
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Particular</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date((entry.entry_date ?? entry.date) + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3 py-2 max-w-[150px] truncate">
                        {entry.particular}
                        {entry.source === 'sms' && (
                          <span className="ml-1.5 text-[9px] font-bold text-trust bg-trust/10 px-1 py-0.5 rounded">SMS</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-numeric font-semibold">{formatCurrency(Number(entry.amount), 'INR')}</td>
                      <td className="pr-2 text-center">
                        <button onClick={() => handleDelete(entry)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-trust/5 font-bold border-t-2 border-trust/20">
                    <td className="px-3 py-2.5 text-xs" colSpan={2}>Total</td>
                    <td className="px-3 py-2.5 text-right font-numeric text-trust">{formatCurrency(total, 'INR')}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Spending Insights ─────────────────────────────────────────────────────────
function SpendingInsights({ chartData, totalActual, month, year }) {
  if (totalActual === 0 || chartData.length === 0) return null

  const prevMonthName = MONTHS[month === 1 ? 11 : month - 2]
  const topCat = chartData[0]
  const increased = chartData.filter(d => d.previous > 0 && d.current > d.previous * 1.1)
  const decreased = chartData.filter(d => d.previous > 0 && d.current < d.previous * 0.9)
  const newSpend  = chartData.filter(d => d.previous === 0 && d.current > 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Spending Breakdown</p>
          <p className="text-xs text-muted-foreground mt-0.5">Where your money went · vs {prevMonthName}</p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {MONTHS[month - 1]} {year}
        </span>
      </div>

      {/* Horizontal bars */}
      <div className="space-y-3">
        {chartData.map(item => {
          const pct = totalActual > 0 ? Math.min(100, (item.current / totalActual) * 100) : 0
          const change = item.previous > 0 ? ((item.current - item.previous) / item.previous) * 100 : null
          const isUp   = change !== null && change > 5
          const isDown = change !== null && change < -5

          return (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-base">{item.icon}</span>
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  {isUp   && <span className="text-destructive font-semibold">▲ {Math.abs(change).toFixed(0)}%</span>}
                  {isDown && <span className="text-growth font-semibold">▼ {Math.abs(change).toFixed(0)}%</span>}
                  {change === null && item.current > 0 && <span className="text-muted-foreground text-[10px]">new</span>}
                  <span className="font-bold font-numeric w-24 text-right">{formatCurrency(item.current, 'INR')}</span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    isUp ? 'bg-destructive/70' : isDown ? 'bg-growth' : 'bg-trust/70'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {item.previous > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {prevMonthName}: {formatCurrency(item.previous, 'INR')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Insight callouts */}
      <div className="space-y-2">
        <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs space-y-1.5">
          <p>
            <span className="font-semibold">💡 Top spend:</span>{' '}
            {topCat.icon} {topCat.name} — {formatCurrency(topCat.current, 'INR')} ({((topCat.current / totalActual) * 100).toFixed(0)}% of total)
          </p>
          {increased.length > 0 && (
            <p className="text-destructive">
              <span className="font-semibold">⚠️ Increased vs {prevMonthName}:</span>{' '}
              {increased.map(c => `${c.icon} ${c.name}`).join(' · ')} — consider cutting these next month.
            </p>
          )}
          {decreased.length > 0 && (
            <p className="text-growth">
              <span className="font-semibold">✓ Reduced vs {prevMonthName}:</span>{' '}
              {decreased.map(c => `${c.icon} ${c.name}`).join(' · ')} — good discipline!
            </p>
          )}
          {newSpend.length > 0 && (
            <p className="text-amber-500">
              <span className="font-semibold">🆕 New this month:</span>{' '}
              {newSpend.map(c => `${c.icon} ${c.name}`).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Expense Tab ───────────────────────────────────────────────────────────────
function ExpenseTab({ settings }) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [openCat, setOpenCat] = useState(null)
  const { data: expenses = [], isLoading } = usePlannerExpenses(year)
  const { data: allItems = [] } = useExpenseItems(year)

  // Load previous month's year (may differ when month = Jan)
  const prevYear = month === 1 ? year - 1 : year
  const { data: prevExpenses = [] } = usePlannerExpenses(prevYear)

  const catTotals = useMemo(() => {
    const map = {}
    expenses.filter(e => e.month === month).forEach(e => { map[e.category] = Number(e.amount) })
    return map
  }, [expenses, month])

  const catCounts = useMemo(() => {
    const map = {}
    allItems.filter(e => e.month === month).forEach(e => { map[e.category] = (map[e.category] || 0) + 1 })
    return map
  }, [allItems, month])

  // Build chart data: current month vs previous month, sorted by spend
  const chartData = useMemo(() => {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevTotals = {}
    prevExpenses.filter(e => e.month === prevMonth).forEach(e => { prevTotals[e.category] = Number(e.amount) })
    return EXPENSE_CATS
      .map(cat => ({
        name: cat.name,
        icon: cat.icon,
        current: catTotals[cat.name] ?? 0,
        previous: prevTotals[cat.name] ?? 0,
      }))
      .filter(d => d.current > 0 || d.previous > 0)
      .sort((a, b) => b.current - a.current)
  }, [catTotals, prevExpenses, month])

  const totalActual = Object.values(catTotals).reduce((s, v) => s + v, 0)
  const budgetExpenses = settings ? Math.round((settings.monthly_salary * settings.expenses_pct) / 100) : 0
  const variance = totalActual - budgetExpenses
  const usedPct = budgetExpenses > 0 ? Math.min(100, Math.round((totalActual / budgetExpenses) * 100)) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Expense Tracker</h3>
          <p className="text-xs text-muted-foreground">Click any category to add entries with date &amp; description</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget meter */}
      {settings && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">
              Budget meter — <span className="text-muted-foreground font-normal">{MONTHS[month - 1]} {year}</span>
            </p>
            <span className={cn('text-sm font-bold', usedPct > 100 ? 'text-destructive' : usedPct > 80 ? 'text-amber-500' : 'text-growth')}>{usedPct}% used</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', usedPct > 100 ? 'bg-destructive' : usedPct > 80 ? 'bg-amber-400' : 'bg-growth')}
              style={{ width: `${Math.min(100, usedPct)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Budget', value: formatCurrency(budgetExpenses, 'INR'), color: 'text-trust' },
              { label: 'Actual', value: formatCurrency(totalActual, 'INR'), color: totalActual > budgetExpenses ? 'text-destructive' : 'text-growth' },
              { label: variance > 0 ? 'Over budget' : 'Remaining', value: formatCurrency(Math.abs(variance), 'INR'), color: variance > 0 ? 'text-destructive' : 'text-growth' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                <p className={cn('text-base font-bold font-numeric', stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
          {variance > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive font-medium flex items-center gap-2">
              ⚠️ Over budget by {formatCurrency(variance, 'INR')} — consider reducing discretionary spending.
            </div>
          )}
          {variance < 0 && totalActual > 0 && (
            <div className="rounded-lg bg-growth/10 border border-growth/20 px-4 py-2.5 text-xs text-growth font-medium flex items-center gap-2">
              ✓ Under budget by {formatCurrency(Math.abs(variance), 'INR')} — consider investing the surplus!
            </div>
          )}
        </div>
      )}

      {/* Spending breakdown + insights */}
      <SpendingInsights chartData={chartData} totalActual={totalActual} month={month} year={year} />

      {/* Category cards — clickable */}
      {isLoading
        ? <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {EXPENSE_CATS.map(cat => {
              const catTotal = catTotals[cat.name] ?? 0
              const count = catCounts[cat.name] ?? 0
              const hasValue = catTotal > 0
              return (
                <button
                  key={cat.name}
                  onClick={() => setOpenCat(cat)}
                  className={cn(
                    'rounded-xl border p-4 transition-all text-left w-full group hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 space-y-2.5',
                    hasValue ? 'border-trust/40 bg-trust/5 shadow-sm' : 'border-border bg-card hover:border-trust/30 hover:bg-trust/5',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                    </div>
                    {hasValue
                      ? <span className="text-[10px] font-bold text-trust bg-trust/10 px-1.5 py-0.5 rounded-full">{count} {count === 1 ? 'entry' : 'entries'}</span>
                      : <Plus className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-trust transition-colors" />
                    }
                  </div>
                  <p className={cn('text-lg font-bold font-numeric', hasValue ? 'text-trust' : 'text-muted-foreground/40')}>
                    {hasValue ? formatCurrency(catTotal, 'INR') : '₹ —'}
                  </p>
                </button>
              )
            })}
          </div>
        )
      }

      {/* Category detail dialog */}
      {openCat && (
        <CategoryDetailDialog
          open={!!openCat}
          onOpenChange={v => !v && setOpenCat(null)}
          category={openCat}
          year={year}
          month={month}
        />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const { data: settings, isLoading } = usePlannerSettings()
  const { mutateAsync: saveSettings, isPending: saving } = useSavePlannerSettings()

  async function handleSave(data) {
    try {
      await saveSettings(data)
      toast.success('Plan saved! Your dashboard has been updated.')
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Finance Planner — FinPath</title>
        <meta name="description" content="Personal finance planner — budget allocation, investment projection and expense tracker." />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div className="rounded-2xl border border-trust/20 bg-gradient-to-r from-trust/8 via-trust/4 to-transparent p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-trust flex items-center justify-center flex-shrink-0 shadow-sm">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Personal Finance Planner</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Plan your budget · Track expenses · Project your wealth</p>
            </div>
          </div>
        </div>

        {isLoading
          ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          : (
            <Tabs defaultValue={settings ? 'dashboard' : 'setup'}>
              <TabsList className="grid grid-cols-4 w-full h-11">
                <TabsTrigger value="setup" className="gap-1.5 text-xs sm:text-sm font-medium">
                  <Calculator className="h-3.5 w-3.5" /> Setup
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm font-medium">
                  <TrendingUp className="h-3.5 w-3.5" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="monthly" className="gap-1.5 text-xs sm:text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Monthly
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm font-medium">
                  <Receipt className="h-3.5 w-3.5" /> Expenses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="mt-6">
                <SetupTab settings={settings} onSave={handleSave} saving={saving} />
              </TabsContent>
              <TabsContent value="dashboard" className="mt-6">
                <DashboardTab settings={settings} />
              </TabsContent>
              <TabsContent value="monthly" className="mt-6">
                <MonthlyTab settings={settings} />
              </TabsContent>
              <TabsContent value="expenses" className="mt-6">
                <ExpenseTab settings={settings} />
              </TabsContent>
            </Tabs>
          )
        }
      </div>
    </>
  )
}
