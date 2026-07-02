---
name: project-cascadia-demo
description: FlightMind demo app for CascadiaJS "Trust, But Verify" talk on Human-in-the-Loop patterns
metadata:
  type: project
---

FlightMind is an AI flight booking assistant demonstrating 4 HIL patterns in escalating order.

**Why:** Conference demo for CascadiaJS 2026 (and AI World Fair SF) talk titled "Trust, But Verify: Human-in-the-Loop for Agents That Actually Matter."

**How to apply:** All implementation decisions should serve the demo narrative. Clarity > abstraction. One cohesive app, escalating stakes.

## Routes
- `/` — public homepage (FlightMind landing page)
- `/dashboard` — protected, chat interface + seat picker
- `/settings` — protected, Google Calendar Token Vault connection
- `/api/chat` — AI SDK v6 streaming endpoint with 8 tools

## Status (as of 2026-06-02)
- Homepage, dashboard, settings, API route all built and building successfully
- Auth0 tenant NOT yet configured (user hasn't set up env vars)
- Next steps: user needs to set up Auth0 tenant and fill .env.local
