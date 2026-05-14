import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ArrowLeft, PieChart, RefreshCw, AlertTriangle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, formatDate } from '@/lib/format'
import { useHoldings, useAddHolding, useUpdateHolding, useDeleteHolding } from '@/hooks/useHoldings'
import { portfolioReturns, assetClassDrift } from '@/lib/trackers/portfolio'
import { useRiskProfile } from '@/hooks/useRiskProfile'

const ASSET_CLASSES = ['equity', 'debt', 'gold', 'alternatives', 'cash']
const CLASS_COLORS = {
  equity: '#0F2A4A',
  debt: '#10B981',
  gold: '#F59E0B',
  alternatives: '#8B5CF6',
  cash: '#6B7280',
}
const CLASS_LABELS = {
  equity: 'Equity', debt: 'Debt', gold: 'Gold', alternatives: 'Alternatives', cash: 'Cash',
}

// Mock price refresh — applies per-class multipliers with small random variance
const CLASS_MULTIPLIERS = { equity: 1.15, debt: 1.07, gold: 1.13, alternatives: 1.08, cash: 1.065 }

function mockRefreshedPrices(holdings) {
  return Object.fromEntries(
    holdings.map((h) => {
      const base = CLASS_MULTIPLIERS[h.asset_class] ?? 1.05
      const variance = 1 + (Math.random() - 0.5) * 0.04
      return [h.id, Number((h.avg_buy_price * base * variance).toFixed(2))]
    })
  )
}

const holdingSchema = z.object({
  instrument_name: z.string().min(2, 'Name required'),
  ticker: z.string().optional(),
  asset_class: z.enum(ASSET_CLASSES),
  units: z.coerce.number().positive('Must be positive'),
  avg_buy_price: z.coerce.number().positive('Must be positive'),
  total_invested: z.coerce.number().positive('Must be positive'),
})

function HoldingDialog({ open, onOpenChange, editHolding }) {
  const add = useAddHolding()
  const update = useUpdateHolding()
  const isEdit = !!editHolding

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(holdingSchema),
    defaultValues: editHolding ?? { asset_class: 'equity' },
  })

  useState(() => {
    reset(editHolding ?? { instrument_name: '', ticker: '', asset_class: 'equity', units: '', avg_buy_price: '', total_invested: '' })
  }, [editHolding])

  async function onSubmit(data) {
    const payload = { ...data, current_price: data.avg_buy_price, last_price_update: new Date().toISOString() }
    if (isEdit) {
      await update.mutateAsync({ id: editHolding.id, ...payload })
    } else {
      await add.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isPending = add.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Holding' : 'Add Holding'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Instrument name</Label>
              <Input placeholder="e.g. Mirae Asset Large Cap Fund" {...register('instrument_name')} />
              {errors.instrument_name && <p className="text-xs text-destructive">{errors.instrument_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Ticker / ISIN (optional)</Label>
              <Input placeholder="e.g. NSEI" {...register('ticker')} />
            </div>
            <div className="space-y-1">
              <Label>Asset class</Label>
              <Controller
                name="asset_class"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_CLASSES.map((c) => <SelectItem key={c} value={c}>{CLASS_LABELS[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Units</Label>
              <Input type="number" step="0.001" placeholder="0" {...register('units')} />
              {errors.units && <p className="text-xs text-destructive">{errors.units.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Avg buy price (₹)</Label>
              <Input type="number" step="0.01" placeholder="0" {...register('avg_buy_price')} />
              {errors.avg_buy_price && <p className="text-xs text-destructive">{errors.avg_buy_price.message}</p>}
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Total invested (₹)</Label>
              <Input type="number" placeholder="0" {...register('total_invested')} />
              {errors.total_invested && <p className="text-xs text-destructive">{errors.total_invested.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-trust hover:bg-trust/90 text-white">
              {isPending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DriftBanner({ drifts }) {
  const flagged = drifts.filter((d) => Math.abs(d.drift) > 5)
  if (!flagged.length) return null

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3 items-start">
      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Allocation drift detected</p>
        <ul className="space-y-0.5 text-muted-foreground">
          {flagged.map((d) => (
            <li key={d.assetClass}>
              {CLASS_LABELS[d.assetClass]}: currently {d.currentPct.toFixed(1)}% vs target {d.targetPct.toFixed(1)}%
              {' '}({d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function PortfolioTrackerPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editHolding, setEditHolding] = useState(null)
  const [mockPrices, setMockPrices] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  const { data: holdings = [], isLoading } = useHoldings()
  const { data: riskProfile } = useRiskProfile()

  const targetAllocation = useMemo(() => {
    if (!riskProfile?.allocation) return {}
    return riskProfile.allocation
  }, [riskProfile])

  const { rows, totalCurrentValue, totalInvested, absoluteGain, returnPct } = useMemo(
    () => portfolioReturns(holdings, mockPrices),
    [holdings, mockPrices]
  )

  const drifts = useMemo(
    () => assetClassDrift(holdings.map((h) => ({ ...h, current_price: mockPrices[h.id] ?? h.current_price })), targetAllocation),
    [holdings, mockPrices, targetAllocation]
  )

  const donutData = Object.entries(
    rows.reduce((acc, r) => {
      acc[r.asset_class] = (acc[r.asset_class] ?? 0) + r.currentValue
      return acc
    }, {})
  ).map(([key, value]) => ({ name: CLASS_LABELS[key] ?? key, value, color: CLASS_COLORS[key] ?? '#999' }))

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => {
      setMockPrices(mockRefreshedPrices(holdings))
      setRefreshing(false)
    }, 800)
  }

  function openAdd() {
    setEditHolding(null)
    setDialogOpen(true)
  }

  function openEdit(h) {
    setEditHolding(h)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/trackers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Investment Portfolio</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Holdings and allocation drift</p>
          </div>
        </div>
        <div className="flex gap-2">
          {holdings.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh prices
            </Button>
          )}
          <Button size="sm" className="bg-trust hover:bg-trust/90 text-white gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Holding
          </Button>
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Portfolio Value', value: formatCurrency(totalCurrentValue), color: 'text-trust' },
          { label: 'Total Invested', value: formatCurrency(totalInvested), color: 'text-foreground' },
          {
            label: 'Absolute Return',
            value: `${absoluteGain >= 0 ? '+' : ''}${formatCurrency(absoluteGain)} (${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%)`,
            color: absoluteGain >= 0 ? 'text-growth' : 'text-rose-500',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            {isLoading
              ? <Skeleton className="h-7 w-32" />
              : <p className={`text-xl font-bold font-numeric ${color}`}>{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Drift banner */}
      {drifts.length > 0 && <DriftBanner drifts={drifts} />}

      {holdings.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-growth/10 mb-4">
            <PieChart className="h-8 w-8 text-growth/60" />
          </div>
          <h3 className="font-semibold mb-2">No holdings yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Add your mutual funds, stocks, or ETFs to track returns and allocation drift.
          </p>
          <Button onClick={openAdd} className="bg-trust hover:bg-trust/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Add your first holding
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Donut */}
          {donutData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-3">Allocation</h2>
              <ResponsiveContainer width="100%" height={180}>
                <RechartsPie>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {donutData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <RTooltip formatter={(v) => formatCurrency(v)} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-numeric font-medium">
                      {totalCurrentValue > 0 ? ((d.value / totalCurrentValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings table */}
          <div className={`rounded-2xl border border-border bg-card p-5 ${donutData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h2 className="font-semibold text-sm mb-3">Holdings</h2>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 mb-2 rounded-lg" />)
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="text-left pb-2 font-medium">Instrument</th>
                        <th className="text-right pb-2 font-medium">Units</th>
                        <th className="text-right pb-2 font-medium">Avg Buy</th>
                        <th className="text-right pb-2 font-medium">Current</th>
                        <th className="text-right pb-2 font-medium">Value</th>
                        <th className="text-right pb-2 font-medium">Return</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((h) => {
                        const ret = h.invested > 0 ? ((h.currentValue - h.invested) / h.invested) * 100 : 0
                        return (
                          <tr key={h.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-3">
                              <p className="font-medium truncate max-w-[140px]">{h.instrument_name}</p>
                              <Badge variant="outline" className="text-xs mt-0.5 py-0 capitalize">{h.asset_class}</Badge>
                            </td>
                            <td className="text-right py-2.5 font-numeric">{Number(h.units).toLocaleString('en-IN')}</td>
                            <td className="text-right py-2.5 font-numeric">{formatCurrency(h.avg_buy_price)}</td>
                            <td className="text-right py-2.5 font-numeric">{formatCurrency(h.price)}</td>
                            <td className="text-right py-2.5 font-numeric font-semibold">{formatCurrency(h.currentValue)}</td>
                            <td className={`text-right py-2.5 font-numeric text-xs ${ret >= 0 ? 'text-growth' : 'text-rose-500'}`}>
                              {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%
                            </td>
                            <td className="text-right py-2.5">
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => openEdit(h)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                <DeleteHolding id={h.id} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      )}

      <HoldingDialog open={dialogOpen} onOpenChange={setDialogOpen} editHolding={editHolding} />
    </div>
  )
}

function DeleteHolding({ id }) {
  const del = useDeleteHolding()
  return (
    <button onClick={() => del.mutate(id)} className="text-muted-foreground hover:text-destructive" disabled={del.isPending}>
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
