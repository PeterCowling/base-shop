---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-product-management
Execution-Track: code
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/inventory-uploader-product-management/fact-find.md
Related-Plan: docs/plans/inventory-uploader-product-management/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Inventory Uploader — Product Management + Caryina DB Migration Analysis

## Decision Frame

### Summary

Caryina's product and inventory data is stored in flat JSON files that cannot be read or written on the Cloudflare Workers runtime — the shop silently returns zero products in production. No operator tool exists to add, edit, or remove products across any shop in the platform. The decision is: **which approach should deliver both product management capability for all shops and reliable PostgreSQL-backed storage for caryina**?

The operator has already selected the full Prisma path at ideas stage. This analysis validates that selection against the alternatives, confirms there are no viable competing approaches, and produces the planning handoff.

### Goals

- Add `Product` model to Prisma schema; complete `prismaProductsRepository` write/update/delete/duplicate methods.
- Add product CRUD API routes and Products tab UI to inventory-uploader.
- Migrate caryina products and inventory from JSON files to PostgreSQL.
- Wire caryina wrangler.toml with `DATABASE_URL` + `DB_MODE=prisma`.
- Move refunds endpoint from caryina admin to inventory-uploader.
- Delete the caryina admin panel.

### Non-goals

- Multi-locale product editing UI (single-value for all locales, matching existing caryina behaviour).
- Product image upload (media URLs provided as strings).
- Per-shop role-based access control.
- Migrating other shops to Prisma in this delivery.

### Constraints & Assumptions

- Constraints:
  - Cloudflare Workers with `nodejs_compat` — no filesystem. PostgreSQL must be reachable.
  - Prisma schema uses `provider = "postgresql"` — no D1.
  - `adminSchemas.ts` (caryina) must be promoted before admin panel can be deleted.
  - Deployment ordering is critical: schema migration → data migration → env var cutover → admin panel deletion.

- Assumptions:
  - Same `DATABASE_URL` covers caryina (same PostgreSQL cluster, different `shopId`).
  - `prisma generate` runs in caryina's CI/deployment pipeline.
  - Refunds endpoint move includes all payment credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) being added to inventory-uploader wrangler secrets.

## Inherited Outcome Contract

- **Why:** Caryina product and stock data is saved in files that do not work on the Cloudflare Workers hosting platform — the shop is silently broken in production for any data write. No operator tool exists to add, edit, or remove products across any shop. Fixing this gives caryina reliable database storage and gives all shops a product management screen in the inventory tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inventory-uploader has a working Products tab for all shops. Caryina products and inventory are stored in PostgreSQL. The caryina admin panel is removed. Product data is no longer stored in flat files for any shop.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/inventory-uploader-product-management/fact-find.md`
- Key findings used:
  - `prismaProductsRepository` read/getById are Prisma-aware; write/update/delete/duplicate delegate unconditionally to `jsonProductsRepository` — all four methods are stubs.
  - `Product` model absent from `packages/platform-core/prisma/schema.prisma`; `InventoryItem` model (line 147) is the implementation reference.
  - `products.json.server.ts:26-34`: Workers catch block returns `[]` silently — caryina storefront shows zero products in production.
  - `apps/inventory-uploader/wrangler.toml` has `DATABASE_URL` wrangler secret + `InventoryAuditEvent` Prisma writes in prod — validates PostgreSQL-from-Workers path.
  - Existing API route pattern fully established (`adjustments/route.ts`): `runtime="nodejs"`, Zod, `apiError()`.
  - Middleware auto-protects all new product routes in inventory-uploader — no new auth code required.
  - Data migration is small: 3 products, 4 inventory rows. `InventoryItem` model already supports the 4 rows; only `Product` model needs adding.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Workers runtime compatibility | Caryina is already broken on Workers with fs-backed data — fixing this is not optional | Critical |
| Platform reuse (all shops benefit) | Product management tool should serve all shops, not just caryina | High |
| Build effort and risk | Additive schema change vs invasive re-architecting | High |
| Data migration safety | 3 products + 4 inventory rows — must not lose or corrupt | High |
| Rollback clarity | Must be able to revert without losing data if deployment fails | Medium |
| Operational tooling continuity | Refunds endpoint must stay functional throughout the transition | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Full Prisma path (chosen) | Add `Product` model, complete Prisma repo, add inventory-uploader product CRUD + UI, migrate 3 products + 4 inventory rows to PostgreSQL, wire caryina env vars, move refunds, delete admin panel | Fixes Workers runtime incompatibility permanently; gives all shops product management; uses existing Prisma/PostgreSQL infrastructure already proven in prod; clean deletion of unprotected caryina admin | Requires schema migration (low risk, additive only); requires data migration (3 products — minimal risk); requires deployment ordering discipline | Data migration runs after env var cutover (storefront briefly empty) — mitigated by explicit sequencing | **Yes** |
| B — Static bundle workaround | Embed caryina products as a hardcoded JS array in the Workers build; bypass filesystem entirely | Zero schema changes; instant fix for the read path | Write path (product CRUD) still impossible; product management goal unmet; creates a maintenance anti-pattern (code changes required for every product edit); doesn't help other shops | Forever workaround — no path to product management | **No — rejected** |
| C — Cloudflare D1 (SQLite) | Replace PostgreSQL with Cloudflare D1 for product/inventory storage | Native Workers database with no TCP connectivity concerns | Entire Prisma schema and all existing inventory data would require D1 migration; Prisma D1 adapter is experimental; inventory-uploader already uses PostgreSQL in production; breaks the unified platform schema | Massive scope expansion; no evidence D1 is planned for the platform; breaks existing inventory tooling | **No — rejected** |
| D — Fix caryina admin panel (keep it) | Add `middleware.ts` to caryina, fix filesystem issue (e.g. force JSON reads at build time), preserve the admin panel | No new app surface | Doesn't solve the platform gap (all shops still have no product management tool); caryina admin remains a separate auth domain (CARYINA_ADMIN_KEY) inconsistent with inventory-uploader; duplicates operator tooling | Security debt remains (separate, weaker auth); product management fragmented across apps | **No — rejected** |

## Engineering Coverage Comparison

| Coverage Area | Option A | Rejected options | Chosen implication |
|---|---|---|---|
| UI / visual | New Products tab in inventory-uploader using established tab/panel pattern | Option B: no UI needed; Option C: major rebuild; Option D: preserves existing broken UI | Build Products tab against `gate-*` tokens; follow existing `RightPanelTab` extension pattern in `InventoryConsole.client.tsx` |
| UX / states | Full create/edit/delete flows; empty-catalogue state; delete-confirmation; success/error feedback | Option B: read-only static display; others N/A | Define empty-catalogue state, delete-confirmation modal, success/error inline feedback |
| Security / privacy | New product routes auto-protected by existing inventory-uploader middleware; Zod validation on all inputs including refunds route | Option D: caryina admin security debt persists; Option B/C: no auth improvement | Refunds endpoint must carry over the existing `refundRequestSchema` Zod validation from `apps/caryina/src/lib/adminSchemas.ts` |
| Logging / observability / audit | `console.info` on product write/update/delete routes; full audit trail (InventoryAuditEvent-style) deferred as future work | Other options: no improvement | Log `shopId`, `productId`/`sku`, action at `console.info` on each mutation; no new `AuditEvent` model in this delivery |
| Testing / validation | Unit tests for new `prismaProductsRepository` methods; unit tests for new inventory-uploader routes including refunds; dry-run assertion on migration script | Option B/D: fewer new tests but also less coverage | Caryina admin test files deleted; new tests added for each new route and each new Prisma method |
| Data / contracts | Additive schema migration (`Product` model only); no existing models changed; `@@unique([shopId, sku])` (conventional) + `@@unique([shopId, id])` (code-required); data migration: 3 products + 4 inventory rows | Option C: full D1 schema rewrite; Option B/D: no schema change | Migration is additive — no destructive SQL. Run `prisma migrate deploy` against staging before production. |
| Performance / reliability | Product catalogues 3–100 items; no hot-path concern; Prisma connection pooling via platform-core singleton | N/A across all options | N/A — no performance work required |
| Rollout / rollback | Order: (1) schema migration, (2) `prisma generate`, (3) data migration, (4) deploy caryina with `DB_MODE=prisma`, (5) delete admin panel. Rollback: remove `DB_MODE` var → JSON fallback restores (silent-failure state — acceptable short-term) | Option B: no deployment risk; Option C: no safe rollback | Migration-first ordering is a hard sequencing constraint. Plan must enforce this order. Staging validation of schema + data migration before production cutover. |

## Chosen Approach

- **Recommendation:** Option A — Full Prisma path.
- **Why this wins:** It is the only option that simultaneously resolves the Workers runtime incompatibility (making caryina functional in production), delivers platform-level product management capability (all shops benefit), and uses the existing proven PostgreSQL/Prisma infrastructure. The rejected options either leave the product management goal unmet (B, C, D), introduce new infrastructure risk (C), or preserve security technical debt (D). The scope is bounded — all implementation patterns are established, the data migration is tiny (3 products, 4 rows), and the schema change is additive only.
- **What it depends on:**
  - `DATABASE_URL` for caryina pointing to the same PostgreSQL cluster as inventory-uploader.
  - Deployment pipeline running `prisma generate` for caryina.
  - All payment credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) added to inventory-uploader wrangler secrets before admin panel deletion.
  - Migration-first ordering strictly enforced.

### Rejected Approaches

- **Option B (static bundle workaround)** — Rejected: doesn't solve the write-path failure or the product management goal. Trades a runtime bug for a maintenance anti-pattern.
- **Option C (Cloudflare D1)** — Rejected: major scope expansion with no existing D1 infrastructure; Prisma D1 adapter is experimental; breaks existing inventory tooling.
- **Option D (fix caryina admin panel)** — Rejected: preserves security debt (weaker auth model), fragments operator tooling across two apps, and doesn't give other shops product management capability.

### Open Questions (Operator Input Required)

- **Q: Should the refunds endpoint transition happen in the same delivery as the admin panel deletion, or as a separate follow-on delivery?**
  - Why operator input is required: Both approaches work technically. Same-delivery increases scope but ships everything at once. Separate-delivery allows faster admin panel deletion if refunds are rarely used. Default assumption (same delivery) is safe but adds ~1 task of scope.
  - Planning impact: If separate delivery, task 9 (admin panel deletion) must be scoped to preserve only the refunds endpoint in caryina; full admin panel deletion deferred to a follow-on.
  - **Default (applied if no input):** Same delivery — refunds ported in this plan before admin panel is deleted.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Product CRUD (caryina + all shops) | No operator tool exists. Caryina admin at `/admin/products` is unprotected and non-functional on Workers. | Operator opens inventory-uploader → navigates to Products tab → selects shop | Operator logs into inventory-uploader → selects shop → opens Products tab → creates/edits/deletes product via form → PATCH/POST/DELETE to `/api/inventory/[shop]/products/[id]` → `prismaProductsRepository.update/write/delete` → PostgreSQL write. All shops supported by same routes. | Auth model (HMAC cookie, middleware) unchanged. Route pattern unchanged. | New Products tab UI must be built against existing tab pattern. Empty-catalogue UX state needed. |
| Storefront product reads (caryina) | `readRepo("caryina")` → JSON fallback → `fs.readFile` on Workers → catches → silent `[]`. Shop shows zero products in production. | Storefront request to `/shop` or `/product/[slug]` | `readRepo("caryina")` → `repoResolver` detects `DB_MODE=prisma` + valid `DATABASE_URL` → `prismaProductsRepository.read()` → `prisma.product.findMany({ where: { shopId: "caryina" } })` → returns 3 products. Storefront renders normally. | `readRepo` interface unchanged. Storefront page components unchanged. | `DB_MODE=prisma` must not be deployed before data migration runs. Staging validation required. |
| Inventory update (caryina) | Admin panel at `/admin/api/inventory/[sku]` — unprotected, non-functional on Workers. Inventory-uploader already serves inventory management for all shops via Prisma. | Operator adjusts stock in inventory-uploader | Inventory-uploader already covers this path via `/api/inventory/[shop]/adjustments`. No change needed for inventory writes. | InventoryItem model, inventory routes, and UI are unchanged. | Confirm caryina's `InventoryItem` rows migrate cleanly with the inventory data migration script. |
| Refunds | `/admin/api/refunds` in caryina — unprotected, handles Axerve + Stripe. | Operator issues a refund | Operator logs into inventory-uploader → POST to `/api/inventory/[shop]/refunds` → `resolveRefundProvider` → Axerve or Stripe refund call. Credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `STRIPE_SECRET_KEY`) in inventory-uploader wrangler secrets. | Payment provider logic (`callRefund`, `refundStripePayment`) unchanged — ported directly. Zod validation (`refundRequestSchema`) preserved. | All three credentials must be in inventory-uploader wrangler secrets before caryina admin is deleted. |
| Caryina admin panel | `/admin/*` routes in `apps/caryina` — auth guard never invoked (no `middleware.ts`). Security liability. | N/A (to be deleted) | All files under `src/app/admin/`, `src/proxy.ts`, `src/lib/adminAuth.ts`, `src/lib/adminSchemas.ts` deleted. Related test files deleted. `inventoryBackend.ts` constant deleted. | Everything outside the admin subtree in caryina unchanged. | Delete order: after refunds are confirmed working in inventory-uploader and caryina DB_MODE switch is confirmed working. |

## Planning Handoff

- **Planning focus:**
  - Hard sequencing constraint: task ordering must be (1) schema migration + `prisma generate`, (2) complete Prisma repo methods, (3) API routes, (4) UI, (5) refunds move + credentials, (6) data migration script, (7) caryina wrangler.toml env vars, (8) admin panel deletion. Steps 6 and 7 must precede step 8.
  - Zod schema promotion: `createProductSchema`, `updateProductSchema`, `refundRequestSchema` extracted from `apps/caryina/src/lib/adminSchemas.ts` to `apps/inventory-uploader/src/lib/productSchemas.ts` before admin panel deletion.
  - New test coverage required: `prismaProductsRepository` unit tests (4 methods), product CRUD route tests (5 routes), refunds route test (1 route), migration script dry-run test.

- **Validation implications:**
  - Each new Prisma repository method needs a unit test with a mock Prisma client.
  - Staging `prisma migrate deploy` must run before production migration.
  - Data migration script must verify row counts: input count from JSON = output count from DB query.
  - Caryina storefront smoke test: `/shop` page must render > 0 products after DB_MODE switch.
  - Refunds smoke test: inventory-uploader refunds route must accept a valid request with both Axerve and Stripe paths exercised.

- **Sequencing constraints:**
  - Schema migration → `prisma generate` → Prisma repo methods → API routes → UI → schema promotion → refunds route + credentials → data migration → caryina env vars → admin panel deletion.
  - Caryina wrangler.toml env var deployment must happen AFTER data migration is verified — not before.
  - Admin panel deletion must happen AFTER refunds are confirmed working in inventory-uploader.

- **Risks to carry into planning:**
  - Migration-ordering risk (medium/high): if env vars deploy before data migration, storefront returns empty. Plan must make this ordering explicit in task dependencies.
  - Payment credentials completeness (medium/high): all three payment credential env vars must be in inventory-uploader wrangler secrets before task — plan must list all three explicitly.
  - `prisma generate` in caryina CI/CD (medium): unverified — plan must include a verification step or add `prisma generate` to the caryina build pipeline.
  - Same `DATABASE_URL` assumption (low/high): plan should confirm the DATABASE_URL value before proceeding with env var wiring.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Env var deployment before data migration — storefront shows zero products | Medium | High | Deployment ordering is an operational discipline issue, not an analysis choice | Plan must enforce explicit task dependency: data migration task must complete before env var wiring task |
| Missing payment credentials when refunds route is moved | Medium | High | Credentials are environment configuration — requires operator to add secrets to wrangler | Plan task must list all three credential names and require smoke-test confirmation before admin deletion |
| `prisma generate` absent from caryina CI/CD | Medium | Medium | Cannot verify CI/CD pipeline from analysis phase without running pipeline | Plan must include a verification sub-step: check `wrangler.toml` / CI pipeline for `prisma generate` presence |
| Same DATABASE_URL assumption unverified | Low | High | `.env.local` DATABASE_URL value not confirmed to match inventory-uploader's | Plan must include a pre-migration verification step comparing the DATABASE_URL values |

## Planning Readiness

- **Status:** Go
- **Rationale:** Evidence Gate, Option Gate, and Planning Handoff Gate all pass. The chosen approach is decisive, alternatives are documented and eliminated, sequencing constraints are explicit, and no unresolved blockers remain. The one open operator question (refunds delivery scope) has a safe default that allows planning to proceed. All engineering coverage areas are addressed.
