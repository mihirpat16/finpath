import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Plus, Pencil, Trash2, ArrowLeft, PieChart, RefreshCw, AlertTriangle, Search, X, Clock, Upload, Eye, Key } from 'lucide-react'
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
import { formatCurrency } from '@/lib/format'
import { useHoldings, useAddHolding, useUpdateHolding, useDeleteHolding } from '@/hooks/useHoldings'
import { portfolioReturns, assetClassDrift, rebalancingSuggestions } from '@/lib/trackers/portfolio'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useAuth } from '@/context/AuthContext'
import { usePrices } from '@/hooks/usePrices'
import { marketStatusLabel, marketStatusColor, formatTimeAgo } from '@/lib/market-data/market-hours'

const ASSET_CLASSES = ['equity', 'debt', 'gold', 'alternatives', 'cash']
const CLASS_COLORS = {
  equity: '#0F2A4A', debt: '#10B981', gold: '#F59E0B', alternatives: '#8B5CF6', cash: '#6B7280',
}
const CLASS_LABELS = {
  equity: 'Equity', debt: 'Debt', gold: 'Gold', alternatives: 'Alternatives', cash: 'Cash',
}

// ── Ticker encoding ───────────────────────────────────────────────────────────
// MF:122639   → mutual fund, scheme code 122639
// STK:RELIANCE → stock, NSE symbol RELIANCE
// (empty)     → no live price

function encodeTicker(type, value) {
  if (type === 'mutual_fund') return `MF:${value}`
  if (type === 'stock') return `STK:${value.toUpperCase().trim()}`
  return ''
}

function parseTicker(ticker) {
  if (!ticker) return { type: 'other', value: '' }
  if (ticker.startsWith('MF:')) return { type: 'mutual_fund', value: ticker.slice(3) }
  if (ticker.startsWith('STK:')) return { type: 'stock', value: ticker.slice(4) }
  // Legacy: plain number → old-style scheme code; plain text → stock symbol
  if (/^\d+$/.test(ticker)) return { type: 'mutual_fund', value: ticker }
  return { type: 'stock', value: ticker }
}

// ── MF search (used in HoldingDialog only) ───────────────────────────────────
async function searchMFunds(query) {
  const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json() // [{schemeCode, schemeName}]
}

// ── CSV / XLSX Import ─────────────────────────────────────────────────────────
// Excel stores numbers as JS numbers — always convert to String before .replace()
const n = (v) => parseFloat(String(v ?? '0').replace(/,/g, '')) || 0

const BROKER_FORMATS = {
  zerodha: {
    name: 'Zerodha',
    detect: (h) => h.some(x => /avg\.?\s*cost/i.test(x)) && h.some(x => /instrument/i.test(x)),
    map: (row) => ({
      instrument_name: row['Instrument'] || row['instrument'] || '',
      units: n(row['Qty.'] ?? row['Qty'] ?? row['qty']),
      avg_buy_price: n(row['Avg. cost'] ?? row['Avg cost'] ?? row['avg. cost']),
      current_price: n(row['LTP'] ?? row['ltp']),
      total_invested: n(row['Cur. val'] ?? row['cur val'] ?? row['Cur val']),
      asset_class: 'equity',
      ticker: '',
    }),
  },
  angelone: {
    name: 'AngelOne',
    detect: (h) => h.some(x => /avg.?buy.?price/i.test(x)),
    map: (row) => ({
      instrument_name: row['Symbol'] || row['Scrip Name'] || row['symbol'] || '',
      units: n(row['Qty'] ?? row['Quantity'] ?? row['Net Qty']),
      avg_buy_price: n(row['Avg Buy Price'] ?? row['Average Price']),
      current_price: n(row['LTP'] ?? row['Current Price']),
      total_invested: n(row['Buy Value'] ?? row['Invested Value'] ?? row['Current Value']),
      asset_class: 'equity',
      ticker: '',
    }),
  },
  upstox: {
    name: 'Upstox',
    detect: (h) => h.some(x => /buy.?average/i.test(x)) && h.some(x => /^symbol$/i.test(x)),
    map: (row) => ({
      instrument_name: row['Symbol'] || row['symbol'] || row['Scrip'] || '',
      units: n(row['Quantity'] ?? row['Qty']),
      avg_buy_price: n(row['Buy Average'] ?? row['Buy Avg'] ?? row['Average']),
      current_price: n(row['LTP'] ?? row['Current Price']),
      total_invested: n(row['Invested Value'] ?? row['Buy Value'] ?? row['Current Value']),
      asset_class: 'equity',
      ticker: String(row['ISIN'] || ''),
    }),
  },
  groww: {
    name: 'Groww',
    detect: (h) => h.some(x => /^isin$/i.test(x)) && h.some(x => /^quantity$/i.test(x)) && h.some(x => /^name$/i.test(x)),
    map: (row) => ({
      instrument_name: row['Name'] || row['name'] || '',
      units: n(row['Quantity'] ?? row['quantity']),
      avg_buy_price: n(row['Average Price'] ?? row['average price'] ?? row['Avg Price']),
      current_price: n(row['Current Price'] ?? row['current price'] ?? row['LTP']),
      total_invested: n(row['Current Value'] ?? row['current value'] ?? row['Invested Value']),
      asset_class: 'equity',
      ticker: String(row['ISIN'] || ''),
    }),
  },
}

function detectBroker(headers) {
  for (const [key, fmt] of Object.entries(BROKER_FORMATS)) {
    if (fmt.detect(headers)) return key
  }
  return null
}

// Parse an XLSX/XLS file and return { data, fields } in same shape as PapaParse
function parseXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        const fields = data.length > 0 ? Object.keys(data[0]) : []
        resolve({ data, fields })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const COL_NONE = '__none__'

function CsvImportDialog({ open, onOpenChange }) {
  // step: 'upload' → 'map' (unknown broker) or 'preview' (known broker) → done
  const [step, setStep] = useState('upload')
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [broker, setBroker] = useState(null)
  const [importing, setImporting] = useState(false)
  const [assetClass, setAssetClass] = useState('equity')
  const [colMap, setColMap] = useState({ name: COL_NONE, units: COL_NONE, avgPrice: COL_NONE, currentPrice: COL_NONE, invested: COL_NONE })
  const fileRef = useRef()
  const add = useAddHolding()

  function afterParse(data, fields) {
    if (!data.length) { toast.error('The file appears to be empty.'); return }
    const detected = detectBroker(fields)
    if (detected) {
      const mapped = data.map(BROKER_FORMATS[detected].map).filter(r => r.instrument_name && r.units > 0 && r.avg_buy_price > 0)
      if (!mapped.length) {
        // Detected format but no valid rows — fall through to manual mapping
        setBroker(null)
        setRawData(data)
        setHeaders(fields)
        setStep('map')
        toast.error(`Detected ${BROKER_FORMATS[detected].name} format but found 0 valid rows. Please map columns manually.`)
        return
      }
      setBroker(detected)
      setRows(mapped)
      setStep('preview')
    } else {
      setBroker(null)
      setRawData(data)
      setHeaders(fields)
      setStep('map')
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const { data, fields } = await parseXlsxFile(file)
        afterParse(data, fields)
      } else {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data, meta }) => afterParse(data, meta.fields ?? []),
        })
      }
    } catch {
      toast.error('Could not read the file. Make sure it is a valid CSV or Excel file.')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function applyMapping() {
    const { name, units, avgPrice, currentPrice, invested } = colMap
    if (name === COL_NONE || units === COL_NONE || avgPrice === COL_NONE) {
      toast.error('Please select at least: Instrument Name, Units, and Avg Buy Price.')
      return
    }
    const mapped = rawData
      .map(row => ({
        instrument_name: String(row[name] ?? '').trim(),
        units: n(row[units]),
        avg_buy_price: n(row[avgPrice]),
        current_price: currentPrice !== COL_NONE ? n(row[currentPrice]) : n(row[avgPrice]),
        total_invested: invested !== COL_NONE ? n(row[invested]) : 0,
        asset_class: 'equity',
        ticker: '',
      }))
      .filter(r => r.instrument_name && r.units > 0 && r.avg_buy_price > 0)

    if (!mapped.length) {
      toast.error('No valid rows found. Make sure the selected columns contain numbers and names.')
      return
    }
    setRows(mapped)
    setStep('preview')
  }

  async function handleImport() {
    if (!rows.length) return
    setImporting(true)
    let ok = 0, fail = 0
    for (const row of rows) {
      try {
        await add.mutateAsync({
          ...row,
          asset_class: assetClass,
          total_invested: row.total_invested || Math.round(row.units * row.avg_buy_price),
          last_price_update: new Date().toISOString(),
        })
        ok++
      } catch { fail++ }
    }
    setImporting(false)
    if (fail === 0) toast.success(`Imported ${ok} holdings successfully!`)
    else toast.error(`Imported ${ok}, failed ${fail}.`)
    onOpenChange(false)
    reset()
  }

  function reset() {
    setStep('upload')
    setRows([])
    setRawData([])
    setHeaders([])
    setBroker(null)
    setColMap({ name: COL_NONE, units: COL_NONE, avgPrice: COL_NONE, currentPrice: COL_NONE, invested: COL_NONE })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Import Holdings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <>
              <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border hover:border-trust/50 bg-muted/20 hover:bg-trust/5 p-8 cursor-pointer transition-all">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Click to upload your broker file</p>
                  <p className="text-xs text-muted-foreground mt-0.5">CSV or Excel (.xlsx) · Any broker · Unknown formats get a column picker</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
              </label>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {[
                  { broker: 'Zerodha', steps: 'Kite → Portfolio → Holdings → Download (⬇) → CSV' },
                  { broker: 'Groww', steps: 'Portfolio → Stocks → Export → Download CSV' },
                  { broker: 'Upstox', steps: 'Portfolio → Holdings → Download → Excel / CSV' },
                  { broker: 'AngelOne', steps: 'Portfolio → Holdings → Export → Download Excel' },
                ].map(b => (
                  <div key={b.broker} className="rounded-xl border border-border bg-card p-3">
                    <p className="font-semibold mb-1">{b.broker}</p>
                    <p className="text-muted-foreground">{b.steps}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Other brokers: upload any CSV/Excel — you will be shown a column picker to map the fields.
              </p>
            </>
          )}

          {/* ── STEP 2: Manual column mapping (unknown broker) ── */}
          {step === 'map' && (
            <>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-400">
                <p className="font-semibold mb-1">Broker format not recognised — map your columns</p>
                <p className="text-xs">Found {headers.length} columns and {rawData.length} rows. Select which column maps to each field below.</p>
              </div>

              {/* Raw preview so user can see column names + sample values */}
              {rawData.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">Your file — first 3 rows</div>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          {headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-border/40 last:border-0">
                            {headers.map(h => (
                              <td key={h} className="px-3 py-1.5 whitespace-nowrap max-w-[140px] truncate">{String(row[h] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Column mapping selects */}
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'name', label: 'Instrument / Fund Name', required: true },
                  { key: 'units', label: 'Units / Quantity', required: true },
                  { key: 'avgPrice', label: 'Avg Buy Price / NAV', required: true },
                  { key: 'currentPrice', label: 'Current / LTP Price', required: false },
                  { key: 'invested', label: 'Total Invested Value', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
                    <Select
                      value={colMap[key]}
                      onValueChange={v => setColMap(prev => ({ ...prev, [key]: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={required ? 'Select column…' : 'Optional — skip'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={COL_NONE}>{required ? '— select —' : '— skip —'}</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: Preview before import ── */}
          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {broker
                    ? <Badge className="bg-growth text-white">{BROKER_FORMATS[broker].name} detected</Badge>
                    : <Badge variant="outline">Custom mapping</Badge>}
                  <span className="text-xs text-muted-foreground">{rows.length} holdings ready</span>
                </div>
                <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline">
                  Upload different file
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Asset class for all:</Label>
                <Select value={assetClass} onValueChange={setAssetClass}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CLASSES.map(c => <SelectItem key={c} value={c}>{CLASS_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> Preview (first 8 rows)
                </div>
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-3 py-2 font-medium">Instrument</th>
                        <th className="text-right px-3 py-2 font-medium">Units</th>
                        <th className="text-right px-3 py-2 font-medium">Avg Buy</th>
                        <th className="text-right px-3 py-2 font-medium">Total Invested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 8).map((r, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="px-3 py-2 font-medium truncate max-w-[180px]">{r.instrument_name}</td>
                          <td className="px-3 py-2 text-right font-numeric">{r.units}</td>
                          <td className="px-3 py-2 text-right font-numeric">{formatCurrency(r.avg_buy_price, 'INR')}</td>
                          <td className="px-3 py-2 text-right font-numeric">{formatCurrency(r.total_invested || r.units * r.avg_buy_price, 'INR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 8 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/10">…and {rows.length - 8} more holdings</div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step === 'map' && (
            <Button
              onClick={applyMapping}
              className="bg-trust hover:bg-trust/90 text-white gap-2"
            >
              <Eye className="h-4 w-4" /> Preview Import
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleImport} disabled={importing} className="bg-trust hover:bg-trust/90 text-white gap-2">
              <Upload className="h-4 w-4" />
              {importing ? 'Importing…' : `Import ${rows.length} Holdings`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Finnhub API Key Dialog ────────────────────────────────────────────────────
function FinnhubKeyDialog({ open, onOpenChange }) {
  const [key, setKey] = useState(() => localStorage.getItem('finnhub_api_key') ?? '')

  function save() {
    if (key.trim()) {
      localStorage.setItem('finnhub_api_key', key.trim())
      toast.success('Finnhub API key saved! Stock prices will now use real-time data.')
    } else {
      localStorage.removeItem('finnhub_api_key')
      toast.success('Finnhub API key removed.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Finnhub API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
            <p className="font-semibold">Free tier — 60 requests/minute</p>
            <p>Get a free key at <span className="font-semibold underline">finnhub.io</span> → Sign up → API Keys tab. No credit card needed.</p>
            <p>Used to fetch live NSE stock prices. Falls back to Yahoo Finance if not set.</p>
          </div>
          <div className="space-y-1.5">
            <Label>API Key</Label>
            <Input
              placeholder="Enter your Finnhub API key"
              value={key}
              onChange={e => setKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-trust hover:bg-trust/90 text-white">Save Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Holding Dialog ────────────────────────────────────────────────────────────
const holdingSchema = z.object({
  instrument_name: z.string().min(2, 'Name required'),
  asset_class: z.enum(ASSET_CLASSES),
  units: z.coerce.number().positive('Must be positive'),
  avg_buy_price: z.coerce.number().positive('Must be positive'),
  total_invested: z.coerce.number().positive('Must be positive'),
})

function HoldingDialog({ open, onOpenChange, editHolding }) {
  const add = useAddHolding()
  const update = useUpdateHolding()
  const isEdit = !!editHolding

  const parsed = editHolding?.ticker ? parseTicker(editHolding.ticker) : null
  const [holdingType, setHoldingType] = useState(parsed?.type ?? 'mutual_fund')
  const [stockSymbol, setStockSymbol] = useState(parsed?.type === 'stock' ? parsed.value : '')
  const [mfSearch, setMfSearch] = useState('')
  const [mfResults, setMfResults] = useState([])
  const [mfSearching, setMfSearching] = useState(false)
  const [selectedFund, setSelectedFund] = useState(
    parsed?.type === 'mutual_fund' ? { schemeCode: parsed.value, schemeName: editHolding?.instrument_name } : null
  )

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(holdingSchema),
    defaultValues: editHolding
      ? { instrument_name: editHolding.instrument_name, asset_class: editHolding.asset_class, units: editHolding.units, avg_buy_price: editHolding.avg_buy_price, total_invested: editHolding.total_invested }
      : { asset_class: 'equity', instrument_name: '', units: '', avg_buy_price: '', total_invested: '' },
  })

  const units = watch('units')
  const avgBuy = watch('avg_buy_price')
  useEffect(() => {
    if (units > 0 && avgBuy > 0) setValue('total_invested', Math.round(units * avgBuy))
  }, [units, avgBuy, setValue])

  // MF search debounce
  useEffect(() => {
    if (holdingType !== 'mutual_fund' || mfSearch.length < 3) { setMfResults([]); return }
    const t = setTimeout(async () => {
      setMfSearching(true)
      try { setMfResults((await searchMFunds(mfSearch)).slice(0, 7)) }
      catch { setMfResults([]) }
      finally { setMfSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [mfSearch, holdingType])

  function selectFund(fund) {
    setSelectedFund(fund)
    setMfSearch(fund.schemeName)
    setMfResults([])
    setValue('instrument_name', fund.schemeName)
  }

  function clearFund() {
    setSelectedFund(null)
    setMfSearch('')
    setValue('instrument_name', '')
  }

  async function onSubmit(data) {
    let ticker = ''
    if (holdingType === 'mutual_fund' && selectedFund) ticker = encodeTicker('mutual_fund', selectedFund.schemeCode)
    else if (holdingType === 'stock' && stockSymbol) ticker = encodeTicker('stock', stockSymbol)

    const payload = { ...data, ticker, current_price: data.avg_buy_price, last_price_update: new Date().toISOString() }
    try {
      if (isEdit) await update.mutateAsync({ id: editHolding.id, ...payload })
      else await add.mutateAsync(payload)
      onOpenChange(false)
    } catch {
      toast.error('Could not save holding. Please try again.')
    }
  }

  const isPending = add.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Holding' : 'Add Holding'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">

          {/* Holding type selector */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Holding type</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'mutual_fund', label: 'Mutual Fund', desc: 'SIP / lump sum MF' },
                  { value: 'stock', label: 'Stock / ETF', desc: 'NSE listed equity' },
                  { value: 'other', label: 'Other', desc: 'Gold, FD, REIT…' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setHoldingType(opt.value); setSelectedFund(null); setMfSearch(''); setStockSymbol('') }}
                    className={`rounded-xl border p-3 text-left transition-all ${holdingType === opt.value ? 'border-trust bg-trust/5 ring-1 ring-trust' : 'border-border hover:border-trust/40'}`}
                  >
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mutual Fund search */}
          {holdingType === 'mutual_fund' && !isEdit && (
            <div className="space-y-1.5">
              <Label>Search fund by name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 pr-8"
                  placeholder="e.g. Parag Parikh Flexi Cap"
                  value={mfSearch}
                  onChange={e => { setMfSearch(e.target.value); if (selectedFund) clearFund() }}
                />
                {mfSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                {selectedFund && !mfSearching && (
                  <button type="button" onClick={clearFund} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {mfResults.length > 0 && !selectedFund && (
                <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden max-h-48 overflow-y-auto z-50">
                  {mfResults.map(f => (
                    <button
                      key={f.schemeCode}
                      type="button"
                      onClick={() => selectFund(f)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 text-sm border-b border-border/40 last:border-0"
                    >
                      <p className="font-medium leading-snug">{f.schemeName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Scheme: {f.schemeCode}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedFund && (
                <div className="rounded-lg bg-growth/10 border border-growth/30 px-3 py-2 text-xs text-growth font-medium flex items-center gap-1.5">
                  ✓ Selected: {selectedFund.schemeName} (#{selectedFund.schemeCode})
                </div>
              )}
              {mfSearch.length >= 3 && !mfSearching && mfResults.length === 0 && !selectedFund && (
                <p className="text-xs text-muted-foreground">No funds found. Try a different name.</p>
              )}
            </div>
          )}

          {/* Stock NSE symbol */}
          {holdingType === 'stock' && (
            <div className="space-y-1.5">
              <Label>NSE Symbol <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. RELIANCE, TCS, INFY, NIFTY50-BEES"
                value={stockSymbol}
                onChange={e => setStockSymbol(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-muted-foreground">Enter the exact NSE ticker. Live prices will be fetched from Yahoo Finance.</p>
            </div>
          )}

          {/* Instrument name (manual for other/stock, auto-filled for MF) */}
          {(holdingType !== 'mutual_fund' || isEdit) && (
            <div className="space-y-1.5">
              <Label>Instrument name</Label>
              <Input placeholder="e.g. Reliance Industries" {...register('instrument_name')} />
              {errors.instrument_name && <p className="text-xs text-destructive">{errors.instrument_name.message}</p>}
            </div>
          )}
          {holdingType === 'mutual_fund' && !isEdit && (
            <input type="hidden" {...register('instrument_name')} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label>Units / Quantity</Label>
              <Input type="number" step="0.001" placeholder="0" {...register('units')} />
              {errors.units && <p className="text-xs text-destructive">{errors.units.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{holdingType === 'mutual_fund' ? 'Avg buy NAV (₹)' : 'Avg buy price (₹)'}</Label>
              <Input type="number" step="0.01" placeholder="0" {...register('avg_buy_price')} />
              {errors.avg_buy_price && <p className="text-xs text-destructive">{errors.avg_buy_price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Total invested (₹)</Label>
              <Input type="number" placeholder="Auto-calculated" {...register('total_invested')} />
              {errors.total_invested && <p className="text-xs text-destructive">{errors.total_invested.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isPending || (holdingType === 'mutual_fund' && !isEdit && !selectedFund)}
              className="bg-trust hover:bg-trust/90 text-white"
            >
              {isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Rebalancing Card ──────────────────────────────────────────────────────────
function RebalancingCard({ suggestions, totalCurrentValue, hasRiskProfile }) {
  if (!hasRiskProfile) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm mb-0.5">No target allocation set</p>
          <p className="text-xs text-muted-foreground">
            Complete the <a href="/app/risk" className="underline text-trust">Risk Profile quiz</a> to get personalised rebalancing suggestions.
          </p>
        </div>
      </div>
    )
  }

  if (!suggestions.length) return null

  const toSell = suggestions.filter(s => s.delta < -500)
  const toBuy = suggestions.filter(s => s.delta > 500)
  const onTarget = suggestions.filter(s => Math.abs(s.delta) <= 500)
  const hasDrift = toSell.length > 0 || toBuy.length > 0

  function driftColor(drift) {
    const abs = Math.abs(drift)
    if (abs <= 2) return 'text-growth'
    if (abs <= 5) return 'text-amber-500'
    return 'text-rose-500'
  }

  function barWidth(pct) {
    return `${Math.min(100, Math.max(0, pct))}%`
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Rebalancing Guide</h2>
        <div className="flex items-center gap-2">
          {hasDrift
            ? <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">Drift detected</Badge>
            : <Badge className="bg-growth/10 text-growth border-growth/30 text-xs">On target</Badge>}
          <span className="text-xs text-muted-foreground">Based on live prices</span>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map(s => {
          const action = s.delta > 500 ? 'buy' : s.delta < -500 ? 'sell' : 'hold'
          return (
            <div key={s.assetClass} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: CLASS_COLORS[s.assetClass] ?? '#999' }} />
                  <span className="font-medium">{CLASS_LABELS[s.assetClass] ?? s.assetClass}</span>
                  <span className="text-muted-foreground">{s.currentPct.toFixed(1)}%</span>
                  <span className="text-muted-foreground">→ target {s.targetPct.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${driftColor(s.drift)}`}>
                    {s.drift > 0 ? '+' : ''}{s.drift.toFixed(1)}%
                  </span>
                  {action === 'buy' && (
                    <span className="rounded-md bg-growth/10 text-growth text-[10px] font-semibold px-1.5 py-0.5">
                      BUY {formatCurrency(Math.abs(s.delta))}
                    </span>
                  )}
                  {action === 'sell' && (
                    <span className="rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-semibold px-1.5 py-0.5">
                      SELL {formatCurrency(Math.abs(s.delta))}
                    </span>
                  )}
                  {action === 'hold' && (
                    <span className="rounded-md bg-growth/10 text-growth text-[10px] font-semibold px-1.5 py-0.5">✓</span>
                  )}
                </div>
              </div>
              {/* Stacked bar: current vs target */}
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: barWidth(s.currentPct), background: CLASS_COLORS[s.assetClass] ?? '#999', opacity: 0.7 }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/40"
                  style={{ left: barWidth(s.targetPct) }}
                  title={`Target: ${s.targetPct}%`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {hasDrift && (
        <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Summary: </span>
          {toSell.length > 0 && (
            <span>Sell {toSell.map(s => `${CLASS_LABELS[s.assetClass]} (${formatCurrency(Math.abs(s.delta))})`).join(', ')}</span>
          )}
          {toSell.length > 0 && toBuy.length > 0 && <span> · </span>}
          {toBuy.length > 0 && (
            <span>Buy {toBuy.map(s => `${CLASS_LABELS[s.assetClass]} (${formatCurrency(s.delta)})`).join(', ')}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PortfolioTrackerPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editHolding, setEditHolding] = useState(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [finnhubOpen, setFinnhubOpen] = useState(false)

  const { data: holdings = [], isLoading } = useHoldings()
  const { data: riskProfile } = useRiskProfile()
  const { user } = useAuth()

  const tickers = useMemo(
    () => [...new Set(holdings.map(h => h.ticker).filter(Boolean))],
    [holdings]
  )
  const { priceMap, isRefetching, refetch } = usePrices(tickers)

  const targetAllocation = useMemo(() => riskProfile?.allocation ?? {}, [riskProfile])

  // Build id→price map from live cache for portfolioReturns
  const currentPrices = useMemo(() => {
    const map = {}
    for (const h of holdings) {
      const pr = priceMap.get(h.ticker)
      if (pr?.current_price != null) map[h.id] = pr.current_price
    }
    return map
  }, [holdings, priceMap])

  const { rows, totalCurrentValue, totalInvested, absoluteGain, returnPct } = useMemo(
    () => portfolioReturns(holdings, currentPrices),
    [holdings, currentPrices]
  )

  const drifts = useMemo(
    () => assetClassDrift(holdings, targetAllocation, currentPrices),
    [holdings, targetAllocation, currentPrices]
  )

  const suggestions = useMemo(
    () => rebalancingSuggestions(holdings, targetAllocation, currentPrices),
    [holdings, targetAllocation, currentPrices]
  )

  const donutData = Object.entries(
    rows.reduce((acc, r) => {
      acc[r.asset_class] = (acc[r.asset_class] ?? 0) + r.currentValue
      return acc
    }, {})
  ).map(([key, value]) => ({ name: CLASS_LABELS[key] ?? key, value, color: CLASS_COLORS[key] ?? '#999' }))

  async function handleRefresh() {
    if (!tickers.length) {
      toast.error('No holdings have a ticker set. Edit a holding to add one.')
      return
    }
    await refetch()
    toast.success('Prices refreshed from live market data.')
  }

  function openAdd() { setEditHolding(null); setDialogOpen(true) }
  function openEdit(h) { setEditHolding(h); setDialogOpen(true) }

  const canRefresh = tickers.length > 0
  const hasFinnhubKey = !!import.meta.env.VITE_FINNHUB_API_KEY || !!localStorage.getItem('finnhub_api_key')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/app/trackers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Investment Portfolio</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">Live NAV & market prices · Allocation drift</p>
              <span className={`text-xs font-medium ${marketStatusColor()}`}>{marketStatusLabel()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setFinnhubOpen(true)}>
            <Key className="h-3.5 w-3.5" />
            {hasFinnhubKey ? 'Finnhub ✓' : 'Add API Key'}
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setCsvOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Import CSV / Excel
          </Button>
          {canRefresh && (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Fetching…' : 'Refresh prices'}
            </Button>
          )}
          <Button size="sm" className="bg-trust hover:bg-trust/90 text-white gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Holding
          </Button>
        </div>
      </div>

      {/* Info banner when no ticker */}
      {holdings.length > 0 && !canRefresh && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
          <span className="text-base">ℹ️</span>
          <span>Edit your holdings and select the fund/stock type to enable live price refresh from NSE/AMFI.</span>
        </div>
      )}

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

      {/* Rebalancing card */}
      {holdings.length > 0 && !isLoading && (
        <RebalancingCard
          suggestions={suggestions}
          totalCurrentValue={totalCurrentValue}
          hasRiskProfile={!!riskProfile?.allocation}
        />
      )}

      {holdings.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-growth/10 mb-4">
            <PieChart className="h-8 w-8 text-growth/60" />
          </div>
          <h3 className="font-semibold mb-2">No holdings yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Add your mutual funds, stocks, or ETFs. Live NAV and market prices will be fetched automatically.
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Holdings</h2>
              <p className="text-xs text-muted-foreground">
                {holdings.filter(h => h.last_price_update && h.ticker).length > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Prices from live market data
                  </span>
                )}
              </p>
            </div>
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
                        const { type } = parseTicker(h.ticker)
                        const priceRow = h.ticker ? priceMap.get(h.ticker) : null
                        return (
                          <tr key={h.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-3">
                              <p className="font-medium truncate max-w-[160px]">{h.instrument_name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className="text-xs py-0 capitalize">{h.asset_class}</Badge>
                                {type === 'mutual_fund' && <span className="text-[10px] text-muted-foreground">AMFI NAV</span>}
                                {type === 'stock' && <span className="text-[10px] text-muted-foreground">NSE</span>}
                                {priceRow?.fetch_error && <span className="text-[10px] text-rose-500 font-medium">⚠ fetch error</span>}
                                {!priceRow?.fetch_error && priceRow?.stale && <span className="text-[10px] text-amber-500 font-medium">⚠ stale</span>}
                                {!priceRow?.fetch_error && !priceRow?.stale && priceRow?.last_updated && (
                                  <span className="text-[10px] text-muted-foreground">{formatTimeAgo(priceRow.last_updated)}</span>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-2.5 font-numeric">{Number(h.units).toLocaleString('en-IN')}</td>
                            <td className="text-right py-2.5 font-numeric text-muted-foreground">{formatCurrency(h.avg_buy_price)}</td>
                            <td className="text-right py-2.5 font-numeric font-semibold">
                              {formatCurrency(h.price)}
                              {h.price !== h.avg_buy_price && (
                                <span className={`block text-[10px] font-normal ${h.price > h.avg_buy_price ? 'text-growth' : 'text-rose-500'}`}>
                                  {h.price > h.avg_buy_price ? '▲' : '▼'} live
                                </span>
                              )}
                            </td>
                            <td className="text-right py-2.5 font-numeric font-semibold">{formatCurrency(h.currentValue)}</td>
                            <td className={`text-right py-2.5 font-numeric font-semibold text-sm ${ret >= 0 ? 'text-growth' : 'text-rose-500'}`}>
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

            {/* Price source note */}
            <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
              <p>📊 Mutual fund NAV: sourced from <span className="font-medium">AMFI via mfapi.in</span> · cached 15 min · updated daily after market close</p>
              <p>📈 Stock prices: sourced from <span className="font-medium">Finnhub (NSE)</span> · cached 15 min · live during market hours (9:15 AM – 3:30 PM IST)</p>
            </div>
          </div>
        </div>
      )}

      <HoldingDialog open={dialogOpen} onOpenChange={setDialogOpen} editHolding={editHolding} />
      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <FinnhubKeyDialog open={finnhubOpen} onOpenChange={setFinnhubOpen} />
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
