import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { toast } from 'sonner'
import { Save, Calculator, TrendingUp, Calendar, Receipt, Info } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { usePlannerSettings, useSavePlannerSettings, usePlannerExpenses, useSaveExpense } from '@/hooks/usePlanner'
import { buildDashboard, investmentPct, emergencyLiquidPct, IDEAL } from '@/lib/planner/calculations'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const EXPENSE_CATS = [
  'Electricity', 'Medical', 'Grocery', 'Festival / Gifts', 'Clothes',
  'Accessories', 'Electronics / Gadgets', 'Dining Out', 'Transport / Fuel',
  'Personal Care', 'Subscriptions', 'Miscellaneous',
]

const DEFAULT = {
  monthly_salary: 0, salary_growth_rate: 6,
  expenses_pct: 25, emi_rent_pct: 20, donations_pct: 3, vacation_pct: 12,
  equity_mf_pct: 73, ppf_epf_pct: 12, nps_pct: 0, direct_stocks_pct: 5,
  life_insurance_pm: 1500, health_insurance_pm: 2500, projection_years: 15,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pctColor(value, ideal) {
  const diff = Math.abs(value - ideal)
  if (diff <= 2) return 'text-growth'
  if (diff <= 5) return 'text-amber-500'
  return 'text-destructive'
}

function AllocationSlider({ label, value, ideal, onChange, max = 60 }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ideal: {ideal}%</span>
          <span className={cn('text-sm font-bold font-numeric w-10 text-right', pctColor(value, ideal))}>{value}%</span>
        </div>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={max} step={1} />
    </div>
  )
}

function MetricCard({ label, value, sub, color = 'text-trust' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-lg font-bold font-numeric leading-tight', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Tab 1: Setup ──────────────────────────────────────────────────────────────
function SetupTab({ settings, onSave, saving }) {
  const [form, setForm] = useState({ ...DEFAULT, ...settings })
  useEffect(() => { if (settings) setForm(f => ({ ...f, ...settings })) }, [settings])

  const invPct = investmentPct(form)
  const emLiqPct = emergencyLiquidPct(form)
  const budgetTotal = form.expenses_pct + form.emi_rent_pct + form.donations_pct + form.vacation_pct + invPct
  const invSubTotal = form.equity_mf_pct + form.ppf_epf_pct + form.nps_pct + form.direct_stocks_pct + emLiqPct

  function set(key, val) { setForm(prev => ({ ...prev, [key]: Number(val) })) }

  function handleSave() {
    if (!form.monthly_salary || form.monthly_salary <= 0) return toast.error('Please enter your monthly salary.')
    if (Math.round(budgetTotal) !== 100) return toast.error('Budget allocation must total 100%.')
    if (Math.round(invSubTotal) !== 100) return toast.error('Investment sub-allocation must total 100%.')
    onSave({ ...form, emergency_liquid_pct: emLiqPct })
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Income */}
      <section>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-base">💰</span> Income</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Monthly Salary (₹) <span className="text-destructive">*</span></Label>
            <Input
              type="number" min={0}
              value={form.monthly_salary || ''}
              onChange={e => set('monthly_salary', e.target.value)}
              placeholder="e.g. 50000"
            />
            <p className="text-xs text-muted-foreground">Annual: {formatCurrency((form.monthly_salary || 0) * 12, 'INR')}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Salary Growth Rate</Label>
              <span className="text-sm font-bold font-numeric text-trust">{form.salary_growth_rate}%</span>
            </div>
            <Slider value={[form.salary_growth_rate]} onValueChange={([v]) => set('salary_growth_rate', v)} min={0} max={20} step={0.5} />
            <p className="text-xs text-muted-foreground">Ideal: 6–8% per year</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Budget Allocation */}
      <section>
        <h3 className="font-semibold mb-1 flex items-center gap-2"><span className="text-base">📊</span> Monthly Budget Allocation</h3>
        <p className="text-xs text-muted-foreground mb-5">The 4 sliders below control spending. Investments = what&apos;s left over.</p>
        <div className="space-y-5">
          <AllocationSlider label="Expenses / Needs" value={form.expenses_pct} ideal={IDEAL.expenses} onChange={v => set('expenses_pct', v)} />
          <AllocationSlider label="EMI / Rent" value={form.emi_rent_pct} ideal={IDEAL.emiRent} onChange={v => set('emi_rent_pct', v)} />
          <AllocationSlider label="Donations" value={form.donations_pct} ideal={IDEAL.donations} onChange={v => set('donations_pct', v)} max={20} />
          <AllocationSlider label="Vacation / Leisure" value={form.vacation_pct} ideal={IDEAL.vacation} onChange={v => set('vacation_pct', v)} />
        </div>
        <div className={cn(
          'mt-4 rounded-xl border p-4 flex items-center justify-between',
          invPct >= 38 ? 'border-growth/30 bg-growth/5' : invPct >= 20 ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'border-destructive/30 bg-destructive/5',
        )}>
          <span className="text-sm font-medium">📈 Investments (auto)</span>
          <div className="text-right">
            <span className={cn('text-2xl font-bold font-numeric', pctColor(invPct, IDEAL.investments))}>{invPct}%</span>
            <p className="text-xs text-muted-foreground">= {formatCurrency(Math.round(((form.monthly_salary || 0) * invPct) / 100), 'INR')}/mo · Ideal: {IDEAL.investments}%</p>
          </div>
        </div>
        <p className={cn('text-xs mt-2 font-medium', Math.round(budgetTotal) === 100 ? 'text-growth' : 'text-destructive')}>
          Total: {Math.round(budgetTotal)}% {Math.round(budgetTotal) === 100 ? '✓ Balanced' : '— must equal 100%'}
        </p>
      </section>

      <Separator />

      {/* Investment Sub-Allocation */}
      <section>
        <h3 className="font-semibold mb-1 flex items-center gap-2"><span className="text-base">💼</span> Investment Sub-Allocation</h3>
        <p className="text-xs text-muted-foreground mb-5">How to split your investment amount. Emergency / Liquid is auto-calculated.</p>
        <div className="space-y-5">
          <AllocationSlider label="Equity Mutual Funds (SIP)" value={form.equity_mf_pct} ideal={73} onChange={v => set('equity_mf_pct', v)} max={100} />
          <AllocationSlider label="PPF / EPF" value={form.ppf_epf_pct} ideal={12} onChange={v => set('ppf_epf_pct', v)} max={100} />
          <AllocationSlider label="NPS (National Pension)" value={form.nps_pct} ideal={0} onChange={v => set('nps_pct', v)} max={40} />
          <AllocationSlider label="Direct Stocks" value={form.direct_stocks_pct} ideal={5} onChange={v => set('direct_stocks_pct', v)} max={50} />
        </div>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/20 p-4 flex items-center justify-between">
          <span className="text-sm font-medium">💧 Emergency / Liquid (auto)</span>
          <span className={cn('text-2xl font-bold font-numeric', emLiqPct < 0 ? 'text-destructive' : 'text-sky-600')}>{emLiqPct}%</span>
        </div>
        <p className={cn('text-xs mt-2 font-medium', Math.round(invSubTotal) === 100 ? 'text-growth' : 'text-destructive')}>
          Total: {Math.round(invSubTotal)}% {Math.round(invSubTotal) === 100 ? '✓ Balanced' : '— must equal 100%'}
        </p>
      </section>

      <Separator />

      {/* Insurance & Projection */}
      <section>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-base">🛡️</span> Insurance & Projection</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Life Insurance (₹/month)</Label>
            <Input type="number" min={0} value={form.life_insurance_pm} onChange={e => set('life_insurance_pm', e.target.value)} />
            <p className="text-xs text-muted-foreground">Ideal: ₹1,500/mo (₹1Cr term plan)</p>
          </div>
          <div className="space-y-1.5">
            <Label>Health Insurance (₹/month)</Label>
            <Input type="number" min={0} value={form.health_insurance_pm} onChange={e => set('health_insurance_pm', e.target.value)} />
            <p className="text-xs text-muted-foreground">Ideal: ₹2,500/mo (family floater)</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Projection Years</Label>
              <span className="text-sm font-bold font-numeric text-trust">{form.projection_years} yrs</span>
            </div>
            <Slider value={[form.projection_years]} onValueChange={([v]) => set('projection_years', v)} min={5} max={30} step={1} />
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="bg-trust hover:bg-trust/90 text-white gap-2 w-full sm:w-auto">
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  )
}

// ── Tab 2: Dashboard ──────────────────────────────────────────────────────────
function DashboardTab({ settings }) {
  const dash = useMemo(() => settings ? buildDashboard(settings) : null, [settings])

  if (!settings) return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-5 text-sm text-amber-800 dark:text-amber-300">
      <Info className="inline h-4 w-4 mr-1.5 align-text-bottom" />
      Complete the <strong>Setup</strong> tab first to see your financial dashboard.
    </div>
  )

  return (
    <div className="space-y-7">
      {/* Key metrics */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard label="Monthly Salary" value={formatCurrency(settings.monthly_salary, 'INR')} />
          <MetricCard label="Annual Salary" value={formatCurrency(dash.annualSalary, 'INR')} />
          <MetricCard label="Monthly Investment" value={formatCurrency(dash.monthlyInvest, 'INR')} color="text-growth" />
          <MetricCard label="Investment Ratio" value={`${dash.invPct}%`} sub="of monthly salary" color={pctColor(dash.invPct, IDEAL.investments)} />
          <MetricCard label="Return (CAGR)" value={`${12}%`} sub="expected annual return" />
          <MetricCard label="Real Return" value={`${dash.realReturn}%`} sub="after 6% inflation" color="text-amber-500" />
        </div>
      </div>

      {/* Budget allocation table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-trust px-5 py-3">
          <h3 className="text-sm font-semibold text-white">📊 Budget Allocation Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Monthly (₹)</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Annual (₹)</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">% of Income</th>
              </tr>
            </thead>
            <tbody>
              {dash.budgetRows.map((r, i) => (
                <tr key={r.label} className={cn('border-b border-border/50 last:border-0', i === 4 && 'font-semibold bg-growth/5')}>
                  <td className="px-4 py-2.5">{r.emoji} {r.label}</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(r.monthly, 'INR')}</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(r.annual, 'INR')}</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{r.pct}%</td>
                </tr>
              ))}
              <tr className="bg-trust/5 font-bold border-t-2 border-trust/20">
                <td className="px-4 py-2.5">TOTAL ALLOCATED</td>
                <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(settings.monthly_salary, 'INR')}</td>
                <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(dash.annualSalary, 'INR')}</td>
                <td className="px-4 py-2.5 text-right font-numeric text-growth">{dash.allocationCheck}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 15-year projection */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">🚀 {settings.projection_years}-Year Wealth Projection</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard label={`Corpus at Yr ${settings.projection_years}`} value={formatCurrency(dash.totalCorpus, 'INR')} color="text-growth" />
          <MetricCard label="Total Invested" value={formatCurrency(dash.totalInvested, 'INR')} />
          <MetricCard label="Lifetime Earnings" value={formatCurrency(dash.lifetimeEarnings, 'INR')} />
          <MetricCard label="Equity SIP Corpus" value={formatCurrency(dash.equitySIP15yr, 'INR')} color="text-trust" />
          <MetricCard label="PPF/EPF Corpus" value={formatCurrency(dash.ppfEpf15yr, 'INR')} />
          <MetricCard label="Emergency Fund Target" value={formatCurrency(dash.emergencyFundTarget, 'INR')} color="text-amber-500" />
        </div>
      </div>

      {/* Protection overview */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">🛡️ Protection & Emergency</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Life Insurance/mo" value={formatCurrency(settings.life_insurance_pm, 'INR')} />
          <MetricCard label="Health Insurance/mo" value={formatCurrency(settings.health_insurance_pm, 'INR')} />
          <MetricCard label="Annual Health Cost" value={formatCurrency(settings.health_insurance_pm * 12, 'INR')} />
          <MetricCard label="Emergency Fund (months)" value="12 months" sub="target" />
        </div>
      </div>

      {/* Investment sub-allocation table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-trust px-5 py-3">
          <h3 className="text-sm font-semibold text-white">💼 Investment Sub-Allocation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Asset Class</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">%</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Monthly (₹)</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Annual (₹)</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Return %</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">{settings.projection_years}-Yr Corpus</th>
              </tr>
            </thead>
            <tbody>
              {dash.investRows.map((r) => (
                <tr key={r.label} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5">{r.emoji} {r.label}</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{r.pct}%</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(r.monthly, 'INR')}</td>
                  <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(r.annual, 'INR')}</td>
                  <td className="px-4 py-2.5 text-right font-numeric text-muted-foreground">{r.rate}</td>
                  <td className="px-4 py-2.5 text-right font-numeric font-semibold text-growth">{formatCurrency(r.corpus, 'INR')}</td>
                </tr>
              ))}
              <tr className="bg-trust/5 font-bold border-t-2 border-trust/20">
                <td className="px-4 py-2.5">TOTAL</td>
                <td className="px-4 py-2.5 text-right font-numeric">100%</td>
                <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(dash.monthlyInvest, 'INR')}</td>
                <td className="px-4 py-2.5 text-right font-numeric">{formatCurrency(dash.monthlyInvest * 12, 'INR')}</td>
                <td className="px-4 py-2.5 text-right"></td>
                <td className="px-4 py-2.5 text-right font-numeric text-growth">{formatCurrency(dash.totalCorpus, 'INR')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: Monthly Budget ─────────────────────────────────────────────────────
function MonthlyTab({ settings }) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const { data: expenses = [] } = usePlannerExpenses(year)

  if (!settings) return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-5 text-sm text-amber-800 dark:text-amber-300">
      <Info className="inline h-4 w-4 mr-1.5 align-text-bottom" />
      Complete the <strong>Setup</strong> tab first.
    </div>
  )

  const dash = buildDashboard(settings)

  // aggregate actual expenses per month
  const actualByMonth = useMemo(() => {
    const map = {}
    expenses.forEach(e => {
      map[e.month] = (map[e.month] || 0) + Number(e.amount)
    })
    return map
  }, [expenses])

  const budgetExpenses = Math.round((settings.monthly_salary * settings.expenses_pct) / 100)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Budget is auto-calculated from your Setup. Actuals come from the Expense Tracker tab.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-trust px-5 py-3">
          <h3 className="text-sm font-semibold text-white">📅 Monthly Budget Tracker — Year {year}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="sticky left-0 bg-muted/50 text-left px-4 py-2.5 font-medium text-muted-foreground min-w-[140px]">Category</th>
                {MONTHS.map(m => <th key={m} className="text-right px-3 py-2.5 font-medium text-muted-foreground">{m}</th>)}
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Annual</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 font-semibold bg-trust/5">
                <td className="sticky left-0 bg-trust/5 px-4 py-2">Monthly Salary</td>
                {MONTHS.map((_, i) => <td key={i} className="px-3 py-2 text-right font-numeric">{formatCurrency(settings.monthly_salary, 'INR')}</td>)}
                <td className="px-4 py-2 text-right font-numeric">{formatCurrency(settings.monthly_salary * 12, 'INR')}</td>
              </tr>
              {dash.budgetRows.map(r => (
                <tr key={r.label} className="border-b border-border/50">
                  <td className="sticky left-0 bg-card px-4 py-2">{r.emoji} {r.label}</td>
                  {MONTHS.map((_, i) => <td key={i} className="px-3 py-2 text-right font-numeric text-muted-foreground">{formatCurrency(r.monthly, 'INR')}</td>)}
                  <td className="px-4 py-2 text-right font-numeric">{formatCurrency(r.annual, 'INR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget vs Actual summary */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-muted/50 px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">📝 Budget vs Actual (Expenses)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 bg-muted/30 text-left px-4 py-2 font-medium text-muted-foreground min-w-[140px]">Row</th>
                {MONTHS.map(m => <th key={m} className="text-right px-3 py-2 font-medium text-muted-foreground">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 bg-card px-4 py-2 font-medium">Budget</td>
                {MONTHS.map((_, i) => <td key={i} className="px-3 py-2 text-right font-numeric">{formatCurrency(budgetExpenses, 'INR')}</td>)}
              </tr>
              <tr className="border-b border-border/50">
                <td className="sticky left-0 bg-card px-4 py-2 font-medium">Actual</td>
                {MONTHS.map((_, i) => {
                  const actual = actualByMonth[i + 1] || 0
                  return <td key={i} className={cn('px-3 py-2 text-right font-numeric', actual > 0 ? 'text-foreground' : 'text-muted-foreground')}>{actual > 0 ? formatCurrency(actual, 'INR') : '—'}</td>
                })}
              </tr>
              <tr>
                <td className="sticky left-0 bg-card px-4 py-2 font-semibold">Over / (Under)</td>
                {MONTHS.map((_, i) => {
                  const actual = actualByMonth[i + 1] || 0
                  const variance = actual - budgetExpenses
                  return (
                    <td key={i} className={cn('px-3 py-2 text-right font-numeric font-semibold', actual === 0 ? 'text-muted-foreground' : variance > 0 ? 'text-destructive' : 'text-growth')}>
                      {actual === 0 ? '—' : variance > 0 ? `+${formatCurrency(variance, 'INR')}` : formatCurrency(variance, 'INR')}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Tab 4: Expense Tracker ────────────────────────────────────────────────────
function ExpenseTab({ settings }) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const { data: expenses = [], isLoading } = usePlannerExpenses(year)
  const { mutateAsync: saveExpense, isPending: saving } = useSaveExpense()

  const [amounts, setAmounts] = useState({})

  // populate inputs from saved data when month/year changes
  useEffect(() => {
    const monthData = {}
    expenses.filter(e => e.month === month).forEach(e => { monthData[e.category] = e.amount })
    setAmounts(monthData)
  }, [expenses, month])

  async function handleSave() {
    try {
      await Promise.all(
        EXPENSE_CATS.map(cat =>
          saveExpense({ year, month, category: cat, amount: Number(amounts[cat] || 0) })
        )
      )
      toast.success(`${MONTHS[month - 1]} ${year} expenses saved.`)
    } catch {
      toast.error('Could not save expenses. Please try again.')
    }
  }

  const totalActual = EXPENSE_CATS.reduce((s, c) => s + Number(amounts[c] || 0), 0)
  const budgetExpenses = settings ? Math.round((settings.monthly_salary * settings.expenses_pct) / 100) : 0
  const variance = totalActual - budgetExpenses

  return (
    <div className="space-y-5">
      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">Logging actual spending for {MONTHS[month - 1]} {year}</span>
      </div>

      {/* Expense grid */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-trust px-5 py-3">
          <h3 className="text-sm font-semibold text-white">📝 Monthly Actuals — {MONTHS[month - 1]} {year}</h3>
        </div>
        {isLoading
          ? <div className="p-5 grid sm:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          : (
            <div className="p-5 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {EXPENSE_CATS.map(cat => (
                <div key={cat} className="space-y-1">
                  <Label className="text-xs font-medium">{cat}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number" min={0}
                      className="pl-6 text-sm"
                      placeholder="0"
                      value={amounts[cat] || ''}
                      onChange={e => setAmounts(prev => ({ ...prev, [cat]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Budget vs Actual summary */}
      {settings && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Budget vs Actual (Expenses — {MONTHS[month - 1]})</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="text-xl font-bold font-numeric text-trust">{formatCurrency(budgetExpenses, 'INR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Actual</p>
              <p className={cn('text-xl font-bold font-numeric', totalActual > budgetExpenses ? 'text-destructive' : 'text-growth')}>
                {formatCurrency(totalActual, 'INR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Over / (Under)</p>
              <p className={cn('text-xl font-bold font-numeric', variance > 0 ? 'text-destructive' : variance < 0 ? 'text-growth' : 'text-muted-foreground')}>
                {variance === 0 ? '—' : variance > 0 ? `+${formatCurrency(variance, 'INR')}` : formatCurrency(variance, 'INR')}
              </p>
            </div>
          </div>
          {variance > 0 && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs text-destructive font-medium">
              ⚠️ You are {formatCurrency(variance, 'INR')} over budget this month. Consider reducing discretionary spending.
            </div>
          )}
          {variance < 0 && totalActual > 0 && (
            <div className="mt-4 rounded-lg bg-growth/10 border border-growth/20 px-4 py-2 text-xs text-growth font-medium">
              ✓ You are {formatCurrency(Math.abs(variance), 'INR')} under budget. Great discipline!
            </div>
          )}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="bg-trust hover:bg-trust/90 text-white gap-2">
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : `Save ${MONTHS[month - 1]} expenses`}
      </Button>
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
      toast.success('Settings saved!')
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

      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Calculator className="h-5 w-5 text-trust" /> Personal Finance Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Set your budget allocations, track monthly expenses, and see your 15-year wealth projection.</p>
        </div>

        {isLoading
          ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          : (
            <Tabs defaultValue={settings ? 'dashboard' : 'setup'}>
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="setup" className="text-xs gap-1"><Calculator className="h-3.5 w-3.5" /> Setup</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-xs gap-1"><TrendingUp className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs gap-1"><Calendar className="h-3.5 w-3.5" /> Monthly</TabsTrigger>
                <TabsTrigger value="expenses" className="text-xs gap-1"><Receipt className="h-3.5 w-3.5" /> Expenses</TabsTrigger>
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
