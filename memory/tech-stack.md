---
name: tech-stack
description: Breaking API changes in the versions used in this project — Next.js 16, AI SDK v6, Auth0 nextjs-auth0 v4
metadata:
  type: reference
---

## Next.js 16
- `middleware.ts` is deprecated → use `proxy.ts` with `export function proxy()`
- Same matcher config format, same NextRequest/NextResponse APIs

## AI SDK v6 (ai@6.x)
- `parameters` renamed to `inputSchema` in tool definitions
- `toDataStreamResponse()` removed → use `result.toUIMessageStreamResponse()`
- `convertToModelMessages()` is now async (returns `Promise<ModelMessage[]>`) — must `await`
- `useChat` from `@ai-sdk/react` no longer returns `input`, `handleInputChange`, `handleSubmit`, `isLoading`
  - New API: `{ messages, sendMessage, status, error, setMessages }`
  - `status` is `'idle' | 'streaming' | 'submitted' | 'error'`
  - `api` option removed — pass `transport: new DefaultChatTransport({ api: '/api/chat' })` instead
  - `DefaultChatTransport` is imported from `ai`
- Messages are `UIMessage[]` with `parts` array (no more `content` string + `toolInvocations`)
  - Tool parts have `type: 'tool-${toolName}'` (NOT `'tool-invocation'`)
  - Use `isToolOrDynamicToolUIPart(part)` type guard from `ai`
  - Tool properties are directly on the part object (not nested under `.toolInvocation`)

## Auth0 nextjs-auth0 v4
- `AUTH0_BASE_URL` → `APP_BASE_URL`
- `AUTH0_ISSUER_BASE_URL` → `AUTH0_DOMAIN` (no https://)
- Routes: `/auth/login`, `/auth/logout`, `/auth/callback` (no `/api/` prefix)
- `getSession()` and `getAccessTokenForConnection()` are on the `auth0` client instance
- No more `withPageAuthRequired` — use `auth0.getSession()` + redirect in layout
- `<Auth0Provider>` is optional but useful for SSR user hydration
- Token Vault: `auth0.getAccessTokenForConnection({ connection: 'google-oauth2' })`

## shadcn/ui (base-nova style)
- Uses Base UI (`@base-ui/react`) instead of Radix UI
- Component APIs are identical from the consumer side
