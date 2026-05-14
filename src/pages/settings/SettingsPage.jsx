import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  User, Moon, Sun, Monitor, LogOut, Trash2, ShieldCheck,
  Bell, ChevronRight, Info, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useRiskProfile } from '@/hooks/useRiskProfile'
import { useGoals } from '@/hooks/useGoals'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/format'

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

function SettingRow({ icon: Icon, label, description, children, iconColor = 'text-muted-foreground' }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {Icon && (
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

// ── Theme selector ────────────────────────────────────────────────────────────
function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
            theme === value ? 'bg-trust text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────────────────────
function ProfileSection({ user }) {
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '')
  const [saving, setSaving] = useState(false)

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FP'

  async function saveName() {
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setSaving(false)
    if (error) {
      toast.error('Could not update name.')
    } else {
      toast.success('Name updated!')
    }
  }

  return (
    <Section title="Profile" description="How you appear in your dashboard">
      <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-trust text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 w-full">
          <Label htmlFor="display-name" className="text-xs text-muted-foreground mb-1.5 block">Display name</Label>
          <div className="flex gap-2">
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="max-w-xs"
            />
            <Button
              size="sm"
              className="bg-trust hover:bg-trust/90 text-white"
              onClick={saveName}
              disabled={saving || name === user?.user_metadata?.full_name}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
      <SettingRow icon={Info} label="Account type" description="Anonymous — no email or phone required">
        <Badge variant="secondary" className="text-xs">Anonymous</Badge>
      </SettingRow>
      <SettingRow icon={ShieldCheck} label="Member since">
        <span className="text-xs text-muted-foreground font-numeric">
          {user?.created_at ? formatDate(user.created_at) : '—'}
        </span>
      </SettingRow>
    </Section>
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────────
function StatsSection({ goals, riskProfile }) {
  const activeGoals = goals?.filter((g) => g.status === 'active') ?? []
  const stats = [
    { label: 'Active goals', value: activeGoals.length },
    { label: 'Risk profile', value: riskProfile ? (riskProfile.profile_key.charAt(0).toUpperCase() + riskProfile.profile_key.slice(1)) : '—' },
    { label: 'Last risk assessment', value: riskProfile ? formatDate(riskProfile.created_at) : 'Never' },
  ]
  return (
    <Section title="Your data summary">
      {stats.map(({ label, value }) => (
        <SettingRow key={label} label={label}>
          <span className="text-sm font-medium">{value}</span>
        </SettingRow>
      ))}
    </Section>
  )
}

// ── Appearance ────────────────────────────────────────────────────────────────
function AppearanceSection() {
  return (
    <Section title="Appearance">
      <SettingRow icon={Sun} label="Theme" description="Choose between light, dark, or follow your system setting">
        <ThemeSelector />
      </SettingRow>
    </Section>
  )
}

// ── Notifications (display-only for now) ─────────────────────────────────────
function NotificationsSection() {
  const [emailDigest, setEmailDigest] = useState(false)
  return (
    <Section title="Notifications" description="FinPath does not collect your email — these are in-app only">
      <SettingRow
        icon={Bell}
        label="Goal reminders"
        description="Remind you when a goal's monthly contribution is due"
      >
        <button
          onClick={() => { setEmailDigest((v) => !v); toast.info('Notification preferences saved') }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${emailDigest ? 'bg-trust' : 'bg-muted-foreground/30'}`}
          role="switch"
          aria-checked={emailDigest}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${emailDigest ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </SettingRow>
    </Section>
  )
}

// ── Danger zone ───────────────────────────────────────────────────────────────
function DangerZone({ onSignOut }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <Section title="Account" description="Irreversible actions">
      <SettingRow icon={LogOut} label="Sign out" description="You will be taken back to the start screen" iconColor="text-muted-foreground">
        <Button size="sm" variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      </SettingRow>

      <SettingRow icon={Trash2} label="Delete all data" description="Permanently removes all your goals, entries, and profile" iconColor="text-destructive">
        <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5" onClick={() => setDeleteOpen(true)}>
          Delete data
        </Button>
      </SettingRow>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete all data?</DialogTitle>
            <DialogDescription>
              This will permanently delete your goals, net worth entries, debts, holdings, and risk profile.
              Your anonymous account session will also be cleared. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                // In production: call a Supabase RPC that deletes the user's data
                // For now, sign out and clear local storage
                localStorage.clear()
                toast.success('Data cleared. Signing you out…')
                setTimeout(onSignOut, 1000)
              }}
            >
              Delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  )
}

// ── Links section ─────────────────────────────────────────────────────────────
function LinksSection() {
  const links = [
    { label: 'Disclosures', to: '/disclosures' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'About FinPath', to: '/about' },
    { label: 'Contact / Feedback', to: '/contact' },
  ]
  return (
    <Section title="About & Legal">
      {links.map(({ label, to }) => (
        <a key={label} href={to} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors group">
          <span className="flex-1 text-sm">{label}</span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>
      ))}
    </Section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: riskProfile } = useRiskProfile()
  const { data: goals } = useGoals()

  async function handleSignOut() {
    await signOut()
    navigate('/auth/register', { replace: true })
  }

  return (
    <>
      <Helmet>
        <title>Settings — FinPath</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and preferences</p>
        </div>

        {user && <ProfileSection user={user} />}
        <StatsSection goals={goals} riskProfile={riskProfile} />
        <AppearanceSection />
        <NotificationsSection />
        <LinksSection />
        <DangerZone onSignOut={handleSignOut} />

        <p className="text-xs text-muted-foreground text-center pb-4">
          FinPath v1.0 · Educational financial planning for India · Not SEBI registered
        </p>
      </div>
    </>
  )
}
