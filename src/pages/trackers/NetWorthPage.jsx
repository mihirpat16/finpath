import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, TrendingUp, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
import { Controller } from 'react-hook-form'
import { formatCurrency, formatCompact } from '@/lib/format'
import {
  useNetWorthEntries, useNetWorthSnapshots,
  useAddNetWorthEntry, useUpdateNetWorthEntry, useDeleteNetWorthEntry,
  useUpsertSnapshot,
} from '@/hooks/useNetWorth'

const ASSET_CATEGORIES = ['Bank Account', 'Fixed Deposit', 'Mutual Fund', 'Stocks', 'Real Estate', 'Gold', 'PPF/EPF', 'Other Asset']
const LIABILITY_CATEGORIES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan', 'Other Liability']

const entrySchema = z.object({
  name: z.string().min(2, 'Name required'),
  type: z.enum(['asset', 'liability']),
  category: z.string().min(1, 'Category required'),
  value: z.coerce.number().positive('Must be positive'),
  notes: z.string().optional(),
})

function EntryDialog({ open, onOpenChange, editEntry }) {
  const add = useAddNetWorthEntry()
  const update = useUpdateNetWorthEntry()
  const isEdit = !!editEntry

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: editEntry ?? { type: 'asset' },
  })

  useEffect(() => {
    reset(editEntry ?? { type: 'asset', name: '', category: '', value: '', notes: '' })
  }, [editEntry, reset])

  const typeValue = watch('type')
  const categories = typeValue === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES

  async function onSubmit(data) {
    if (isEdit) {
      await update.mutateAsync({ id: editEntry.id, ...data })
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
          <DialogTitle>{isEdit ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Name / Description</Label>
            <Input placeholder="e.g. HDFC Savings Account" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Value (₹)</Label>
            <Input type="number" placeholder="0" {...register('value')} />
            {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any notes..." {...register('notes')} />
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

function EntryRow({ entry, onEdit }) {
  const del = useDeleteNetWorthEntry()
  const isAsset = entry.type === 'asset'

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        <p className="text-xs text-muted-foreground">{entry.category}</p>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className={`text-sm font-numeric font-semibold ${isAsset ? 'text-growth' : 'text-rose-500'}`}>
          {formatCurrency(entry.value)}
        </span>
        <button onClick={() => onEdit(entry)} className="text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => del.mutate(entry.id)}
          className="text-muted-foreground hover:text-destructive"
          disabled={del.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold font-numeric">{formatCompact(payload[0].value)}</p>
    </div>
  )
}

export default function NetWorthPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)

  const { data: entries = [], isLoading } = useNetWorthEntries()
  const { data: snapshots = [] } = useNetWorthSnapshots()
  const upsertSnapshot = useUpsertSnapshot()

  const assets = entries.filter((e) => e.type === 'asset')
  const liabilities = entries.filter((e) => e.type === 'liability')
  const totalAssets = assets.reduce((s, e) => s + Number(e.value), 0)
  const totalLiabilities = liabilities.reduce((s, e) => s + Number(e.value), 0)
  const netWorth = totalAssets - totalLiabilities

  // Auto-snapshot whenever entries change
  useEffect(() => {
    if (entries.length > 0) {
      upsertSnapshot.mutate({ totalAssets, totalLiabilities })
    }
  }, [totalAssets, totalLiabilities])

  const chartData = snapshots.map((s) => ({
    month: new Date(s.snapshot_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    netWorth: s.net_worth,
  }))

  function openAdd() {
    setEditEntry(null)
    setDialogOpen(true)
  }

  function openEdit(entry) {
    setEditEntry(entry)
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
            <h1 className="text-2xl font-bold tracking-tight">Net Worth</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Assets minus liabilities</p>
          </div>
        </div>
        <Button size="sm" className="bg-trust hover:bg-trust/90 text-white gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      {/* Hero cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Net Worth', value: netWorth, color: netWorth >= 0 ? 'text-growth' : 'text-rose-500' },
          { label: 'Total Assets', value: totalAssets, color: 'text-trust' },
          { label: 'Total Liabilities', value: totalLiabilities, color: 'text-rose-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            {isLoading
              ? <Skeleton className="h-7 w-32" />
              : <p className={`text-2xl font-bold font-numeric ${color}`}>{formatCurrency(value)}</p>
            }
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-trust" />
            <h2 className="font-semibold text-sm">Net Worth Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="netWorth" stroke="#0F2A4A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-column: Assets + Liabilities */}
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { label: 'Assets', items: assets, type: 'asset' },
          { label: 'Liabilities', items: liabilities, type: 'liability' },
        ].map(({ label, items }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3 text-sm">{label} ({items.length})</h2>
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-9 mb-2" />)
              : items.length === 0
                ? <p className="text-xs text-muted-foreground py-4 text-center">No {label.toLowerCase()} added yet</p>
                : items.map((e) => <EntryRow key={e.id} entry={e} onEdit={openEdit} />)
            }
          </div>
        ))}
      </div>

      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editEntry={editEntry}
      />
    </div>
  )
}
