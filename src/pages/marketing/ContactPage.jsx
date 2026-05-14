import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Mail, Code2, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' } }),
}

const TOPICS = [
  { value: 'bug', label: 'Bug report' },
  { value: 'feature', label: 'Feature request' },
  { value: 'question', label: 'General question' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
]

const CONTACT_LINKS = [
  {
    icon: Code2,
    title: 'GitHub Issues',
    description: 'Report bugs or request features on our public repository. This is the fastest way to get a response.',
    label: 'Open an issue',
    href: 'https://github.com',
    color: 'text-foreground bg-foreground/10',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'For anything that isn\'t a bug or feature request, you can reach us by email.',
    label: 'mihirpatdms@gmail.com',
    href: 'mailto:mihirpatdms@gmail.com',
    color: 'text-trust bg-trust/10',
  },
  {
    icon: MessageSquare,
    title: 'Feedback',
    description: 'Tell us what you love, what frustrates you, or what you wish FinPath could do.',
    label: 'Send feedback',
    href: 'mailto:mihirpatdms@gmail.com?subject=FinPath Feedback',
    color: 'text-growth bg-growth/10',
  },
]

export default function ContactPage() {
  const [topic, setTopic] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      setError('Please fill in your name and message.')
      return
    }
    // In a real app this would POST to a backend / Formspree / EmailJS
    // For now we open a mailto: with the form data
    const subject = `FinPath — ${TOPICS.find((t) => t.value === topic)?.label ?? 'Message'}`
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`
    window.open(`mailto:mihirpatdms@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    setSubmitted(true)
  }

  return (
    <>
      <Helmet>
        <title>Contact — FinPath</title>
        <meta name="description" content="Get in touch with the FinPath team. Report bugs, request features, or send feedback." />
      </Helmet>

      {/* Hero */}
      <section className="py-20 md:py-24">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-xs font-medium">Get in touch</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl md:text-5xl font-bold tracking-tight text-trust dark:text-foreground mb-4"
          >
            We'd love to hear from you
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-muted-foreground text-lg leading-relaxed"
          >
            FinPath is a personal project. Every bug report, feature idea, and piece of feedback
            genuinely helps make it better.
          </motion.p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-4 mb-14">
            {CONTACT_LINKS.map(({ icon: Icon, title, description, label, href, color }, i) => (
              <motion.a
                key={title}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.1}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{description}</p>
                  <span className="text-xs font-medium text-trust underline underline-offset-2">{label}</span>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Contact form */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-growth/10 mx-auto mb-4">
                    <CheckCircle2 className="h-7 w-7 text-growth" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Message sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your email client should have opened. If not, email us directly at{' '}
                    <a href="mailto:mihirpatdms@gmail.com" className="underline text-trust">
                      mihirpatdms@gmail.com
                    </a>
                  </p>
                  <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Send a message</h2>
                    <p className="text-sm text-muted-foreground">We'll get back to you as soon as possible.</p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Your name *</Label>
                      <Input id="name" placeholder="Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input id="email" type="email" placeholder="priya@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Topic</Label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTopic(value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            topic === value
                              ? 'bg-trust text-white border-trust'
                              : 'border-border text-muted-foreground hover:border-trust/50 hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us what's on your mind..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-trust hover:bg-trust/90 text-white" size="lg">
                    Send message
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Clicking "Send message" opens your email client with the form pre-filled.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-center">Common questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is FinPath free?',
                a: 'Yes, completely free. No subscription, no hidden fees, no premium tier. FinPath is a personal portfolio project.',
              },
              {
                q: 'Can I trust the investment recommendations?',
                a: 'FinPath provides educational suggestions based on your risk profile. Always verify with a SEBI-registered adviser before investing real money.',
              },
              {
                q: 'How is my data stored?',
                a: 'All data is stored in Supabase with row-level security. We use anonymous authentication — no email or phone number is ever collected.',
              },
              {
                q: 'Will you add more instruments to the catalog?',
                a: "The catalog currently covers 30 popular Indian instruments across equity, debt, gold, and alternatives. We're planning to expand it.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card p-5">
                <p className="font-semibold text-sm mb-1.5">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
