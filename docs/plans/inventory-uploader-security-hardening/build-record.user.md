# Inventory Uploader — Security Hardening Build Record

**Date**: 2026-03-13
**App**: `apps/inventory-uploader`
**Reference implementation**: `apps/xa-uploader`

---

## What was done

### Dispatch 0003 — Import upload size limit (P1)
**Commit**: `ea80413a39`

Added a 5 MB cap to the inventory import route (`src/app/api/inventory/[shop]/import/route.ts`). The route now checks the `content-length` header as a fast path, then verifies actual byte size after reading the body for all three content types (multipart/form-data, application/json, plain CSV). Returns 413 `payload_too_large` if exceeded. Body parsing extracted into `parseImportBody()` helper to keep function complexity within linting limits.

---

### Dispatch 0001 — IP allowlist enforcement (P1)
**Commit**: `0987e4446c`

Created three new files in `src/lib/auth/`:
- `requestIp.ts` — IPv4/IPv6 validation and IP extraction from `cf-connecting-ip` / `x-forwarded-for` / `x-real-ip` headers (controlled by `INVENTORY_TRUST_PROXY_IP_HEADERS`)
- `accessControl.ts` — `isInventoryIpAllowed()` with deny-all default when `INVENTORY_ALLOWED_IPS` is unset or empty; once-per-process coherence warning when allowlist configured but proxy trust disabled
- `inventoryLog.ts` — structured JSON-line logger (used across all auth modules)

Middleware rewritten to enforce IP allowlist before all routing; UI paths return 404 on deny, API paths return `{ ok: false }` 404.

Added `INVENTORY_TRUST_PROXY_IP_HEADERS` and `INVENTORY_ALLOWED_IPS` to `.env.local`.

---

### Dispatch 0004 — Security response headers (P2)
**Commit**: `3ac88687ca`

Added `BASE_SECURITY_HEADERS` block to middleware with CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (camera/mic/geo off), and `Strict-Transport-Security: max-age=31536000`. Applied to all responses including IP deny responses and auth redirects.

Note: The security headers block was initially added as part of dispatch 0001's middleware rewrite; dispatch 0004 commit adds the missing header application to the auth redirect path.

---

### Dispatch 0002 — Session revocation (P1)
**Commit**: `3c8e4dff2b`

Added `src/lib/auth/inventoryKv.ts` with `getInventoryKv()` using `getCloudflareContext` to access the `INVENTORY_KV` binding. Rewrote `src/lib/auth/session.ts` with:
- `revokeAllInventorySessions()` — writes current timestamp to KV key `inventory:revocation:min_issued_at`
- `verifySessionToken()` now async; reads KV and rejects tokens issued before the stored minimum; fails open if KV unavailable
- `isTokenRevokedByTimestamp()` exported for direct testing

Added `[[kv_namespaces]]` binding `INVENTORY_KV` to `wrangler.toml`.

---

### Dispatch 0005 — Rate limiter hardening (P2)
**Commit**: `7c8b730465`

Extracted `src/lib/auth/rateLimit.ts` — memory-bounded rate limiter with LRU eviction at 20,000 keys. Uses `globalThis.__inventoryRateLimitStore` for Worker-instance persistence. Includes `withRateHeaders()` which sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` (on rate-limited responses).

Login route (`src/app/api/inventory/login/route.ts`) refactored to use the new rate limiter. `login_failed` and `rate_limited` events now logged via `inventoryLog`.

---

### Dispatch 0006 — Structured security logging (P2)
**Covered by dispatches 0001 and 0005**

`inventoryLog()` created in dispatch 0001. All three required events were emitted in their respective dispatches:
- `ip_denied` — middleware (dispatch 0001)
- `login_failed` — login route (dispatch 0005)
- `rate_limited` — login route (dispatch 0005)

No separate commit required.

---

### Dispatch 0007 — Small security fixes (P3)
**Commit**: `3de278c61a`

Three fixes:
1. **Timing-safe version check** — `verifySessionToken` uses `timingSafeEqual(version ?? "", "v1")` (implemented as part of session.ts rewrite in dispatch 0002)
2. **Build-time secret validation** — `next.config.mjs` now validates `INVENTORY_SESSION_SECRET` and `INVENTORY_ADMIN_TOKEN` are present and at least 32 characters in production builds; generates random values in dev/CI
3. **E2E test token** — `INVENTORY_E2E_ADMIN_TOKEN` override in `adminToken()` for `NODE_ENV !== "production"` (implemented in session.ts rewrite in dispatch 0002)

---

### Dispatch 0008 — Security test coverage (P3)
**Commit**: `7da3e1210b`

Added `jest.config.cjs` and `test` script to `package.json`. Four test suites created under `src/lib/auth/__tests__/`:

- `session.test.ts` — session issue/verify/expiry, KV revocation (mock), fail-open on KV error, timing-safe version check, E2E token override in non-production/blocked in production, tampered token rejection, `revokeAllInventorySessions` KV write + error handling
- `accessControl.test.ts` — IP allowlist match/no-match, deny-all when empty/unset, IPv6 support, `cf-connecting-ip` vs `x-forwarded-for` preference, coherence warning deduplication
- `rateLimit.test.ts` — enforcement, count/remaining, key isolation, reset after window, LRU eviction at max keys
- `importSizeLimit.test.ts` — 5 MB boundary arithmetic, content-length header validation logic, UTF-8 multi-byte character counting

---

---

### Dispatch IDEA-DISPATCH-20260313170000-0001 — Neon adapter for Cloudflare Workers
**Date**: 2026-03-13

Standard Prisma uses Node.js TCP connections which are blocked inside Cloudflare's V8 isolate runtime. This dispatch wires in `@neondatabase/serverless` and `@prisma/adapter-neon` so that the inventory-uploader app can reach its Neon Postgres database when deployed as a Cloudflare Worker.

**Changes:**

- `packages/platform-core/package.json` — added `@neondatabase/serverless` and `@prisma/adapter-neon@6.14.0` (matching existing prisma version) to `dependencies`
- `packages/platform-core/prisma/schema.prisma` — added `previewFeatures = ["driverAdapters"]` to the generator block; Prisma client regenerated
- `packages/platform-core/src/db.ts` — added `isCloudflareWorkersRuntime()` detection (checks `EdgeRuntime` global, `CF_PAGES`, `WORKERS_RS_VERSION`); in that path the client is created via `PrismaNeon(neon(DATABASE_URL))` adapter instead of a direct TCP datasource; the Node.js path (reception, prime, caryina, local dev) is unchanged
- `apps/inventory-uploader/wrangler.toml` — added Neon connection string format note to the secrets comment block
- `apps/inventory-uploader/.env.example` — created with `DATABASE_URL` placeholder and `INVENTORY_BACKEND=json` default for local dev

The Node.js Prisma path used by all other apps is untouched. Neon packages are loaded via dynamic `require` so they are not bundled into Node.js builds.

---

## Files created

- `apps/inventory-uploader/src/lib/auth/requestIp.ts`
- `apps/inventory-uploader/src/lib/auth/accessControl.ts`
- `apps/inventory-uploader/src/lib/auth/inventoryLog.ts`
- `apps/inventory-uploader/src/lib/auth/inventoryKv.ts`
- `apps/inventory-uploader/src/lib/auth/rateLimit.ts`
- `apps/inventory-uploader/src/lib/auth/__tests__/session.test.ts`
- `apps/inventory-uploader/src/lib/auth/__tests__/accessControl.test.ts`
- `apps/inventory-uploader/src/lib/auth/__tests__/rateLimit.test.ts`
- `apps/inventory-uploader/src/lib/auth/__tests__/importSizeLimit.test.ts`
- `apps/inventory-uploader/jest.config.cjs`

## Files modified

- `apps/inventory-uploader/src/app/api/inventory/[shop]/import/route.ts`
- `apps/inventory-uploader/src/app/api/inventory/login/route.ts`
- `apps/inventory-uploader/src/lib/auth/session.ts`
- `apps/inventory-uploader/src/middleware.ts`
- `apps/inventory-uploader/next.config.mjs`
- `apps/inventory-uploader/wrangler.toml`
- `apps/inventory-uploader/package.json`
- `apps/inventory-uploader/.env.local`
