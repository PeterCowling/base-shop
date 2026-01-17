<!-- docs/plans/edge-commerce-standardization-implementation-plan.md -->

Type: Implementation Plan
Status: Draft (Revised after repo review + follow‑up refinements)
Domains: Platform, Commerce
Last-reviewed: 2025-12-26

Unified Edge Routing + Multi‑Tenant Commerce Standardization Implementation Plan
Audience

Product, Engineering, Ops, Finance

Purpose

Implement a single scalable Cloudflare routing + deployment model that:

supports many shops and domains without “project per shop” sprawl,

preserves host-only cart cookies (same-host cart → checkout),

standardizes all existing commerce API surfaces already present in the repo (not just cart/checkout/webhooks),

guarantees a single inventory authority (validate now, reserve with TTL next),

makes tenant (shop) resolution first-class across storefront, gateway/node, webhooks, and background jobs,

and provides secure, observable, independently deployable edge + node commerce services.

Scope
In scope

Front Door Worker as the universal entrypoint for storefront traffic (umbrella subdomains + onboarded apex/vanity domains).

Hostname → shop mapping with:

canonical redirects,

locale prefix enforcement,

mode handling (active, landing-only, expired),

“redirect-only” support for campaign domains.

Contract-aware routing allowlist for the real commerce API surface in the repo (see Route Matrix).

A multi-tenant storefront runtime (one deployment serving many shops).

Edge + node topology:

Front Door Worker → Checkout Gateway Worker → Node Commerce Service (Stripe + Prisma/Postgres + inventory holds + ledger writes)

Dedicated Stripe webhook hostname per environment (for checkout + billing).

Multi-tenant webhook correctness:

shopId resolution from Stripe event content (metadata) plus a robust Stripe-object→shop mapping fallback,

tenant-aware dedupe and idempotent upserts,

fail-safe behavior for missing tenant identity (do not mis-attribute; dead-letter + alert).

Unified inventory authority:

deterministic variantKeyV1,

validate-only baseline,

reserve_ttl holds with extend/commit/release.

Money invariants:

single canonical unit strategy (minor units),

consistent Stripe metadata conventions,

reconciliation-grade order persistence,

validation/normalization at compatibility bridges (notably /api/reconciliation).

Worker convergence path:

hosted redirect → platform-standard custom checkout,

deprecate worker-local order persistence/webhook handling,

keep reconciliation ingest compatible during transition.

Payments breadth consolidation under the commerce authority boundary:

returns/refunds, rental order ops, subscriptions, billing webhooks,

background Stripe operations (deposit release, late fees, etc.).

Out of scope (explicit)

Full Cloudflare Access policy design for internal admin routes (tracked separately).

Native mobile checkout.

Multi-warehouse inventory, bundles/kits, backorders, supplier lead times.

Stripe Tax, gift cards, exchanges, bundles (not assumed present; not pulled into critical path).

Non-negotiable principles

Host-only carts mean same-host checkout
No cross-domain cart/session hacks. Routing must preserve host for cart → checkout.

Edge does routing + safety checks; Node does transactional work
Edge: hostname resolution, redirects, rate limiting, normalization.
Node: Stripe calls, webhooks, DB writes, inventory holds, finance-grade order writes.

Cache-first routing
Avoid D1 reads on the hot path: in-worker LRU + KV + SWR; D1 only on true miss/refresh.

Independent deployability
Gateway Worker and Node Commerce Service deploy independently with strict internal API versioning.

Tenant Context Breakthrough: no defaults, no guesses
No route-level SHOP_ID = "...". No DEFAULT_SHOP env fallback.
Tenant identity must be explicit and validated at the boundary of every authoritative operation.

Fail closed for authoritative operations
Checkout/session creation, webhook finalization, inventory holds, and financial writes must not run under an “unknown tenant”.

Support-grade tracing
x-request-id returned to clients and propagated end-to-end.

End-state architecture

Client → Front Door Worker (canonical + locale + tenancy + routing)

Pages + cart → Multi-tenant Storefront Runtime (same host)

Commerce authority endpoints → Checkout Gateway Worker → Node Commerce Service → Postgres (Prisma)
Stripe → https://hooks.<platform-domain>/api/stripe-webhook + .../api/billing/webhook → Gateway → Node

Route matrix (explicit allowlist)

Front Door Worker must treat these as non-locale-prefixed and route them deterministically:

Routed to Storefront Runtime (same host)

GET/POST/PATCH/PUT/DELETE /api/cart

Routed to Gateway → Node Commerce Service

Checkout + webhooks:

POST /api/checkout-session

POST /api/stripe-webhook

Inventory authority:

POST /api/inventory/validate

Returns/refunds & rental ops:

POST /api/return

POST/PATCH /api/rental

Subscriptions/billing:

POST /api/subscribe

POST /api/subscription/change

POST /api/subscription/cancel

POST /api/billing/webhook

Reconciliation ingest (worker shim compatibility):

POST /api/reconciliation

All other /api/* paths: explicitly decide per endpoint. Default posture should be “deny/404” unless intentionally exposed.

Acceptance criteria:

Front Door has an explicit allowlist for all routes above.

Each route is unambiguously routed to either storefront runtime or gateway/node, consistently across tenants.

Workstreams and execution lanes

Each workstream is split into:

Coding (Codex): implementation tasks, tests, refactors.

Cloudflare / Terminal: Wrangler commands, routing, Access, secrets, console config.

Workstream 1 — Tenant Shop Context Resolution (storefront → edge → gateway → node)
Goal

Remove hard-coded shop constants and env-default fallbacks. Make tenant resolution deterministic, testable, and consistent for all storefront-originated traffic.

Coding (Codex)

Define a single “Shop Context” contract

Required fields: shopId, requestId, environment

Helpful fields: host, canonicalHost, runtimeId

Front Door Worker: resolve and inject

Resolve Host → shopId via mapping store (D1/KV/SWR).

Inject X-Shop-Id: <shopId> for:

storefront runtime routes,

gateway routes (all commerce authority endpoints).

Spoofing defense

Ensure inbound client-provided X-Shop-Id is ignored/stripped before internal injection.

Gateway/Node: enforce “explicit shop context”

Middleware that:

requires X-Shop-Id for all non-webhook commerce authority endpoints,

validates format and existence (shop exists / enabled / not expired per mapping),

rejects any attempt to fall back to defaults.

Repo-wide removal of hardcoding patterns

Eliminate SHOP_ID = "...", NEXT_PUBLIC_DEFAULT_SHOP, and similar patterns in:

route handlers,

webhook entrypoints (where currently hard-coded),

background jobs (see Workstream 7).

Guardrails

ESLint/static checks: fail CI if forbidden patterns appear.

“Tenant context” contract tests: multiple hosts/shops through same deployment must partition correctly.

Cloudflare / Terminal

Optional hardening via Transform Rules / WAF:

strip X-Shop-Id and other internal headers from public requests at the edge.

No other unique Cloudflare config beyond ensuring Front Door injects X-Shop-Id.

Acceptance criteria

No SHOP_ID = ... constants in commerce route handlers.

No env-default shop fallback in server-side commerce flows.

All storefront-originated commerce requests are tenant-resolved via X-Shop-Id and validated.

Workstream 2 — Front Door routing + mapping control plane (D1 + KV + SWR) + expanded allowlist
Goal

Universal edge entrypoint with cache-first tenancy resolution and explicit routing for the full commerce surface.

Coding (Codex)

Front Door Worker:

canonical host enforcement (301 alias → canonical, preserve path+query)

locale prefix enforcement (307 add locale prefix; allowlist excludes /api, /.well-known, /cms)

mode handling: active / landing-only / expired

request normalization + x-request-id generation/propagation

Explicit allowlist routing (Route Matrix):

route each commerce endpoint to storefront vs gateway

ensure locale logic never touches these endpoints

Mapping control plane:

D1 schema for host mapping + aliases + mode + expiry + config pointers + audit fields

KV caching + invalidation

SWR in-worker LRU cache (Tier0) + negative caching

Cloudflare / Terminal

Worker routes

https://*.umbrella.com/* → Front Door (staging then prod)

D1 + KV provisioning (staging/prod)

wrangler d1 create <routing_db_name>

wrangler d1 migrations apply <routing_db_name> --env <env>

wrangler kv namespace create HOST_MAPPING_CACHE --env <env>

Bindings in wrangler.toml for D1/KV

Deploy

wrangler deploy --env staging

Acceptance criteria

Domain cutover requires only mapping updates (no deploy).

D1 not hit on steady-state hot path.

Unknown-host scans do not thrash D1 (negative caching works).

All listed commerce endpoints are explicitly routed and never locale-redirected.

Workstream 3 — Webhook multi-tenancy + resolution gap hardening (checkout + billing)
Goal

A single webhook endpoint can safely process events for N shops, including legacy/external Stripe objects that may not carry shop_id metadata.

Coding (Codex)
3A. Stripe tenant resolution algorithm (robust, multi-step)

Implement resolveShopIdFromStripeEvent(event):

Primary: direct metadata (fast path)

For Checkout Session / PaymentIntent / Subscription / Invoice events:

read event.data.object.metadata.shop_id (or canonical metadata key you standardize on)

Validate shopId exists and is active.

Secondary: Stripe object ownership lookup table (required)

Maintain a canonical DB table that maps Stripe objects to tenant identity, e.g.:

stripe_object_shop_map(environment, object_type, stripe_id) -> shopId (+ internal refs)

Populate this table whenever your system creates/links Stripe objects:

checkout session created → map cs_* + associated pi_* (and ch_* when known) → shopId

subscription created → map sub_* → shopId

invoice created/seen → map in_* → shopId

customer association (see below) → map if and only if it’s unambiguous/intentional

For webhook resolution, attempt lookup using the strongest identifiers present in the event:

subscription id, invoice id, checkout session id, payment intent id, charge id

Tertiary: customer/account fallback (carefully bounded)

If event includes customer and the system uses per-shop customers, allow stripe_customer_id → shopId lookup.

If customers can span multiple shops, only use customer fallback when it resolves to exactly one tenant for the relevant object context; otherwise treat as unresolved.

If using Connect in the future, allow event.account (Stripe connected account id) as a tenant hint only if your platform actually partitions by account.

Unresolved policy (do not mis-attribute)

If shopId still can’t be resolved:

write the full event payload to a dead-letter store with reason unresolved_tenant,

alert Ops/Finance (actionable runbook),

do not mutate state (no orders, no refunds, no subscription updates).

Response strategy:

default: return 2xx to Stripe after dead-lettering to avoid infinite retry loops for permanently-unresolvable events

optionally: return non-2xx only for transient/internal failures where retry is useful (DB down, etc.)

3B. Tenant-aware dedupe and idempotency

Dedupe store must record:

stripe_event_id (unique per environment),

event_type, created_at,

resolved shopId (or NULL if unresolved),

processing status + timestamps

Idempotent upserts:

order/payment state transitions safe under retries and out-of-order delivery

billing/subscription state sync safe under retries

3C. Backfill + operational tooling for legacy Stripe objects

Backfill mapping table from existing internal records:

orders table: map historical checkout_session_id, payment_intent_id, etc.

subscriptions table: map subscription_id and known invoices

Provide an internal admin tool/API to manually associate:

a legacy sub_* or in_* with a shopId

(with audit trail: who/when/why)

Cloudflare / Terminal

Configure stable webhook hostnames (per env):

https://hooks.<platform-domain>/api/stripe-webhook

https://hooks.<platform-domain>/api/billing/webhook

Route webhook hostname(s) to Gateway Worker.

Configure Stripe dashboard webhook endpoints to target these hosts.

Acceptance criteria

Same webhook endpoint processes events for N shops without ambiguity.

Legitimate legacy subscription events can resolve tenant identity via the mapping table (not only metadata).

Dedupe and idempotency guarantees hold, with tenant identity recorded.

Unresolved events are dead-lettered + alerted, never mis-attributed.

Workstream 4 — Inventory authority alignment (soft-cart, hard-checkout) + holds with herd-resistant retries
Goal

Stop treating sku.stock as authoritative inventory. Keep cart fast while enforcing correctness at checkout, with safe behavior under contention.

Decision

Default to Option B — “Soft-cart, hard-checkout”:

cart is optimistic and fast,

checkout is strict: validate → reserve/hold → commit on payment success.

Coding (Codex)

Remove cart quantity gating based on embedded sku.stock.

Standardize inventory error contract:

409 Conflict

payload includes shopId, items[], reason, and retryAfterMs (for inventory_busy)

Availability preview API:

read-optimized endpoint used by PDP/cart/mini-cart

short TTL caching + revalidation

Holds (reserve_ttl) in Node authority:

createHold, extendHold, commitHold, releaseHold

atomic updates + strict lock timeouts

fail fast with inventory_busy + retryAfterMs

Thundering herd mitigation (client side required)

When inventory_busy occurs:

implement exponential backoff with jitter on the client

use retryAfterMs as the initial base delay

apply random jitter (e.g., 0.5×–1.5×) and exponential growth up to a capped max

cap retries and provide a user-visible fallback (“Try again”)

Integrate holds into checkout + webhook finalization:

checkout creation: validate → create hold → attach reservation id in Stripe metadata → store holdId on Order

payment success: commit hold primarily via webhook; optional idempotent fast-path finalize endpoint

cancel/failure/expiry: release hold

Cloudflare / Terminal

Ensure /api/inventory/validate and preview endpoints route to gateway/node.

Monitor inventory contention:

rate of inventory_busy,

retry success rate,

p95/p99 lock timeouts

Acceptance criteria

No reliance on embedded sku.stock as authoritative stock.

Under flash-sale contention, system fails fast with inventory_busy, and clients retry with backoff + jitter (no herd waves).

Holds prevent oversell under concurrency.

Workstream 5 — Money invariants + formatting utilities + reconciliation bridge hardening
Goal

Guarantee ledger-grade consistency: store all amounts in minor units, never mix representations, and normalize legacy ingress paths.

Coding (Codex)
5A. Canonical money invariant

Canonical storage: minor units (integers) for:

subtotal, tax, shipping, discount, deposit, total

Always store currency.

Webhook-derived Stripe amounts in minor units are the primary source of truth at finalization.

5B. Shared money utility library (required for display + input)

Create a shared package used by Storefront + Admin + Node:

toMinor(inputMajor, currency) (safe parsing; avoids float errors)

fromMinor(minor, currency) (string/decimal)

formatMinor(minor, currency, locale) (Intl.NumberFormat)

assertMinorInt(...) (invariant guard)

tests across currencies/locales you support

Requirement:

UI/CMS must never hand-roll formatting that risks rendering $10.00 as 1000 or $10.

5C. /api/reconciliation validation + normalization layer (bridge safety)

Because /api/reconciliation is a compatibility shim and likely source of invariant violations:

Implement a strict validation/normalization layer in Node for /api/reconciliation:

accept legacy inputs (including floats/major units) only during the migration window,

normalize into minor units using shared money utilities before DB writes,

attach source=worker_reconciliation + store raw payload for audit/debug.

Add conformance tests:

reject/flag malformed payloads,

ensure normalized DB writes always satisfy minor-unit invariants.

Cloudflare / Terminal

None beyond routing and auth.

Add monitoring:

count of “normalization applied” events (should trend to zero post-migration),

invariant violation alarms (must be zero).

Acceptance criteria

Order records are internally consistent (no mixed-unit fields).

Storefront/Admin display amounts consistently via shared utility library.

/api/reconciliation cannot write mixed/float amounts into DB.

Workstream 6 — Worker checkout shim convergence + UX latency smoothing
Goal

Converge worker checkout to the platform standard without regressing user experience when moving the system-of-record from KV to Postgres.

Coding (Codex)

Worker becomes API/gateway only; no heavy UI or canonical persistence.

Hosted redirect → custom checkout:

session creation via gateway/node, returns client_secret etc.

Centralize webhook processing:

no worker-local webhook processing for canonical orders

Deprecate KV as system-of-record for orders:

transitional compatibility only if necessary

UX latency smoothing (required)

Use optimistic UI states:

show “Processing…” immediately after client completes payment (no “Confirmed” yet)

poll order status from canonical store until finalized

This is explicitly designed to absorb the extra Edge→Origin→DB hop without feeling “stuck”.

Keep reconciliation ingest compatible during transition (/api/reconciliation normalization in Workstream 5).

Cloudflare / Terminal

Gradual rollout:

staging → low-traffic tenants → high-traffic

Keep legacy endpoints routable during a deprecation window if needed.

Monitor:

time-to-first “Processing…” render,

time-to-final confirmation,

drop-offs and error spikes by tenant.

Acceptance criteria

No worker-local webhook processing for canonical orders.

KV is not a system-of-record for orders after migration.

Users see immediate “Processing…” and never see “Confirmed” until server finalization.

Workstream 7 — Payments breadth consolidation + tenant-scoped background jobs
Goal

Bring refunds, rentals, subscriptions, billing webhooks, and background Stripe operations under the commerce authority boundary with tenant scoping, auth, and idempotency.

Coding (Codex)

Route and standardize these under gateway/node with the same auth:

/api/return

/api/rental (POST/PATCH)

/api/subscribe, /api/subscription/change, /api/subscription/cancel

/api/billing/webhook

Idempotency for all financial writes:

refunds (including deposits), fees, adjustments

strict DB guards + idempotency keys

Background job tenancy (technical requirement)

If using a queue (BullMQ, Cloudflare Queues, etc.), the job payload must include shopId.

The processor must:

set execution context from payload shopId (tenant partition),

pick the correct Stripe credentials/config for that shop (or shop-scoped config even if one Stripe account),

include idempotency key(s) per operation.

Auditing:

who/what/when/why for all money-moving actions.

Tests:

retry safety (no double-apply),

job tenancy enforcement (cannot run without shopId).

Cloudflare / Terminal

Ensure gateway-to-node auth covers these endpoints.

Ensure queue worker infra has:

access to tenant config,

required secrets,

structured logging with shopId and requestId (if available).

Acceptance criteria

Jobs cannot execute without explicit shopId in payload.

Refunds/charges cannot double-apply under retries.

Billing webhooks are multi-tenant with the same dedupe guarantees.

Workstream 8 — Domain onboarding + SEO-safe migration sequencing
Coding (Codex)

Enforce redirect-only vs landing-only policy via mapping.

Preserve path+query for attribution and SEO.

Ensure canonical tags and sitemap alignment in storefront runtime.

Cloudflare / Terminal

Umbrella wildcard DNS + Worker route

Apex domains added to mapping + DNS/zone configuration

Vanity domains default redirect-only

Acceptance criteria

No attribution loss (path + query preserved).

No redirect loops.

Vanity domains never create cross-domain cart/checkout failures.

Workstream 9 — Security + observability baseline with tenant-aware SLIs
Goal

Make debugging multi-tenant issues tractable and ensure monitoring catches “one shop is on fire” scenarios.

Coding (Codex)

Security headers baseline.

Rate limiting profiles (front door + gateway).

Request tracing:

x-request-id propagation everywhere

logs include shopId, requestId, endpoint, outcome, latency

Tenant-aware SLIs (required)

Emit metrics with shopId dimension for:

error rate (4xx/5xx) per endpoint family

checkout creation latency

webhook processing latency + backlog/dead-letter counts

inventory validate/hold latency + inventory_busy rates

reconciliation normalization count

Alerting:

“Shop X error rate spike” (not just global)

“Shop X checkout failures” thresholds

“Shop X webhook unresolved tenant events” thresholds

Cloudflare / Terminal

Configure WAF/rate limits for front door and gateway.

Configure Logpush/log streaming and ensure requestId/shopId correlation fields are captured.

Access token rotation policies.

Acceptance criteria

A single request can be traced across edge and node layers reliably.

Monitoring can alert on “Error rate spike for Shop X” and not just global error rate.

Sequencing (practical rollout order)

Workstream 2 (Front Door + mapping + allowlist) + Workstream 1 (basic injection + enforcement scaffolding)

Workstream 1 (remove defaults/hardcodes; enforce tenant context everywhere)

Workstream 3 (webhook multi-tenancy + mapping table + dead-letter + backfill tooling)

Workstream 5 (money invariants + shared formatting utils + reconciliation normalization)

Workstream 4 (inventory alignment + holds + jittered retries)

Workstream 6 (worker convergence + optimistic “Processing…” UX + deprecation window)

Workstream 7 (payments breadth consolidation + tenant-scoped jobs)

Workstreams 8–9 continuously (domain rollout + security/observability hardening)

