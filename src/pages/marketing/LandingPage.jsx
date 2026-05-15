import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Target, ShieldCheck, BarChart2, TrendingUp, ArrowRight,
  CheckCircle2, Star, ChevronRight, UserPlus, ClipboardList,
  Brain, Flag, Calculator, Activity, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-trust/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-growth/5 blur-3xl" />
      </div>

      <div className="container text-center max-w-4xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium tracking-wide">
            Educational financial planning tool
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="text-4xl md:text-6xl font-bold tracking-tight text-trust dark:text-foreground leading-tight mb-6"
        >
          Plan smarter.{' '}
          <span className="text-growth">Invest with clarity.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
        >
          FinPath helps you set meaningful financial goals, understand your risk appetite,
          and discover investment strategies — all in one clean, beginner-friendly dashboard.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button size="lg" className="bg-trust hover:bg-trust/90 text-white gap-2" asChild>
            <Link to="/auth/register">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <Link to="/auth/register">Sign In</Link>
          </Button>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-5 text-xs text-muted-foreground"
        >
          Free to use. Not personalized advice.{' '}
          <Link to="/disclosures" className="underline hover:text-foreground">Read disclosures.</Link>
        </motion.p>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Target,
    title: 'Goal-based planning',
    description:
      'Define what you\'re saving for — retirement, a home, education, or anything else. FinPath calculates exactly how much you need to invest monthly.',
    color: 'text-trust bg-trust/10',
  },
  {
    icon: ShieldCheck,
    title: 'Risk profiling',
    description:
      'Answer a short questionnaire about your finances and temperament. We map your score to a risk profile — conservative, balanced, or aggressive.',
    color: 'text-growth bg-growth/10',
  },
  {
    icon: BarChart2,
    title: 'Smart tracking',
    description:
      'Log your net worth, track debt payoff progress using avalanche or snowball methods, and monitor your investment portfolio over time.',
    color: 'text-amber-500 bg-amber-500/10',
  },
]

function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything you need to plan with confidence
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Built for Indian investors who are just starting out and want clear, structured guidance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create your free account',
    time: '1 min',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    desc: 'Sign up with just your name, email, and password — no credit card, no KYC, completely free.',
    points: [
      'Click "Get Started" or "Create free account"',
      'Enter your full name, email address and a password',
      'You are instantly logged in — no email verification wait',
    ],
  },
  {
    step: '02',
    icon: ClipboardList,
    title: 'Complete your profile (onboarding)',
    time: '2 min',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    desc: 'Answer a few quick questions so FinPath can personalise your experience from day one.',
    points: [
      'Enter your age, city, and annual income range',
      'Choose your primary financial goal (retirement, home, education…)',
      'Tell us your investment experience level',
    ],
  },
  {
    step: '03',
    icon: Brain,
    title: 'Take the risk quiz',
    time: '3 min',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    desc: 'Answer 8 simple questions about your financial comfort and get your investor profile instantly.',
    points: [
      'Questions cover your income stability, investment horizon and loss tolerance',
      'Get your profile: Conservative, Moderate, or Aggressive',
      'Unlock personalised mutual fund and ETF recommendations tailored to your risk level',
    ],
  },
  {
    step: '04',
    icon: Flag,
    title: 'Set your financial goals',
    time: '5 min',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    desc: 'Add real goals — retirement, child\'s education, buying a home, emergency fund — and see exactly what to invest monthly.',
    points: [
      'Pick a goal type and enter your target amount and timeline',
      'FinPath auto-calculates the required monthly SIP using compound interest',
      'Track progress on your dashboard — green bar fills as you get closer',
    ],
  },
  {
    step: '05',
    icon: Calculator,
    title: 'Build your personal finance plan',
    time: '10 min',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    desc: 'Open the Finance Planner and get a complete 15-year wealth projection based on your salary and budget.',
    points: [
      'Enter your monthly salary and drag sliders to split: expenses, EMI, vacation, donations, investments',
      'Sub-allocate investments across Equity MF, PPF/EPF, NPS, direct stocks',
      'Instantly see your Financial Health Score, projected corpus, and personalized tips',
    ],
  },
  {
    step: '06',
    icon: Activity,
    title: 'Monitor and update regularly',
    time: 'Daily / Monthly',
    color: 'bg-trust',
    lightColor: 'bg-trust/5',
    borderColor: 'border-trust/20',
    desc: 'Keep your financial picture accurate by logging real data — the more you update, the more useful FinPath becomes.',
    points: [
      'Expense Tracker: Log actual monthly spending (groceries, fuel, dining, etc.) to compare against your budget',
      'Net Worth Tracker: Add your assets (FD, gold, property) and liabilities (loans) — watch your net worth grow',
      'Portfolio Tracker: Record SIP and lump-sum investments to see real returns vs target',
      'Dashboard: Get an instant overview of all goals, net worth, and investment health in one place',
    ],
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/20">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            From sign-up to full financial clarity
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Follow these 6 steps to go from a blank slate to a complete, personalised financial plan — and keep it updated for daily monitoring.
          </p>
        </div>

        <div className="space-y-6">
          {STEPS.map(({ step, icon: Icon, title, time, color, lightColor, borderColor, desc, points }, i) => (
            <motion.div
              key={step}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i * 0.15}
              className={`rounded-2xl border ${borderColor} ${lightColor} p-6`}
            >
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Step number + icon */}
                <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 flex-shrink-0">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{time}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground tracking-widest">STEP {step}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-snug mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{desc}</p>
                  <ul className="space-y-1.5">
                    {points.map((pt, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-growth flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-sm text-muted-foreground mb-4">Ready to get started? It takes less than 5 minutes to set up your complete plan.</p>
          <Button size="lg" className="bg-trust hover:bg-trust/90 text-white gap-2" asChild>
            <Link to="/auth/register">Create free account <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Software Engineer, Bengaluru',
    text: 'FinPath helped me realise I was way off track for retirement. The goal calculator was a wake-up call — in the best way.',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'MBA Student, Mumbai',
    text: 'The risk quiz was easy to understand. I finally know why I should hold 60% equity and 40% debt at my age.',
    rating: 5,
  },
  {
    name: 'Divya Nair',
    role: 'Teacher, Kochi',
    text: 'I was always intimidated by investing. FinPath\'s beginner-friendly explanations made it feel approachable.',
    rating: 5,
  },
]

function Testimonials() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">What users say</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Real people, real clarity
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, text, rating }, i) => (
            <motion.div
              key={name}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i * 0.2}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: rating }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="h-9 w-9 rounded-full bg-trust/10 flex items-center justify-center text-trust font-semibold text-sm">
                  {name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Band ─────────────────────────────────────────────────────────────────
function CTABand() {
  return (
    <section className="py-20">
      <div className="container max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-trust px-8 py-16 text-white shadow-md relative overflow-hidden"
        >
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 h-40 w-40 rounded-full border-8 border-white" />
            <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full border-4 border-white" />
          </div>

          <TrendingUp className="h-10 w-10 mx-auto mb-5 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start your financial journey today
          </h2>
          <p className="text-white/75 mb-8 max-w-lg mx-auto">
            Join thousands of Indians taking control of their financial future.
            Free to use. No advisor fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-trust hover:bg-white/90 gap-2"
              asChild
            >
              <Link to="/auth/register">
                Create free account <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link to="/disclosures">Read disclosures</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-white/70">
            {['Free forever', 'No credit card', 'Educational only', 'Not personalized advice'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-growth" /> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>FinPath — Plan smarter. Invest with clarity.</title>
        <meta name="description" content="Goal-based financial planning for India. Set meaningful goals, understand your risk appetite, and discover investment strategies — free and educational." />
      </Helmet>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTABand />
    </>
  )
}
