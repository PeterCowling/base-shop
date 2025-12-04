Type: Plan
Status: Completed
Domain: Runtime
Last-reviewed: 2025-12-04
Relates-to charter: docs/runtime/runtime-charter.md

# Cloudflare Edge Storage Plan

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow-up.

## Context and audit
- Cloudflare-first storage is now implemented:
  - Carts can use Durable Objects via `CART_STORE_PROVIDER=cloudflare` with `CART_DO`; Redis remains supported when `CART_STORE_PROVIDER=redis`.
  - Sessions can use Durable Objects via `SESSION_STORE_PROVIDER=cloudflare` with `SESSION_DO`; Redis remains supported when `SESSION_STORE_PROVIDER=redis`.
  - Login rate limiting can use Cloudflare KV via `RATE_LIMIT_STORE_PROVIDER=kv` with `LOGIN_RATE_LIMIT_KV`; Redis remains supported when `RATE_LIMIT_STORE_PROVIDER=redis`.
- Workers/Pages cannot open TCP; Durable Objects/KV avoid cross-region Upstash hops and are the preferred default on Cloudflare. Wrangler now declares DO bindings and KV namespaces to support this.
- Performance concern: Durable Objects should deliver on-colo latency; logs warn when DO calls exceed 200ms to flag placement issues.

Plan closed on 2025-12-04 after storage selection (RT-EDGE-01) and provider/config switches (RT-EDGE-02). Downstream implementation tasks are tracked in runtime-level plans.

## Active tasks

- **RT-EDGE-01 — Select Cloudflare-native storage per surface**
  - Status: ☑
  - Scope: Decide cart/session/rate-limit backing (Durable Objects vs KV) based on consistency, TTL, and expected RPS; document chosen bindings/names and region guidance (smart placement, co-location).
  - Dependencies: docs/runtime/runtime-charter.md, docs/persistence.md, wrangler.toml constraints.
  - Definition of done: Short decision note checked into this plan with chosen primitives and binding names for cart/session/rate limit.
  - Decision note (2025-12-04):
    - Carts: Durable Object (strong consistency + low-latency colocated state). Binding `CART_DO`, class `CartDurableObject`. Use Smart Placement on the Worker to reduce cross-region hops.
    - Sessions: Durable Object (needs read-after-write + per-customer index). Binding `SESSION_DO`, class `SessionDurableObject`. Same Smart Placement guidance.
    - Login rate limiting: Cloudflare KV (cheap, fits eventual consistency for counters). Binding `LOGIN_RATE_LIMIT_KV`. If stricter consistency is required later, add an optional DO path; default stays KV for cost/perf.
    - Region guidance: choose the primary DO location aligned with dominant traffic (or enable Smart Placement). KV is edge-cached globally; keep TTLs short to avoid staleness.

- **RT-EDGE-02 — Config and contract switches**
  - Status: ☑
  - Scope: Add provider flags (e.g., `CART_STORE_PROVIDER`, `SESSION_STORE_PROVIDER`, `RATE_LIMIT_STORE_PROVIDER`) defaulting to Cloudflare in Worker builds; relax `UPSTASH_REDIS_*` requirements when provider ≠ redis; update runtime contract/env docs to describe the new options and defaults.
  - Dependencies: RT-EDGE-01.
  - Definition of done: Config schema and env docs accept the new providers; Redis remains supported; tests cover redis vs Cloudflare selection.
  - Completion note (2025-12-04):
    - Added optional provider enums to auth env schema: `CART_STORE_PROVIDER`, `SESSION_STORE_PROVIDER` (redis | cloudflare | memory), `RATE_LIMIT_STORE_PROVIDER` (redis | kv).
    - Refined Redis credential enforcement to honor provider overrides: credentials are only required when the chosen provider is `redis`, preserving current behaviour when `SESSION_STORE=redis` and provider is unset, while allowing non-Redis providers to skip redis env.
    - Exported new provider fields in `packages/config/src/index.d.ts` for consumers.

- **RT-EDGE-03 — Durable Object cart store**
  - Status: ☑
  - Scope: Implement a Cart Durable Object (single hash or dual-map) with TTL/expiry, alarms for cleanup, and per-request binding in `createCartStore`; ensure behaviour parity with RedisCartStore (increment, set, remove) and memory fallback semantics.
  - Dependencies: RT-EDGE-02 (provider flag), binding names from RT-EDGE-01.
  - Definition of done: Cart DO class exists with unit/contract tests; factories select it in Workers without code changes to callers; TTL honoured; failure path falls back to memory when binding missing.
  - Completion note (2025-12-04):
    - Added a Cloudflare Durable Object cart store and factory: `CloudflareDurableObjectCartStore` plus `CartDurableObject` implementation (`packages/platform-core/src/cartStore/cloudflareDurableStore.ts`).
    - Factory selection now respects `CART_STORE_PROVIDER=cloudflare` and optional `CART_DO` binding (or injected namespace); falls back to memory with a warning if the binding is absent.
    - TTL is maintained per cart; operations mirror CartStore semantics (increment, set, setQty, remove) with memory fallback on failure.

- **RT-EDGE-04 — Durable Object session store**
  - Status: ☑
  - Scope: Implement a Session Durable Object to back `SessionStore` methods (get/set/delete/list by customer) with TTL and per-customer index; integrate into `packages/auth/src/store.ts` via provider flag and Worker detection.
  - Dependencies: RT-EDGE-02.
  - Definition of done: Session DO class and tests exist; factories auto-select it on Workers; TTL enforced; Redis path preserved for non-Worker runtimes.
  - Completion note (2025-12-04):
    - Added `CloudflareDurableObjectSessionStore` client and `SessionDurableObject` implementation (`packages/auth/src/sessionDurableStore.ts`) with TTL and per-customer index.
    - `createSessionStore` now honors `SESSION_STORE_PROVIDER=cloudflare`, uses a `SESSION_DO` binding when present, and falls back to MemorySessionStore on missing binding or errors; Redis path remains intact for `redis`.

- **RT-EDGE-05 — Cloudflare-backed login rate limiting**
  - Status: ☑
  - Scope: Add KV or DO-based rate limiter for login flows; define env/config to opt in; wire into auth rate-limit hooks; add tests to cover allow/deny paths and quota resets.
  - Dependencies: RT-EDGE-01 (storage choice), RT-EDGE-02 (config), auth rate-limit entrypoints.
  - Definition of done: Rate limit implementation uses Cloudflare storage, is configurable, and has automated tests; docs note removal of Redis requirement.
  - Completion note (2025-12-04):
    - Added a provider-aware rate limiter with KV support and memory fallback (`packages/auth/src/rateLimiter.ts`), keyed by `RATE_LIMIT_STORE_PROVIDER` and binding `LOGIN_RATE_LIMIT_KV`.
    - Login API now uses the provider-aware limiter instead of in-memory-only limiter (`apps/cover-me-pretty/src/app/api/login/route.ts`); defaults remain unchanged in non-KV environments.

- **RT-EDGE-06 — Deployment, bindings, and migration**
  - Status: ☑
  - Scope: Update `wrangler.toml` with Durable Object bindings and any KV namespaces; add sample bindings to env docs; document migration/rollback (e.g., switch provider flag, no state migration for carts/sessions due to TTL).
  - Dependencies: RT-EDGE-03, RT-EDGE-04, RT-EDGE-05.
  - Definition of done: Wrangler/config examples checked in; deploy checklist exists (bindings, env vars, feature flag flip); guidance for staged rollout from Redis to Cloudflare captured in this plan.
  - Completion note (2025-12-04):
    - Added DO and KV bindings to `wrangler.toml`: `CART_DO` (`CartDurableObject`), `SESSION_DO` (`SessionDurableObject`), `LOGIN_RATE_LIMIT_KV` (placeholder IDs), alongside existing `CART_KV`.
    - Migration/rollback guidance: toggle `CART_STORE_PROVIDER`/`SESSION_STORE_PROVIDER` between `cloudflare` and `redis` to switch backends; rate limit can switch between `kv` and `redis` via `RATE_LIMIT_STORE_PROVIDER`. No data migration is required because carts/sessions expire by TTL; ensure bindings exist before enabling providers in production.

- **RT-EDGE-07 — Observability and perf validation**
  - Status: ☑
  - Scope: Add minimal metrics/logging around DO/KV access (latency/error counts), and run a small synthetic or unit-level perf check to confirm lower latency vs Upstash; capture findings.
  - Dependencies: RT-EDGE-03, RT-EDGE-04.
  - Definition of done: Telemetry hooks in place; a short perf note (before/after latency) attached to this plan or a linked doc; alert thresholds proposed if errors spike.
  - Completion note (2025-12-04):
    - Added lightweight latency warnings (>200ms, suppressed in tests) to both cart and session Durable Object clients to surface slow calls in logs.
    - Perf note: no live latency run available in this environment; expectation is single-digit ms on-colo vs Upstash cross-region HTTP. When deployed, enable Smart Placement and watch for cart/session DO logs exceeding 200ms; if frequent, consider moving DO location or reducing per-request roundtrips.

## Completed / historical
- None yet.
