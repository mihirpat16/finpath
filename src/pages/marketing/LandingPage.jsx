import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  TrendingUp, Target, ShieldCheck, BarChart2, ArrowRight, CheckCircle2,
  LayoutDashboard, Flag, Wallet, UserPlus, ClipboardList, Brain,
  Calculator, Activity, Clock,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' },
  }),
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 overflow-hidden emerald-gradient-bg">
      {/* Ambient blobs */}
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-growth/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-trust/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <motion.h1
          variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-trust mb-6 leading-[1.08]"
        >
          Wealth as a<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-trust via-growth to-trust">
            living ecosystem.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Nurture your financial future with goal-based planning, risk profiling,
          and smart tracking tools — built for Indian investors.
        </motion.p>

        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/auth/register"
            className="px-10 py-4 bg-trust text-white text-lg font-bold rounded-full shadow-xl shadow-trust/20 hover:bg-trust/90 transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/about"
            className="px-10 py-4 bg-white/50 backdrop-blur-md border border-white/30 text-trust text-lg font-bold rounded-full hover:bg-white transition-all duration-300 inline-block"
          >
            Learn More
          </Link>
        </motion.div>

        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="mt-5 text-xs text-slate-400"
        >
          Free to use · Not personalised advice ·{' '}
          <Link to="/disclosures" className="underline hover:text-trust">Read disclosures</Link>
        </motion.p>

        {/* Orbit visual */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={4}
          className="mt-20 relative flex items-center justify-center"
          style={{ minHeight: 420 }}
        >
          {/* Orbit ring */}
          <div className="absolute w-80 h-80 md:w-[420px] md:h-[420px] rounded-full border border-growth/15 animate-orbit">
            {/* Top: Dashboard */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-counter-rotate">
              <div className="glass-card px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg text-trust font-bold text-xs md:text-sm flex items-center gap-2">
                <LayoutDashboard className="h-3.5 w-3.5 text-growth" /> Dashboard
              </div>
            </div>
            {/* Bottom-left: Goals */}
            <div className="absolute top-3/4 left-0 -translate-x-1/2 animate-counter-rotate">
              <div className="glass-card px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg text-trust font-bold text-xs md:text-sm flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-growth" /> Goals
              </div>
            </div>
            {/* Bottom-right: Net Worth */}
            <div className="absolute top-3/4 right-0 translate-x-1/2 animate-counter-rotate">
              <div className="glass-card px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg text-trust font-bold text-xs md:text-sm flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-growth" /> Net Worth
              </div>
            </div>
          </div>

          {/* Central globe */}
          <div className="relative z-10 w-48 h-48 md:w-64 md:h-64">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-trust via-trust/90 to-growth flex flex-col items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.35)] animate-float">
              <TrendingUp className="h-12 w-12 md:h-16 md:w-16 text-white/90 mb-1" />
              <span className="text-white font-extrabold text-base md:text-lg tracking-tight">FinPath</span>
              <span className="text-growth/80 text-[10px] md:text-xs mt-0.5">Your wealth, evolved.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Philosophy / Features ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Target,
    title: 'Goal-based Planning',
    description:
      'We don\'t just track numbers — we map your aspirations. Align your portfolio with the life milestones that truly matter: retirement, a home, your child\'s education.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Profiling',
    description:
      'Answer 8 simple questions to discover your investor DNA. Get mapped to Conservative, Moderate, or Aggressive — and unlock recommendations tailored to your comfort zone.',
  },
  {
    icon: BarChart2,
    title: 'Smart Tracking',
    description:
      'Real-time analytics for your portfolio, net worth, and debt payoff. Stay informed with live NAV prices, rebalancing alerts, and a personalised financial health score.',
  },
]

function Philosophy() {
  return (
    <section id="features" className="py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tighter text-trust mb-4"
          >
            The FinPath Philosophy
          </motion.h2>
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="text-slate-500 text-lg"
          >
            Precision engineering for your financial evolution.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.15}
              className="glass-card p-10 rounded-2xl group hover:border-growth/40 transition-all duration-500 hover:-translate-y-4 cursor-default"
            >
              <div className="w-16 h-16 rounded-2xl bg-trust/10 flex items-center justify-center mb-8 group-hover:bg-growth group-hover:text-white transition-colors duration-300">
                <Icon className="h-8 w-8 text-trust group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-trust mb-3">{title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 6-Step Journey ───────────────────────────────────────────────────────────
const STEPS = [
  {
    n: 1,
    icon: UserPlus,
    title: 'Account Creation',
    time: '1 min',
    desc: 'Sign up with your name, email, and password — no credit card, no KYC, completely free. You\'re instantly inside.',
  },
  {
    n: 2,
    icon: ClipboardList,
    title: 'Complete Your Profile',
    time: '2 min',
    desc: 'Tell FinPath your age, income range, city, and primary financial goal. We personalise your experience from day one.',
  },
  {
    n: 3,
    icon: Brain,
    title: 'Risk Assessment',
    time: '3 min',
    desc: 'Discover your investor DNA through 8 simple behavioural questions. Get your profile: Conservative, Moderate, or Aggressive.',
  },
  {
    n: 4,
    icon: Flag,
    title: 'Goal Identification',
    time: '5 min',
    desc: 'Define what victory looks like — early retirement, a home, a child\'s education. FinPath calculates your exact monthly SIP.',
  },
  {
    n: 5,
    icon: Calculator,
    title: 'Build Your Finance Plan',
    time: '10 min',
    desc: 'Open the Finance Planner, enter your salary, drag sliders for expenses and investments — get a 15-year wealth projection instantly.',
  },
  {
    n: 6,
    icon: Activity,
    title: 'Ongoing Optimisation',
    time: 'Daily / Monthly',
    desc: 'Log expenses, update net worth, track portfolio returns with live NAV prices. The more you update, the smarter FinPath gets.',
    isLast: true,
  },
]

function Journey() {
  return (
    <section id="how-it-works" className="py-28 px-4 sm:px-6 bg-slate-50/60 overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tighter text-trust mb-4"
          >
            The 6-Step Journey
          </motion.h2>
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="text-slate-500 text-lg"
          >
            From sign-up to full financial clarity.
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-trust via-growth to-growth/20 opacity-20" />

          <div className="space-y-16">
            {STEPS.map(({ n, icon: Icon, title, time, desc, isLast }, i) => (
              <motion.div
                key={n}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.1}
                className="relative group"
              >
                {/* Number bubble */}
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl z-10 shadow-lg text-white transition-transform group-hover:scale-125 ${isLast ? 'bg-growth shadow-growth/20' : 'bg-trust shadow-trust/20'}`}>
                    {n}
                  </div>
                </div>

                <div className="glass-card p-8 rounded-2xl text-center max-w-lg mx-auto group-hover:shadow-2xl group-hover:shadow-growth/10 transition-all duration-500">
                  <div className="flex items-center justify-center gap-2 mb-3 text-xs text-slate-400">
                    <Icon className="h-4 w-4" />
                    <Clock className="h-3 w-3" />
                    <span>{time}</span>
                  </div>
                  <h4 className="text-lg font-bold text-trust mb-2">{title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/auth/register"
            className="px-10 py-4 bg-trust text-white text-base font-bold rounded-full shadow-xl shadow-trust/20 hover:bg-trust/90 transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            Start your journey <ArrowRight className="h-4 w-4" />
          </Link>
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
    text: 'FinPath turned my chaotic spreadsheet life into a crystalline vision of the future. The goal calculator was a genuine wake-up call — in the best way.',
    accent: true,
  },
  {
    name: 'Arjun Mehta',
    role: 'MBA Student, Mumbai',
    text: 'As someone learning about investing, I appreciate how thorough the risk profiling is. Sophisticated enough to be credible, intuitive enough for a beginner.',
  },
  {
    name: 'Divya Nair',
    role: 'Teacher, Kochi',
    text: 'Finally, a financial tool that doesn\'t feel overwhelming. The UI is gorgeous, and the live portfolio tracking with real NAV prices is genuinely useful.',
    accent: true,
    accentColor: 'border-trust',
  },
  {
    name: 'Rohan Desai',
    role: 'Marketing Executive, Pune',
    text: 'The goal-based tracking changed how I view my savings. It\'s no longer just a number — it\'s my first home, my retirement, my legacy.',
  },
]

function Testimonials() {
  return (
    <section className="py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tighter text-trust mb-4"
          >
            Real people, real clarity.
          </motion.h2>
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="text-slate-500 text-lg"
          >
            Trusted by the next generation of Indian wealth builders.
          </motion.p>
        </div>

        <div className="columns-1 md:columns-2 gap-8 space-y-8">
          {TESTIMONIALS.map(({ name, role, text, accent, accentColor }, i) => (
            <motion.div
              key={name}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.15}
              className={`break-inside-avoid glass-card p-8 rounded-2xl ${accent ? `border-l-4 ${accentColor ?? 'border-growth'}` : ''}`}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 rounded-full bg-trust/10 flex items-center justify-center text-trust font-bold text-sm flex-shrink-0">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h5 className="font-bold text-trust text-sm">{name}</h5>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </div>
              <p className="italic text-slate-600 leading-relaxed text-sm">"{text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function CTABand() {
  return (
    <section className="py-28 px-4 sm:px-6 bg-trust text-white text-center relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-8 leading-tight">
            Start your financial<br />journey today.
          </h2>
          <p className="text-lg text-growth/80 mb-12 max-w-2xl mx-auto">
            Join thousands of Indian investors who have found clarity with FinPath.
            Free forever. No advisor fees.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/auth/register"
              className="px-12 py-5 bg-growth text-trust text-xl font-bold rounded-full hover:bg-white transition-all duration-300 hover:scale-105 shadow-2xl inline-flex items-center gap-2"
            >
              Create Free Account <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/disclosures"
              className="text-base font-semibold text-white/70 hover:text-growth transition-colors"
            >
              Read Disclosures
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 justify-center text-sm text-white/50">
            {['Free forever', 'No credit card', 'Educational only', 'Not personalised advice'].map(t => (
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
        <title>FinPath — Wealth as a living ecosystem.</title>
        <meta name="description" content="Goal-based financial planning for India. Set meaningful goals, understand your risk appetite, and discover investment strategies — free and educational." />
      </Helmet>
      <Hero />
      <Philosophy />
      <Journey />
      <Testimonials />
      <CTABand />
    </>
  )
}
