---
Status: Complete
Feature-Slug: xa-b-static-export
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record: xa-b Static Export

## What Was Built

**Wave 1 — Build config (TASK-01, commit 79293e4c4b):**
Set `output: 'export'` in `next.config.mjs` by removing the ternary guard on `OUTPUT_EXPORT` and setting the field unconditionally. Removed the `requireEnv("NEXTAUTH_SECRET", 32)` call that would abort the build in static export mode when `NEXTAUTH_SECRET` is absent. Replaced the conditional `images.remotePatterns` block with an unconditional array. This made the Next.js static export mode permanent rather than opt-in.

**Wave 2 — Runtime removal, API deletion, security headers, account cleanup (TASK-02, TASK-03, TASK-06, TASK-07, commit 19ee385120):**
Removed `export const runtime = "nodejs"` from `layout.tsx` and `robots.ts` (both blocked static pre-rendering). Deleted the `api/search/sync/` route handler and its test — route handlers are incompatible with `output: 'export'`; `xaSearchService.ts` falls back gracefully to bundled `XA_PRODUCTS`. Created `apps/xa-b/public/_headers` with CF Pages-native security header rules (CSP, X-Frame-Options, XNTO, Referrer-Policy, Permissions-Policy) migrated from the middleware CSP builder. Deleted `middleware.ts`, removed its reference from `tsconfig.json`. Deleted the `account/` route tree (login, orders/[orderId], register, trackingorder), removed the `/account/login` nav link from `XaShell.tsx`, removed the now-unused `PersonIcon` import, and deleted the empty `api/access/` and `api/access-request/` directories.

**Wave 3 — Static route generation (TASK-04, commit 9c0cf77ae9):**
Added `export function generateStaticParams()` to all 14 dynamic route files across 6 route families (brands/[handle], designer/[slug], products/[handle], edits/[slug], collections/[handle], and all 9 subcategory routes under kids/men/women for bags/clothing/jewelry). Each function returns the correct data-derived array from `demoData.ts` and `xaCatalog.ts`. Without this, `next build` with `output: 'export'` refuses to generate HTML for dynamic routes.

**Wave 4 — Client searchParams refactor (TASK-05, commit 2db61e64ae):**
Converted `new-in/page.tsx` from an async server component (using `await searchParams`) to a `"use client"` component using `useSearchParams()` from `next/navigation`. The inner `NewInContent()` function calls `useSearchParams()` and is wrapped in `<Suspense fallback={null}>` in the `NewInPage` default export. The `designer/[slug]/page.tsx` was refactored to a thin server wrapper that retains `generateStaticParams` (cannot be exported from a `"use client"` module) and delegates rendering to the new `DesignerPageClient.tsx`. The client component uses `useSearchParams()` for the tab parameter. The pattern follows `search/page.tsx` (existing in-repo reference).

**Wave 5 — CI/deploy pipeline (TASK-08, commit 0dd31cde99):**
Deleted `apps/xa-b/wrangler.toml` (Worker configuration). Rewrote the `deploy-xa-b` job in `.github/workflows/xa.yml`: replaced the OpenNext build (`opennextjs-cloudflare build`) and Worker deploy (`wrangler deploy --env preview`) steps with (1) static build via `pnpm build`, (2) `__next.*` metadata file cleanup (CF Pages 20k file limit guard), (3) `wrangler pages deploy out/ --project-name xa-b-site`, and (4) an `out/` directory existence check. The `needs: [deploy-drop-worker]` dependency is retained — xa-drop-worker must be deployed first so the catalog sync during build can fetch the latest catalog. The `XA_CATALOG_CONTRACT_READ_URL` environment variable is forwarded to the build step unchanged.

## Tests Run

- `pnpm --filter @apps/xa-b typecheck` — PASS across all waves; FULL TURBO cache hit on most waves after Wave 1 rebuilt the base
- `pnpm --filter @apps/xa-b lint` — PASS across all waves (one lint fix applied in Wave 4: `import type` for type-only demoData imports in `DesignerPageClient.tsx`)
- Pre-commit hook `typecheck-staged` — PASS (Waves 1–5)
- Pre-commit hook `lint-staged-packages` — PASS (Waves 1–5)
- Search route test (`apps/xa-b/src/app/api/search/sync/__tests__/route.test.ts`) — deleted with TASK-03 (tests for the removed route); pre-existing unrelated test failures in brikette/reception confirmed as out-of-scope

## Validation Evidence

| Task | Contract | Result |
|---|---|---|
| TASK-01 | TC-01: `output: 'export'` in next.config.mjs | PASS |
| TASK-01 | TC-02: no `requireEnv` call in next.config.mjs | PASS |
| TASK-01 | TC-03: typecheck passes | PASS |
| TASK-02 | TC-01: no `runtime` in layout.tsx | PASS |
| TASK-02 | TC-02: no `runtime` in robots.ts | PASS |
| TASK-03 | TC-01: `api/search/sync/` deleted | PASS |
| TASK-03 | TC-02: search-related tests pass | PASS (no xa-b search failures) |
| TASK-04 | TC-01: `generateStaticParams` in 3 sampled files | PASS |
| TASK-04 | TC-02: `generateStaticParams` in all 14 files | PASS |
| TASK-04 | TC-03: typecheck passes | PASS |
| TASK-05 | TC-01: `useSearchParams` + `use client` in new-in/page.tsx | PASS |
| TASK-05 | TC-02: `generateStaticParams` in designer/[slug]/page.tsx | PASS |
| TASK-05 | TC-03: `useSearchParams` + `use client` in DesignerPageClient.tsx | PASS |
| TASK-05 | TC-04: typecheck passes | PASS |
| TASK-06 | TC-01: CSP + X-Frame-Options in `public/_headers` | PASS |
| TASK-06 | TC-02: middleware.ts deleted | PASS |
| TASK-06 | TC-03: typecheck passes | PASS |
| TASK-07 | TC-01: `account/` directory deleted | PASS |
| TASK-07 | TC-02: no `/account` reference in XaShell.tsx | PASS |
| TASK-08 | TC-01: wrangler.toml deleted | PASS |
| TASK-08 | TC-02: no opennextjs/wrangler-deploy in xa-b job | PASS |
| TASK-08 | TC-03: `wrangler pages deploy` in xa-b job | PASS |
| TASK-08 | TC-04: `__next.*` cleanup step in xa-b job | PASS |

## Scope Deviations

- **TASK-02 / TASK-06**: `"middleware.ts"` removed from `tsconfig.json` `include` array — required to prevent TypeScript "file not in project" warning after deleting middleware.ts. Bounded to same commit.
- **TASK-07**: `PersonIcon` import removed from `XaShell.tsx` `@radix-ui/react-icons` import block — became unused after removing the `/account/login` link block. Bounded to same commit.

## Outcome Contract

- **Why:** CF Workers free tier hits 10ms CPU limit per request causing 1102 errors; static export on CF Pages free tier has no per-request CPU cost and no monthly fee, directly eliminating the operational blocker.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b builds as `output: 'export'` without errors, all static pages are pre-generated at build time, CI deploys via `wrangler pages deploy`, and the app loads correctly on CF Pages staging with no 1102 errors.
- **Source:** operator
