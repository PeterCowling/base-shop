# xa-account — Dormant Customer Account System

This is an archived copy of the customer account system that was originally built
in `apps/xa-b`. It was removed from xa-b when the stealth gate and user accounts
were stripped out prior to open deployment.

## What's here

**Routes** (`routes/`) — Next.js App Router route handlers, ready to drop into
`src/app/api/account/` of any Next.js app:

| File | Path | Description |
|---|---|---|
| `routes/login.ts` | `POST /api/account/login` | Email + password auth, sets session cookie |
| `routes/register.ts` | `POST /api/account/register` | New account creation (email, password, whatsapp/skype/wechat) |
| `routes/logout.ts` | `POST /api/account/logout` | Clears session cookie |
| `routes/session.ts` | `GET /api/account/session` | Validates session, returns auth state |
| `routes/orders/orders.ts` | `GET/POST /api/account/orders` | List and create orders (auth-gated) |
| `routes/orders/by-number.ts` | `GET /api/account/orders/[orderNumber]` | Single order lookup (auth-gated) |
| `routes/track.ts` | `POST /api/account/track` | Guest order tracking by order number + email |

**Lib** (`lib/`) — Self-contained helpers:

| File | Description |
|---|---|
| `accountStore.ts` | File-backed user store (node:fs) — **needs replacing with D1/KV for CF Workers** |
| `ordersStore.ts` | File-backed orders store (node:fs) — **needs replacing with D1/KV for CF Workers** |
| `accountAuth.ts` | JWT session cookie helpers (`issueAccountSession`, `readAccountSession`) |
| `accessTokens.ts` | Low-level JWT sign/verify using Web Crypto API |
| `rateLimit.ts` | In-memory sliding-window rate limiter (per-IP, per-route) |
| `requestBody.ts` | Size-limited JSON and form body readers |
| `httpCookies.ts` | Cookie header parsing helper |

## How to use this as a basis for caryina

1. **Storage layer (required change):** `accountStore.ts` and `ordersStore.ts` use
   `node:fs/promises` for persistence. Caryina deploys to Cloudflare Workers, which
   have no persistent filesystem. Replace the `readStoreFile`/`writeStoreFile` calls
   with Cloudflare **D1** (recommended) or **KV**. Everything above the store layer
   (auth, routes, rate limiting) works on CF Workers as-is.

2. **Auth helpers:** Copy `accountAuth.ts`, `accessTokens.ts`, `rateLimit.ts`,
   `requestBody.ts`, `httpCookies.ts` into caryina's `src/lib/` unchanged. These
   use only Web Crypto API and standard JS — fully CF Workers compatible.

3. **Routes:** Drop the route files into `apps/caryina/src/app/api/account/`,
   update their relative imports (`../../../../lib/...` → correct depth), and add
   `export const dynamic = "force-dynamic"` if needed.

4. **Session secret:** The system reads `XA_ACCESS_COOKIE_SECRET` (or `SESSION_SECRET`
   / `NEXTAUTH_SECRET` as fallbacks) for signing JWTs. Add this to caryina's wrangler
   secrets.

## Original location

Was at: `apps/xa-b/src/app/api/account/` and `apps/xa-b/src/lib/`
Removed: 2026-02-27
