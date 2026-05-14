import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, Users, Activity, Calendar, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID

function StatCard({ icon: Icon, label, value, color = 'text-trust' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-numeric ${color}`}>{value}</p>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = !ADMIN_USER_ID || user?.id === ADMIN_USER_ID

  async function loadEvents() {
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) toast.error('Could not load events: ' + error.message)
    else setEvents(data ?? [])
  }

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    loadEvents().finally(() => setLoading(false))
  }, [isAdmin])

  async function handleRefresh() {
    setRefreshing(true)
    await loadEvents()
    setRefreshing(false)
    toast.success('Refreshed.')
  }

  const stats = useMemo(() => {
    const uniqueUsers = new Set(events.map((e) => e.user_id)).size
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = events.filter((e) => e.created_at?.slice(0, 10) === today).length
    const typeCounts = events.reduce((acc, e) => {
      acc[e.event_name] = (acc[e.event_name] ?? 0) + 1
      return acc
    }, {})
    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
    return { uniqueUsers, todayCount, total: events.length, sortedTypes }
  }, [events])

  function shortId(id) {
    return id ? `${id.slice(0, 8)}…` : '—'
  }

  function relativeTime(dateStr) {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
        <p className="font-semibold text-lg mb-1">Access denied</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          This page is only accessible to the developer account.
          Set <code className="bg-muted px-1 rounded text-xs">VITE_ADMIN_USER_ID</code> in your <code className="bg-muted px-1 rounded text-xs">.env</code> file.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground font-mono">
          Your ID: {user?.id ?? 'not logged in'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 gap-1.5 text-xs"
          onClick={() => { navigator.clipboard.writeText(user?.id ?? ''); toast.success('Copied!') }}
        >
          <Copy className="h-3 w-3" /> Copy your user ID
        </Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin — FinPath</title>
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Developer Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live activity across all FinPath users</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stat cards */}
        {loading
          ? <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          : (
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Users} label="Unique users" value={stats.uniqueUsers} />
              <StatCard icon={Activity} label="Total events" value={stats.total} color="text-growth" />
              <StatCard icon={Calendar} label="Events today" value={stats.todayCount} color="text-amber-500" />
            </div>
          )
        }

        <div className="grid md:grid-cols-3 gap-5">
          {/* Event type breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm mb-3">Events by type</h2>
            {loading
              ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 rounded" />)}</div>
              : stats.sortedTypes.length === 0
                ? <p className="text-xs text-muted-foreground">No events yet.</p>
                : (
                  <ul className="space-y-2">
                    {stats.sortedTypes.map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-muted-foreground truncate">{name}</span>
                        <Badge variant="secondary" className="text-xs font-numeric flex-shrink-0">{count}</Badge>
                      </li>
                    ))}
                  </ul>
                )
            }
          </div>

          {/* Recent events feed */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm mb-3">Recent activity</h2>
            {loading
              ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
              : events.length === 0
                ? <p className="text-xs text-muted-foreground">No events recorded yet. Activity will appear here once users interact with the app.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="text-left pb-2 font-medium pr-4">Time</th>
                          <th className="text-left pb-2 font-medium pr-4">User</th>
                          <th className="text-left pb-2 font-medium pr-4">Event</th>
                          <th className="text-left pb-2 font-medium">Page</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.slice(0, 50).map((e) => (
                          <tr key={e.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                            <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{relativeTime(e.created_at)}</td>
                            <td className="py-2 pr-4 font-mono text-muted-foreground whitespace-nowrap">{shortId(e.user_id)}</td>
                            <td className="py-2 pr-4 font-medium whitespace-nowrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                e.event_name.includes('created') ? 'bg-growth/10 text-growth'
                                : e.event_name.includes('deleted') ? 'bg-destructive/10 text-destructive'
                                : e.event_name.includes('viewed') ? 'bg-trust/10 text-trust'
                                : 'bg-muted text-muted-foreground'
                              }`}>
                                {e.event_name}
                              </span>
                            </td>
                            <td className="py-2 text-muted-foreground font-mono truncate max-w-[120px]">{e.page ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {events.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Showing 50 of {events.length} events. Query Supabase for full history.
                      </p>
                    )}
                  </div>
                )
            }
          </div>
        </div>

        {/* Your ID helper */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-0.5">Your developer user ID</p>
            <p className="text-xs font-mono text-muted-foreground truncate">{user?.id}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-shrink-0"
            onClick={() => { navigator.clipboard.writeText(user?.id ?? ''); toast.success('Copied!') }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </div>
    </>
  )
}
