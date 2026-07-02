import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Zap,
} from 'lucide-react'

const HIL_PATTERNS = [
  {
    step: '01',
    icon: Zap,
    title: 'Inline Interrupt',
    description:
      'The agent pauses and asks before acting — filling gaps like seat preferences before the booking goes through.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/25',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Permission Expansion',
    description:
      "The agent hits an OAuth boundary — your Google Calendar isn't connected. It surfaces this gracefully so you can expand what it's allowed to do.",
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/25',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Payment Gate',
    description:
      'The agent hunts promos, does the math, then stops. You approve the Stripe Link payment. Money only moves when you say so.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/25',
  },
  {
    step: '04',
    icon: Smartphone,
    title: 'External Re-auth',
    description:
      "The airline upgrades your seat. Because you didn't ask — it did — Auth0 CIBA fires an email and a Guardian push to your phone. You tap approve.",
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/25',
  },
]

const TICKER_ITEMS = [
  'SFO → ORD   08:30   ON TIME',
  'ORD → JFK   08:40   BOARDING',
  'AGENT   AWAITING APPROVAL',
  'LHR → SIN   21:05   DELAYED',
  'CIBA PUSH   SENT TO GUARDIAN',
  'TOKEN VAULT   CREDENTIALS SEALED',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-sm tracking-tight">
              FlightMind
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground font-mono">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              how-it-works
            </a>
            <a href="#patterns" className="hover:text-foreground transition-colors">
              hil-patterns
            </a>
          </nav>
          <Link href="/auth/login?returnTo=/dashboard">
            <Button size="sm" className="gap-1.5">
              Sign in
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* decorative backdrop layer — grid + glow live here, never the text */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[32rem] w-[64rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-[120px]"
        />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1 text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            <ShieldCheck className="w-3 h-3 text-primary" />
            AI Engineer World&apos;s Fair 2026 &middot; Trust, But Verify
          </Badge>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight text-foreground leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:100ms] [animation-fill-mode:both]">
            An AI that books flights.
            <br />
            <span className="italic text-primary">And knows when to stop.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms] [animation-fill-mode:both]">
            FlightMind is a live demo of Human-in-the-Loop patterns for AI agents.
            Watch a single booking flow escalate through four levels of consequence —
            each one requiring a different kind of human approval.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:300ms] [animation-fill-mode:both]">
            <Link href="/auth/login?returnTo=/dashboard">
              <Button size="lg" className="gap-2 h-11 px-6">
                Try the demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="ghost" size="lg" className="h-11 px-6 text-muted-foreground">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Departure-board ticker */}
      <div className="relative border-y border-border/60 bg-secondary/50 py-2.5 overflow-hidden">
        <div className="flex w-max animate-ticker">
          {[0, 1].map((dupe) => (
            <div key={dupe} className="flex items-center shrink-0" aria-hidden={dupe === 1}>
              {TICKER_ITEMS.map((item, i) => (
                <span
                  key={`${dupe}-${i}`}
                  className="font-mono text-xs text-primary/80 tracking-wider px-6 flex items-center gap-6"
                >
                  {item}
                  <span className="text-border">&bull;</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Axis diagram */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 border-b border-border/60 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-12 font-mono">
            The Mental Model
          </p>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono">Low stakes</span>
              <span className="text-xs text-muted-foreground font-mono">High stakes</span>
            </div>
            <div className="h-2 rounded-full mb-3 bg-gradient-to-r from-blue-400 via-violet-400 via-40% via-emerald-400 via-70% to-amber-400" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">Fast response needed</span>
              <span className="text-xs text-muted-foreground font-mono">External trigger</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
              {HIL_PATTERNS.map((p) => (
                <div key={p.step} className="text-center space-y-2">
                  <div
                    className={`w-8 h-8 rounded-full ${p.bg} border ${p.border} flex items-center justify-center mx-auto`}
                  >
                    <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{p.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Patterns grid */}
      <section id="patterns" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4 font-mono">
            Four Patterns
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-medium text-center tracking-tight mb-16">
            One app. Escalating stakes.
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {HIL_PATTERNS.map((p) => (
              <div
                key={p.step}
                className={`group relative rounded-2xl border ${p.border} ${p.bg} p-6 space-y-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl ${p.bg} border ${p.border} flex items-center justify-center`}
                  >
                    <p.icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <span className={`font-mono text-xs font-bold ${p.color} opacity-70`}>
                    {p.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-medium text-foreground mb-1.5">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link href="/auth/login?returnTo=/dashboard">
              <Button size="lg" className="gap-2 h-11 px-8">
                See it live
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stack strip */}
      <section className="py-12 px-4 border-t border-border/60 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-widest mb-8 font-mono">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              'Next.js 16',
              'Vercel AI SDK',
              'Auth0',
              'Token Vault',
              'CIBA + Guardian',
              'Stripe Link',
              'Neon',
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground bg-background font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/60">
        <p className="text-center text-xs text-muted-foreground font-mono">
          Conference demo for{' '}
          <span className="text-foreground">
            Trust, But Verify: Human-in-the-Loop for Agents That Actually Matter
          </span>
        </p>
      </footer>
    </div>
  )
}
