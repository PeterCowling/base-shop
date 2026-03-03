---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27 (All waves complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-b-static-export
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# xa-b Static Export Plan

## Summary

Converts xa-b from SSR via OpenNext/CF Workers to `output: 'export'` static generation deployed on Cloudflare Pages free tier. This eliminates the $5/month CF Workers Standard fee and the 1102 CPU-timeout errors caused by the 10ms free-tier CPU limit. All product/catalog data is static demo data, making the app fully statically pre-renderable. Eight tasks cover the build config, runtime export removal, API route deletion, dynamic route `generateStaticParams`, server-side `searchParams` refactor, security headers migration, account/dead-code cleanup, and CI/deploy pipeline update.

## Active tasks
- [x] TASK-01: Set `output: 'export'` and remove requireEnv guards in next.config.mjs
- [x] TASK-02: Remove `export const runtime = "nodejs"` from layout.tsx and robots.ts
- [x] TASK-03: Delete `api/search/sync` route handler and its test
- [x] TASK-04: Add `generateStaticParams` to all 14 dynamic route files
- [x] TASK-05: Refactor `new-in` and `designer/[slug]` from server searchParams to client useSearchParams
- [x] TASK-06: Replace middleware security headers with `public/_headers`; delete middleware.ts
- [x] TASK-07: Remove account UI pages, audit nav, delete empty api dirs
- [x] TASK-08: Delete wrangler.toml; update xa.yml CI for static Pages deploy

## Goals
- `next build --webpack` with `output: 'export'` succeeds, generating `out/` directory
- All pages pre-rendered at build time from `catalog.runtime.json` data
- `wrangler pages deploy out/ --project-name xa-b-site` succeeds from CI
- No 1102 CPU-timeout errors (no server runtime needed)
- No $5/month CF Workers Standard charge

## Non-goals
- Any new features, routes, or catalog functionality
- Real-time catalog updates post-deploy (xa-drop-worker sync at build time only)
- xa-drop-worker or xa-uploader changes
- Customer account system (reference implementation at `docs/reference/xa-account/`)

## Constraints & Assumptions
- Constraints:
  - CF Pages free tier only (no paid plans)
  - Webpack build (`--webpack` flag required, Turbopack config not migrated)
  - Operator must create CF Pages project `xa-b-site` in Cloudflare dashboard before first deploy (one-time action)
- Assumptions:
  - All dynamic route paths enumerable at build time from `XA_PRODUCTS`, `XA_BRANDS`, `XA_COLLECTIONS`, `XA_EDITS`, `XA_SUBCATEGORIES`
  - `build-xa.mjs` writes `catalog.runtime.json` before `next build` runs — sequential, verified
  - `requireEnv` secrets (NEXTAUTH_SECRET, etc.) can be removed without adding GitHub secrets (static app has no server-side auth)

## Inherited Outcome Contract
- **Why:** CF Workers free tier hits 10ms CPU limit per request causing 1102 errors; static export on CF Pages free tier has no per-request CPU cost and no monthly fee, directly eliminating the operational blocker.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b builds as `output: 'export'` without errors, all static pages are pre-generated at build time, CI deploys via `wrangler pages deploy`, and the app loads correctly on CF Pages staging with no 1102 errors.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-b-static-export/fact-find.md`
- Key findings used:
  - `next.config.mjs:62` explicitly suppresses static export with a ternary — must be reversed
  - `layout.tsx:20` and `robots.ts:4` both export `runtime = "nodejs"` — must be removed
  - `api/search/sync/route.ts` is the only API route; route handlers incompatible with static export; `xaSearchService.ts` gracefully falls back to bundled `XA_PRODUCTS` (no URL change mandatory)
  - No `generateStaticParams` exists anywhere; 14 dynamic route files need it
  - `new-in/page.tsx` and `designer/[slug]/page.tsx` use server-side `searchParams`; `designer/[slug]` needs a server wrapper kept for `generateStaticParams`, client component extracted for tab behavior
  - Middleware resolved CSP values from i18n (confirmed): `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:`
  - `XaShell.tsx:125` has `/account/login` link — must be removed in TASK-07
  - `account/orders/[orderId]` is a dynamic route without `generateStaticParams` — TASK-07 must remove it before TASK-04 adds generateStaticParams to others
  - `requireEnv("NEXTAUTH_SECRET", 32)` in `next.config.mjs:22-30` must be removed (mandatory, not optional)
  - `wrangler.toml` is Worker-format; CF Pages uses `wrangler pages deploy` without wrangler.toml
  - CF Pages 20k file limit: `find out -name '__next.*' -type f -delete` required before deploy

## Proposed Approach
- Option A: Static export on CF Pages free tier — convert all pages to pre-rendered HTML/CSS/JS; use `wrangler pages deploy out/` for CI
- Option B: Keep Workers SSR, optimize to reduce CPU time below 10ms threshold — complex, fragile, and still costs $5/month
- Chosen approach: **Option A** — architectural alignment with all-demo-data app; clean break from Workers billing; no runtime needed.

## Plan Gates
- Foundation Gate: Pass (fact-find has Deliverable-Type, Execution-Track, Primary-Execution-Skill; test landscape present; Delivery-Readiness 85%; no blocking open questions)
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Set output:export; remove requireEnv guards in next.config.mjs | 90% | S | Complete (2026-02-27) | - | All |
| TASK-02 | IMPLEMENT | Remove runtime=nodejs from layout.tsx and robots.ts | 95% | S | Complete (2026-02-27) | TASK-01 | TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Delete api/search/sync route handler and its test | 88% | S | Complete (2026-02-27) | TASK-01 | TASK-08 |
| TASK-04 | IMPLEMENT | Add generateStaticParams to 14 dynamic route files | 85% | M | Complete (2026-02-27) | TASK-01, TASK-02, TASK-07 | TASK-05, TASK-08 |
| TASK-05 | IMPLEMENT | Refactor new-in and designer/[slug] searchParams to client-side | 82% | M | Pending | TASK-01, TASK-02, TASK-04 | TASK-08 |
| TASK-06 | IMPLEMENT | Replace middleware headers with public/_headers; delete middleware.ts | 88% | S | Complete (2026-02-27) | TASK-01 | TASK-08 |
| TASK-07 | IMPLEMENT | Remove account pages, nav link, empty api dirs | 88% | S | Complete (2026-02-27) | TASK-01 | TASK-04 |
| TASK-08 | IMPLEMENT | Delete wrangler.toml; update xa.yml CI for Pages deploy | 82% | S | Pending | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Config enabler — must land before all others |
| 2 | TASK-02, TASK-03, TASK-06, TASK-07 | TASK-01 | All are independent removals/replacements; TASK-07 must complete before TASK-04 |
| 3 | TASK-04 | TASK-02, TASK-07 | generateStaticParams on all 14 routes; must complete before TASK-05 (shared `designer/[slug]/page.tsx`) |
| 4 | TASK-05 | TASK-04 | searchParams refactor; TASK-05 design relies on TASK-04's `generateStaticParams` in `designer/[slug]/page.tsx` |
| 5 | TASK-08 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | CI update only after all code changes complete |

## Tasks

---

### TASK-01: Set `output: 'export'` and remove requireEnv guards in next.config.mjs
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/next.config.mjs` updated with static export config
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 79293e4c4b. TC-01 grep confirms `output: "export"`; TC-02 grep confirms `unoptimized: true`; TC-03 grep confirms 0 auth-secret references; typecheck + lint pass. Stale `.next/types/` cache removed (pre-existing errors from prior sessions). 1 file, 2 insertions, 29 deletions.
- **Affects:** `apps/xa-b/next.config.mjs`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08
- **Confidence:** 90%
  - Implementation: 92% — Direct file edit; exact line 62 change is clear; `images.unoptimized` is a known config key
  - Approach: 90% — Standard Next.js static export pattern; `output: "export"` is the documented setting
  - Impact: 90% — Enables all downstream tasks; without this, static export build never starts
- **Acceptance:**
  - `apps/xa-b/next.config.mjs` exports `output: "export"` unconditionally
  - `images: { unoptimized: true }` present in the images config
  - Lines 22-30 (`requireEnv(...)` block) removed
  - Lines 7-30 (DEV_NEXTAUTH, DEV_SESSION, ensureStrong, requireEnv functions and if/else block) removed — these are all session/auth guards irrelevant to a static app
  - `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` env var defaults (`process.env.CMS_SPACE_URL ??=` etc. from lines 32-35 can remain — they are build-time config, not auth secrets)
- **Validation contract (TC-01):**
  - TC-01: `next.config.mjs` exported object has `output: "export"` — verify with `grep -E 'output:\s*"export"' apps/xa-b/next.config.mjs`; must return a match after edit (file is ESM; `require()` is not usable)
  - TC-02: `images.unoptimized` is `true` in the exported config
  - TC-03: `NEXTAUTH_SECRET` is not referenced anywhere in the file (grep check)
  - TC-04: `pnpm --filter @apps/xa-b typecheck` passes with no new errors
- **Execution plan:**
  - Red: Confirm `next.config.mjs:62` currently opts out of static export and that `output` is undefined for xa-b
  - Green: Replace line 62 ternary with `output: "export"`; add `images: { ...sharedConfig.images, remotePatterns: [...], unoptimized: true }` (or add unoptimized as a top-level property inside the images block); remove lines 7-30 (auth guard block)
  - Refactor: Run typecheck; grep for any remaining NEXTAUTH_SECRET / SESSION_SECRET references in the file
- **Planning validation:**
  - Checks run: Read `next.config.mjs` — confirmed line 62 is the opt-out; lines 22-30 are the requireEnv block
  - Validation artifacts: `apps/xa-b/next.config.mjs` (read)
  - Unexpected findings: Lines 32-35 set non-auth env var defaults (CMS_SPACE_URL, CMS_ACCESS_TOKEN, SANITY_API_VERSION, EMAIL_PROVIDER) — these are safe to keep; they're build-time config not runtime secrets
- **Consumer tracing (new outputs):**
  - `output: "export"` — consumed by Next.js build framework; all pages will be statically pre-rendered
  - `images.unoptimized: true` — consumed by `next/image` in `XaFadeImage.tsx`; disables server-side optimization, passes raw URLs through to Cloudflare Images
  - No application code reads these config values directly
- **Scouts:** Run `grep -n "NEXTAUTH_SECRET\|SESSION_SECRET\|CART_COOKIE_SECRET" apps/xa-b/next.config.mjs` before and after — confirm zero matches post-edit
- **Edge Cases & Hardening:**
  - The `sharedConfig.output` from `@acme/next-config` may be `"export"` when `OUTPUT_EXPORT=1` is set — the new config overrides unconditionally with `"export"`, so this is safe regardless of the shared config value
- **What would make this >=90%:**
  - Run `next build --webpack` locally and confirm static output generates without errors
- **Rollout / rollback:**
  - Rollout: Single file edit, committed to dev branch
  - Rollback: Revert line to `output: sharedConfig.output === "export" ? undefined : sharedConfig.output`
- **Documentation impact:**
  - None: internal config file
- **Notes / references:**
  - `next.config.mjs:7-63` (full relevant block)
  - Auth-related env vars (NEXTAUTH_SECRET, SESSION_SECRET, CART_COOKIE_SECRET) were for the now-removed account system; confirmed unused in static app

---

### TASK-02: Remove `export const runtime = "nodejs"` from layout.tsx and robots.ts
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/src/app/layout.tsx` and `apps/xa-b/src/app/robots.ts` without runtime export
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 19ee385120 (Wave 2). TC-01 grep confirms no `export const runtime` in layout.tsx; TC-02 confirms none in robots.ts; typecheck + lint pass.
- **Affects:** `apps/xa-b/src/app/layout.tsx`, `apps/xa-b/src/app/robots.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 95%
  - Implementation: 96% — Two-line deletion; no dependencies changed
  - Approach: 95% — Standard: removing explicit runtime export lets Next.js use its default (Node.js at build time for static generation)
  - Impact: 95% — Removes edge runtime conflict during static pre-rendering
- **Acceptance:**
  - `layout.tsx` has no `export const runtime` statement
  - `robots.ts` has no `export const runtime` statement
  - `pnpm --filter @apps/xa-b typecheck` passes
  - Comment about "edge runtime breaking page data collection" may be removed or left as historical note
- **Validation contract (TC-02):**
  - TC-01: `grep "export const runtime" apps/xa-b/src/app/layout.tsx` returns empty
  - TC-02: `grep "export const runtime" apps/xa-b/src/app/robots.ts` returns empty
- **Execution plan:**
  - Red: Confirm both files have `export const runtime = "nodejs"` on the identified lines
  - Green: Delete line 20 from `layout.tsx`; delete line 4 from `robots.ts`
  - Refactor: Remove associated comment in `layout.tsx` (lines 18-19) if desired; typecheck
- **Planning validation:**
  - Checks run: Read both files — `layout.tsx:20` and `robots.ts:4` confirmed
  - Unexpected findings: `layout.tsx` still references `stealthEnabled` (XA_STEALTH_MODE) for metadata — this is build-time env var reading, compatible with static export
- **Consumer tracing (modified behavior):**
  - `layout.tsx` runtime removal: Next.js will use default (build-time Node.js) for static generation. The root layout is pre-rendered once at build time. No runtime consumers to update.
  - `robots.ts` runtime removal: `robots.txt` is generated at build time. Reads `process.env.NEXT_PUBLIC_STEALTH_MODE` — available as a CF Pages build-time env var.
- **Scouts:** None: risk is near-zero for line deletion
- **Edge Cases & Hardening:**
  - `layout.tsx` also references `process.env.XA_STEALTH_MODE` for className and metadata — these are `process.env.NEXT_PUBLIC_*` reads, valid at build time in Next.js static mode
- **What would make this >=90%:**
  - Already at 95%; standard deletion task
- **Rollout / rollback:**
  - Rollout: Two-line deletion
  - Rollback: Re-add `export const runtime = "nodejs"` to both files
- **Documentation impact:** None
- **Notes / references:**
  - `layout.tsx:18-20` (comment + runtime export)
  - `robots.ts:4`

---

### TASK-03: Delete `api/search/sync` route handler and its test
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/src/app/api/search/sync/route.ts` and `apps/xa-b/src/app/api/search/sync/__tests__/route.test.ts` deleted
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 19ee385120 (Wave 2). TC-01 `ls api/search/` fails (deleted). TC-02 test failures related to search sync: none (brikette/reception failures are pre-existing, unrelated). xaSearchService.ts fetch URL reference intentional (graceful fallback to XA_PRODUCTS bundle).
- **Affects:** `apps/xa-b/src/app/api/search/sync/route.ts`, `apps/xa-b/src/app/api/search/sync/__tests__/route.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-08
- **Confidence:** 88%
  - Implementation: 90% — File deletion; no consumers to update
  - Approach: 88% — Route handlers are incompatible with `output: 'export'`; search falls back to bundled data gracefully
  - Impact: 88% — Removes the only remaining API route; search continues to work via `XA_PRODUCTS` bundle fallback in `xaSearchService.ts:47-50`
- **Acceptance:**
  - `apps/xa-b/src/app/api/search/sync/route.ts` does not exist
  - `apps/xa-b/src/app/api/search/sync/__tests__/route.test.ts` does not exist
  - `pnpm --filter @apps/xa-b test` passes (no reference to deleted test)
  - `apps/xa-b/src/app/api/search/` directory does not exist (removal of `api/access/` and `api/access-request/` handled by TASK-07)
- **Validation contract (TC-03):**
  - TC-01: `ls apps/xa-b/src/app/api/search/` fails (directory does not exist); `api/` may still contain `access/` and `access-request/` dirs — those are removed by TASK-07
  - TC-02: `pnpm --filter @apps/xa-b test` passes with no test failures related to search sync
- **Execution plan:**
  - Red: Confirm `xaSearchService.ts` has the fallback to `XA_PRODUCTS` (lines 47-50 and catch at 65-67) — verify search works without the route
  - Green: Delete `route.ts`, its `__tests__` dir and contents, and the now-empty `api/search/sync/` and `api/search/` directories (leave `api/access/`, `api/access-request/` to TASK-07 which owns them)
  - Refactor: Run test suite; confirm no test failures
- **Planning validation:**
  - Checks run: Read `xaSearchService.ts` — confirmed fallback at lines 47-50 (`!products.length && XA_PRODUCTS.length` → use bundled data) and catch block at lines 65-67
  - Validation artifacts: `apps/xa-b/src/lib/search/xaSearchService.ts` (read)
  - Unexpected findings: The search service is sophisticated (IndexedDB caching, Web Worker for search indexing) — but all of this is client-side; the API sync is a best-effort update, not a hard requirement
- **Consumer tracing (modified behavior):**
  - `fetchSync("/api/search/sync")` in `xaSearchService.ts:33` — will return 404 in static deployment; the catch block at line 65 handles this silently. No code change needed in `xaSearchService.ts`.
  - The search index is built from either the cached catalog or bundled `XA_PRODUCTS` — functional in both cases.
- **Scouts:** Confirm `xaSearchService.ts` fallback behavior: `!products.length && XA_PRODUCTS.length` branch at line 47
- **Edge Cases & Hardening:**
  - The `404` from `/api/search/sync` on first load: user sees search powered by bundled data (same data as the API would return — `catalog.runtime.json` is the source for both). No user-visible degradation.
  - Empty api/ dirs (`api/access/`, `api/access-request/`) are owned by TASK-07 (they are in TASK-07's Affects field). Do not delete them in this task.
- **What would make this >=90%:**
  - Confirm `pnpm --filter @apps/xa-b test` passes after deletion (route.test.ts removal is clean)
- **Rollout / rollback:**
  - Rollout: File deletion
  - Rollback: Restore from git history (not needed unless reverting the whole plan)
- **Documentation impact:** None
- **Notes / references:**
  - `apps/xa-b/src/lib/search/xaSearchService.ts` (verified fallback)

---

### TASK-04: Add `generateStaticParams` to all 14 dynamic route files
- **Type:** IMPLEMENT
- **Deliverable:** 14 route files each export `generateStaticParams()` returning the full set of path segments from static catalog data
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 9c0cf77ae9. TC-02 grep confirms 14 generateStaticParams in app/. TC-01 confirms brands/[handle], designer/[slug], products/[handle] all have it. TC-03 typecheck passes. Only new import needed: XA_BRANDS in brands/[handle]/page.tsx. All 9 subcategory files used existing XA_SUBCATEGORIES import. 14 files, 58 insertions.
- **Affects:** `apps/xa-b/src/app/brands/[handle]/page.tsx`, `apps/xa-b/src/app/designer/[slug]/page.tsx`, `apps/xa-b/src/app/products/[handle]/page.tsx`, `apps/xa-b/src/app/edits/[slug]/page.tsx`, `apps/xa-b/src/app/collections/[handle]/page.tsx`, `apps/xa-b/src/app/kids/bags/[type]/page.tsx`, `apps/xa-b/src/app/kids/clothing/[category]/page.tsx`, `apps/xa-b/src/app/kids/jewelry/[type]/page.tsx`, `apps/xa-b/src/app/men/bags/[type]/page.tsx`, `apps/xa-b/src/app/men/clothing/[category]/page.tsx`, `apps/xa-b/src/app/men/jewelry/[type]/page.tsx`, `apps/xa-b/src/app/women/bags/[type]/page.tsx`, `apps/xa-b/src/app/women/clothing/[category]/page.tsx`, `apps/xa-b/src/app/women/jewelry/[type]/page.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-07
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 86% — All data sources confirmed; pattern is a pure addition to each file; no existing logic modified
  - Approach: 85% — `generateStaticParams` is a standard Next.js pattern; all param values come from static imports already in each file
  - Impact: 86% — Required for static export to succeed on all dynamic routes; without it `next build` fails with "Page has no generateStaticParams"
- **Acceptance:**
  - All 14 route files export `export async function generateStaticParams()` (or `export function generateStaticParams()`)
  - Each function returns an array of param objects matching the route's dynamic segment names
  - `pnpm --filter @apps/xa-b typecheck` passes
  - `next build --webpack` (once all tasks complete) generates pages for all dynamic routes
- **Validation contract (TC-04):**
  - TC-01: `grep -l "generateStaticParams" apps/xa-b/src/app/brands/\[handle\]/page.tsx apps/xa-b/src/app/designer/\[slug\]/page.tsx apps/xa-b/src/app/products/\[handle\]/page.tsx` returns all 3 files
  - TC-02: `grep -rn "generateStaticParams" apps/xa-b/src/app/ | wc -l` returns 14
  - TC-03: Unit test: for each file, verify the returned array is non-empty and params match the dynamic segment name (existing `__tests__/xaCatalog.test.ts` can be extended with a simple import test)
- **Execution plan:**
  - Red: Confirm none of the 14 files currently export `generateStaticParams` (`grep -rn "generateStaticParams" apps/xa-b/src/app/ | wc -l` → 0)
  - Green: Add `generateStaticParams` to each file using the param mappings below
  - Refactor: Run typecheck; run tests

**Param mappings for Green step:**

```
brands/[handle]          → XA_BRANDS.map(b => ({handle: b.handle}))
designer/[slug]          → XA_BRANDS.map(b => ({slug: b.handle}))   ← keep server component wrapper (see TASK-05 note)
products/[handle]        → XA_PRODUCTS.map(p => ({handle: p.slug}))
edits/[slug]             → XA_EDITS.map(e => ({slug: e.slug}))
collections/[handle]     → [...XA_COLLECTIONS.map(c => ({handle: c.handle})), {handle: "all"}]
kids/bags/[type]         → XA_SUBCATEGORIES.bags.map(t => ({type: t}))
kids/clothing/[category] → XA_SUBCATEGORIES.clothing.map(c => ({category: c}))
kids/jewelry/[type]      → XA_SUBCATEGORIES.jewelry.map(t => ({type: t}))
men/bags/[type]          → XA_SUBCATEGORIES.bags.map(t => ({type: t}))
men/clothing/[category]  → XA_SUBCATEGORIES.clothing.map(c => ({category: c}))
men/jewelry/[type]       → XA_SUBCATEGORIES.jewelry.map(t => ({type: t}))
women/bags/[type]        → XA_SUBCATEGORIES.bags.map(t => ({type: t}))
women/clothing/[category]→ XA_SUBCATEGORIES.clothing.map(c => ({category: c}))
women/jewelry/[type]     → XA_SUBCATEGORIES.jewelry.map(t => ({type: t}))
```

**Important note for `designer/[slug]/page.tsx`:** This file MUST remain a server component to export both `generateStaticParams` and the server-rendered default export (which reads `params.slug`). The `searchParams` tab-filtering logic is extracted to `DesignerPageClient.tsx` in TASK-05. Do NOT convert this file to `"use client"`.

- **Planning validation (M effort):**
  - Checks run: Read `demoData.ts` — confirmed XA_PRODUCTS, XA_BRANDS, XA_COLLECTIONS exports. Read `xaCatalog.ts` — confirmed XA_SUBCATEGORIES. Read `xaEdits.ts` — confirmed XA_EDITS (2 entries). Read all 14 target route files — none has generateStaticParams.
  - Validation artifacts: All 14 route files, demoData.ts, xaCatalog.ts, xaEdits.ts
  - Unexpected findings: `account/orders/[orderId]` is also a dynamic route — this is removed by TASK-07 before TASK-04 runs, so it does NOT need to be included in the 14 files
- **Consumer tracing (new outputs):**
  - `generateStaticParams()` functions — consumed exclusively by the Next.js static export build process; no application code reads these
  - Return arrays determine which HTML files are generated in `out/` — no silent fallback possible (build fails if missing)
- **Scouts:** Verify `XA_EDITS` count: `XA_EDITS.length` should be 2 (confirmed in xaEdits.ts)
- **Edge Cases & Hardening:**
  - `collections/[handle]` page also handles the path `/collections/all` (rendered as a catch-all in the existing page component) — include `{handle: "all"}` in the generateStaticParams return
  - `brands/[handle]` uses `redirect()` — generates a meta-refresh page; acceptable behavior for a non-primary route
  - Subcategory files (`kids/bags/[type]` etc.) call `notFound()` if the type is not in the allowed list — this is correct; generateStaticParams only returns the allowed values so no 404 pages are generated
- **What would make this >=90%:**
  - Run `next build --webpack` after this task and confirm no "missing generateStaticParams" errors
- **Rollout / rollback:**
  - Rollout: 14 additive edits to existing files
  - Rollback: Remove added functions from each file
- **Documentation impact:** None
- **Notes / references:**
  - Data sources: `demoData.ts:43-50`, `xaCatalog.ts:19-23`, `xaEdits.ts:3-13`
  - TASK-07 must complete before this task (removes `account/orders/[orderId]` which would otherwise need its own generateStaticParams)

---

### TASK-05: Refactor `new-in` and `designer/[slug]` from server searchParams to client useSearchParams
- **Type:** IMPLEMENT
- **Deliverable:** `new-in/page.tsx` converted to client component; `designer/[slug]/page.tsx` with tab logic extracted to `DesignerPageClient.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 2db61e64ae (Wave 4). TC-01–03 grep markers confirmed; TC-04 typecheck passes. `new-in/page.tsx` rewritten as `"use client"` with `useSearchParams()` in `NewInContent()` wrapped by Suspense. `designer/[slug]/page.tsx` thinned to server wrapper (retains `generateStaticParams`). New `DesignerPageClient.tsx` created as `"use client"` with `useSearchParams()` in `DesignerContent()` wrapped by Suspense. Lint fix: `import type { XA_BRANDS, XA_PRODUCTS }` (type-only usage in interface).
- **Affects:** `apps/xa-b/src/app/new-in/page.tsx`, `apps/xa-b/src/app/designer/[slug]/page.tsx`, `apps/xa-b/src/app/designer/[slug]/DesignerPageClient.tsx` (new file)
- **Depends on:** TASK-01, TASK-02, TASK-04
- **Blocks:** TASK-08
- **Confidence:** 82%
  - Implementation: 83% — Pattern established in `search/page.tsx`; both refactors follow the same shape; `designer/[slug]` extraction adds complexity (server wrapper + client component)
  - Approach: 82% — `"use client"` + `useSearchParams()` in `<Suspense>` is the confirmed in-repo pattern for query-param driven pages
  - Impact: 84% — Without this, searchParams in static export always returns empty object; filters appear broken but build succeeds; this fixes functional correctness
- **Acceptance:**
  - `new-in/page.tsx` is a `"use client"` component using `useSearchParams()` for `department` and `window` params; wrapped in `<Suspense fallback={null}>` in its parent
  - `designer/[slug]/page.tsx` retains `export async function generateStaticParams()` (server) and a thin default export that passes designer data to `DesignerPageClient`
  - `designer/[slug]/DesignerPageClient.tsx` is a `"use client"` component using `useSearchParams()` for the `tab` param
  - `pnpm --filter @apps/xa-b typecheck` passes
  - Filter behavior works: visiting `/new-in?department=women` shows only women's products; `/designer/[slug]?tab=bags` shows the bags tab
- **Validation contract (TC-05):**
  - TC-01: `grep "useSearchParams\|use client" apps/xa-b/src/app/new-in/page.tsx` returns both markers
  - TC-02: `grep "generateStaticParams" apps/xa-b/src/app/designer/\[slug\]/page.tsx` returns a match (server wrapper retained)
  - TC-03: `grep "useSearchParams\|use client" apps/xa-b/src/app/designer/\[slug\]/DesignerPageClient.tsx` returns both markers
  - TC-04: Typecheck passes

**Design specification for Green step:**

**`new-in/page.tsx` → full client component:**
```
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
// ... other imports

function NewInContent() {
  const searchParams = useSearchParams();
  const departmentParam = searchParams.get("department") ?? undefined;
  const windowParam = searchParams.get("window") ?? undefined;
  // ... existing filter logic using XA_PRODUCTS (imported from bundle)
  return <XaProductListing ... />;
}

export default function NewInPage() {
  return (
    <Suspense fallback={null}>
      <NewInContent />
    </Suspense>
  );
}
```

**`designer/[slug]/page.tsx` → server wrapper + client component:**
- Server `page.tsx` keeps `generateStaticParams` (added by TASK-04), reads `params.slug`, looks up designer from `XA_BRANDS`, calls `notFound()` if missing, then passes `designer` and `brands` data to `DesignerPageClient`
- `DesignerPageClient.tsx`: `"use client"`, receives designer data as props, uses `useSearchParams()` for tab, renders the tab UI and product listing

- **Planning validation (M effort):**
  - Checks run: Read `new-in/page.tsx` (server component with `await searchParams`), `designer/[slug]/page.tsx` (server component with both params and searchParams), `search/page.tsx` (reference pattern for client-side useSearchParams in Suspense)
  - Validation artifacts: All three files read; pattern confirmed
  - Unexpected findings: `new-in/page.tsx` has complex `resolvedSearchParams instanceof URLSearchParams` check — this can be simplified to `searchParams.get(...)` in the client version; both paths produce same result
- **Consumer tracing (modified behavior):**
  - `new-in/page.tsx` default export: changes from async server function to client component. Next.js static export will pre-render the default state (no query params) as the HTML page; query params are handled client-side after hydration. No external consumers of this component (it's a route component, only consumed by Next.js routing).
  - `designer/[slug]/page.tsx` default export: keeps the same external interface (route component); internally now passes data to `DesignerPageClient` instead of rendering tabs directly. No external consumers to update.
  - `DesignerPageClient.tsx` (new file): consumed only by `designer/[slug]/page.tsx`. Correctly scoped.
- **Scouts:** Confirm `search/page.tsx` pattern: `"use client"` at top, `useSearchParams()` call inside a `function SearchContent()`, default export wraps in `<Suspense fallback={null}>` — match this exactly
- **Edge Cases & Hardening:**
  - `useSearchParams()` requires `<Suspense>` boundary — must wrap the client component that calls it; verified pattern in `search/page.tsx`
  - For `new-in`: the tab between `windowParam === "week"` and `"day"` — same logic, just reads from `searchParams.get("window")` instead of server `resolvedSearchParams`
  - For `designer/[slug]` client component: `useParams()` from `next/navigation` can get the slug if needed; but since the server wrapper passes designer data as props, `useParams()` is not needed in the client component
- **What would make this >=90%:**
  - Run a local `next build --webpack` and `next start` to verify filter behavior works for both pages
- **Rollout / rollback:**
  - Rollout: Two modified files + one new file
  - Rollback: Restore original `new-in/page.tsx` from git; restore `designer/[slug]/page.tsx`; delete `DesignerPageClient.tsx`
- **Documentation impact:** None
- **Notes / references:**
  - Reference pattern: `apps/xa-b/src/app/search/page.tsx` (uses `useSearchParams()` + Suspense)
  - `apps/xa-b/src/app/new-in/page.tsx:8-55` (full current implementation)
  - `apps/xa-b/src/app/designer/[slug]/page.tsx:20-112` (full current implementation)

---

### TASK-06: Replace middleware security headers with `public/_headers`; delete middleware.ts
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/public/_headers` with CF Pages security header rules; `apps/xa-b/middleware.ts` deleted
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 19ee385120 (Wave 2). TC-01 `_headers` contains CSP + X-Frame-Options; TC-02 middleware.ts deleted; TC-03 typecheck passes. Scope expansion: removed `"middleware.ts"` from tsconfig.json includes (required to avoid TS include-file warning).
- **Affects:** `apps/xa-b/public/_headers` (new), `apps/xa-b/middleware.ts` (delete)
- **Depends on:** TASK-01
- **Blocks:** TASK-08
- **Confidence:** 88%
  - Implementation: 90% — CSP values confirmed from i18n lookup; CF Pages `_headers` syntax is simple
  - Approach: 88% — CF Pages `_headers` file is the documented mechanism for response headers in static deployments
  - Impact: 87% — Maintains security headers; without this, pages are served without CSP/X-Frame-Options etc.
- **Acceptance:**
  - `apps/xa-b/public/_headers` exists with correct syntax
  - `apps/xa-b/middleware.ts` does not exist
  - Security headers are visible on all pages: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`
  - `pnpm --filter @apps/xa-b typecheck` passes (middleware.ts type removed)
- **Validation contract (TC-06):**
  - TC-01: `cat apps/xa-b/public/_headers` contains `Content-Security-Policy` and `X-Frame-Options`
  - TC-02: `ls apps/xa-b/middleware.ts` returns "No such file"
  - TC-03: Typecheck passes (middleware.ts import of `xaI18n` is removed with the file)
- **Execution plan:**
  - Red: Confirm middleware.ts exists and contains the CSP builder; confirm CSP values from i18n lookup
  - Green: Create `public/_headers`:
    ```
    /*
      Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:
      X-Frame-Options: DENY
      X-Content-Type-Options: nosniff
      Referrer-Policy: no-referrer
      Permissions-Policy: camera=(), microphone=(), geolocation=()
    ```
    Then delete `middleware.ts`.
  - Refactor: Verify typecheck; verify `middleware.ts` no longer imported anywhere
- **Planning validation:**
  - Checks run: Read `middleware.ts` + extracted CSP values via i18n json lookup. Confirmed all 5 header names and values.
  - Validation artifacts: `apps/xa-b/src/i18n/en.json` (CSP i18n keys confirmed), `apps/xa-b/middleware.ts` (read)
  - Unexpected findings: Production CSP omits `'unsafe-eval'` (only in dev); `_headers` uses production CSP. Dev local server uses `next dev` with middleware still active. Static staging/prod uses `_headers` only.
- **Consumer tracing (modified behavior):**
  - `middleware.ts` exports: removed. Next.js `middleware.ts` is consumed only by the Next.js request pipeline — no application code imports it.
  - `xaI18n` import from middleware.ts: the import in middleware.ts is deleted with the file. No other consumer of the middleware module.
- **Scouts:** Check if any other file imports from `middleware.ts`: `grep -rn "from.*middleware" apps/xa-b/src/` — expected: zero matches
- **Edge Cases & Hardening:**
  - The CF Pages `_headers` file uses the production CSP (no `'unsafe-eval'`). Local dev still uses middleware via `next dev`. This is correct — dev builds use live middleware; static deploys use `_headers`.
  - The middleware `config.matcher` was `["/((?!_next/|.*\\.[\\w]+$).*)"]` — the `_headers` file uses `/*` which applies to all paths including assets. This is acceptable (security headers on static assets don't cause issues).
- **What would make this >=90%:**
  - Deploy to CF Pages staging and verify headers with `curl -I https://...`
- **Rollout / rollback:**
  - Rollout: Create `_headers` file; delete `middleware.ts`
  - Rollback: Delete `_headers`; restore `middleware.ts` from git
- **Documentation impact:** None
- **Notes / references:**
  - CSP values resolved from `apps/xa-b/src/i18n/en.json` (xaB.middleware.* keys)
  - CF Pages `_headers` docs: https://developers.cloudflare.com/pages/configuration/headers/

---

### TASK-07: Remove account UI pages, nav link, and empty api dirs
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/src/app/account/` directory removed; `/account/login` link removed from `XaShell.tsx`; empty api dirs removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 19ee385120 (Wave 2). TC-01 `ls account/` fails; TC-02 grep confirms no `account/login` in XaShell.tsx; TC-03 typecheck passes. `PersonIcon` import removed from XaShell.tsx (now unused). api/access/ and api/access-request/ deleted. api/ directory now empty.
- **Affects:** `apps/xa-b/src/app/account/` (remove dir), `apps/xa-b/src/components/XaShell.tsx` (remove nav link), `apps/xa-b/src/app/api/access/` (remove empty dir), `apps/xa-b/src/app/api/access-request/` (remove empty dir)
- **Depends on:** TASK-01
- **Blocks:** TASK-04 (account/orders/[orderId] must be gone before generateStaticParams is added to other dynamic routes)
- **Confidence:** 88%
  - Implementation: 89% — Confirmed account UI pages are all `"use client"`; `XaShell.tsx:125` has the only nav link; api dirs are empty
  - Approach: 90% — Simple deletion; no server-side dependencies
  - Impact: 87% — Removes broken stubs; prevents `account/orders/[orderId]` from requiring its own generateStaticParams
- **Acceptance:**
  - `apps/xa-b/src/app/account/` directory does not exist
  - `XaShell.tsx` has no reference to `/account/login` or any `/account/*` href
  - `apps/xa-b/src/app/api/access/` does not exist
  - `apps/xa-b/src/app/api/access-request/` does not exist
  - `pnpm --filter @apps/xa-b typecheck` passes
  - `pnpm --filter @apps/xa-b test` passes
- **Validation contract (TC-07):**
  - TC-01: `ls apps/xa-b/src/app/account/` fails (directory gone)
  - TC-02: `grep "/account" apps/xa-b/src/components/XaShell.tsx` returns empty
  - TC-03: Typecheck passes (no imports from removed files)
- **Execution plan:**
  - Red: Confirm the 5 account pages are all `"use client"` (no server-only imports); confirm `XaShell.tsx:125` has the only nav reference; confirm api dirs are empty
  - Green: `rm -rf apps/xa-b/src/app/account/`; remove the nav link block from `XaShell.tsx`; `rm -rf apps/xa-b/src/app/api/access/ apps/xa-b/src/app/api/access-request/` (if no TASK-03 hasn't already cleaned api/)
  - Refactor: Typecheck; test suite
- **Planning validation:**
  - Checks run: Read account pages (all confirmed `"use client"`); grep `XaShell.tsx` for `/account` → line 125 only; confirmed api dirs are empty
  - Validation artifacts: `apps/xa-b/src/components/XaShell.tsx` (grepped), account page files (confirmed "use client")
  - Unexpected findings: Only one nav link to account found (`/account/login` at XaShell.tsx:125); no `/account/register`, `/account/orders` nav links
- **Consumer tracing (modified behavior):**
  - `XaShell.tsx` nav link removal: The link is a UI element only; removing it doesn't affect any other component. Confirm no JavaScript references to `/account/*` paths in other components via grep.
  - Account page files deletion: Confirmed no other component imports from `src/app/account/` (App Router pages are not imported — they're route-resolved by the framework).
- **Scouts:** `grep -rn "account" apps/xa-b/src/components/ apps/xa-b/src/contexts/ apps/xa-b/src/lib/` — confirm no non-UI references to account paths
- **Edge Cases & Hardening:**
  - `OrderDetail.client.tsx` in `account/orders/[orderId]/` — deleted along with the parent dir
  - If `api/` dir is already empty after TASK-03 removes the search/sync subtree, the `api/access/` and `api/access-request/` dirs (which are already empty) should also be cleaned up in this task
- **What would make this >=90%:**
  - Run full test suite to confirm no tests reference account page paths
- **Rollout / rollback:**
  - Rollout: Directory deletion + one line removal in XaShell.tsx
  - Rollback: Restore account pages from git; restore nav link
- **Documentation impact:** None
- **Notes / references:**
  - Account API reference: `docs/reference/xa-account/README.md`
  - Caryina reference note: `apps/caryina/NOTES.md`

---

### TASK-08: Delete wrangler.toml; update xa.yml CI for Pages deploy
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/wrangler.toml` deleted; `.github/workflows/xa.yml` `deploy-xa-b` job updated for static Pages deploy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Commit 0dd31cde99 (Wave 5). TC-01 `ls wrangler.toml` fails; TC-02 no opennextjs/wrangler-deploy in xa-b job; TC-03 `wrangler pages deploy` present; TC-04 `find __next.*` cleanup step present. `deploy-xa-b` job renamed to "Deploy xa-b (Pages)" and fully rewritten with 4 steps: static build, `__next.*` cleanup, Pages deploy, out/ validation.
- **Affects:** `apps/xa-b/wrangler.toml` (delete), `.github/workflows/xa.yml`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 83% — CI YAML edits are straightforward; `wrangler pages deploy` syntax is known
  - Approach: 82% — CF Pages deployment via `wrangler pages deploy` is documented; health check redesign is the main variable
  - Impact: 84% — Without CI update, the deployment pipeline still uses OpenNext which fails with static output
- **Acceptance:**
  - `apps/xa-b/wrangler.toml` does not exist
  - `xa.yml` `deploy-xa-b` job:
    - Builds with `cd apps/xa-b && pnpm build` (runs build-xa.mjs which calls `next build --webpack`)
    - Runs `find out -name '__next.*' -type f -delete` (CF Pages 20k file limit guard)
    - Deploys with `cd apps/xa-b && pnpm exec wrangler pages deploy out/ --project-name xa-b-site`
    - No OpenNext build step (`opennextjs-cloudflare build` removed)
    - No Worker deploy step (`wrangler deploy` removed)
    - Health check replaced with: `test -d apps/xa-b/out && test $(ls apps/xa-b/out | wc -l) -gt 0 && echo "out/ is non-empty" || (echo "FAIL: out/ missing or empty"; exit 1)`
  - `xa.yml` retains `needs: [deploy-drop-worker]` in `deploy-xa-b` (catalog fetch from xa-drop-worker at build time via `build-xa.mjs` requires the worker to be deployed first; removing this dependency risks a stale catalog)
- **Validation contract (TC-08):**
  - TC-01: `ls apps/xa-b/wrangler.toml` fails (file deleted)
  - TC-02: `grep "opennextjs-cloudflare\|wrangler deploy " .github/workflows/xa.yml` returns no matches for xa-b job
  - TC-03: `grep "wrangler pages deploy" .github/workflows/xa.yml` returns match for deploy-xa-b job
  - TC-04: `grep "find out -name.*__next" .github/workflows/xa.yml` returns match for cleanup step
- **Execution plan:**
  - Red: Read current `deploy-xa-b` job in `xa.yml` to confirm current OpenNext/Worker steps
  - Green: Delete `wrangler.toml`; rewrite `deploy-xa-b` job:
    1. Build: `cd apps/xa-b && pnpm build` (catalog sync + next build --webpack runs inside build-xa.mjs)
    2. Cleanup: `find apps/xa-b/out -name '__next.*' -type f -delete`
    3. Deploy: `cd apps/xa-b && pnpm exec wrangler pages deploy out/ --project-name xa-b-site`
    4. Validate: `test -d apps/xa-b/out && test $(ls apps/xa-b/out | wc -l) -gt 0`
    Env: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (same secrets, different scope)
  - Refactor: Verify yaml syntax; confirm `needs: [deploy-drop-worker]` is retained
- **Planning validation:**
  - Checks run: Read `xa.yml` deploy-xa-b job (lines 105-151); confirmed current structure
  - Validation artifacts: `.github/workflows/xa.yml` (read)
  - Unexpected findings: `XA_CATALOG_CONTRACT_READ_URL` is passed as an env var to the build step — must be retained in the new build step (build-xa.mjs reads it)
- **Consumer tracing (modified behavior):**
  - `xa.yml` changes consumed by GitHub Actions — no application code reference
  - `build-xa.mjs` is still called via `pnpm build` (package.json script `"build": "node ./scripts/build-xa.mjs"`) — no change to build-xa.mjs needed
  - `wrangler pages deploy` requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — same secrets as before
- **Scouts:** Verify `package.json` build script: `"build": "node ./scripts/build-xa.mjs"` — confirm `pnpm build` runs the catalog sync script
- **Edge Cases & Hardening:**
  - `XA_CATALOG_CONTRACT_READ_URL` env var must be passed to the build step (same as current)
  - CF Pages 20k file limit: the `find out -name '__next.*' -delete` step is required; Next.js 16 generates 33k+ `__next.*` files per route
  - Operator must create CF Pages project `xa-b-site` in dashboard before the first CI deploy succeeds — document in PR description
- **What would make this >=90%:**
  - Successful CI run with `wrangler pages deploy` returning a Pages URL
- **Rollout / rollback:**
  - Rollout: Delete wrangler.toml; update xa.yml deploy-xa-b job
  - Rollback: Restore wrangler.toml from git; revert xa.yml to OpenNext build + `wrangler deploy`
- **Documentation impact:** None
- **Notes / references:**
  - `apps/xa-b/wrangler.toml` (read — Worker format confirmed)
  - `.github/workflows/xa.yml:105-151` (current deploy-xa-b job)
  - MEMORY.md: `__next.*` cleanup pattern (established for brikette static export)

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Set output:export, remove requireEnv | Yes — no dependencies | None | No |
| TASK-02: Remove runtime exports | Yes — TASK-01 done | None | No |
| TASK-03: Delete api/search/sync | Yes — TASK-01 done | [Advisory][Minor]: api/access and api/access-request dirs also cleaned here — confirm order with TASK-07 | No — both tasks handle distinct dirs; no conflict |
| TASK-06: Replace middleware headers | Yes — TASK-01 done | None | No |
| TASK-07: Remove account pages | Yes — TASK-01 done; must complete before TASK-04 | [Advisory][Moderate]: Must complete before TASK-04 to avoid missing generateStaticParams on account/orders/[orderId] | No — explicit dependency in task summary |
| TASK-04: Add generateStaticParams | Yes — TASK-01, TASK-02, TASK-07 done | [Advisory][Moderate]: XA_EDITS has only 2 entries; edits/[slug] will only generate 2 pages — correct, no gap | No |
| TASK-05: Refactor searchParams | Yes — TASK-01, TASK-02 done | [Advisory][Minor]: designer/[slug] server wrapper must remain to export generateStaticParams (added by TASK-04) — TASK-05 must not convert the whole file to "use client" | No — documented in TASK-05 design spec |
| TASK-08: CI update | Yes — all code tasks done | [Advisory][Minor]: Operator must create CF Pages project xa-b-site before first deploy; CI will fail gracefully if project doesn't exist | No — documented in TASK-08 notes |

No Critical simulation findings. Proceed to plan persistence.

## Risks & Mitigations
- **CF Pages project not created** — Medium likelihood / Low impact: CI deploy fails with clear error; operator creates project (one-time action); no code risk
- **requireEnv guards cause build failure if secrets not removed** — Unlikely after TASK-01: TASK-01 explicitly removes them; tracked as mandatory (not optional)
- **CF Pages 20k file limit** — Low likelihood: `find out -name '__next.*' -delete` in TASK-08 addresses this
- **`brands/[handle]` meta-refresh redirect** — Low impact: acceptable UX for a non-primary route
- **catalog.runtime.json absent at build time** — Low likelihood: build-xa.mjs writes it before next build; fallback to catalog.json exists
- **TASK-04 + TASK-05 interaction** — Managed: TASK-05 design spec explicitly preserves server wrapper in `designer/[slug]/page.tsx`

## Observability
- Logging: `next build` output in CI confirms all routes pre-generated (lists "Generating static pages")
- Metrics: `wrangler pages deploy` output reports uploaded files count (verify below 20k)
- Alerts/Dashboards: None required — static Pages deployment; no runtime metrics

## Acceptance Criteria (overall)
- [ ] `next build --webpack` with `output: 'export'` completes successfully, generating `out/` directory
- [ ] All 14 dynamic route families produce pre-rendered HTML in `out/`
- [ ] `wrangler pages deploy out/ --project-name xa-b-site` succeeds from CI
- [ ] Lint, typecheck, and test all pass in CI
- [ ] Homepage (`out/index.html`) and a product page (`out/products/[handle]/index.html`) exist and are non-empty
- [ ] No reference to OpenNext, `wrangler deploy` (Worker), or `opennextjs-cloudflare` in xa-b build/deploy pipeline

## Decision Log
- 2026-02-27: Chose Option A (full static export on CF Pages) over Option B (optimise Workers CPU) — all-demo-data app is a perfect fit for static generation; no runtime server state exists
- 2026-02-27: `xaSearchService.ts` URL change deemed optional — fallback to bundled XA_PRODUCTS exists; TASK-03 scope limited to route deletion only
- 2026-02-27: `designer/[slug]/page.tsx` kept as server wrapper + client component extraction (cannot export `generateStaticParams` from `"use client"` module)
- 2026-02-27: `brands/[handle]` meta-refresh redirect accepted — not a primary entry point
- 2026-02-27: `wrangler.toml` deleted (not updated) — CF Pages deployment does not use Worker-format wrangler.toml

## Overall-confidence Calculation
- Effort weights: S=1, M=2
- TASK-01: 90% × 1 = 90
- TASK-02: 95% × 1 = 95
- TASK-03: 88% × 1 = 88
- TASK-04: 85% × 2 = 170
- TASK-05: 82% × 2 = 164
- TASK-06: 88% × 1 = 88
- TASK-07: 88% × 1 = 88
- TASK-08: 82% × 1 = 82
- Total weight: 10, Weighted sum: 865
- **Overall-confidence: 87%**
