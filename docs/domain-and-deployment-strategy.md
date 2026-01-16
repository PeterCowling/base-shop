Type: Plan
Status: Active
Domain: CI-Deploy
Last-reviewed: 2026-01-16
Last-updated: 2026-01-16
Last-updated-by: Codex
Relates-to charter: docs/architecture.md

# Domain & Deployment Strategy — Worker Front Door + Early Multi‑Tenancy

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

## Summary decision

- **Default launch surface**: `shopSlug.<umbrella>/<lang>/...`
- **Campaigns**: locale-aware paths on canonical host: `shopSlug.<umbrella>/<lang>/lp/<campaign>`
- **Vanity domains (rare)**: redirect-only `productX.com/*` → canonical LP (never creates cart state)
- **Owned brands**: `brand.com` mapped to the same underlying runtime when durable (or day 1 if known durable)
- **Non‑negotiable invariant**: if a user can create/modify a cart on host A, checkout must complete on host A (cart cookie is host-only by design).

This plan commits to **Worker as the origin entrypoint** for shop and brand traffic, and treats deployment consolidation (**Phase 1.5**) as an early milestone to avoid drifting into “project-per-shop”.

## Repo anchors (code truth)

- Cart cookie is host-bound: `packages/platform-core/src/cartCookie.ts`
- Storefront locale contract (example app): `apps/cover-me-pretty/middleware.ts` and `apps/cover-me-pretty/src/app/[lang]/**`
- “Project-per-shop drift” is structurally present: `packages/platform-core/src/createShop/deploy.ts`
- Pages custom-domain provisioning exists today (but becomes optional under this plan): `apps/cms/src/actions/cloudflare.server.ts`

## Known Cloudflare constraints (hard rules)

Treat these as architecture drivers, not “edge cases”:

- **Pages custom domains cannot be wildcard** (no `*.domain.com` attachment to Pages).
- **Pages domain attachment is blocked** if a **Worker is already routed** on that hostname; Access policies can also block attachment.
- **Domain verification / certificate issuance can fail** if `/.well-known/acme-challenge/*` is blocked/intercepted (Workers/Access).
- **Pages projects have scaling pressure** (soft ~100 projects/account; monorepo defaults can cap Pages projects per repo).
- **Custom domains per Pages project are plan-capped** (Free 100 / Pro 250 / Business 500 / Enterprise 500).

Implication: treating Pages as the owner of most canonical hostnames does not scale cleanly; a Worker entrypoint avoids recurring “can’t attach this domain” problems.

## Choose the front door (forced choice)

The “front door” is the first component that receives traffic for canonical hostnames and decides:

- which runtime serves the request (storefront vs checkout vs CMS),
- where redirects/canonicals happen,
- where security headers/bot controls live,
- and how many deployments must remain in sync.

### Option A — Pages is the front door

**Shape**

- Each canonical hostname is attached directly to a Cloudflare Pages project.
- Pages serves the storefront (and ideally its APIs) on that hostname.

**Where it fails in practice**

- Pages hostname attachment is fragile (blocked by wildcard needs, Worker routes, Access policies, ACME validation reachability).
- You inherit **project sprawl** (hotfix fan-out + drift) as shop count grows.

**Non-negotiables if this option is chosen**

- Keep checkout on the same hostname as cart activity (host-only cookie boundary).
- Don’t route a Worker on hostnames planned for Pages attachment (domain attach will fail).
- Ensure `/.well-known/acme-challenge/*` is reachable during domain verification (Access/Workers can block it).

**Choose this only if**

- You expect single-digit to low‑teens canonical storefront hostnames in the next 90 days, and
- Workers can remain off storefront hostnames that will be attached to Pages, and
- You accept deployment fan-out during that period.

### Option B — Worker is the front door (recommended baseline)

**Shape**

- A Worker receives traffic first for umbrella subdomains (and optionally brand domains).
- It routes by hostname + path to the correct runtime.

**Important nuance**

- Wildcard tenancy is achieved via **Worker Routes / dispatch** (e.g. `https://*.umbrella.com/*`), not Worker Custom Domains.
- Choosing this means Worker is the stable origin entrypoint (a real platform decision, not a small tweak).

**Two implementation variants**

- **B1 — Dispatch to Workers (preferred)**: front door routes to other Workers (storefront runtime, checkout, CMS APIs) via service bindings; hostname/cookies remain natural.
- **B2 — Proxy to Pages (possible, sharp edges)**: front door fetches a Pages origin; requires disciplined handling of absolute redirects/canonicals and “external host” headers.

**Choose this if**

- You expect dozens of shops/products, or
- You want wildcard routing under the umbrella, or
- You want canonicalization/security/rate-limiting in one place, or
- You want to avoid Pages domain-attach blockers as a default operating mode.

## Target architecture

### Front Door Worker (mandatory)

Responsibilities:

1) Resolve site context
- `hostname -> { shopId, canonicalHost, defaultLocale, allowedLocales, mode }`
- `mode ∈ { active, landing-only, expired }`

2) Enforce canonical host
- If host is an alias → `301` to canonical (preserve path + query)

3) Enforce locale prefix (must preserve suffix + query)
- If path is not locale-prefixed and not allowlisted (`/api`, `/cms`, `/.well-known`, `/_next`, static assets):
  - `307` → `/<defaultLang><path>?<query>`
- This is a “must ship first” behaviour to avoid attribution loss.

4) Route by path
- `/api/checkout/*` (and optionally `/checkout/*`) → Checkout Worker
- `/cms/*` → CMS runtime (optional; if hosted under platform hostnames)
- everything else → Storefront runtime

5) Apply platform-wide controls
- baseline security headers, request IDs, logging fields, bot/rate-limit hooks

### Multi-tenant storefront runtime (Phase 1.5 — required)

Instead of “one Pages project per shop”, deploy one storefront runtime (or a small handful) that serves many shops.

Key behaviours:

- Reads `shopId` from:
  - `Host` header, or
  - `X-Shop-Id` injected by the Front Door Worker (recommended)
- Loads shop config dynamically from shared storage (D1/KV/R2) and/or CMS API with caching.

This is the inflection point that prevents the distributed‑monolith trap (50 deploy pipelines for one hotfix).

### Checkout Worker (dedicated)

A dedicated Worker handles:

- Stripe session creation, fraud/rate limiting
- webhooks (optionally on a separate non-public webhook hostname)
- optional queues for order finalization

Routing rule: checkout must occur on the same host that owns cart state (host-bound cookie invariant).

## DNS and routing setup

### Umbrella shops (subdomains)

For `shopSlug.<umbrella>`:

- DNS: orange-cloud wildcard record for the shop namespace (pattern: `*.umbrella.com`)
- Worker Route: `https://*.umbrella.com/*` → Front Door Worker
- If apex `umbrella.com` is required, add `https://umbrella.com/*` as a separate route and treat it as a root marketing site or redirector.

### Brand domains (apex domains like `brand.com`)

Two supported operational models:

- **Model A (simplest if DNS is controlled)**: `brand.com` is a zone in the Cloudflare account; add a Worker Route `https://brand.com/*` to the same Front Door Worker.
- **Model B (SaaS-scale)**: Cloudflare for Platforms custom hostnames + dispatch logic when supporting many vanity domains without managing each as a zone.

Worker logic and tenant mapping are the same in both models.

## Configuration model and control plane

### Data model (minimum viable)

Store per site (shop/brand):

- `shopId` (primary key)
- `canonicalHost`
- `aliasHosts[]` (e.g. `www.brand.com`, legacy hosts)
- `vanityHosts[]` (redirect-only hosts; optional)
- `defaultLocale` and `locales[]` (e.g. `en`, `en-gb`, `de`)
- `mode`: `active` | `landing-only` | `expired`
- `expiresAt` (required for labs/flippers)
- origin targets:
  - storefront target (service binding name or origin URL)
  - checkout target
  - cms target (optional)

### Storage and update flow

Recommended baseline:

- **D1** as source of truth (predictable updates for cutovers)
- **KV** as read-optimized cache for edge lookups
- CMS writes to D1 and triggers KV refresh (write-through or event-driven)

## Request flows

### Normal shop browsing

User visits: `shopSlug.umbrella.com/summer-sale?utm=...`

- Front Door Worker:
  - resolves shop
  - `307` → `/<defaultLang>/summer-sale?utm=...` (preserve suffix + query)
- Storefront runtime renders and sets cart cookie on that host (as needed).
- Checkout stays on the same host:
  - `shopSlug.umbrella.com/<lang>/checkout`
  - `shopSlug.umbrella.com/api/checkout/*` routed to Checkout Worker

### Vanity/campaign domains (hand-off that avoids cookie traps)

Default rule: vanity domains are redirect-only.

- `perfect-product.com/*` → `302/307` to `https://shopSlug.umbrella.com/<lang>/lp/<campaign>?utm=...`
- Vanity domain never renders cart UI and never attempts cross-domain session sync.

If marketing insists on rendering on the vanity domain, it must be `landing-only`:

- allow only `/` and `/<lang>/lp/*` content
- CTA links directly to canonical host “buy now” / checkout permalink

## Active tasks

- **FD-00 — Locale redirect correctness (no attribution loss)**
  - Status: ☐
  - Scope:
    - Ensure the front door locale-prefix redirect preserves **path suffix + query**.
    - Add a regression test for: `/lp/foo?utm_source=x` → `/<defaultLang>/lp/foo?utm_source=x` (307).
    - Audit any app-level middleware that currently drops suffix/query on non-locale paths (example risk: `apps/cover-me-pretty/middleware.ts`).
  - Dependencies:
    - None.
  - Definition of done:
    - Locale injection preserves suffix + query everywhere (edge + app).
    - No ads/UTM landing loses its route.

- **FD-01 — Front Door Worker skeleton**
  - Status: ☐
  - Scope:
    - Deploy Front Door Worker to staging with wildcard route.
    - Implement canonical host enforcement + allowlist routing (`/api`, `/cms`, `/.well-known`).
    - Implement deterministic unknown-host behaviour (404 or platform landing).
  - Dependencies:
    - FD-00 (redirect semantics finalised).
  - Definition of done:
    - Alias host 301s to canonical without loops.
    - Non-locale paths are rewritten to `/<defaultLang>/...` without dropping suffix/query.

- **FD-02 — Tenant mapping store + CMS integration**
  - Status: ☐
  - Scope:
    - Define D1 schema + KV cache for hostname→site mapping.
    - Add CMS UI/API to manage canonical/aliases/TTL/mode.
    - Worker reads from KV (D1 fallback on cache miss).
  - Dependencies:
    - FD-01.
  - Definition of done:
    - Domain cutover is executed by updating CMS mapping only.
    - Changes propagate predictably and are auditable (who/when/what).

- **FD-03 — Checkout routing and same-host enforcement**
  - Status: ☐
  - Scope:
    - Integrate Checkout Worker service binding and route `/api/checkout/*` from front door.
    - Ensure checkout UI and API calls stay on the same host as cart activity.
    - Ensure checkout worker can resolve `shopId` (header or lookup).
  - Dependencies:
    - FD-01, FD-02.
  - Definition of done:
    - Cart → checkout works with no cross-host cookie hacks.
    - Checkout worker logs show correct `shopId` and host.

- **FD-04 — Multi-tenant storefront runtime (Phase 1.5)**
  - Status: ☐
  - Scope:
    - Consolidate storefront deployments so multiple shops are served by one runtime.
    - Remove build-time “shop baked in” assumptions on the runtime path.
    - Load shop config dynamically from shared store (D1/KV/R2/CMS API).
  - Dependencies:
    - FD-02 (mapping exists).
  - Definition of done:
    - Adding a new shop does not require a new Pages project by default.
    - A single hotfix deploy updates all shops simultaneously.
    - Per-shop theme/content separation verified.

- **FD-05 — Migration of existing shops and domains**
  - Status: ☐
  - Scope:
    - Migrate existing hostnames to Worker-front-door routing.
    - Reduce reliance on Pages custom-domain attachment where feasible.
    - Add `landing-only` + TTL tagging for experiments.
  - Dependencies:
    - FD-04 (or a deliberate “temporary origins behind worker” decision).
  - Definition of done:
    - No SEO duplication (canonical rules consistent).
    - No attribution loss on marketing redirects.
    - Error budgets per shop remain stable during cutover.

- **FD-06 — Flipper TTL enforcement and cleanup automation**
  - Status: ☐
  - Scope:
    - Require TTL on labs/flipper shops.
    - Scheduled process transitions expired shops to discontinued experience / redirect / 410.
    - Ensure redirects preserve user experience and don’t create SEO chaos.
  - Dependencies:
    - FD-02 (mode + expiresAt available).
  - Definition of done:
    - No “forever-live” zombie flipper sites.
    - Cleanup is automatic, not manual policing.

## Operational policies

- Keep the host-only cart boundary strict: browse/cart/checkout remain on the same host.
- Centralize canonical enforcement, redirects, and security posture in the Front Door Worker.
- Treat Pages domain-attachment as an exceptional mechanism (legacy or special-case), not the default.

## Migration playbook (add to every domain promotion PR)

When moving `shopSlug.<umbrella>` → `brand.com`:

1) Verify the hostname is attachable/routable (avoid Worker-route/Access conflicts if attaching to Pages; ensure `/.well-known/acme-challenge/*` isn’t blocked).
2) Set canonical host + per-locale canonical base rules.
3) Implement 301s preserving deep links + query.
4) Validate canonical + hreflang.
5) Update paid ads destinations and affiliate links.
6) Update transactional email domains (SPF/DKIM/DMARC) and warm-up plan.
7) Verify Search Console / analytics properties and sitemaps reflect the new canonical host.
8) Update support/help center links and customer email templates if they reference old URLs.
9) Monitor crawl errors + conversion for at least one release cycle; keep rollback and “stop the bleeding” redirects ready.

## Risk register (top 10)

- **Locale redirect drops suffix/query → attribution loss**: enforce “preserve suffix + query” in the front door (FD-00) + regression tests.
- **Domain attach blocked (Worker routes / Access / ACME)**: default to Worker-front-door ownership; preflight attach checks; don’t block `/.well-known/acme-challenge/*`.
- **Project-per-shop drift**: ship Phase 1.5 multi-tenancy (FD-04); treat per-shop projects as temporary scaffolding only.
- **Cross-host checkout breaks cart/session**: same-host checkout enforcement (FD-03); vanity domains must be landing-only and redirect before cart exists.
- **SEO duplication across aliases**: edge 301 alias→canonical + consistent canonical/hreflang; treat vanity domains as redirect-only.
- **Email deliverability regression on new apex domains**: SPF/DKIM/DMARC + warm-up; avoid frequent “burner” apex domains.
- **Flipper risk contaminates owned brands**: isolate flippers under separate umbrella namespace + enforce TTL + cleanup automation (FD-06).
- **Custom-domain caps hit unexpectedly**: reserve apex domains for durable brands; keep product domains redirect-only; consider Cloudflare for Platforms for large vanity counts.
- **Governance gaps (who owns a hostname, when it expires)**: hostname mapping in D1 with audit trail (FD-02) + TTL required for experiments.
- **Observability blind spots across tenants**: include `shopId` in logs/metrics; dashboards keyed by host/shopId before scaling shop count.
