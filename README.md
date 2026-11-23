# Trust, But Verify: Human-in-the-Loop for Agents That Actually Matter

Demo app for the CascadiaJS (and AI World Fair SF) conference talk on Human-in-the-Loop (HIL) patterns for AI agents.

**The premise:** An AI-powered flight booking assistant that escalates in stakes with every step — each step triggering a different HIL pattern. The audience never context-switches between demos; they watch the same app with the stakes going up.

---

## The Four HIL Patterns (in order)

| # | Pattern | Trigger | Stakes |
|---|---------|---------|--------|
| 1 | AI SDK Interrupt | Agent needs missing info (seat preference) before proceeding | Low — conversational gap-fill |
| 2 | Auth0 Token Vault | The user connects Google Calendar and approves adding the flight | Medium — real consent and calendar write |
| 3 | Simulated Stripe Link | Agent finds a promo, then requests in-app approval | No Stripe request or charge |
| 4 | Simulated Auth0 CIBA + Guardian | Agent surfaces the sample seat upgrade and requests in-app approval | No email or push notification |

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Agent:** Vercel AI SDK with the direct Anthropic provider locally
- **Auth:** Auth0 Universal Login and Token Vault for Google Calendar
- **Chat history:** This browser tab only, scoped to the signed-in account; no database
- **Flight data:** Mock JSON (no real flights API)
- **Hosting:** Vercel

### Intentionally excluded
- Resend — Auth0 handles all emails natively via CIBA
- Vercel Queues — no long-running background tasks in this demo
- Vercel Blob — no file uploads needed

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local`. Register your origin and `/auth/callback` URL on a dedicated Auth0 Regular Web Application, and use `openssl rand -hex 32` for `AUTH0_SECRET`. Set `ANTHROPIC_API_KEY` for local chat. The hosted Vercel demo can instead use the team's existing AI Gateway via OIDC, with a project budget, when no direct provider key is configured.

For Calendar, enable the Refresh Token and Token Vault grants and grant the app user access to the My Account API with only `create:me:connected_accounts`. Give its refresh token policy the same audience and scope. Configure a separate Google connected-account connection with offline access and the `calendar.events` scope, and set `AUTH0_GOOGLE_CONNECTION` to its name. Enable only the login and Calendar connections for this app. Google may limit consent to test users unless its OAuth app is published and verified.

Sign in or sign up with email and password. Google is intentionally not a sign-in option: connect it from Settings after signing in so Calendar consent is a separate Token Vault step.

---

## Key Design Principles

- **Match the interruption to the consequence.** Don't use a push notification where a confirm button will do. Don't use a confirm button where real money is moving.
- **The agent surfaces the need, it doesn't just hit a wall.** The best HIL moments are when the agent detects something contextual and defers gracefully.
- **One cohesive app, escalating stakes.** All four patterns live in the same flight booking flow.
