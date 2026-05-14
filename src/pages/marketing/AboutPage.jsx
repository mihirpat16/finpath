import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, ShieldCheck, BarChart2, TrendingUp, ArrowRight, Heart, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.1, ease: 'easeOut' } }),
}

const VALUES = [
  {
    icon: Target,
    title: 'Clarity over complexity',
    description: 'Personal finance is confusing by design. FinPath strips away the jargon and shows you exactly what to do, step by step.',
    color: 'text-trust bg-trust/10',
  },
  {
    icon: ShieldCheck,
    title: 'Education, not advice',
    description: 'We are not SEBI-registered advisers and we never pretend to be. Every number on FinPath is a learning tool, not a directive.',
    color: 'text-growth bg-growth/10',
  },
  {
    icon: Heart,
    title: 'Built for India',
    description: 'From PPF and SGBs to Nifty 50 and ELSS — our instrument catalog and calculations are designed for Indian investors.',
    color: 'text-rose-500 bg-rose-500/10',
  },
  {
    icon: BarChart2,
    title: 'Data stays yours',
    description: 'Anonymous authentication means no email, no account to hack. Your financial data is stored with row-level security — only you can read it.',
    color: 'text-amber-500 bg-amber-500/10',
  },
]

const TIMELINE = [
  { year: '2024', event: 'Idea born — frustrated by complex financial tools that assumed you already knew everything.' },
  { year: 'Early 2025', event: 'First prototype: goal calculator + risk quiz. Tested with friends and family.' },
  { year: 'Mid 2025', event: 'Added investment recommendations, debt tracker, and net worth tracking.' },
  { year: '2026', event: 'Full platform launch with dashboard, portfolio tracker, and dark mode.' },
]

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About — FinPath</title>
        <meta name="description" content="Learn about FinPath — a free, educational financial planning tool built for Indian investors." />
      </Helmet>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-xs font-medium tracking-wide">
              Our story
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl md:text-5xl font-bold tracking-tight text-trust dark:text-foreground leading-tight mb-6"
          >
            Financial clarity for every Indian investor
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            FinPath was built out of a simple frustration: most financial tools either overwhelm
            beginners with jargon, or oversimplify to the point of uselessness. We wanted something
            in between — structured, honest, and built specifically for India.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Mission</Badge>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Make goal-based investing accessible to everyone
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Most Indians leave their money in a savings account earning 3–4% while inflation
                erodes its value at 6%. Not because they don't care about their future — but because
                the financial system feels inaccessible.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                FinPath changes that. Set a goal, answer 10 questions about your risk tolerance,
                and get a clear, personalised plan in minutes — for free, no adviser fees, no sales pitch.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-trust text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <blockquote className="text-lg font-medium leading-relaxed">
                "If you don't know where your money is going, it's going somewhere you don't want it to."
              </blockquote>
              <p className="text-sm text-muted-foreground">— The philosophy behind FinPath</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Our values</Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What we stand for</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map(({ icon: Icon, title, description, color }, i) => (
              <motion.div
                key={title}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.1}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Timeline</Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How we got here</h2>
          </div>
          <div className="relative">
            <div className="absolute left-16 top-4 bottom-4 w-px bg-border hidden sm:block" />
            <div className="space-y-8">
              {TIMELINE.map(({ year, event }, i) => (
                <motion.div
                  key={year}
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.1}
                  className="flex gap-6 items-start"
                >
                  <div className="w-24 flex-shrink-0 text-right">
                    <span className="text-xs font-semibold text-trust bg-trust/10 px-2 py-1 rounded-full">{year}</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="outline" className="mb-4">The person behind it</Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Meet the founder</h2>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0.1}
            className="relative rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-trust to-trust/40" />
            <div className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-trust text-white shadow-lg">
                  <BookOpen className="h-9 w-9" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Founder</p>
                  <h3 className="text-2xl font-bold mb-1">Mihir Patel</h3>
                  <p className="text-sm font-medium text-trust mb-3">Chartered Accountant</p>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Mihir is a Chartered Accountant who built FinPath to bridge the gap between
                    professional financial knowledge and everyday investors. Having seen first-hand
                    how overwhelming personal finance can be, he designed FinPath to give every
                    Indian the same clarity that a CA would offer — completely free.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Special Thanks */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="outline" className="mb-4">Acknowledgements</Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Special thanks</h2>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0.1}
            className="relative rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Decorative gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-trust via-growth to-amber-400" />

            <div className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar / icon */}
                <div className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-trust to-growth text-white shadow-lg">
                  <Sparkles className="h-9 w-9" />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    With heartfelt gratitude
                  </p>
                  <h3 className="text-2xl font-bold mb-3">Vishwa Makwana</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                    FinPath would not exist without the constant encouragement, feedback, and support
                    of Vishwa Makwana. From early ideas to the final product, her belief in this project
                    shaped every part of what FinPath has become. This work is as much hers as it is anyone&apos;s.
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-rose-500 text-sm font-medium">
                    <Heart className="h-4 w-4 fill-rose-500" />
                    Thank you for making this possible
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Ready to start planning?</h2>
          <p className="text-muted-foreground mb-8">
            It takes under 5 minutes to set your first goal. No email, no credit card, no sales calls.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-trust hover:bg-trust/90 text-white gap-2" asChild>
              <Link to="/auth/register">Get started free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
