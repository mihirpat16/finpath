import {
  Umbrella, Home, Briefcase, GraduationCap, Heart,
  Plane, Shield, Sparkles,
} from 'lucide-react'

export const GOAL_TYPES = [
  {
    value: 'retirement',
    label: 'Retirement',
    icon: Umbrella,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    defaultCagr: 0.10,
  },
  {
    value: 'house',
    label: 'Buy a house',
    icon: Home,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    defaultCagr: 0.08,
  },
  {
    value: 'business',
    label: 'Start a business',
    icon: Briefcase,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    defaultCagr: 0.08,
  },
  {
    value: 'education',
    label: "Children's education",
    icon: GraduationCap,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    defaultCagr: 0.09,
  },
  {
    value: 'wedding',
    label: 'Wedding',
    icon: Heart,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    defaultCagr: 0.07,
  },
  {
    value: 'travel',
    label: 'Travel',
    icon: Plane,
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    defaultCagr: 0.07,
  },
  {
    value: 'emergency',
    label: 'Emergency fund',
    icon: Shield,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    defaultCagr: 0.065,
  },
  {
    value: 'custom',
    label: 'Custom goal',
    icon: Sparkles,
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800/50',
    defaultCagr: 0.10,
  },
]

export function getGoalType(value) {
  return GOAL_TYPES.find((t) => t.value === value) ?? GOAL_TYPES[GOAL_TYPES.length - 1]
}
