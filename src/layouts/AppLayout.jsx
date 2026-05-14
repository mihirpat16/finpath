import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Target, ShieldCheck, PieChart, BarChart2,
  Settings, TrendingUp, Menu, X, Sun, Moon, Bell, ChevronDown, LogOut, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { useTrackEvent } from '@/hooks/useTrackEvent'

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/goals', label: 'Goals', icon: Target },
  { to: '/app/risk', label: 'Risk Profile', icon: ShieldCheck },
  { to: '/app/portfolio', label: 'Portfolio', icon: PieChart },
  { to: '/app/trackers', label: 'Trackers', icon: BarChart2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

// Mobile bottom nav shows only the 5 primary items
const BOTTOM_NAV = NAV_ITEMS.slice(0, 5)

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

function NavList({ onItemClick, collapsed }) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-trust/10 text-trust font-medium dark:bg-trust/20 dark:text-blue-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'md:justify-center md:px-2',
              )
            }
            title={label}
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function DesktopSidebar({ collapsed }) {
  return (
    <aside
      className={cn(
        'hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-border px-4', collapsed && 'justify-center px-0')}>
        <Link to="/" className="flex items-center gap-2" aria-label="FinPath home">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-trust text-white flex-shrink-0">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          {!collapsed && <span className="font-semibold text-trust dark:text-foreground">FinPath</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
        <NavList collapsed={collapsed} />
      </nav>
    </aside>
  )
}

function MobileDrawer({ open, onClose }) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link to="/" className="flex items-center gap-2" onClick={onClose} aria-label="FinPath home">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-trust text-white flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="font-semibold text-trust dark:text-foreground">FinPath</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
          <NavList onItemClick={onClose} collapsed={false} />
        </nav>
      </SheetContent>
    </Sheet>
  )
}

function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden border-t border-border bg-card/95 backdrop-blur"
      aria-label="Mobile navigation"
    >
      {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
              isActive ? 'text-trust dark:text-blue-400' : 'text-muted-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function Topbar({ onMenuClick, sidebarCollapsed }) {
  const { user, signOut } = useUser()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth/register', { replace: true })
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FP'

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 transition-all duration-200',
        sidebarCollapsed ? 'md:pl-20' : 'md:pl-68',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onMenuClick}
        aria-label="Toggle navigation"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="flex-1" />

      <ThemeToggle />

      <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
        <Bell className="h-4 w-4" aria-hidden="true" />
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-growth" aria-hidden="true" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-8 px-2" aria-label="User menu">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-trust text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/app/settings" className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" /> Profile &amp; Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive flex items-center gap-2 cursor-pointer"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

function PageTracker() {
  const location = useLocation()
  const track = useTrackEvent()
  useEffect(() => {
    track('page_viewed', { path: location.pathname })
  }, [location.pathname])
  return null
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleMenuClick() {
    if (window.innerWidth < 768) {
      setMobileOpen(true)
    } else {
      setCollapsed((c) => !c)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <PageTracker />
      <DesktopSidebar collapsed={collapsed} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className={cn(
        'flex flex-1 flex-col transition-all duration-200 min-w-0',
        collapsed ? 'md:ml-16' : 'md:ml-64',
      )}>
        <Topbar onMenuClick={handleMenuClick} sidebarCollapsed={collapsed} />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
