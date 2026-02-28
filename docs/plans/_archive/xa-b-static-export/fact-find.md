---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: xa-b-static-export
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-b-static-export/plan.md
Trigger-Why: CF Workers free tier hits 10ms CPU limit on SSR routes causing 1102 errors; static export on CF Pages free tier eliminates this entirely with no per-request CPU constraint and no $5/month cost.
Trigger-Intended-Outcome: type: operational | statement: xa-b deploys successfully as a static export to CF Pages free tier; all pages render correctly; CI builds and deploys via wrangler pages deploy | source: operator
---

# xa-b Static Export Fact-Find Brief

## Scope

### Summary
Convert xa-b (Next.js 16 storefront) from SSR via OpenNext/CF Workers to `output: 'export'` static generation deployed to Cloudflare Pages free tier. This removes the CF Workers Standard $5/month requirement and eliminates 1102 CPU-timeout errors. All 8 identified blockers require code changes; the approach is fully feasible given the app's all-demo-data architecture.

### Goals
- Remove `output` override in `next.config.mjs` so xa-b builds as a static site (`output: 'export'`)
- Remove `runtime = "nodejs"` exports from `layout.tsx` and `robots.ts`
- Replace the `api/search/sync` route handler with a build-time-generated static JSON file in `public/`
- Move server-side `searchParams` in `new-in/page.tsx` and `designer/[slug]/page.tsx` to client-side `useSearchParams()` (matching the established pattern in `search/page.tsx` and `checkout/success/page.tsx`)
- Add `generateStaticParams()` to all 14 dynamic route files
- Replace middleware security headers with `public/_headers` for CF Pages
- Add `images: { unoptimized: true }` to `next.config.mjs` for `next/image` static export compatibility
- Update `wrangler.toml` from Workers format to CF Pages format
- Update `.github/workflows/xa.yml` deploy step from `opennextjs-cloudflare build + wrangler deploy` to `next build + wrangler pages deploy`
- Remove orphaned account UI pages (`app/account/login`, `register`, `orders`, `orders/[orderId]`, `trackingorder`) whose account API was already removed

### Non-goals
- Any server-side rendering capability (fully going static)
- Migrating xa-drop-worker or xa-uploader (out of scope)
- Adding new features or routes to xa-b
- Real customer account system (deferred; reference implementation in `docs/reference/xa-account/`)

### Constraints & Assumptions
- Constraints:
  - Must stay on Cloudflare Pages free tier (no paid plans)
  - Must use webpack build (the build script already passes `--webpack` to avoid Turbopack)
  - All product/catalog data is static demo data from `src/data/catalog.runtime.json` — no live API at request time
  - `XA_STEALTH_MODE` env var controls stealth behavior; must remain configurable via CF Pages env vars at build time
- Assumptions:
  - The operator will create a CF Pages project named `xa-b-site` (or equivalent) manually in the Cloudflare dashboard; this is a one-time operator action not automatable from CI without the Pages API
  - All dynamic routes can be enumerated at build time from static data (`XA_PRODUCTS`, `XA_BRANDS`, `XA_COLLECTIONS`, `XA_EDITS`, `XA_SUBCATEGORIES`)
  - `catalog.runtime.json` is synced from xa-drop-worker at build time via `build-xa.mjs` — this flow is compatible with static export as-is

## Outcome Contract

- **Why:** CF Workers free tier hits 10ms CPU limit per request causing 1102 errors on SSR pages; static export on CF Pages free tier has no per-request CPU cost and no monthly fee, directly eliminating the operational blocker.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b builds as `output: 'export'` without errors, all static pages are pre-generated at build time, CI deploys via `wrangler pages deploy`, and the app loads correctly on CF Pages staging with no 1102 errors.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-b/next.config.mjs` — build config; line 62 suppresses static export for xa-b even when `OUTPUT_EXPORT=1` is set upstream
- `apps/xa-b/middleware.ts` — security headers only (52 lines); sets CSP, X-Frame-Options, etc.; runs on every route; does NOT run in `output: 'export'` mode
- `apps/xa-b/wrangler.toml` — currently configured as OpenNext Worker (`main = ".open-next/worker.js"`); must be converted to CF Pages format
- `.github/workflows/xa.yml` — CI pipeline; currently uses `opennextjs-cloudflare build` + `wrangler deploy` for xa-b

### Key Modules / Files

- `apps/xa-b/next.config.mjs:62` — `output: sharedConfig.output === "export" ? undefined : sharedConfig.output` — intentional static-export opt-out that must be reversed
- `apps/xa-b/src/app/layout.tsx:20` — `export const runtime = "nodejs"` — must be removed; comment says "edge runtime breaks during page data collection" (no longer relevant post stealth/account removal)
- `apps/xa-b/src/app/robots.ts:4` — `export const runtime = "nodejs"` — must be removed
- `apps/xa-b/src/app/api/search/sync/route.ts` — only remaining API route; reads `XA_PRODUCTS` from `demoData.ts`, computes ETag, returns JSON; must be replaced with a pre-generated `public/catalog.json` and the route handler deleted
- `apps/xa-b/src/app/new-in/page.tsx:8-13` — server async component with `searchParams?: Promise<URLSearchParams | {...}>` prop; filters products by `department` and `window` query params; must refactor to client component using `useSearchParams()`
- `apps/xa-b/src/app/designer/[slug]/page.tsx:22-28` — server async component with `searchParams?: Promise<{tab?: string}>` prop; filters product tabs by `?tab=` param; must refactor to client component using `useSearchParams()`
- `apps/xa-b/src/components/XaFadeImage.tsx:4-5` — uses `next/image`; requires `images: { unoptimized: true }` in `next.config.mjs` for static export compatibility
- `apps/xa-b/src/lib/demoData.ts` — exports `XA_PRODUCTS`, `XA_BRANDS`, `XA_COLLECTIONS` from `catalog.runtime.json`; all data is available at build time
- `apps/xa-b/src/lib/xaCatalog.ts:19-23` — exports `XA_SUBCATEGORIES` with subcategory arrays for bags, clothing, jewelry; provides all values needed for nested dynamic route `generateStaticParams`
- `apps/xa-b/src/lib/xaEdits.ts:3-13` — exports `XA_EDITS` array with 2 edit slugs; needed for `edits/[slug]/generateStaticParams`
- `apps/xa-b/scripts/build-xa.mjs` — catalog sync script; fetches from xa-drop-worker, writes `catalog.runtime.json`, then calls `next build --webpack`; compatible with static export as-is

### Patterns & Conventions Observed
- Client-side `searchParams` pattern already established: `search/page.tsx` uses `useSearchParams()` inside a `"use client"` component wrapped in `<Suspense>` — same pattern needed for `new-in` and `designer/[slug]`
- `checkout/success/page.tsx` also uses `useSearchParams()` client-side — confirms pattern is safe
- `generateStaticParams` pattern: none exists yet; must be introduced fresh across 14 dynamic route files

### Data & Contracts
- **Static data source:** `apps/xa-b/src/data/catalog.runtime.json` — brands, collections, products (populated at build time by `build-xa.mjs` from xa-drop-worker)
- **Dynamic route enumerations** (all available at build time):
  - Products: `XA_PRODUCTS.map(p => ({handle: p.slug}))`
  - Brands/Designers: `XA_BRANDS.map(b => ({handle/slug: b.handle}))`
  - Collections: `XA_COLLECTIONS.map(c => ({handle: c.handle}))` + `["all"]`
  - Edits: `XA_EDITS.map(e => ({slug: e.slug}))` — 2 entries
  - Bags subcategories: `["tote","shoulder","crossbody","clutch","backpack","belt-bag","bucket"]` (7)
  - Clothing categories: `["outerwear","knitwear","tops","shirts"]` (4)
  - Jewelry types: `["necklaces","bracelets","earrings","rings"]` (4)
- **Catalog JSON format:** `{collections: [...], brands: [...], products: [...]}` — known stable contract with xa-drop-worker

### Dependency & Impact Map
- Upstream dependencies:
  - `xa-drop-worker` — provides catalog data at build time via HTTP; no change needed
  - `@acme/next-config` shared config — `sharedConfig.output` is read by xa-b's `next.config.mjs`; xa-b must override with `"export"` unconditionally
- Downstream dependents:
  - CF Pages project (xa-b) — deploy target changes from Worker to Pages
  - GitHub Actions xa.yml — build + deploy steps change
  - Service workers (`public/sw.js`) — already present; static export compatible
- Likely blast radius:
  - Only xa-b is affected. xa-drop-worker and xa-uploader are untouched.
  - 14 dynamic route files need `generateStaticParams` added
  - 2 server-component pages need client-side refactor
  - 5 account UI pages to be removed
  - 2 config files to update (`next.config.mjs`, `xa.yml`); `wrangler.toml` to be deleted (Worker-format; not used by `wrangler pages deploy`)
  - 1 API route file to replace with static artifact + script

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (via `pnpm test`)
- Commands: `pnpm --filter @apps/xa-b test`
- CI integration: `.github/workflows/xa.yml` — test job runs before deploy

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| next.config.mjs | Unit (security) | `src/__tests__/nextConfig.security.test.ts` | Tests config values, likely will need updates after output mode change |
| api/search/sync | Unit | `src/app/api/search/sync/__tests__/route.test.ts` | Tests GET handler — must be updated or removed when route is deleted |
| demoData | Unit | `src/lib/__tests__/demoData.test.ts` | Tests data loading — unaffected |
| xaCatalog | Unit | `src/lib/__tests__/xaCatalog.test.ts` | Tests catalog helpers — unaffected |
| xaFilters | Unit | `src/lib/__tests__/xaFilters.test.ts` | Filter utilities — unaffected |
| xaImages | Unit | `src/lib/__tests__/xaImages.test.ts` | Image URL builder — unaffected |
| xaListingUtils | Unit | `src/lib/__tests__/xaListingUtils.test.ts` | Listing utilities — unaffected |

#### Coverage Gaps
- No tests for `generateStaticParams` implementations (none exist yet)
- No tests for refactored client-side `new-in` or `designer/[slug]` searchParams behavior
- No E2E or smoke test covering the full static build output

#### Testability Assessment
- Easy to test: `generateStaticParams` functions are pure (input: static data, output: array of params)
- Hard to test: Full static build round-trip (requires `next build` which is slow)
- Test seams needed: `route.test.ts` for `search/sync` must be adapted or removed when route is deleted

#### Recommended Test Approach
- Unit tests for each `generateStaticParams` function (verify output against expected slugs/handles)
- Update `nextConfig.security.test.ts` to verify `output: 'export'` is set and `images.unoptimized: true`
- Remove or adapt `route.test.ts` for `search/sync` (route will no longer exist; test becomes extinct)
- Build-time smoke: `next build` in CI validates all static pages generate without error

## Questions

### Resolved
- Q: Can all dynamic routes be enumerated at build time from static data alone?
  - A: Yes. All product handles, brand slugs, collection handles, edit slugs, and subcategory values are available in `XA_PRODUCTS`, `XA_BRANDS`, `XA_COLLECTIONS`, `XA_EDITS`, and `XA_SUBCATEGORIES` which are loaded from `catalog.runtime.json` at build time.
  - Evidence: `apps/xa-b/src/lib/demoData.ts:43-50`, `apps/xa-b/src/lib/xaCatalog.ts:19-23`, `apps/xa-b/src/lib/xaEdits.ts:3-13`

- Q: Is `next/image` usage compatible with static export?
  - A: Not by default — Next.js static export disables the built-in image optimization server. Must add `images: { unoptimized: true }` to `next.config.mjs`. The existing usage is only in `XaFadeImage.tsx` (wraps `next/image`). With `unoptimized: true` the raw image URLs are passed through; Cloudflare Images handles delivery independently via `NEXT_PUBLIC_XA_IMAGES_BASE_URL`.
  - Evidence: `apps/xa-b/src/components/XaFadeImage.tsx:4-5`, Next.js static export docs pattern confirmed in MEMORY.md (post-deploy cleanup notes reference `output: 'export'` mechanics)

- Q: Should server-side `searchParams` in `new-in` and `designer/[slug]` be moved client-side or handled via `generateStaticParams` + route enumeration?
  - A: Must be moved client-side. These pages filter by user-provided query params (`?department=`, `?window=`, `?tab=`) that cannot be known at build time. `generateStaticParams` only works for path segments, not query strings. The established pattern (`search/page.tsx`, `checkout/success/page.tsx`) is `"use client"` + `useSearchParams()` inside a `<Suspense>` boundary.
  - Evidence: `apps/xa-b/src/app/search/page.tsx:18`, `apps/xa-b/src/app/checkout/success/page.tsx:19`

- Q: Should the account UI pages (`app/account/*`) be removed in this plan?
  - A: Yes. The account API routes were removed in the prior session. The 5 remaining UI pages (`login`, `register`, `orders`, `orders/[orderId]`, `trackingorder`) are all `"use client"` components that fetch account API endpoints which no longer exist. They are broken stubs. Removing them reduces page count and avoids confusing dead links. The reference implementation is documented in `docs/reference/xa-account/`.
  - Evidence: `apps/xa-b/src/app/account/login/page.tsx:1` (`"use client"`), `apps/xa-b/src/app/account/orders/page.tsx:1` (`"use client"`); session summary confirms API routes were moved to reference docs

- Q: Can the existing `build-xa.mjs` script be used for static builds without modification?
  - A: Yes. The script syncs `catalog.runtime.json` from xa-drop-worker, then calls `next build --webpack`. Changing `output` to `"export"` in `next.config.mjs` is sufficient; `build-xa.mjs` doesn't need changes.
  - Evidence: `apps/xa-b/scripts/build-xa.mjs:134-156` — the build invocation is `pnpm exec next build --webpack`

- Q: Does the existing `public/sw.js` service worker need changes for static export?
  - A: No changes needed. Service workers are served from `public/` and are CF Pages compatible as-is. Static export preserves `public/` files unchanged.
  - Evidence: `apps/xa-b/public/sw.js` confirmed to exist; CF Pages serves public/ files directly

- Q: Does the `robots.ts` file work with static export?
  - A: The `robots.ts` metadata route is supported by Next.js static export — it generates `/robots.txt` at build time using the env var values present during the build. Removing `export const runtime = "nodejs"` is sufficient; the stealth check reads `process.env.NEXT_PUBLIC_STEALTH_MODE` which is set as a CF Pages env var.
  - Evidence: `apps/xa-b/src/app/robots.ts` — uses only `process.env` values available at build time

- Q: Does the `api/search/sync` route need to be replaced with something, or can it just be deleted?
  - A: Needs a replacement. The route serves `XA_PRODUCTS` as JSON for the client-side search. With static export, a script must pre-generate `public/catalog.json` at build time (containing `{version, products}` matching the existing response shape), and the client search code must be updated to fetch `/catalog.json` instead of `/api/search/sync`. The ETag logic can be dropped since the static file is content-addressed by build.
  - Evidence: `apps/xa-b/src/app/api/search/sync/route.ts:26-29`, `apps/xa-b/src/lib/search/useXaProductSearch.ts` (client fetches this endpoint)

- Q: What CF Pages project setup is needed in the Cloudflare dashboard?
  - A: The operator must create a CF Pages project named `xa-b-site` (to match the current wrangler project name) or rename it. CF Pages projects cannot be created purely via `wrangler pages deploy` without prior manual setup in the dashboard. This is a one-time operator action. CI can deploy to the existing project with `wrangler pages deploy out/ --project-name xa-b-site`.
  - Evidence: `apps/xa-b/wrangler.toml:1` (`name = "xa-b-site"`)

- Q: Does `redirect()` in `brands/[handle]/page.tsx` work with `output: 'export'`?
  - A: Yes, with a minor UX caveat. In Next.js `output: 'export'`, a server-side `redirect()` call at build time generates a static HTML page containing `<meta http-equiv="refresh" content="0;url=/designer/[handle]">`. This is functional but causes a brief blank-page flash before the redirect fires. Accept this behavior — `brands/` is not a primary entry point. Still requires `generateStaticParams` to enumerate all brand handles so the pages are pre-rendered.
  - Evidence: `apps/xa-b/src/app/brands/[handle]/page.tsx:3` — uses `redirect()` from `next/navigation`; Next.js static export docs confirm meta-refresh output for server redirects

- Q: Are `requireEnv` guards for NEXTAUTH_SECRET / SESSION_SECRET / CART_COOKIE_SECRET a blocking concern?
  - A: Yes, mandatory removal. `next.config.mjs:22-30` runs `requireEnv("NEXTAUTH_SECRET", 32)` etc. in production mode, which `next build` always sets. A static app has no server-side session or JWT usage — these guards are vestigial from the account system (now removed). They must be deleted in TASK-01 or the build will fail if the secrets are absent from CI. The `xa.yml` workflow does not pass these secrets to the build step.
  - Evidence: `apps/xa-b/next.config.mjs:22-30`, `apps/xa-b/.github/workflows/xa.yml:126-129` (no secret env vars in build step)

### Open (Operator Input Required)
- Q: Should the CF Pages project be named `xa-b-site` (matching the existing Worker name) or a new name?
  - Why operator input is required: The Cloudflare dashboard project name is chosen by the operator at creation time; names cannot be inferred from code.
  - Decision impacted: `--project-name` flag in `wrangler pages deploy` CI step
  - Decision owner: Operator
  - Default assumption: Use `xa-b-site`; CI step will use `--project-name xa-b-site`. If operator creates a different name, update one line in `xa.yml`.

## Confidence Inputs
- Implementation: 92%
  - Evidence: All 9 change categories have confirmed paths. `generateStaticParams` additions are pure additions with zero risk. `searchParams` refactor follows an established in-repo pattern. Main uncertainty: whether `catalog.runtime.json` is available to a script running during `next build` (very likely — `build-xa.mjs` writes it before `next build` starts).
  - Raise to 95%: Verify `catalog.runtime.json` is written before any Next.js build step that imports `demoData.ts`
- Approach: 88%
  - Evidence: Static export is the standard Next.js approach for no-server deployments; all blockers have well-known solutions. No experimental APIs.
  - Raise to 95%: Running `next build` locally with `output: 'export'` to confirm no surprise errors
- Impact: 95%
  - Evidence: Direct cost/reliability fix. Static export on CF Pages free tier: no CPU limits, no $5/month.
  - Already high; the impact is unambiguous.
- Delivery-Readiness: 85%
  - Evidence: All code changes are within xa-b, well-understood, and independently testable. Blockers are code-level, not people/process. Only dependency: operator creates CF Pages project (low friction, one-time).
  - Raise to 90%: Operator confirms CF Pages project setup
- Testability: 80%
  - Evidence: Static build can be validated in CI (`next build` output). `generateStaticParams` functions are pure/testable. Client-side refactors are Suspense-wrapped — same pattern as existing passing tests.
  - Raise to 90%: Add a build-smoke step to xa.yml that runs `next build` to confirm static pages generate

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `catalog.runtime.json` not written before `next build` imports data | Low | High | `build-xa.mjs` writes the file then calls `next build`; import of `demoData.ts` happens during the Next.js build phase, after the script writes the file |
| `useXaProductSearch` returns stale/404 for `/api/search/sync` in static export | Low | Near-zero | `xaSearchService.ts` imports `XA_PRODUCTS` directly (line 4) and falls back to bundled data if cache is empty (lines 47-50); fetch failures caught silently (lines 65-67). Search is functional without URL change. |
| Dynamic route pages with `notFound()` after data check: generates no page for missing slugs | Low | Low | Correct behavior — Next.js skips pages where `generateStaticParams` returns a slug that triggers `notFound()` |
| CF Pages project doesn't exist yet — first deploy fails | Medium | Low | One-time operator action; CI deploy step will fail gracefully with a clear error message; instructions in plan |
| `requireEnv` guards for NEXTAUTH_SECRET / SESSION_SECRET / CART_COOKIE_SECRET throw during `next build` | Medium | High | Remove guards in TASK-01 (mandatory, not optional). These serve no purpose in a static app. |
| CF Pages 20k file upload limit exceeded by `__next.*` metadata files | Low | High | Run `find out -name '__next.*' -type f -delete` before `wrangler pages deploy` in TASK-08 (established pattern per MEMORY.md). |
| `brands/[handle]` generates meta-refresh redirect pages instead of instant navigation | Low | Low | Expected behavior for `redirect()` in Next.js `output: 'export'`; generates `<meta http-equiv="refresh">`. Acceptable for a non-primary route. |
| Account pages not removed causes dead links in any remaining nav references | Low | Medium | Plan includes audit of nav/shell for account links and their removal |

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `"use client"` + `useSearchParams()` inside `<Suspense>` for all query-param-driven pages (matches `search/page.tsx` pattern)
  - `generateStaticParams` should import from `demoData.ts` and `xaCatalog.ts` — same imports as the page itself
  - Commit task-scoped files only; do not touch xa-drop-worker or xa-uploader
  - Security headers in `public/_headers` use Cloudflare Pages syntax (one header per line: `key: value` under path block)
- Rollout/rollback expectations:
  - Rollback is trivial: revert `next.config.mjs` line 62 and the CI deploy step to restore the OpenNext/Worker build
  - No data migration; all data is static catalog files
- Observability expectations:
  - CI build output confirms all routes are pre-generated (`next build` lists generated pages)
  - CF Pages deployment log confirms upload success
  - Health check step replaced with build-output presence check (CF Pages preview URLs are non-deterministic; cannot be hardcoded)

## Suggested Task Seeds (Non-binding)
1. TASK-01 (IMPLEMENT): Update `next.config.mjs` — set `output: 'export'`, add `images: { unoptimized: true }`. **Mandatory:** remove the `requireEnv` guards for `NEXTAUTH_SECRET`, `SESSION_SECRET`, and `CART_COOKIE_SECRET` (lines 22-30). These run during `next build` (production mode) and throw if secrets are absent. A static app has no server-side JWT handling; the guards serve no purpose and will cause CI build failures if the secrets are not in GitHub secrets. This is a required change, not optional.
2. TASK-02 (IMPLEMENT): Remove `runtime = "nodejs"` from `layout.tsx` and `robots.ts`
3. TASK-03 (IMPLEMENT): Delete `api/search/sync/route.ts` and its test. **Note on search behavior:** `xaSearchService.ts` imports `XA_PRODUCTS` directly at line 4 and explicitly falls back to bundled data if cache is empty (lines 47-50). Fetch failures are caught silently (lines 65-67: "Offline or stealth-blocked is fine"). This means search works from bundled data even when `/api/search/sync` returns 404 — the URL change in `xaSearchService.ts` is **optional**. If catalog currency is needed, optionally: (a) update the fetch URL to `/catalog.json` and (b) add a `catalog.json` write step to `build-xa.mjs` after the catalog sync. This is an optimization, not a correctness requirement.
4. TASK-04 (IMPLEMENT): Add `generateStaticParams` to all 14 dynamic route files
5. TASK-05 (IMPLEMENT): Refactor `new-in/page.tsx` and `designer/[slug]/page.tsx` from server `searchParams` to client `useSearchParams()`
6. TASK-06 (IMPLEMENT): Replace middleware security headers with `public/_headers` CF Pages format; delete `middleware.ts`
7. TASK-07 (IMPLEMENT): Remove 5 account UI pages (`app/account/*`); remove any nav/shell links to account routes; remove empty `api/access/` and `api/access-request/` directories
8. TASK-08 (IMPLEMENT): Delete `wrangler.toml` (Worker-format; not used by `wrangler pages deploy`). Update `xa.yml` deploy step to `wrangler pages deploy out/ --project-name xa-b-site`. Remove non-deterministic Workers health check; replace with build-output presence check (`test -d out && test $(ls out | wc -l) -gt 0`). Run `find out -name '__next.*' -type f -delete` before pages deploy (CF Pages 20k file limit guard).

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `next build` completes with `output: 'export'`, generating `out/` directory with all pages pre-rendered
  - `wrangler pages deploy out/` succeeds
  - Health check on CF Pages staging URL returns HTTP 200
  - No CI regressions in lint/typecheck/test
- Post-delivery measurement plan:
  - Confirm no 1102 errors on CF Pages staging
  - Confirm all static pages load (spot-check: `/`, `/products/[handle]`, `/designer/[slug]`, `/new-in?department=women`)

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Build config (`next.config.mjs`, `images`) | Yes | None | No |
| Runtime exports removal (`layout.tsx`, `robots.ts`) | Yes | None | No |
| API route replacement (`search/sync` → delete route) | Yes | [Advisory][Minor]: fetch URL change in `xaSearchService.ts` is optional — fallback to bundled data exists (lines 47-50, 65-67) | No — scope clarified in TASK-03 |
| `searchParams` server→client migration (`new-in`, `designer/[slug]`) | Yes | None | No |
| `generateStaticParams` coverage (14 dynamic route files) | Yes | [Advisory][Minor]: `brands/[handle]` only redirects; still needs param enumeration for static pages | No — captured in TASK-04 |
| Security headers → `public/_headers` | Yes | None | No |
| Account pages removal (5 pages + nav audit) | Yes | [Advisory][Moderate]: Nav/shell links to account pages must be audited | No — captured in TASK-07 |
| `requireEnv` env guard removal (`next.config.mjs:22-30`) | Yes | [Advisory][Moderate]: Must be removed (mandatory, not optional) — causes build failure if NEXTAUTH_SECRET/SESSION_SECRET/CART_COOKIE_SECRET absent from CI | No — classified mandatory in TASK-01 |
| CI/deploy update (`xa.yml`; delete `wrangler.toml`) | Yes | [Advisory][Moderate]: CF Pages health check URL non-deterministic; replaced with build-output presence check | No — resolved in TASK-08 |
| CF Pages 20k file limit (`__next.*` cleanup) | Yes | [Advisory][Moderate]: Must run `find out -name '__next.*' -delete` before deploy | No — captured in TASK-08 |
| `next/image` unoptimized flag | Yes | None | No |
| Test landscape update (`route.test.ts`, `nextConfig.security.test.ts`) | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed
- **`useXaProductSearch.ts` fetch target**: Not directly read — risk captured in Risks table. The client search component fetches the catalog endpoint; the new URL `/catalog.json` must be substituted. TASK-03 scope includes updating this file.
- **Account nav/shell references**: `app/account/*` pages have nav links in the XaShell component. TASK-07 scope includes an audit of `XaShell` and related components for account route references.
- **`next/image` unoptimized**: Confirmed `XaFadeImage.tsx` uses `next/image`. Fix is a one-line config addition.

### Confidence Adjustments
- Implementation confidence set at 92% (not 95%) pending local confirmation that `next build --webpack` with `output: 'export'` completes without surprises. This is the primary residual uncertainty.
- Delivery-Readiness at 85% pending operator CF Pages project creation.

### Remaining Assumptions
- `catalog.runtime.json` is always present before `next build` (written by `build-xa.mjs`; assumption holds in CI)
- CF Pages `public/_headers` supports all required security header values (CSP, X-Frame-Options, etc.) — standard CF Pages feature, no known limitations
- The XA_STEALTH_MODE and related env vars can be set as CF Pages build-time env vars (confirmed: CF Pages supports env vars that are used during `next build`)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-b-static-export --auto`
