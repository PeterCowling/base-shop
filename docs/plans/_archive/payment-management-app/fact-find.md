---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: payment-management-app
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/payment-management-app/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313190000-0001
Trigger-Why: Right now, refunding a customer can only be done through a buried page inside the Caryina shop. There is no way to see or manage payments for any other shop from one place. If you want to switch from one payment provider to another, you have to change a server setting and redeploy the entire app, which takes time and risks downtime.
Trigger-Intended-Outcome: type: operational | statement: A standalone payment management app (apps/payment-manager/) is live on Cloudflare Workers: per-shop processor selection switchable at runtime via UI, cross-portfolio order list with refund issuance, and the Caryina admin refund route migrated to a proxy then removed. | source: operator
---

# Payment Management App Fact-Find Brief

## Scope

### Summary

Build a standalone internal tool (`apps/payment-manager/`) that centralises payment lifecycle management across all shops in the portfolio. Currently, refunds can only be issued via a buried Caryina admin page, payment processor selection requires redeployment of `apps/caryina`, and no cross-portfolio order visibility exists. The new app replaces these gaps with runtime-switchable provider configuration, a unified cross-shop order list with refund issuance, checkout reconciliation visibility, and a webhook event log.

### Goals

- Per-shop processor selection (Axerve / Stripe) switchable at runtime without redeploy
- Cross-portfolio order list with filtering, search, and refund issuance
- Migrate Caryina's `/admin/api/refunds` route to the new app (then remove or proxy it)
- Checkout reconciliation view and webhook event log
- Basic analytics dashboard (revenue, refund rate, failed payment rate)

### Non-goals

- Customer-facing payment UI (stays in each storefront)
- Dispute/chargeback management
- New payment provider integrations beyond Axerve and Stripe
- Payout management or bank reconciliation

### Constraints & Assumptions

- Constraints:
  - Cloudflare Workers V8 isolate runtime; TCP-based database connections not allowed — must use Neon HTTP adapter via `@prisma/adapter-neon`
  - `@acme/axerve` uses `soap` dynamic import (`import("soap")`) — SOAP dynamic imports may not work in a CF Workers isolate; needs validation
  - Axerve refund route currently requires `export const runtime = "nodejs"` — incompatible with CF Workers unless Axerve client is replaced
  - `checkoutIdempotency.server.ts` uses `fs` — cannot run inside CF Workers; order data must be read from Prisma DB, not the JSON file
  - The new `StripeWebhookEvent` model in the spec conflicts with an existing `StripeWebhookEvent` model already in `packages/platform-core/prisma/schema.prisma`
- Assumptions:
  - Neon project `silent-flower-70372159` (`eu-west-2`) is shared — new payment tables are additive migrations on top of existing schema
  - Session auth pattern from `apps/inventory-uploader` is the correct template (HMAC cookie + KV revocation)
  - Initial order data comes from Caryina's `checkout-idempotency.json` file (once the file exists on disk) or is populated going forward from checkout events
  - Cover-me-pretty orders live in `RentalOrder` model in Prisma and via the `addOrder` / `handleStripeWebhook` path in `@acme/platform-core`

## Outcome Contract

- **Why:** Refunding requires accessing a buried page inside Caryina only; switching payment processors requires redeploying the entire app with downtime risk; no cross-shop payment visibility exists.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A standalone payment management app (`apps/payment-manager/`) is live on Cloudflare Workers: per-shop processor selection switchable at runtime via UI, cross-portfolio order list with refund issuance, and the Caryina admin refund route migrated to a proxy then removed.
- **Source:** operator

## Current Process Map

- **Trigger:** Merchant needs to issue a refund or switch payment processor
- **End condition:** Refund issued or provider switched

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Refund issuance (Caryina) | Operator navigates to `/admin` page inside `apps/caryina` → enters `shopTransactionId` or `bankTransactionId` + amount → POST `/admin/api/refunds` → handler looks up provider from JSON idempotency store → dispatches to Axerve SOAP or Stripe REST | `apps/caryina/src/app/admin/api/refunds/route.ts`, `checkoutIdempotency.server.ts` | `apps/caryina/src/app/admin/api/refunds/route.ts` | Only accessible inside Caryina admin; no other shop can use it; Axerve requires Node.js runtime (SOAP) |
| Provider selection | `PAYMENTS_PROVIDER` env var read at startup via `@acme/config/env/payments` (`paymentsEnv.PAYMENTS_PROVIDER`) → fallback to `"axerve"` | `apps/caryina/src/lib/payments/provider.server.ts` | `provider.server.ts` | Changing provider requires redeploy of entire Caryina app; no audit trail |
| Checkout session (Caryina) | Customer cart → POST `/api/checkout-session` → `checkoutSession.server.ts` calls `resolveCaryinaPaymentProvider()` → branches Axerve S2S or Stripe redirect → writes attempt record to `data/shops/caryina/checkout-idempotency.json` via file lock | `checkoutSession.server.ts`, `checkoutIdempotency.server.ts` | `apps/caryina/src/lib/checkoutSession.server.ts` | File-based store not visible to other services; lock mechanism is local FS only |
| Stripe webhook processing (Caryina) | Stripe POST `/api/stripe-webhook` → verify signature → `finalizeStripeSession` / `expireStripeSession` → updates JSON idempotency store | `apps/caryina/src/app/api/stripe-webhook/route.ts`, `stripeCheckout.server.ts` | route.ts | Webhook events not persisted anywhere queryable; no cross-shop visibility |
| Stripe webhook processing (CMP) | Stripe POST `/api/stripe-webhook` → verify → `handleStripeWebhook` (platform-core) → `assertStripeWebhookTenant` | `apps/cover-me-pretty/src/api/stripe-webhook/route.ts` | route.ts | Uses different handler (`@acme/platform-core/stripe-webhook`), not Caryina's local handler; separate credentials |
| Checkout reconciliation | `reconcileStaleCheckoutAttempts` called periodically from Caryina → lists stale in-progress attempts from JSON store → releases inventory holds → sends alert emails | `checkoutReconciliation.server.ts` | `apps/caryina/src/lib/checkoutReconciliation.server.ts` | Only runs for Caryina; not visible to operator without reading logs |
| Order data (Cover-me-pretty) | Checkout creates `RentalOrder` in Prisma via `addOrder()` from `@acme/platform-core/orders/creation`; fallback to `orders.jsonl` file | `apps/cover-me-pretty/src/api/checkout-session/route.ts` | route.ts | Some orders may be in JSONL fallback rather than Prisma; no refund surface |

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/admin/api/refunds/route.ts` — only refund surface in portfolio; requires Node.js runtime (SOAP)
- `apps/caryina/src/lib/checkoutSession.server.ts` — checkout initiation; calls `resolveCaryinaPaymentProvider()`; writes to JSON idempotency store
- `apps/caryina/src/app/api/stripe-webhook/route.ts` — Stripe webhook receiver; finalize/expire via local handlers
- `apps/cover-me-pretty/src/api/stripe-webhook/route.ts` — CMP Stripe webhook; uses `handleStripeWebhook` from platform-core
- `apps/cover-me-pretty/src/api/checkout-session/route.ts` — CMP checkout; creates `RentalOrder` in Prisma
- `apps/inventory-uploader/wrangler.toml` — Worker deployment template (KV + Prisma via Neon adapter)
- `apps/inventory-uploader/src/lib/auth/session.ts` — session auth template (HMAC cookie + KV revocation)

### Key Modules / Files

- `apps/caryina/src/lib/payments/provider.server.ts` — provider resolution from env var (`paymentsEnv.PAYMENTS_PROVIDER`)
- `apps/caryina/src/lib/payments/stripeRefund.server.ts` — Stripe refund logic; looks up `stripePaymentIntentId` from idempotency store
- `apps/caryina/src/lib/checkoutIdempotency.server.ts` — file-locked JSON store; holds checkout attempt records including `provider`, `shopTransactionId`, `stripePaymentIntentId`
- `apps/caryina/src/lib/checkoutReconciliation.server.ts` — stale attempt cleanup; releases inventory holds; sends email alerts
- `packages/axerve/src/index.ts` — `callRefund()` + `callPayment()`; uses dynamic `import("soap")` — CF Workers incompatible
- `packages/stripe/src/index.ts` — Stripe client; uses `createFetchHttpClient()` — CF Workers compatible
- `packages/platform-core/src/db.ts` — auto-detects CF Workers runtime; switches to `@prisma/adapter-neon` (HTTP-based) automatically
- `packages/platform-core/prisma/schema.prisma` — shared Neon schema; already has `StripeWebhookEvent`, `RentalOrder`, `InventoryItem`, `Product` models
- `apps/inventory-uploader/src/lib/auth/accessControl.ts` — IP allowlist pattern (deny-all when unset)
- `apps/xa-uploader/src/lib/uploaderAuth.ts` — session auth pattern; same HMAC structure as inventory-uploader

### Patterns & Conventions Observed

- CF Workers apps use `@opennextjs/cloudflare` build + `wrangler.toml` with `main = ".open-next/worker.js"` — evidence: `apps/inventory-uploader/wrangler.toml`
- Session auth: HMAC-signed cookie (`v1.<issuedAt>.<nonce>.<sig>`), 7-day TTL, KV-backed revocation — evidence: `session.ts`, `uploaderAuth.ts`
- IP allowlist via `INVENTORY_ALLOWED_IPS` / `XA_UPLOADER_ALLOWED_IPS` env var — deny-all when unset
- Security headers applied globally in middleware (CSP, X-Frame-Options, HSTS, etc.)
- KV binding accessed via `getCloudflareContext({ async: true })` from `@opennextjs/cloudflare` — evidence: `inventoryKv.ts`
- `prisma` instance in `packages/platform-core/src/db.ts` detects `EdgeRuntime` global to switch to Neon HTTP adapter automatically
- Axerve uses `export const runtime = "nodejs"` — SOAP dynamic import requires Node.js; incompatible with CF Workers

### Data & Contracts

- Types/schemas/events:
  - `CheckoutAttemptRecord` — defined in `checkoutIdempotency.server.ts`; fields: `idempotencyKey`, `requestHash`, `status`, `provider?`, `shopTransactionId?`, `stripeSessionId?`, `stripePaymentIntentId?`, `holdId?`, `buyerName?`, `buyerEmail?`
  - `CaryinaPaymentProvider` — `"axerve" | "stripe"` — from `provider.server.ts`
  - `AxerveRefundParams` / `AxerveRefundResult` — from `packages/axerve/src/types.ts`
  - `StripeWebhookEvent` model already in schema (id, shop, type, status, lastError, createdAt, updatedAt) — spec's proposed `StripeWebhookEvent` model **conflicts** (different field set, different table name `stripe_webhook_events` vs implicit default)
- Persistence:
  - Caryina checkout attempts: `data/shops/caryina/checkout-idempotency.json` (file; does not yet exist for production data)
  - CMP orders: `RentalOrder` model in Prisma (Neon)
  - CMP orders fallback: `data/shops/cover-me-pretty/orders.jsonl`
  - Shared Neon DB: project `silent-flower-70372159`, `eu-west-2`
- API/contracts:
  - POST `/admin/api/refunds` → `{ shopTransactionId?, bankTransactionId?, amountCents }` → `{ ok, data: { transactionId, bankTransactionId } }`
  - `callRefund(params: AxerveRefundParams)` → requires `shopLogin`, `apiKey` from env vars at call time — currently read from `process.env.AXERVE_SHOP_LOGIN` / `process.env.AXERVE_API_KEY` directly

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/axerve` (SOAP client) — CF Workers incompatible due to `import("soap")`
  - `@acme/stripe` (fetch-based client) — CF Workers compatible
  - `packages/platform-core/src/db.ts` (Prisma + Neon adapter) — proven in inventory-uploader
  - `@acme/config/env/payments` (paymentsEnv) — used by Caryina for `PAYMENTS_PROVIDER`, `STRIPE_WEBHOOK_SECRET`
- Downstream dependents:
  - `apps/caryina/src/app/admin/api/refunds/route.ts` — to be proxied then removed
  - `apps/caryina/src/lib/payments/provider.server.ts` — to read from Payment Manager DB instead of env var (Phase 3)
  - `apps/caryina/src/lib/checkoutSession.server.ts` — uses `resolveCaryinaPaymentProvider()` — affected in Phase 3
- Likely blast radius:
  - Caryina admin routes (Phase 5 removal)
  - Caryina checkout provider resolution (Phase 3 change)
  - `packages/platform-core/prisma/schema.prisma` (new migrations)
  - CI/deploy pipeline for payment-manager app

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Playwright (e2e) — consistent with monorepo
- Commands: `pnpm --filter payment-manager test` (new app); governed runner for CI
- CI integration: per-app test lane in reusable-app.yml (to be added for new app)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Caryina refund route | Unit | `apps/caryina/src/app/admin/api/refunds/route.test.ts` | 9 test cases (TC-04-01 to TC-04-09); covers Axerve and Stripe paths, env var missing, validation errors |
| Axerve package | Unit | `packages/axerve/src/index.test.ts` | mock mode tested |
| Stripe package | Unit | `packages/stripe/src/__tests__/*.test.ts` | mock mode, edge, init, response contracts |
| Inventory-uploader session | Unit | `apps/inventory-uploader/src/lib/auth/__tests__/session.test.ts` | HMAC, revocation |
| Inventory-uploader access control | Unit | `apps/inventory-uploader/src/lib/auth/__tests__/accessControl.test.ts` | IP allowlist |

#### Coverage Gaps

- Untested paths:
  - No test coverage for Caryina `checkoutReconciliation.server.ts` (called by cron/periodic trigger)
  - No test for CMP order creation path using Prisma (tested via happy-path only)
  - No cross-shop refund scenarios (new app will need these from scratch)
  - No test for credential encryption/decryption (new requirement)
- Extinct tests:
  - Once Caryina proxy (Phase 2) ships, `route.test.ts` tests will need to be updated to test the proxy, not the direct handler
- Sequencing dependency (reconciliation view):
  - TASK-07 (reconciliation view) reads "stale attempts from DB" — but no in-progress checkout records exist in the DB until Caryina writes them in real-time (Phase 1 per resolved Q2). Reconciliation view shows empty state until this is live. This must be noted as accepted empty-state in TASK-07 acceptance criteria.
- Testability constraints:
  - Axerve SOAP calls require mock (`AXERVE_USE_MOCK=true`) — SOAP testing in CF Workers environment not possible; CF Workers build would need Axerve replaced with HTTP-based calls
  - KV binding tests require `getCloudflareContext` mock (pattern proven in inventory-uploader)

#### Recommended Test Approach

- Unit tests for: credential encryption/decryption, provider config CRUD, refund validation logic, session auth
- Integration tests for: Prisma model read/write (using test DB), Stripe refund path end-to-end with mock
- E2E tests for: login flow, order list render, refund modal submit
- Contract tests for: Caryina proxy to Payment Manager API shape

### Delivery & Channel Landscape

Not investigated: internal tool only; no audience targeting, channel constraints, delivery approvals, or compliance requirements apply beyond the session auth and IP allowlist already described in Security.

### Recent Git History (Targeted)

- `feat(caryina/axerve): IMPLEMENT-03 — production Axerve SOAP client` — Axerve SOAP client built and tested; uses dynamic `import("soap")` which CF Workers cannot execute
- `feat(caryina): harden checkout idempotency and reconciliation` — JSON idempotency store hardened with file locking, stale detection, status machine
- `feat(caryina): Wave 1 — Axerve package scaffold + payments env schema` — `paymentsEnv` and `PAYMENTS_PROVIDER` env schema established
- `0ab1174475 feat(caryina): migrate all .btn-primary call sites to DS Button` — Caryina admin UI active; admin routes in use
- `feat(caryina): add admin product list, create/edit form, and inventory editor` — Admin area growing; confirms admin won't be removed until Phase 5

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | No UI exists yet for cross-portfolio payments; Caryina admin has a minimal refund form | Must design and build full UI from scratch: order list, order detail, refund modal, provider config form, reconciliation view, analytics | Design system (`@acme/design-system`) is available; confirm Tailwind v4 compatible with new app |
| UX / states | Required | Caryina refund handler has validation errors and clear HTTP status codes | New UI must handle: empty order list, loading states, refund in-flight, refund success/failure, provider switch confirmation modal, credential masked entry | Partial refund amount cap logic and line-item selection are new UX states not yet designed |
| Security / privacy | Required | Caryina admin protected by middleware (cookie-based, admin-only matcher); Axerve credentials in env vars | New app stores payment credentials encrypted in DB; encryption key as Worker secret; session auth + IP allowlist pattern from inventory-uploader; customer email masked in UI; credentials never returned decrypted to client. Minimum viable rotation procedure: run `wrangler secret put PAYMENT_MANAGER_ENCRYPTION_KEY` with new key value; admin endpoint re-encrypts all `ShopProviderCredential` rows before old key is retired | AES-256-GCM implementation needed (new, no existing pattern in repo); rotation endpoint must be built as part of TASK-03 |
| Logging / observability / audit | Required | Caryina logs refund OK/KO to console with structured data; no audit trail for provider switches | New app requires: immutable audit log for config changes, refund audit trail per order, structured logs for all provider API calls, alert emails for reconciliation errors (existing pattern in `checkoutReconciliation.server.ts`) | Audit log model is in spec; carry forward: how operator views logs beyond UI |
| Testing / validation | Required | Caryina refund route: 9 unit tests; Axerve and Stripe packages have unit tests | CF Workers Axerve test path limited (SOAP not available); new credential encryption needs unit tests; proxy behavior needs integration test | Test for Caryina proxy shape must be written before Phase 2 ships |
| Data / contracts | Required | `CheckoutAttemptRecord` in JSON file; `StripeWebhookEvent` model already in schema (different from spec's proposed model); `RentalOrder` in Prisma for CMP | **Critical**: spec proposes new `StripeWebhookEvent` model named `StripeWebhookEvent` but one already exists in schema with different fields — name collision must be resolved; Caryina idempotency data is in a JSON file (may not exist in production at time of migration) | Spec uses D1 inconsistently in Phase 1 migration script description ("Populate D1 `orders` table") but Technical Architecture section correctly says Neon/Prisma — clarify |
| Performance / reliability | Required | Caryina file-lock idempotency store: 5s timeout, stale lock cleanup; Stripe session TTL 30 min | New DB-backed order store must handle concurrent refund requests (idempotent refund API); Axerve SOAP in CF Workers is a hard blocker — SOAP dynamic import not supported in V8 isolates | **Critical**: Axerve `callRefund` uses `import("soap")` which CF Workers cannot execute; must replace with Axerve HTTP API or proxy via a Node.js service |
| Rollout / rollback | Required | No existing rollout plan for payment-manager app; Caryina admin routes active and in use | Phase-based rollout (5 phases in spec) is sensible; rollback triggers and methods not specified; credential encryption key rotation not defined; Caryina proxy in Phase 2 is the highest-risk step | If Payment Manager is down during Phase 2, Caryina refunds are blocked — need fallback plan |

## Questions

### Resolved

- Q: Does cover-me-pretty have an existing idempotency store to migrate?
  - A: No. CMP uses `RentalOrder` model in Prisma (`addOrder()` from platform-core) and a fallback JSONL file. There is no JSON idempotency store like Caryina's. CMP orders are already partially in Prisma. CMP has no admin refund surface at all.
  - Evidence: `apps/cover-me-pretty/src/api/checkout-session/route.ts`, `packages/platform-core/prisma/schema.prisma` (`RentalOrder` model)

- Q: Does the existing `StripeWebhookEvent` model in the schema conflict with the spec's proposed model?
  - A: Yes. `packages/platform-core/prisma/schema.prisma` already has `model StripeWebhookEvent { id, shop, type, status, lastError, createdAt, updatedAt }`. The spec proposes a new `StripeWebhookEvent` model with a completely different field set and `@@map("stripe_webhook_events")`. These cannot coexist with the same Prisma model name. The spec's model must be renamed (e.g. `PaymentWebhookEvent`) or the existing model extended.
  - Evidence: `packages/platform-core/prisma/schema.prisma` line 197

- Q: Is the spec's "D1" database reference (in Phase 1 migration steps) correct?
  - A: No. The spec uses "D1" inconsistently. The Technical Architecture section correctly specifies Neon PostgreSQL + Prisma. The Phase 1 and Phase 5 step descriptions use "D1 orders table" and "D1 table" which is incorrect — this is a copywriting error in the spec. The database is Neon/Prisma throughout.
  - Evidence: spec.md lines 388–389, 417 vs lines 216–225

- Q: Can the Axerve SOAP client run in a CF Workers V8 isolate?
  - A: No. `packages/axerve/src/index.ts` uses `await import("soap")` — a dynamic import of the `soap` npm package which depends on Node.js APIs (`http`, `net`, `tls`) not available in V8 isolates. The current `apps/caryina/src/app/admin/api/refunds/route.ts` explicitly declares `export const runtime = "nodejs"` for this reason. A CF Workers-deployed Payment Manager cannot use the SOAP-based Axerve client as-is.
  - Evidence: `packages/axerve/src/index.ts` lines 68–69; `apps/caryina/src/app/admin/api/refunds/route.ts` line 15

- Q: Does the session auth pattern from inventory-uploader work in CF Workers?
  - A: Yes. `apps/inventory-uploader` is a deployed CF Worker with the HMAC cookie + KV revocation session pattern. The KV access uses `getCloudflareContext({ async: true })` from `@opennextjs/cloudflare`. This pattern is directly reusable.
  - Evidence: `apps/inventory-uploader/wrangler.toml`, `apps/inventory-uploader/src/lib/auth/session.ts`, `apps/inventory-uploader/src/lib/auth/inventoryKv.ts`

- Q: Does the Prisma DB adapter auto-detect CF Workers at runtime?
  - A: Yes. `packages/platform-core/src/db.ts` checks `typeof globalThis.EdgeRuntime !== "undefined"` or presence of `CF_PAGES` / `WORKERS_RS_VERSION` env vars, then dynamically requires `@neondatabase/serverless` + `@prisma/adapter-neon` for HTTP-based connections. No extra work needed in the new app.
  - Evidence: `packages/platform-core/src/db.ts` lines 74–124

- Q: Does checkout-idempotency.json currently exist in production data?
  - A: No file exists at `data/shops/caryina/checkout-idempotency.json`. The directory `data/shops/caryina/` exists with other files (`inventory.json`, `products.json`, `settings.json`, `shop.json`). The idempotency file is created lazily on first checkout. Any migration script must handle the case where this file does not yet exist.
  - Evidence: `ls data/shops/caryina/` — no checkout-idempotency.json present

- Q: Should Caryina's checkout session write order records to the Payment Manager DB in real time, or should the Payment Manager read historical data on-demand from the idempotency JSON?
  - A: Real-time dual-write is the recommended approach. Reasoning: (a) the spec's default assumption is real-time write; (b) on-demand sync means the order list lags actual checkouts, making analytics unreliable until a sync is triggered; (c) the `checkoutIdempotency.server.ts` already writes to a file store — extending it to also write a `Order` row to Neon (which Caryina can access via the shared Prisma instance) is a bounded addition to checkout session code; (d) the coupling is acceptable for an internal tool sharing the same Neon DB. The tradeoff is: Caryina's checkout session takes a new DB write dependency (one additional Prisma `upsert` call on success); this is low-risk given Caryina already uses Prisma for inventory holds. Caryina code change happens in Phase 1 (not Phase 3), which slightly expands Phase 1 scope.
  - Evidence: `apps/caryina/src/lib/checkoutIdempotency.server.ts` (file write pattern); `packages/platform-core/src/db.ts` (shared Prisma instance); spec.md Question 1 default assumption

### Open (Operator Input Required)

- Q: Should Axerve refunds in Payment Manager be handled by a Node.js proxy sidecar, or should the Axerve SOAP integration be replaced with Axerve's REST API?
  - Why operator input is required: Axerve offers both SOAP and REST APIs. Migrating to REST would remove the CF Workers blocker entirely but requires code changes to `@acme/axerve`. A Node.js sidecar (separate route or service) would preserve the SOAP client but adds deployment complexity. The operator should decide based on Axerve account tier and API access level.
  - Decision impacted: Architecture of Axerve refund path in Payment Manager; whether `packages/axerve` needs a REST implementation; whether the Payment Manager can be a pure CF Worker
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default to REST API replacement in `@acme/axerve` (separate implementation alongside existing SOAP). Risk: REST may require different Axerve account settings; validation with sandbox required.


## Confidence Inputs

- **Implementation: 72%**
  - The inventory-uploader pattern is a near-exact template for the new app (auth, KV, Prisma/Neon, Workers). Session auth, middleware, and DB adapter are all proven.
  - Reduces to 72% (not higher) because Axerve SOAP blocker is unresolved — Axerve refunds in CF Workers cannot use the current package; either a REST implementation or sidecar is needed, and neither exists yet.
  - To reach ≥80%: Confirm Axerve REST API availability and decide approach; confirm new model naming resolves the `StripeWebhookEvent` collision.
  - To reach ≥90%: Axerve REST client implemented and tested; schema migration plan confirmed.

- **Approach: 80%**
  - 5-phase migration plan is sound and low-risk to Caryina. Phased proxy approach (Phase 2) protects in-flight traffic.
  - The Neon + Prisma + CF Workers pattern is verified through inventory-uploader. Auth pattern is proven.
  - Reduces from higher because Axerve approach (Open Q1) remains to be pre-selected before Phase 1 Axerve task can be fully scoped.
  - To reach ≥90%: Resolve Open Q1; define encryption key rotation strategy (default procedure now in Security row).

- **Impact: 90%**
  - Directly solves the stated pain: refunds accessible from a single place, provider switching without redeploy, cross-portfolio visibility.
  - High confidence in impact because the current gap is concrete and measurable (refunds only in Caryina admin, provider change = redeploy).

- **Delivery-Readiness: 65%**
  - Stack is clear; templates exist; no new infrastructure beyond a KV namespace and Neon migrations.
  - Reduces to 65% because: (a) Axerve CF Workers blocker needs design decision before Phase 1 can be scoped; (b) `StripeWebhookEvent` model conflict needs resolution; (c) partial refund line-item UI is under-specified.
  - To reach ≥80%: Resolve open questions and model naming.

- **Testability: 75%**
  - Session auth, IP allowlist, Prisma models, and Stripe refund path all have clear test patterns from existing apps.
  - Reduces to 75% because Axerve path testing in CF Workers environment requires new patterns; credential encryption has no existing test seam in the repo.
  - To reach ≥80%: Design encryption test seam; confirm Axerve mock behavior in Workers test context.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Axerve SOAP incompatibility with CF Workers | High (confirmed) | High — blocks Axerve refunds in Payment Manager | Must replace SOAP client with REST implementation OR route Axerve calls via a Node.js route in Caryina (proxy pattern). Open Q1. |
| `StripeWebhookEvent` model name collision in Prisma schema | High (confirmed) | Medium — migration would fail; type errors at compile time | Rename spec's model to `PaymentWebhookEvent` or similar before writing migration |
| Caryina proxy (Phase 2) fails silently | Medium | High — operator loses refund capability without notice | Add health check call from Caryina proxy to Payment Manager; circuit-breaker pattern; fallback to direct handler until stable |
| Real-time order write scope creep (Phase 1) | Low | Medium — Phase 1 is larger than expected if Caryina checkout changes are required | Resolved: real-time dual-write adopted; Caryina checkout writes to both Prisma and existing idempotency store during transition phases |
| Credential encryption key management | Medium | High — lost key = lost access to all provider credentials | Document rotation procedure before going live; consider envelope encryption or Cloudflare Secrets Store in future |
| Cover-me-pretty orders in JSONL fallback not migrated | Low | Medium — CMP order history incomplete in Payment Manager | Migration script must read both Prisma `RentalOrder` and `data/shops/cover-me-pretty/orders.jsonl` (Phase 4) |
| Caryina checkout-idempotency.json missing at migration time | Medium | Low — migration script outputs empty order table | Migration script must handle ENOENT gracefully; orders will be populated going forward from checkout events |
| CF Workers file limit (20k) during build | Low | Low — already handled by `find out -name "__next.*" -type f -delete` pattern | New app must add same cleanup to CI workflow |

## Planning Constraints & Notes

- Must-follow patterns:
  - `wrangler.toml` pattern from `apps/inventory-uploader`: `main = ".open-next/worker.js"`, `[assets]`, `[[kv_namespaces]]`, secrets via `wrangler secret put`
  - Session auth: copy `session.ts` pattern from inventory-uploader; cookie name `payment_manager_admin`; 7-day TTL; KV revocation
  - IP allowlist: copy `accessControl.ts` pattern; deny-all when `PAYMENT_MANAGER_ALLOWED_IPS` unset
  - Middleware: security headers applied globally (CSP, X-Frame-Options, HSTS, etc.)
  - Prisma: use shared `packages/platform-core/src/db.ts` — do not create a new Prisma instance
  - CF Workers: no `export const runtime = "nodejs"` — all routes must be Worker-compatible
  - `StripeWebhookEvent` model in spec must be renamed before migration is written
- Rollout/rollback expectations:
  - Phase 2 (proxy) is the highest-risk step; rollback = revert Caryina's refund route to direct handler
  - Phase 3 (provider resolution from DB) should be feature-flagged or have an env-var fallback
  - Phase 5 (code removal) only after Phase 3 is stable in production
- Observability expectations:
  - Audit log for all config changes (immutable, append-only, stored in `PaymentConfigAudit` table)
  - Refund audit trail per order in `Refund` table
  - Console logging follows existing pattern: `[payment-manager] event description {structured data}`

## Suggested Task Seeds (Non-binding)

- TASK-01: Scaffold `apps/payment-manager/` — wrangler.toml, auth middleware, login route, KV session (copy from inventory-uploader)
- TASK-02: Design and apply Prisma migrations — resolve `StripeWebhookEvent` naming conflict; add `ShopPaymentConfig`, `ShopProviderCredential`, `PaymentConfigAudit`, `Order`, `Refund`, `PaymentWebhookEvent` models
- TASK-03: Credential encryption module — AES-256-GCM encrypt/decrypt; test seam; store in `ShopProviderCredential`
- TASK-04: Shop config API + UI — CRUD for `ShopPaymentConfig`; provider selector; credential form (masked); test-connection endpoint; audit log view
- TASK-05: Order list API + UI — paginated `GET /api/orders`; filters; sorting
- TASK-06: Refund API + UI — `POST /api/refunds`; full/partial; Axerve and Stripe paths; Axerve must use REST not SOAP
- TASK-07: Checkout reconciliation view — read stale attempts from DB; manual trigger; resolve action
- TASK-08: Webhook event log — `GET /api/webhook-events`; filtered by shop/type/date
- TASK-09: Analytics dashboard — revenue, refund rate, failed payment rate
- TASK-10: Migration script — populate `Order` table from Caryina JSON idempotency + CMP Prisma `RentalOrder`
- TASK-11: Caryina proxy (Phase 2) — replace `/admin/api/refunds` with thin proxy
- TASK-12: Checkout provider resolution (Phase 3) — `resolveCaryinaPaymentProvider()` reads from Payment Manager DB
- TASK-13: Caryina admin cleanup (Phase 5) — remove admin routes after Phase 3 is stable

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/payment-manager/` deployed and accessible at `payment-manager.<worker-subdomain>.workers.dev`
  - All 5 phases shipped and verified
  - Caryina admin refund route removed (or proxied)
  - `pnpm typecheck && pnpm lint` passing
- Post-delivery measurement plan:
  - Refunds can be issued for both Caryina and CMP orders via Payment Manager
  - Provider switch from Axerve → Stripe on Caryina completes without redeploy
  - Zero downtime during Phase 2 proxy deployment

## Evidence Gap Review

### Gaps Addressed

- Confirmed Axerve SOAP CF Workers incompatibility via code inspection (`import("soap")`, `runtime = "nodejs"`)
- Confirmed `StripeWebhookEvent` model collision via direct schema inspection
- Confirmed CMP has no JSON idempotency store; uses Prisma `RentalOrder` + JSONL fallback
- Confirmed Caryina idempotency JSON file does not exist yet in `data/shops/caryina/`
- Confirmed spec uses "D1" incorrectly in Phase 1 step descriptions (should be Neon/Prisma)
- Confirmed Stripe client is CF Workers compatible (`createFetchHttpClient()`)
- Confirmed KV access pattern for CF Workers (`getCloudflareContext({ async: true })`)
- Confirmed Prisma CF Workers auto-detection in `db.ts`

### Confidence Adjustments

- Implementation confidence reduced to 72% due to unresolved Axerve SOAP blocker (was higher in spec assumption)
- Data/contracts confidence adjusted: spec model naming conflict is a required fix before migration can be written
- Phase 1 scope uncertainty increased because real-time order write decision affects how much Caryina code changes in Phase 1

### Remaining Assumptions

- Axerve REST API is available for the production Axerve account (unverified — needs operator confirmation)
- Neon project `silent-flower-70372159` is accessible from new `apps/payment-manager/` deploy (same `DATABASE_URL` secret can be reused)
- CMP JSONL fallback orders are few enough that manual migration is acceptable

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Caryina refund infrastructure (entry points, contracts) | Yes | None | No |
| Axerve package CF Workers compatibility | Yes | [Integration boundary not handled][Critical]: `callRefund()` uses `import("soap")` — dynamic Node.js SOAP import; CF Workers V8 isolate cannot execute; route.ts declares `runtime = "nodejs"` | Yes — must resolve before Axerve refunds can be built for Payment Manager |
| Stripe package CF Workers compatibility | Yes | None — `createFetchHttpClient()` is CF Workers compatible | No |
| Inventory-uploader pattern (auth, KV, Prisma, wrangler) | Yes | None — full pattern confirmed | No |
| Prisma schema (existing models + new models) | Yes | [Type contract gap][Major]: spec proposes `model StripeWebhookEvent` but name already used in schema with different fields; Prisma migration would fail | Yes — rename to `PaymentWebhookEvent` |
| Spec D1/Neon consistency | Yes | [Scope gap][Minor]: spec Phase 1 migration steps say "D1 table" but Tech Architecture correctly says Neon/Prisma — inconsistency in spec prose | No — spec prose inconsistency only; plan should use Neon/Prisma throughout |
| Cover-me-pretty order data source | Yes | None — `RentalOrder` in Prisma confirmed; no admin refund surface exists | No |
| Credential encryption (new requirement) | Partial | [Missing precondition][Moderate]: no existing AES-256-GCM pattern or test seam in repo; `PAYMENT_MANAGER_ENCRYPTION_KEY` rotation procedure undefined | Yes — design decision needed before Task-03 |
| Checkout idempotency JSON migration | Yes | [Missing data dependency][Minor]: `data/shops/caryina/checkout-idempotency.json` does not yet exist; migration script must handle ENOENT | No — minor; script can handle gracefully |
| Phase 2 proxy rollback plan | Partial | [Integration boundary not handled][Moderate]: if Payment Manager is down during Phase 2, Caryina loses refund capability entirely; no circuit-breaker or fallback defined in spec | Yes — define fallback behavior in plan |

## Rehearsal-Blocking-Waiver

Not applicable — blocking findings (Axerve SOAP incompatibility, StripeWebhookEvent collision) are genuine issues requiring resolution, not false positives.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items:
  - None blocking analysis entry. However, analysis must treat Axerve resolution (Open Q1: REST vs sidecar proxy) as a required Option A vs Option B evaluation — one approach must be selected before planning can scope TASK-06 (Refund API). Analysis that defers this choice cannot produce a complete plan.
- Recommended next step:
  - `/lp-do-analysis payment-management-app` — key analysis question: Axerve REST vs SOAP-proxy approach (Option A vs Option B); the Stripe-only scope can be planned independently of this decision, but Axerve refund scope cannot.

## Scope Signal

**Right-sized** with one scope caveat. The spec is comprehensive and matches the operator-stated problem. The 5-phase migration plan correctly isolates risk. The main technical discoveries (Axerve SOAP blocker, model naming conflict) are tractable and have defined resolution paths. No scope inflation detected. The feature is large (new app, 5 phases, credential encryption, two payment providers) but every element is justified by a concrete current-state gap.

**Scope caveat:** If Axerve REST is required (the likely resolution path for Open Q1), a new `@acme/axerve` REST client module is an additional task not currently in the task seeds. This would add approximately one implementation task to Phase 1 scope.
