# Trust, But Verify: Human-in-the-Loop for Agents That Actually Matter

Demo app for the CascadiaJS (and AI World Fair SF) conference talk on Human-in-the-Loop (HIL) patterns for AI agents.

**The premise:** An AI-powered flight booking assistant that escalates in stakes with every step — each step triggering a different HIL pattern. The audience never context-switches between demos; they watch the same app with the stakes going up.

---

## The Four HIL Patterns (in order)

| # | Pattern | Trigger | Stakes |
|---|---------|---------|--------|
| 1 | AI SDK Interrupt | Agent needs missing info (seat preference) before proceeding | Low — conversational gap-fill |
| 2 | Auth0 Token Vault | Agent hits an OAuth boundary (Google Calendar not connected) | Medium — permission expansion |
| 3 | Stripe Link | Agent finds a promo, applies it, then requests payment approval | High — real money moving |
| 4 | Auth0 CIBA + Guardian Push | External trigger (airline seat upgrade) requires human re-auth | Peak — agent acts on your behalf without your instigation |

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Agent:** Vercel AI SDK
- **Auth:** Auth0 — authentication, Token Vault, CIBA, Guardian push notifications
- **Payments:** Stripe Link
- **Database:** Neon (Postgres via Prisma) — SQLite locally
- **Flight data:** Mock JSON (no real flights API)
- **Hosting:** Vercel

### Intentionally excluded
- Resend — Auth0 handles all emails natively via CIBA
- Vercel Queues — no long-running background tasks in this demo
- Vercel Blob — no file uploads needed
- Vercel AI Gateway — adds nothing to the demo narrative

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and fill in your Auth0, Stripe, and Neon credentials.

---

## Key Design Principles

- **Match the interruption to the consequence.** Don't use a push notification where a confirm button will do. Don't use a confirm button where real money is moving.
- **The agent surfaces the need, it doesn't just hit a wall.** The best HIL moments are when the agent detects something contextual and defers gracefully.
- **One cohesive app, escalating stakes.** All four patterns live in the same flight booking flow.
