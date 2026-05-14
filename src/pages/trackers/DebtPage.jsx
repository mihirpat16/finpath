import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ArrowLeft, CreditCard } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatCompact } from '@/lib/format'
import { useDebts, useAddDebt, useUpdateDebt, useDeleteDebt } from '@/hooks/useDebts'
import {
  avalancheOrder, snowballOrder, monthsToPayoff,
  totalInterestPaid, payoffTimeline,
} from '@/lib/trackers/debt'

const debtSchema = z.object({
  name: z.string().min(2, 'Name required'),
  lender: z.string().optional(),
  principal_remaining: z.coerce.number().positive('Must be positive'),
  interest_rate: z.coerce.number().min(0, 'Rate required'),
  monthly_payment: z.coerce.number().positive('Must be positive'),
})

function DebtDialog({ open, onOpenChange, editDebt }) {
  const add = useAddDebt()
  const update = useUpdateDebt()
  const isEdit = !!editDebt

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(debtSchema),
    defaultValues: editDebt ?? {},
  })

  useState(() => {
    reset(editDebt ?? { name: '', lender: '', principal_remaining: '', interest_rate: '', monthly_payment: '' })
  }, [editDebt])

  async function onSubmit(data) {
    if (isEdit) {
      await update.mutateAsync({ id: editDebt.id, ...data })
    } else {
      await add.mutateAsync(data)
    }
    onOpenChange(false)
  }

  const isPending = add.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Debt' : 'Add Debt'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Debt name</Label>
              <Input placeholder="e.g. HDFC Car Loan" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Lender (optional)</Label>
              <Input placeholder="e.g. HDFC Bank" {...register('lender')} />
            </div>
            <div className="space-y-1">
              <Label>Balance (₹)</Label>
              <Input type="number" placeholder="0" {...register('principal_remaining')} />
              {errors.principal_remaining && <p className="text-xs text-destructive">{errors.principal_remaining.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Interest rate (%)</Label>
              <Input type="number" step="0.1" placeholder="12" {...register('interest_rate')} />
              {errors.interest_rate && <p className="text-xs text-destructive">{errors.interest_rate.message}</p>}
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Monthly payment (₹)</Label>
              <Input type="number" placeholder="0" {...register('monthly_payment')} />
              {errors.monthly_payment && <p className="text-xs text-destructive">{errors.monthly_payment.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-trust hover:bg-trust/90 text-white">
              {isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Debt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DebtCard({ debt, onEdit }) {
  const del = useDeleteDebt()
  const months = monthsToPayoff(debt.principal_remaining, debt.interest_rate, debt.monthly_payment)
  const interest = totalInterestPaid(debt.principal_remaining, debt.interest_rate, debt.monthly_payment)
  const original = (debt.original_principal ?? debt.principal_remaining)
  const paidPct = original > 0 ? Math.min(100, ((original - debt.principal_remaining) / original) * 100) : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{debt.name}</p>
          {debt.lender && <p className="text-xs text-muted-foreground">{debt.lender}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(debt)} className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => del.mutate(debt.id)} className="text-muted-foreground hover:text-destructive" disabled={del.isPending}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Progress value={paidPct} className="h-1.5" />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-sm font-semibold font-numeric text-rose-500">{formatCurrency(debt.principal_remaining)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rate</p>
          <p className="text-sm font-semibold font-numeric">{debt.interest_rate}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payoff</p>
          <p className="text-sm font-semibold font-numeric">
            {isFinite(months) ? `${months}m` : '—'}
          </p>
        </div>
      </div>

      {isFinite(interest) && interest > 0 && (
        <p className="text-xs text-muted-foreground">
          Total interest: <span className="font-numeric text-rose-500">{formatCurrency(interest)}</span>
        </p>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">Month {label}</p>
      <p className="font-semibold font-numeric">{formatCompact(payload[0].value)}</p>
    </div>
  )
}

export default function DebtPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDebt, setEditDebt] = useState(null)
  const [strategy, setStrategy] = useState('avalanche')

  const { data: debts = [], isLoading } = useDebts()

  const totalDebt = debts.reduce((s, d) => s + Number(d.principal_remaining), 0)
  const totalMonthly = debts.reduce((s, d) => s + Number(d.monthly_payment), 0)
  const ordered = strategy === 'avalanche' ? avalancheOrder(debts) : snowballOrder(debts)
  const timeline = payoffTimeline(debts, strategy)

  function openAdd() {
    setEditDebt(null)
    setDialogOpen(true)
  }

  function openEdit(debt) {
    setEditDebt(debt)
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
            <h1 className="text-2xl font-bold tracking-tight">Debt Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track and eliminate your debts</p>
          </div>
        </div>
        <Button size="sm" className="bg-trust hover:bg-trust/90 text-white gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Debt
        </Button>
      </div>

      {/* Hero cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Debt</p>
          {isLoading
            ? <Skeleton className="h-7 w-32" />
            : <p className="text-2xl font-bold font-numeric text-rose-500">{formatCurrency(totalDebt)}</p>
          }
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Monthly Payments</p>
          {isLoading
            ? <Skeleton className="h-7 w-32" />
            : <p className="text-2xl font-bold font-numeric text-trust">{formatCurrency(totalMonthly)}</p>
          }
        </div>
      </div>

      {/* Strategy toggle */}
      {debts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Payoff Strategy</h2>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              {[
                { key: 'avalanche', label: 'Avalanche (high rate first)' },
                { key: 'snowball', label: 'Snowball (small balance first)' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStrategy(key)}
                  className={`px-3 py-1.5 transition-colors ${strategy === key ? 'bg-trust text-white' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {strategy === 'avalanche'
              ? 'Pay highest interest debt first — minimises total interest paid.'
              : 'Pay smallest balance first — builds momentum with quick wins.'}
          </p>

          {/* Payoff order */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payoff order</p>
            {ordered.map((d, i) => (
              <div key={d.id} className="flex items-center gap-2 text-sm py-1">
                <span className="h-5 w-5 rounded-full bg-trust/10 text-trust text-xs flex items-center justify-center font-semibold flex-shrink-0">{i + 1}</span>
                <span className="flex-1">{d.name}</span>
                <span className="text-muted-foreground font-numeric">{d.interest_rate}% · {formatCurrency(d.principal_remaining)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payoff timeline chart */}
      {timeline.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Payoff Timeline</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 11 }} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="totalBalance" stroke="#f43f5e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Debt cards */}
      {isLoading
        ? <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        : debts.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 mb-4">
                <CreditCard className="h-8 w-8 text-rose-400" />
              </div>
              <h3 className="font-semibold mb-2">No debts added yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-5">
                Add your loans and credit cards to see a personalised payoff strategy.
              </p>
              <Button onClick={openAdd} className="bg-trust hover:bg-trust/90 text-white gap-2">
                <Plus className="h-4 w-4" /> Add your first debt
              </Button>
            </div>
          )
          : (
            <div className="grid sm:grid-cols-2 gap-4">
              {ordered.map((debt) => (
                <DebtCard key={debt.id} debt={debt} onEdit={openEdit} />
              ))}
            </div>
          )
      }

      <DebtDialog open={dialogOpen} onOpenChange={setDialogOpen} editDebt={editDebt} />
    </div>
  )
}
