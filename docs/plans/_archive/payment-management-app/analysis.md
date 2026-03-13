---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: payment-management-app
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/payment-management-app/fact-find.md
Related-Plan: docs/plans/payment-management-app/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Payment Management App Analysis

## Decision Frame

### Summary

The core architectural decision is how to handle Axerve SOAP refunds in a Cloudflare Workers environment. The `@acme/axerve` package uses `await import("soap")` — a dynamic Node.js import that is blocked in CF Workers V8 isolates. Every other aspect of the app (Stripe, Prisma/Neon, session auth, UI) has confirmed CF Workers patterns in the repo. The Axerve approach must be resolved before Phase 1 refund work is scoped.

### Goals

- Caryina processor selection (Axerve / Stripe) switchable at runtime without redeploy (Phase 3). CMP is Stripe-only and hardcodes `"billingProvider": "stripe"` in `apps/cover-me-pretty/shop.json` — runtime provider switching for CMP is out of scope for v1.
- Cross-portfolio order list with filtering, search, and refund issuance
- Migrate Caryina's `/admin/api/refunds` route to Payment Manager (then remove or proxy from Caryina)
- Checkout reconciliation view and webhook event log (reading from existing `StripeWebhookEvent` store; adding Caryina wire-up)
- Basic analytics dashboard (revenue, refund rate, failed payment rate)

### Non-goals

- Customer-facing payment UI (stays in each storefront)
- Dispute/chargeback management
- New payment provider integrations beyond Axerve and Stripe
- Payout management or bank reconciliation
- Line-item-level partial refunds (v1 is amount-only)

### Constraints & Assumptions

- Constraints:
  - CF Workers V8 isolate: TCP blocked; `import("soap")` blocked; must use Neon HTTP adapter
  - `@acme/axerve` is SOAP-only (confirmed — `packages/axerve/package.json` has `soap: ^1.7.1`, no REST client)
  - `StripeWebhookEvent` model already exists in `packages/platform-core/prisma/schema.prisma` (schema.prisma:197) and is already written by `packages/platform-core/src/stripeWebhookEventStore.ts`. Payment Manager must READ from this existing model — no new webhook model should be created. Caryina's webhook handler must be wired to call `markStripeWebhookEventProcessed/Failed` (currently missing). The spec's proposed new `StripeWebhookEvent`-named model must NOT be created; the spec's data model section is superseded on this point.
  - Caryina `checkoutIdempotency.server.ts` uses `fs` (file-locked JSON) — not accessible from a CF Worker; order history populated going forward via real-time dual-write
  - Neon project `silent-flower-70372159` is shared; new models are additive migrations only
- Assumptions:
  - Session auth from `apps/inventory-uploader` (`session.ts` + `inventoryKv.ts`) is the structural template; however, `session.ts:87` fails open when KV revocation is unavailable — the payment admin hardening decision is: KV revocation failure must fail **closed** (deny session) for payment-manager, not fail open. This deviation from the inventory-uploader pattern must be implemented explicitly
  - Caryina will remain on Node.js runtime (it uses Axerve SOAP in checkout too, not just refunds)
  - Cover-me-pretty order history lives primarily in the `RentalOrder` Prisma model
  - Global AES-256-GCM key (`PAYMENT_MANAGER_ENCRYPTION_KEY`) is acceptable for v1 credential encryption
  - Axerve REST API availability on the production account is unknown — must be confirmed at Phase 1 build time; Option A does not depend on this

## Inherited Outcome Contract

- **Why:** Refunding requires accessing a buried page inside Caryina only; switching payment processors requires redeploying the entire app; no cross-shop payment visibility exists.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A standalone payment management app (`apps/payment-manager/`) is live on Cloudflare Workers: per-shop processor selection switchable at runtime via UI, cross-portfolio order list with refund issuance, and the Caryina admin refund route migrated to a proxy then removed. **Scope clarification under Option A:** Caryina's Node.js Axerve execution path is retained as a backend service under Option A; "Caryina payment admin code removal" (Phase 5) applies to the user-facing admin UI and the Stripe direct handler only — not the Axerve Node.js route, which remains until Option B (Axerve REST) is adopted.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/payment-management-app/fact-find.md`
- Key findings used:
  - `@acme/axerve` uses `await import("soap")` at callRefund() and callPayment() — confirmed CF Workers incompatible
  - `apps/caryina/src/app/admin/api/refunds/route.ts` has `export const runtime = "nodejs"` — already using Node.js runtime for SOAP
  - `packages/stripe/src/index.ts` uses `createFetchHttpClient()` — CF Workers compatible
  - `apps/inventory-uploader` provides complete CF Workers pattern: wrangler.toml, HMAC session, KV revocation, Prisma/Neon
  - Existing `StripeWebhookEvent` model at schema.prisma:197 already written by `stripeWebhookEventStore.ts` — spec's proposed new webhook model must NOT be created; Payment Manager reads from the existing table; Caryina must be wired to write to it
  - Q2 (real-time vs on-demand order write) resolved: real-time dual-write adopted
  - Q1 (Axerve REST vs proxy) — this analysis resolves it

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| CF Workers compatibility | The app must run in a CF Workers isolate; approaches that don't are non-starters for the Payment Manager app itself | Critical |
| Axerve refund availability from day 1 | Operator refund capability cannot regress during migration | High |
| Delivery speed | Phase 1 should be buildable without awaiting third-party API access confirmations | High |
| Maintenance surface | Two separate Axerve code paths (SOAP + REST) vs one is a long-term maintenance concern | Medium |
| Rollback safety | Phase 2 proxy introduces a dependency chain; failure must not silently kill refund capability | High |
| Test coverage | Existing Axerve tests (9 in Caryina, unit tests in `@acme/axerve`) should not be lost | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — SOAP proxy via Caryina | Payment Manager calls a **new non-admin route** `POST /api/internal/axerve-refund` in Caryina (outside the `/admin/:path*` cookie gate in `apps/caryina/src/proxy.ts`) authenticated by `CARYINA_INTERNAL_TOKEN` header. Caryina executes the SOAP call via the existing `@acme/axerve` Node.js path. Phase 2: Caryina's legacy `/admin/api/refunds` route becomes a thin proxy to Payment Manager for all refund types — Payment Manager then routes internally (Stripe: native CF Workers; Axerve: forward to Caryina's internal endpoint). | No new REST client to build; works on confirmed-available infrastructure; no third-party API access unknowns | Caryina must stay running as a dependency for Axerve refunds; Payment Manager ↔ Caryina coupling; adds one network hop for Axerve refunds; Axerve route cannot be removed in Phase 5 | If Caryina is down, Axerve refunds from Payment Manager fail; `CARYINA_INTERNAL_TOKEN` must be set in both apps | Yes |
| B — Replace SOAP with Axerve REST in `@acme/axerve` | Build a new fetch-based Axerve GestPay HTTP/REST client in `packages/axerve`; remove SOAP dependency; Payment Manager calls REST directly | Clean CF Workers native path; removes `soap` dependency from monorepo; single Axerve code path long-term; Caryina checkout could also migrate eventually | Axerve REST API availability on production account is unknown (must verify with Axerve account team); significant new build work; existing SOAP tests must be replaced; higher risk | Axerve may require account tier upgrade or separate API key for REST access; timeline blocked on vendor confirmation | Yes, conditional on REST API access confirmed |
| C — Stripe-only v1 | Build Payment Manager for Stripe only; Caryina retains its own Axerve Node.js refund route; Axerve refunds still via Caryina admin | Fastest path to value for Stripe orders (the higher-volume provider); unblocked build; no Axerve complexity | Axerve refunds remain buried in Caryina admin — the problem is only half-solved; operator still needs two tools; spec goal not achieved | Axerve work deferred indefinitely if Option C is accepted as permanent | Partial — acceptable as interim, not as final |

## Engineering Coverage Comparison

| Coverage Area | Option A (SOAP proxy via Caryina) | Option B (Axerve REST native) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | Identical — refund UI in Payment Manager, same design system; proxy is invisible to UI | Identical | Full UI build needed: order list, order detail, refund modal, provider config form. Design system (`@acme/design-system`) available; Tailwind v4 in new app |
| UX / states | Identical — same user-facing flows | Identical | Must handle: refund in-flight, refund success/failure, provider switch confirmation, masked credential entry, empty order list, loading states |
| Security / privacy | Shared secret between Payment Manager and Caryina for proxy auth needed; Caryina Node.js route still holds Axerve credentials | Caryina Axerve credentials move to Payment Manager encrypted DB | Payment Manager holds AES-256-GCM encrypted credentials; rotation procedure: `wrangler secret put PAYMENT_MANAGER_ENCRYPTION_KEY` + re-encrypt endpoint; Caryina RETAINS its Axerve credentials (env vars) for the proxy path under Option A |
| Logging / observability / audit | Axerve refund logs split: Payment Manager logs the outbound call; Caryina logs the SOAP execution | Single unified log in Payment Manager | Audit log model (`PaymentConfigAudit`) in Prisma; refund audit trail per order; structured logs for all provider API calls; Caryina proxy call must be logged on both sides |
| Testing / validation | Existing 9 Caryina refund tests remain valid; new proxy integration test needed; Payment Manager unit tests for proxy wrapper | Caryina SOAP tests must be replaced with REST mocks; new `@acme/axerve` REST tests needed | Proxy path test (TC: Caryina returns 200 → Payment Manager returns 200) must be written; credential encryption unit tests needed; proxy failure test (Caryina down → Payment Manager returns 503) needed |
| Data / contracts | `ShopPaymentConfig`, `ShopProviderCredential`, `PaymentConfigAudit`, `Order`, `Refund` — 5 new additive models; existing `StripeWebhookEvent` model (schema.prisma:197) is RETAINED and REUSED for webhook log — spec's proposed new model must NOT be created. Existing model fields: `id, shop, type, status, lastError, createdAt, updatedAt` — no `payloadJson` field. Webhook log in Payment Manager UI is scoped to: event type, shop, status, lastError, timestamp — no raw payload display in v1 (payload view deferred to v2 or requires adding `payloadJson` field via additive migration). | Same data models | 5 new models only; Caryina must be wired to call `markStripeWebhookEventProcessed/Failed`; `ShopPaymentConfig.webhookEvents` relation in spec is removed — no such relation needed since webhook table is stand-alone; if raw payload view is required in v1, add `payloadJson String?` to existing `StripeWebhookEvent` model via additive migration |
| Performance / reliability | One extra network hop (Payment Manager → Caryina) for Axerve refunds; acceptable for low-frequency admin operation; circuit-breaker pattern needed for Phase 2 | Direct call from Payment Manager; lower latency | Axerve refunds via proxy: if Caryina is unavailable, Payment Manager must return 503 with clear error (not silent failure); Stripe path is CF Workers native with no extra hop |
| Rollout / rollback | Phase 1: Payment Manager standalone, Caryina unchanged — no rollback risk; Phase 2: Caryina's `/admin/api/refunds` becomes a unified proxy to Payment Manager for ALL refund types; rollback = revert route to direct implementation | Phase 1 is larger: must replace SOAP with REST before building refund API | Phase 1 is safe (additive only); Phase 2 rollback: revert `apps/caryina/src/app/admin/api/refunds/route.ts` to direct Axerve/Stripe dispatch (pre-proxy state); Phase 3 rollback: revert `provider.server.ts` to env-var read; Phase 3 config reads use `PAYMENT_MANAGER_API_URL` env var + `CARYINA_PM_TOKEN` header (bypasses session gate) |

## Chosen Approach

- **Recommendation:** Option A — SOAP proxy via Caryina, with Option B as a planned follow-on upgrade
- **Why this wins:**
  - Option A is immediately buildable with no third-party unknowns. Caryina already has `runtime = "nodejs"` for SOAP; no new infrastructure needed.
  - Axerve refunds are a low-frequency admin operation — the extra network hop (Payment Manager → Caryina) is acceptable.
  - The 9 existing Caryina refund tests (`TC-04-01` to `TC-04-09`) cover the current direct handler and remain valid through Phase 1. Phase 2 converts `/admin/api/refunds` to a proxy and introduces a new internal Axerve route at a non-admin path — the existing tests will need to be split: proxy-shape tests for the new public route, and SOAP-execution tests for the new internal Axerve handler.
  - Option B is strictly better long-term (single code path, no Caryina dependency for refunds) but is conditional on Axerve REST API access being available on the production account. This confirmation should be sought during Phase 1 build time; if confirmed, Option B can replace Option A in Phase 4 without disrupting the main build sequence.
  - Option C is explicitly rejected as the final state — it leaves the stated goal (cross-portfolio refund surface) only half-achieved.
- **What it depends on:**
  - Caryina must remain deployed alongside Payment Manager (already true — Caryina is the production storefront)
  - A shared service-to-service token (`CARYINA_INTERNAL_TOKEN`) must be added to both apps to authenticate Payment Manager → Caryina proxy calls
  - Phase 3 (checkout provider resolution from DB) is independent of the Axerve approach and can proceed on Stripe first

### Rejected Approaches

- **Option B (Axerve REST native)** — viable long-term but blocked on Axerve REST API access confirmation; deferred to Phase 4 as an optional upgrade once REST credentials are confirmed
- **Option C (Stripe-only v1)** — rejected as final state; acceptable as a short-term scope choice if Axerve complexity threatens Phase 1 delivery, but the operator's stated goal requires both providers

### Open Questions (Operator Input Required)

No operator-only questions remain. The Axerve approach decision (Option A) is resolved. All other open questions from the spec were either resolved in the fact-find or are defaulted by spec.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Refund issuance (Axerve) | Operator navigates to Caryina `/admin` → POST `/admin/api/refunds` → SOAP call via Node.js route | Operator needs to issue Axerve refund | (1) Operator opens Payment Manager → order list → order detail → "Issue Refund" modal; (2) Payment Manager POST `/api/refunds` → resolves provider for order = axerve; (3) Payment Manager POST `https://caryina-host/api/internal/axerve-refund` with `CARYINA_INTERNAL_TOKEN` header (this is a **new non-admin route** that must be added to Caryina — outside the `/admin/:path*` matcher in `apps/caryina/src/proxy.ts`); (4) Caryina Node.js route executes SOAP call → returns result; (5) Payment Manager records refund in `Refund` table → responds to UI | Caryina's SOAP execution path (`@acme/axerve`) and Node.js runtime requirement are unchanged | `CARYINA_INTERNAL_TOKEN` must be set in both apps; the new `/api/internal/*` route must be protected by header token check only (not cookie); Caryina outage = Axerve refund capability lost from Payment Manager |
| Refund issuance (Stripe) | Same Caryina admin page → Stripe REST call | Operator needs to issue Stripe refund | (1) Operator opens Payment Manager → "Issue Refund" → (2) Payment Manager POST `/api/refunds` → provider = stripe → calls Stripe REST directly in CF Workers → records refund → responds to UI; (3) Caryina admin refund route becomes a thin proxy to Payment Manager for legacy URL compatibility (Phase 2) | Stripe credentials management stays in Payment Manager DB (encrypted); Stripe SDK usage unchanged | Phase 2 proxy in Caryina must be tested before old direct route is removed |
| Provider selection (Caryina) | `PAYMENTS_PROVIDER` env var in Caryina process; change requires Caryina redeploy. CMP hardcodes `"billingProvider": "stripe"` in `shop.json` — CMP has no runtime provider switching. | Operator needs to switch Caryina from Axerve to Stripe (or vice versa) | (1) Operator opens Payment Manager → Shop config → selects Caryina provider from dropdown → saves; (2) Payment Manager writes `activeProvider` to `ShopPaymentConfig` in Neon DB; (3) Caryina's `resolveCaryinaPaymentProvider()` calls Payment Manager `/api/internal/shop-config` with `PAYMENT_MANAGER_INTERNAL_TOKEN` header (service-to-service, not session-authenticated) → reads `activeProvider` at runtime (Phase 3); (4) Response cached in Caryina's KV for 60s (env-var fallback if endpoint unreachable); (5) New checkouts use new provider; in-flight orders complete on prior provider | Old `PAYMENTS_PROVIDER` env var becomes fallback during bootstrap; CMP Stripe-only configuration unchanged and out of scope; checkout idempotency store format unchanged | Phase 3 adds a network call in Caryina's checkout hot path; `/api/internal/shop-config` must be explicitly exempted from Payment Manager's session middleware; cold-cache scenario must be tested |
| Cross-shop order visibility | No unified view; each shop's orders are in separate data stores (JSON file, Prisma `RentalOrder`, etc.) | Operator needs to see all orders | (1) Payment Manager real-time dual-write: each shop's checkout event writes order to Payment Manager's `Order` table in Neon; (2) Operator opens Payment Manager → order list with shop filter → full cross-portfolio view with search, filter, pagination | Each storefront continues to maintain its own local order state (Caryina idempotency JSON, CMP `RentalOrder`) | Real-time dual-write requires code changes in Caryina checkout path (Phase 1) and CMP checkout path (Phase 4); write failures must not block checkout |
| Checkout reconciliation | `checkoutReconciliation.server.ts` runs in Caryina only; not visible to operator outside logs | Operator needs to see stale in-progress attempts | Payment Manager reconciliation view reads stale attempts from Payment Manager's `Order` table (status = in-progress AND age > 15 min); operator can trigger manual reconciliation or release hold | Caryina's own reconciliation continues running as a safety net during migration | Reconciliation view is only as accurate as real-time dual-write; stale attempts from before dual-write is deployed will not appear |
| Webhook event log | Stripe webhook events are already persisted in the `StripeWebhookEvent` Prisma model (written by `packages/platform-core/src/stripeWebhookEventStore.ts`; used by CMP webhook handler); Caryina's webhook handler does NOT yet call the store. The existing model has fields: `id, shop, type, status, lastError, createdAt, updatedAt` — no payload storage. | Operator needs to audit webhook delivery | Payment Manager reads from the existing `StripeWebhookEvent` table (shared Neon DB). Caryina wired to call `markStripeWebhookEventProcessed/Failed` in Phase 1. UI shows: event type, shop, status, lastError, timestamp. **No raw payload view in v1** (model lacks `payloadJson`; scope narrowed from spec). If payload view is needed in v1, add `payloadJson String?` to `StripeWebhookEvent` model via additive migration. No new `PaymentWebhookEvent` model needed or permitted. | Stripe webhook verification stays in each app's webhook route; CMP already writes events; only the read view + Caryina wire-up is new | Caryina must call `markStripeWebhookEventProcessed/Failed` before the Payment Manager webhook log shows Caryina events; spec's raw payload view is out of scope for v1 unless `payloadJson` migration is added |

## Planning Handoff

- Planning focus:
  - Phase 1: Scaffold `apps/payment-manager/` (wrangler.toml, KV, Prisma, session auth); Prisma migrations for 5 new models only (no new webhook model — read from existing `StripeWebhookEvent`); order list + order detail UI; refund API (Stripe native + Axerve proxy via Caryina's new `/api/internal/axerve-refund` route); shop config UI; credential encryption (AES-256-GCM); real-time dual-write hook in Caryina checkout; Caryina wired to call `markStripeWebhookEventProcessed/Failed`
  - Phase 2: Caryina's legacy `/admin/api/refunds` route → thin proxy to Payment Manager's `/api/refunds` for ALL provider types (Stripe and Axerve); Payment Manager internally routes Axerve calls to Caryina's `/api/internal/axerve-refund`; this single unified proxy removes undefined provider behavior from the legacy endpoint
  - Phase 3: Caryina `resolveCaryinaPaymentProvider()` reads from Payment Manager's `/api/internal/shop-config` (a new non-session route — service-to-service auth via `PAYMENT_MANAGER_INTERNAL_TOKEN` header; explicitly exempted from the session/IP gate in Payment Manager's middleware) with KV cache fallback (60s TTL; env-var fallback if endpoint unreachable)
  - Phase 4: CMP onboarding + JSONL migration; optional Axerve REST upgrade if REST access confirmed
  - Phase 5: Remove Caryina payment admin code (user-facing admin UI and Stripe direct handler only; Axerve Node.js route at `/api/internal/axerve-refund` is RETAINED under Option A)
- Validation implications:
  - Proxy path (Phase 2) must be integration-tested: Payment Manager → Caryina → SOAP → success/failure flows
  - Credential encryption must have unit tests for encrypt/decrypt round-trip and key rotation
  - Real-time dual-write must have a circuit-breaker: checkout must succeed even if Payment Manager write fails (fire-and-forget or retry queue)
  - Provider resolution cache (Phase 3) must be tested: cache miss, cache hit, env-var fallback
- Sequencing constraints:
  - No new `PaymentWebhookEvent` model should be created; webhook log uses the existing `StripeWebhookEvent` model via `packages/platform-core/src/stripeWebhookEventStore.ts`; Caryina must wire up `markStripeWebhookEventProcessed/Failed` calls
  - Session auth fail-open behavior must be changed to fail-closed for payment-manager (deviation from inventory-uploader template)
  - Session auth and IP allowlist must be built before any other API routes (security prerequisite)
  - Caryina internal Axerve endpoint must be a **new non-admin route** at `POST /api/internal/axerve-refund` — explicitly NOT under `/admin/:path*` (which requires admin cookie per `apps/caryina/src/proxy.ts`); protected by `CARYINA_INTERNAL_TOKEN` header check only
  - Phase 2 must not go live until the proxy integration test (all refund types through the unified proxy) passes end-to-end
  - Phase 3: Payment Manager must expose `/api/internal/shop-config` as a service-to-service endpoint exempt from session/IP gate, authenticated by `PAYMENT_MANAGER_INTERNAL_TOKEN` header; this token must be set in both Payment Manager (as a Worker secret) and Caryina (as an env var/secret) before Phase 3 ships
  - Phase 3 provider resolution must cache in Caryina's KV with 60s TTL and env-var fallback to avoid adding checkout latency
- Risks to carry into planning:
  - Caryina outage breaks Axerve refunds from Payment Manager — mitigated by fallback error messaging; not solvable without Option B
  - Real-time dual-write checkout write failures must not block checkout — fire-and-forget with async retry or out-of-band sync
  - Phase 3 checkout hot path latency: payment manager config lookup must be fast (< 50ms p99 from KV cache) — warm cache required before Phase 3 goes live
  - CMP `orders.jsonl` fallback data may have incomplete records — migration script must handle gracefully

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Axerve REST access unavailable on production account | Medium | Medium — Option B stays blocked; Option A remains in place long-term | Requires Axerve account team confirmation; cannot be verified without operator action | Phase 4 task: operator confirms REST access; if confirmed, Option B migration scoped; if not, Option A is permanent |
| Real-time dual-write checkout latency regression | Medium | High — checkout is revenue-critical path; Caryina checkout must not be slowed | Write must be fire-and-forget to not block; async retry needed; design deferred to plan | Plan must design dual-write as non-blocking; include latency regression test in validation contract |
| Phase 3 provider resolution cold-cache latency | Medium | Medium — slow checkout if KV cache misses on every request | Cache design deferred to plan-level task | KV cache with 60s TTL + env-var fallback must be implemented before Phase 3 goes live |
| Spec's `StripeWebhookEvent` model created as a duplicate | Low | Medium — compilation errors; two separate webhook stores diverging | Naming fix now fully documented in analysis; requires discipline at plan/build phase | Plan must NOT include a task to add `PaymentWebhookEvent` model; webhook log task reads from existing `StripeWebhookEvent` model only |
| CMP orders in JSONL fallback missing from unified order list | Low | Low — historical data gap, not a live system gap | Migration script graceful handling is sufficient | Migration script must try Prisma first, JSONL as fallback, ENOENT = warn not fail |

## Planning Readiness

- Status: Go
- Rationale: Evidence gate passes (fact-find `Ready-for-analysis`, outcome contract inherited, engineering coverage complete). Option gate passes (3 options with explicit rationale; Option A chosen decisively). Planning handoff gate passes (chosen approach stated, rejected approaches documented, sequencing constraints explicit, end-state operating model present per area). No operator-only questions remain. Axerve approach resolved as Option A (proxy via Caryina).
