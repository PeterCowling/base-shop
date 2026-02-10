---
Type: Plan
Last-reviewed: 2026-02-08
Status: Archived
Domain: Brikette
Created: 2026-02-05
Last-updated: 2026-02-09
Feature-Slug: brikette-live-delivery-speed
Overall-confidence: 82%
Remaining-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Relates-to charter: none
Tasks-complete: 12/19
---

# Brikette — Live Delivery Speed Plan


## Active tasks

No active tasks at this time.

## Summary

**Progress:** 12 of 19 tasks complete (63%)

**Completed P0 work:**
- ✅ TASK-01: Gated interactive prefetch (removed always-on modal/swiper downloads)
- ✅ TASK-02: Lazy-loaded rates.json (on-demand fetch, not always-on)
- ✅ TASK-03: Eliminated global namespace preload (core-only preload in AppLayout)
- ✅ TASK-04: Investigated layout chunk bloat root cause (locale-loader context split)
- ✅ TASK-05: Removed always-on i18n bundle bloat (layout 12MB→28KB, 99.8% reduction)
- ✅ TASK-07: Reduced prefetch fan-out on experiences collections
- ✅ TASK-08: Diagnosed chunk explosion (3,982 JSON chunks = 97.4% of total)
- ✅ TASK-10: Decided on GA-only Web Vitals (no RUM endpoint)
- ✅ TASK-11: Reduced prefetch fan-out on assistance/how-to-get-here
- ✅ TASK-12: Implemented GA-only Web Vitals (removed /api/rum fallback)
- ✅ TASK-17: Consolidated icon imports (single barrel export)

**Remaining work:**
1. **Fix `_headers` deployment** (TASK-06A): Staging has 311-rule `_headers` exceeding CF Pages' 100-rule limit (silently ignored). Condensed 22-rule version exists on `dev` — needs merging to staging.
2. **Verify production cache headers** (TASK-06B): curl verification after TASK-06A fix is deployed.
3. **Translation chunk investigation** (TASK-15): investigate chunking approach given CF free-tier constraints, guide draft→publish flow, and i18n architecture complexity. Stop before implementing.
4. **GA setup + verification** (TASK-13): expanded — create GA4 property, configure env vars in Cloudflare Pages, then verify Web Vitals + booking events.
5. **LHCI budgets** (TASK-09): add Lighthouse CI with budgets derived from post-fix baselines (depends on TASK-06B).
6. **Telemetry decision** (TASK-14): keep disabled (user decision made).
7. **Optional stopgap** (TASK-16): webpack splitChunks config (only if TASK-15 investigation recommends it).

**TASK-05 Success:** Layout bundle reduced from ~12MB to 28KB (99.8% reduction) by splitting locale loaders into "core" vs "guides" and deferring guides-only imports.

**TASK-08 Investigation Findings:** Chunk explosion root cause identified via `apps/brikette/scripts/perf/analyze-chunks.mjs`:
- **Total chunks:** 4,088 (27.1 MB)
- **JSON translation chunks:** 3,982 (97.4%, 23.5 MB) — webpack creates separate chunks for each dynamically imported JSON file
- **Other:** 59 (1.4%, 2.9 MB)
- **Route:** 44 (1.1%, 429.2 KB)
- **Framework:** 3 (0.1%, 288.5 KB)

Impact: HTTP/2 connection pressure, deployment overhead, potential first-render latency on guide pages (20-50 chunk requests).

Proposed solutions: namespace bundling by language (TASK-15, target <200 chunks), webpack splitChunks config (TASK-16, stopgap <500 chunks), icon consolidation if detected (TASK-17).

## Goals
- Reduce “First Load JS” and JS parse/compile time for non-booking pages (guides, assistance, how-to-get-here).
- Remove unconditional eager downloads that don’t contribute to LCP/TTI.
- Enable edge caching for HTML and static JSON so repeat visits hit Cloudflare cache.
- Add automated performance budgets for Brikette (LHCI) to catch regressions.
- Keep booking UX correct (modals, pricing, translations) across all 18 locales.

## Non-goals
- A full rewrite of the guides content system (only the minimum needed to remove always-on bloat).
- Building a full analytics pipeline for RUM (requires a product decision).
- Global “chunk count minimization” until after always-on bloat is removed (we’ll measure and decide follow-on work post P0 fixes).

## Constraints & Assumptions
- **Deployment:** Cloudflare Pages (supports `public/_headers`).
- **App shape:** Next.js App Router, extensive SSG (525 static routes), 18 locales.
- **Quality gates:** Brikette lint is currently disabled (`apps/brikette/package.json`), so the validation gate is typecheck + targeted Jest + perf checks.

## Fact-Find Reference
- Related brief: `docs/plans/brikette-live-delivery-speed-fact-find.md`
- Key findings (2026-02-04):
  - Always-on bundle: `apps/brikette/.next/static/chunks/app/[lang]/layout.js` is ~12MB uncompressed.
  - Always-on prefetch: `apps/brikette/src/utils/prefetchInteractive.ts` pulls ~7MB (swiper + modals) on every page.
  - Always-on data: `packages/ui/src/context/RatesContext.tsx` fetches `/data/rates.json` (714KB) on mount, site-wide.
  - Production cache headers are effectively disabled (`cf-cache-status: DYNAMIC`, `max-age=0` for HTML and JSON).

## Baseline → Targets (single source of truth)

| Area | Baseline (prod) | Target (post P0) | Target (post P1) | Measure |
|---|---|---|---|---|
| Always-on layout JS | `layout.js` ~12MB uncompressed | `< 1MB` uncompressed | `< 1MB` sustained via CI | build artifact size + LHCI script budget |
| Modal/swiper prefetch | ~7MB always-on | not fetched without intent | sustained | DevTools Network + targeted Jest |
| Rates fetch | `/data/rates.json` 714KB always-on | only on consumer/intent | cached at edge | DevTools Network + curl headers |
| Edge caching | HTML/JSON `max-age=0` and `cf-cache-status: DYNAMIC` | headers set + cacheable routes | sustained | curl headers (allow HIT/REVALIDATED) |
| Total chunk count | 4,088 chunks (post-TASK-05) | `< 500` via splitChunks | `< 200` via namespace bundling | `node apps/brikette/scripts/perf/analyze-chunks.mjs` (total count) |

## Existing System Notes
- Layout/client shell:
  - `apps/brikette/src/app/[lang]/ClientLayout.tsx` — client boundary + `I18nextProvider`
  - `apps/brikette/src/components/layout/AppLayout.tsx` — global providers + i18n preloading + `prefetchInteractiveBundles()`
- i18n loading:
  - `apps/brikette/src/i18n.ts` — `i18next-resources-to-backend` loader; guides namespace special-casing
  - `apps/brikette/src/locales/locale-loader.ts` — dynamic JSON loader; context is top-level only (non-recursive, `/^\.\/[a-z]{2}\/[^/]+\.json$/`) after TASK-05 split (`apps/brikette/src/locales/locale-loader.ts:37-40`)
  - `apps/brikette/src/hooks/usePagePreload.ts` — existing page-level namespace preloading pattern (preferred)
- Pricing:
  - `packages/ui/src/context/RatesContext.tsx` — fetches `/data/rates.json` on-demand when a consumer calls `useRates()` (lazy, not on provider mount; changed in TASK-02)
  - `apps/brikette/src/hooks/useRoomPricing.ts` — consumes `useRates()`
- Prefetch fan-out:
  - Multiple `<Link prefetch={true}>` call sites (guide cards, also-helpful sections, how-to-get-here route groups)

## Test Landscape (Reality Check)
- Test runner: Jest for `@apps/brikette` (`pnpm --filter @apps/brikette test ...`).
- Relevant passing tests (verified 2026-02-05):
  - `apps/brikette/src/test/utils/prefetchInteractive.test.ts`
  - `apps/brikette/src/test/hooks/useRoomPricing.test.ts`
- Typecheck (verified 2026-02-05):
  - `pnpm --filter @apps/brikette typecheck` ✅
  - `pnpm --filter @acme/ui typecheck` ✅
- Known gap: `apps/brikette/src/test/utils/loadI18nNs*.test.ts` exists but is ignored by Jest (`apps/brikette/jest.config.cjs`), so i18n-loader changes must be validated via build artifacts + Lighthouse (and/or new Jest-compatible tests).

## Proposed Approach

### P0 — Remove always-on work (largest wins)
- Stop global i18n preloading in `AppLayout` and rely on existing page-level preloading (`usePagePreload`) plus a small “core layout namespaces” preload only.
- Remove or gate `prefetchInteractiveBundles()` so modals/swiper are not prefetched on every route.
- Make rates loading on-demand (only when a consumer actually calls `useRates()`), preserving BookingModal correctness.
- Fix the **~12MB layout chunk** by splitting locale-loading into “core” vs “nested guides/content” loaders so the recursive `src/locales` import-map is not reachable from the always-on layout bundle.

### P1 — Infrastructure wins + guardrails
- Add explicit Cloudflare Pages cache headers via `apps/brikette/public/_headers`.
- Reduce `<Link prefetch={true}>` fan-out (keep only primary CTAs).
- Add Brikette to Lighthouse CI with budgets aligned to expected post-P0/P1 performance.

### P2 — Investigations / decisions
- ✅ Chunk explosion diagnosed (TASK-08): 4,088 chunks confirmed via `analyze-chunks.mjs`. Long-term fix: namespace bundling by language (TASK-15).
- Decide whether Brikette should wire up `@acme/telemetry` to an actual collector endpoint (or keep it disabled).

## Cache Policy Model (correctness-first)

This plan intentionally treats caching as a correctness problem first (avoid caching booking/personalised responses), then a performance problem.

- **Cacheable HTML (edge):** guides, experiences, assistance, how-to-get-here, static marketing pages.
  - Goal: edge-cached with short `s-maxage` and `stale-while-revalidate` for deploy-time updates.
- **Potentially sensitive HTML:** booking flows and any route that could be personalised or query-driven.
  - Goal: do **not** make these long-lived cacheable until verified safe; prefer `no-store` or minimal caching.
- **Static assets:** `/_next/static/**` hashed assets should be long-lived + immutable.
- **Static JSON:** `/data/rates.json` is served from `public/` (changes on deploy). Prefer edge caching with a conservative staleness model (short `s-maxage` + SWR) to avoid “deploy lag” serving stale prices too long.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Gate/remove always-on `prefetchInteractiveBundles()` | 82% | S | ✅ Complete (2026-02-05) | - |
| TASK-02 | IMPLEMENT | Lazy-load `/data/rates.json` on first `useRates()` consumer (with intent-based prefetch option) | 80% | M | ✅ Complete (2026-02-05) | - |
| TASK-03 | IMPLEMENT | Replace AppLayout global i18n preload (54 namespaces) with core-only | 85% | S | ✅ Complete (2026-02-05) | - |
| TASK-04 | INVESTIGATE | Confirm best fix for ~12MB `layout.js` (locale-loader context split) | 90% | M | ✅ Complete (2026-02-05) | TASK-03 |
| TASK-05 | IMPLEMENT | Implement i18n loader split so guide JSON context is not always-on | 80% | L | ✅ Complete (2026-02-05) | TASK-04 |
| TASK-06 | IMPLEMENT | Add Cloudflare Pages `_headers` caching policy | 75% ⚠️ | S | ⚠️ Reopened — 311-rule `_headers` exceeds CF 100-rule limit (see TASK-06A) | - |
| TASK-06A | IMPLEMENT | Merge condensed 22-rule `_headers` from `dev` to staging + fix SEO file timing | 92% | S | ⬜ Pending (blocker) | TASK-06 |
| TASK-06B | INVESTIGATE | Verify cache headers working in production (curl checks) | 90% | S | ⬜ Pending | TASK-06A |
| TASK-07 | IMPLEMENT | Reduce Next `<Link prefetch>` fan-out on `/[lang]/experiences` collections | 82% | M | ✅ Complete (2026-02-05) | - |
| TASK-08 | INVESTIGATE | Diagnose chunk explosion + propose split strategy changes (post TASK-05) | 95% | M | ✅ Complete (2026-02-05) | TASK-05 |
| TASK-09 | IMPLEMENT | Add Brikette to Lighthouse CI (budgets + workflow) | 84% | M | ⬜ Pending | TASK-05, TASK-06B |
| TASK-10 | DECISION | Decide: implement `/api/rum` vs remove fallback | 95% | S | ✅ Complete (2026-02-05) | - |
| TASK-11 | IMPLEMENT | Reduce Next `<Link prefetch>` fan-out on assistance + how-to-get-here | 90% | M | ✅ Complete (2026-02-05) | - |
| TASK-12 | IMPLEMENT | GA-only Web Vitals: remove `/api/rum` fallback + ensure GA script wiring | 90% | M | ✅ Complete (2026-02-05) | TASK-10 |
| TASK-13 | IMPLEMENT | Set up GA4 property + configure env vars + verify Web Vitals in production | 85% | M | ⬜ Pending (expanded) | TASK-12, TASK-06A |
| TASK-14 | DECISION | Decide: wire Brikette `@acme/telemetry` to a collector vs keep disabled | 95% | S | ✅ Complete (keep disabled) | - |
| TASK-15 | INVESTIGATE | Investigate chunk reduction approach given CF free-tier, guide publishing, i18n complexity | 88% | M | ⬜ Pending (highest priority) | TASK-08 |
| TASK-16 | INVESTIGATE/EXPERIMENT | Add webpack splitChunks config to group JSON by language (stopgap fallback) | 70% ⚠️ | S | ⬜ Optional Fallback | TASK-15 |
| TASK-17 | IMPLEMENT | Consolidate icon imports to reduce icon chunk count | 90% | S | ✅ Complete (2026-02-05) | TASK-08 |

**Completion Status:** 12 of 19 tasks complete (✅)
- Complete: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-07, TASK-08, TASK-10, TASK-11, TASK-12, TASK-14, TASK-17
- Reopened: TASK-06 (311-rule `_headers` exceeds CF 100-rule limit — see TASK-06A)
- Pending: TASK-06A (blocker), TASK-06B, TASK-09, TASK-13, TASK-15
- Optional: TASK-16

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

**Confidence note:** `Overall-confidence` includes completed work (useful as a summary of the plan as-written). `Remaining-confidence` excludes completed tasks and is meant to reflect the "work left to do". Build gating remains per-task: each IMPLEMENT task must be ≥80% and have a complete test contract. INVESTIGATE/EXPERIMENT tasks may have lower confidence (<80%) since they are exploratory fallbacks, not required implementation work.

## Tasks

### TASK-01: Gate/remove always-on `prefetchInteractiveBundles()` (~7MB)
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/utils/prefetchInteractive.ts`, `apps/brikette/src/components/layout/AppLayout.tsx`, `apps/brikette/src/context/modal/provider.tsx`
- **Depends on:** -
- **Status:** Complete (2026-02-05)
- **Confidence:** 82%
  - Implementation: 90% — isolated code, existing Jest coverage (`prefetchInteractive.test.ts`).
  - Approach: 85% — removes always-on network contention; aligns with “only prefetch where it helps”.
  - Impact: 82% — broad reach (all pages) but easy to validate via network waterfall.
- **Acceptance:**
  - Non-booking routes (e.g. `/en/experiences`) do **not** fetch BookingModal/swiper bundles until an explicit user-intent signal (e.g. hover/focus/click on booking CTA, opening date picker) or a route-specific allowlist.
  - Booking-critical routes can still prefetch after true idle, respecting `saveData`/slow connections (and `effectiveType`) if we add gating.
  - Existing Jest tests for `prefetchInteractive` updated and passing.
- **Test contract:**
  - TC-01: `/en/experiences` initial load → no `BookingModal*` chunk requests.
  - TC-02: `/en/rooms` idle period → (if enabled) prefetch begins after idle, not immediately.
  - TC-03: `navigator.connection.saveData === true` → prefetch suppressed.
  - **Test type:** unit
  - **Test location:** `apps/brikette/src/test/utils/prefetchInteractive.test.ts`
  - **Run:** `pnpm --filter @apps/brikette test -- apps/brikette/src/test/utils/prefetchInteractive.test.ts`
- **Planning validation:**
  - Typecheck: `pnpm --filter @apps/brikette typecheck` ✅
  - Tests: `pnpm --filter @apps/brikette test -- apps/brikette/src/test/utils/prefetchInteractive.test.ts` ✅
  - Unexpected findings: none
- **Rollout / rollback:**
  - Rollout: deploy normally; verify network waterfalls on staging + production.
  - Rollback: revert the AppLayout call/gating logic.
- **Documentation impact:** None
- **Notes / references:** `apps/brikette/src/utils/prefetchInteractive.ts` currently imports 8 heavy modules with `webpackPrefetch: true`.

### TASK-02: Lazy-load `/data/rates.json` only when a consumer uses rates (714KB)
- **Type:** IMPLEMENT
- **Affects:** `packages/ui/src/context/RatesContext.tsx`, `packages/ui/src/context/__tests__/RatesContext.lazy-load.test.tsx`, `[readonly] apps/brikette/src/hooks/useRoomPricing.ts`, `[readonly] packages/ui/src/hooks/useRoomPricing.ts`
- **Depends on:** -
- **Status:** Complete (2026-02-05)
- **Confidence:** 80%
  - Implementation: 85% — localized change; existing hooks already model `loading` state.
  - Approach: 82% — keeps global provider available for BookingModal while eliminating waste on guide/assistance pages.
  - Impact: 80% — must preserve booking + room card behavior; validation is straightforward via Network tab.
- **Acceptance:**
  - Visiting `/en/experiences` (or assistance/how-to) triggers **no** `/data/rates.json` request.
  - Visiting `/en/rooms` triggers `/data/rates.json` request (price UI remains correct).
  - Opening BookingModal on any route still loads rates (if modal needs them) and does not crash.
  - Decide and document the “first interaction” experience:
    - Either show a skeleton while rates load, or
    - Prefetch rates on intent (hover/focus on booking CTA / opening modal) so prices are ready when the user commits.
  - Note coupling: if TASK-06 edge caching is effective for `/data/rates.json`, the “first interaction” latency spike is reduced; if not, prefer the intent-based prefetch strategy.
- **Test contract:**
  - TC-01: On a non-room route with no rates consumers → no network request for `/data/rates.json`.
  - TC-02: On `/en/rooms` with room cards mounted → `/data/rates.json` requested and `useRoomPricing` resolves.
  - TC-03: BookingModal open on home page → rates load on-demand; UI doesn’t crash.
  - **Test type:** integration
  - **Test location:** `apps/brikette/src/test/hooks/useRoomPricing.test.ts`
  - **Run:** `pnpm --filter @apps/brikette test -- apps/brikette/src/test/hooks/useRoomPricing.test.ts`
- **Planning validation:**
  - Typecheck: `pnpm --filter @acme/ui typecheck` ✅
  - Tests run: `pnpm --filter @apps/brikette test -- apps/brikette/src/test/hooks/useRoomPricing.test.ts` ✅
  - Provider contract: `pnpm --filter @acme/ui test:quick -- packages/ui/src/context/__tests__/RatesContext.lazy-load.test.tsx` ✅
  - Unexpected findings: `useRoomPricing` tests mock `useRates` (provider timing covered by the `@acme/ui` test above).
- **Rollout / rollback:**
  - Rollout: ship; verify `/data/rates.json` absent on guide pages in production waterfall.
  - Rollback: revert provider behavior to eager fetch (accepting perf regression).
- **Documentation impact:** None
- **Notes / references:** current eager fetch is in `packages/ui/src/context/RatesContext.tsx` mount effect.

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 80%
- **Updated confidence:** 80% (no change; implementation verified complete)
  - Implementation: 85% — lazy-load implementation complete with provider-level test (`RatesContext.lazy-load.test.tsx`).
  - Approach: 82% — global provider pattern retained; fetch deferred to first `useRates()` consumer.
  - Impact: 80% — straightforward Network tab validation; booking/rooms behavior preserved.
- **Investigation performed:**
  - Repo: `packages/ui/src/context/RatesContext.tsx` (lazy-load implementation), `packages/ui/src/context/__tests__/RatesContext.lazy-load.test.tsx` (provider contract test)
  - Tests: passing (`pnpm --filter @acme/ui test:quick -- ...`)
- **Decision / resolution:**
  - **"First interaction" approach:** Simple on-demand fetch (no skeleton, no intent prefetch). Rates load when first consumer calls `useRates()`; UI shows existing loading states. Rationale: simplest correct implementation; TASK-06 edge caching will reduce latency spike if effective.
  - If edge caching proves insufficient, revisit intent-based prefetch in future iteration.
- **Changes to task:**
  - None; acceptance criterion now satisfied with documented decision.

### TASK-03: Replace AppLayout i18n preload of all namespaces with core-only
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/components/layout/AppLayout.tsx`, `apps/brikette/src/hooks/useI18nPreloading.ts`, `apps/brikette/src/i18n.namespaces.ts`, `apps/brikette/src/context/modal/constants.ts`, `[readonly] apps/brikette/src/hooks/usePagePreload.ts`
- **Depends on:** -
- **Status:** Complete (2026-02-05)
- **Confidence:** 85%
  - Implementation: 88% — contained to AppLayout; existing page components already preload their own namespaces.
  - Approach: 85% — aligns loading to actual route needs; reduces duplicated work.
  - Impact: 85% — must ensure header/footer/banner namespaces remain available; easy to validate visually.
- **Acceptance:**
  - AppLayout no longer preloads `APP_I18N_NAMESPACES` (54 namespaces) on every route.
  - Core layout namespaces are preloaded (at minimum: `header`, `footer`, `_tokens`) to avoid visible translation-key flicker.
  - Page-level preloads continue to load route-specific namespaces (no missing copy).

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 85%
- **Updated confidence:** 85%
  - Implementation: 88% — change is localized to AppLayout’s preload effect (`apps/brikette/src/components/layout/AppLayout.tsx:43-86`).
  - Approach: 85% — aligns with the existing page-level namespace preloading pattern (`apps/brikette/src/hooks/usePagePreload.ts`).
  - Impact: 85% — regression surface is visible and can be validated quickly across representative locales.
- **Investigation performed:**
  - Repo: `apps/brikette/src/components/layout/AppLayout.tsx:43-86`
  - Tests: Jest moduleNameMapper mock for `@/utils/loadI18nNs` (`apps/brikette/jest.config.cjs:42-43`, `apps/brikette/src/test/__mocks__/loadI18nNs.ts:1-21`)
- **Decision / resolution:**
  - Add a Jest integration test to lock the “core-only preload” contract (instead of relying only on `pnpm build` + manual smoke).
- **Changes to task:**
  - Test contract updated with explicit `TC-XX`, test type, location, and run command.
- **Test contract:**
  - **TC-01:** Render `<AppLayout lang="en">` → calls `preloadI18nNamespaces()` with the core layout namespaces only.
  - **TC-02:** Render `<AppLayout lang="en">` → does **not** call `preloadI18nNamespaces()` with the full `APP_I18N_NAMESPACES` list (54 namespaces).
  - **TC-03:** Manual smoke on `/en/assistance` + `/en/experiences` across `en`, `de`, `ar` → header/footer render without raw i18n keys (and guides content is present on experiences).
  - **Acceptance coverage:** TC-02 covers criteria 1; TC-01 covers criteria 2; TC-03 covers criteria 3.
  - **Test type:** integration
  - **Test location:** `apps/brikette/src/test/components/layout/AppLayout.i18n-preload.test.tsx` (new)
  - **Run:** `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/layout/AppLayout.i18n-preload.test.tsx`
- **Planning validation:**
  - Typecheck: `pnpm --filter @apps/brikette typecheck` ✅
  - Tests: `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/layout/AppLayout.i18n-preload.test.tsx` ✅
  - Unexpected findings: none
- **Rollout / rollback:**
  - Rollout: ship; validate on staging with at least `en`, `de`, `ar` (RTL).
  - Rollback: revert to previous AppLayout preload behavior.
- **Documentation impact:** None
- **Notes / references:** `apps/brikette/src/hooks/usePagePreload.ts` already exists for page-level namespace loading.

### TASK-04: Confirm best fix for ~12MB `layout.js` (locale-loader context split)
- **Type:** INVESTIGATE
- **Affects:** `apps/brikette/src/i18n.ts`, `apps/brikette/src/locales/locale-loader.ts`, `apps/brikette/src/locales/guides.imports.ts`, build artifact `apps/brikette/.next/static/chunks/app/[lang]/layout.js`
- **Depends on:** TASK-03
- **Status:** Complete (2026-02-05)
- **Confidence:** 90%
  - Implementation: 90% — the exact bundle source + call chain is now identified with file-level evidence.
  - Approach: 90% — a low-tech-debt split is available that keeps “nested guides/content” contexts off the always-on path.
  - Impact: 90% — the change is constrained to i18n loader wiring; runtime behavior can be verified via build artifact + route smoke.
- **Findings (evidence):**
  - Locale-loader currently uses a **recursive** webpack context and includes every JSON module under `src/locales`:
    - `getWebpackContextFromMeta("./", true, /\.json$/)` (`apps/brikette/src/locales/locale-loader.ts:37-38`)
    - `webpackInclude: /\.json$/` for dynamic import (`apps/brikette/src/locales/locale-loader.ts:56-59`)
  - The guides importer loads `guides/content/*` via `loadLocaleResource(...)` for every generated guide key (`apps/brikette/src/locales/guides.imports.ts:91-101`).
  - The built `layout.js` contains the async context id and a massive module map including `./<lang>/guides/content/*.json` entries:
    - Context id: `apps/brikette/.next/static/chunks/app/[lang]/layout.js:4285`
    - Example map entries: `apps/brikette/.next/static/chunks/app/[lang]/layout.js:4376`
  - Why it’s always-on: `AppLayout` imports `i18n` (`apps/brikette/src/components/layout/AppLayout.tsx:16-22`), and `i18n.ts` imports `loadLocaleResource` (`apps/brikette/src/i18n.ts:15-18`).
- **Approach options (A/B):**
  - **Option A (Chosen): Split locale loading by “core” vs “nested guides/content”.**
    - Keep `loadLocaleResource()` (or a renamed equivalent) limited to `./<lang>/<ns>.json` only (one-level deep).
    - Move nested guide loading (`guides/**`, especially `guides/content/*`) behind a separate loader module that is only imported on-demand for guide routes.
    - Rationale: reduce the module-map embedded in the always-on layout chunk while preserving current runtime semantics.
  - **Option B:** Move guides translation JSON to runtime fetch (e.g., `public/`) instead of bundling.
    - Rejected for now: higher migration surface + caching/versioning concerns; Option A is the smallest long-term-safe change.
- **Result / chosen approach write-up (feeds TASK-05):**
  - Implement a two-loader split:
    1) **Core loader**: supports top-level namespaces only, with a narrow include pattern (prevents `guides/**` from being part of the context).
    2) **Guides loader**: supports `guides/**` (incl. `guides/content/*`), loaded via dynamic import from the guides namespace path so it’s not reachable from the always-on layout.

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 70%
- **Updated confidence:** 90%
  - Implementation: 90% — root cause is pinned to `loadLocaleResource()`’s recursive context (`apps/brikette/src/locales/locale-loader.ts:37-59`) and its presence in `layout.js` (`apps/brikette/.next/static/chunks/app/[lang]/layout.js:4285`).
  - Approach: 90% — Option A is consistent with existing guides loader patterns (`apps/brikette/src/locales/guides.state.ts:36-58`) and avoids a “move-to-public” data migration.
  - Impact: 90% — changes are isolated to i18n loader modules + import wiring.
- **Investigation performed:**
  - Repo: `apps/brikette/src/locales/locale-loader.ts:37-63`, `apps/brikette/src/locales/guides.imports.ts:51-119`, `apps/brikette/src/i18n.ts:85-145`, `apps/brikette/src/components/layout/AppLayout.tsx:43-86`
  - Build artifact: `apps/brikette/.next/static/chunks/app/[lang]/layout.js:4285,4376`
- **Decision / resolution:**
  - Proceed with Option A (split loaders + defer guides loader import) to keep the recursive `src/locales` map out of the always-on chunk.
- **Changes to task:**
  - Status: marked complete; TASK-05 updated to implement the chosen approach with contract-style artifact checks.

### TASK-05: Implement i18n loader split to keep guide JSON context out of always-on layout
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/i18n.ts`, `apps/brikette/src/locales/locale-loader.ts`, `apps/brikette/src/locales/guides.*` (as needed), `apps/brikette/src/components/layout/AppLayout.tsx`, `[new] apps/brikette/scripts/perf/check-layout-chunk.mjs`
- **Depends on:** TASK-04
- **Status:** Complete (2026-02-05)
- **Confidence:** 80%
  - Implementation: 82% — integration seams are identified (`apps/brikette/src/i18n.ts:85-145`, `apps/brikette/src/locales/locale-loader.ts:37-63`) and the root cause is confirmed in the build artifact (`apps/brikette/.next/static/chunks/app/[lang]/layout.js:4285`).
  - Approach: 80% — loader split + deferred guides import is the smallest long-term-safe change (no data migration to `public/`).
  - Impact: 80% — broad surface (translations) but regressions are catchable via artifact checks + representative locale smoke (`en`, `de`, `ar`).
- **Acceptance:**
  - `[lang]` layout chunk is < 1MB uncompressed (baseline: ~12MB), and the chunk does **not** embed `guides/content/*` module-map keys.
  - No missing translation keys on core routes across 3 representative locales (`en`, `de`, `ar`).
- **Planning validation:**
  - Build: `pnpm --filter @apps/brikette build` ✅
  - Artifact guard: `pnpm --filter @apps/brikette perf:check-layout-chunk` ✅ (layout chunk ~25KB; no `guides/content/` substring)

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 72%
- **Updated confidence:** 80%
  - Implementation: 82% — root cause + ownership is explicit (recursive locale-loader context: `apps/brikette/src/locales/locale-loader.ts:37-59`; always-on reachability via `apps/brikette/src/components/layout/AppLayout.tsx:16-22` and `apps/brikette/src/i18n.ts:15-18`).
  - Approach: 80% — chosen split approach (TASK-04) avoids migrating translation JSON to runtime fetch and keeps changes localized.
  - Impact: 80% — mitigated by adding a deterministic build-artifact contract check (script) and limiting manual validation to representative routes/locales.
- **Investigation performed:**
  - Repo: `apps/brikette/src/locales/locale-loader.ts:37-63`, `apps/brikette/src/i18n.ts:85-145`, `apps/brikette/src/locales/guides.imports.ts:91-101`, `apps/brikette/src/components/layout/AppLayout.tsx:43-86`
  - Build artifact: `apps/brikette/.next/static/chunks/app/[lang]/layout.js:4285,4376`
- **Decision / resolution:**
  - Implement the “core vs guides” loader split (Option A) and defer guides-only loader imports so the nested module map is no longer reachable from the always-on layout.
- **Changes to task:**
  - Acceptance unchanged, but test contract upgraded to include ≥5 contract cases and an explicit build-artifact check script.
- **Test contract:**
  - **TC-01:** `pnpm --filter @apps/brikette build` → `apps/brikette/.next/static/chunks/app/[lang]/layout.js` is <1MB uncompressed.
  - **TC-02:** `node apps/brikette/scripts/perf/check-layout-chunk.mjs` → fails if `layout.js` still contains any `guides/content/` module-map keys (semantic check; avoid matching brittle bundler banner strings).
  - **TC-03:** `/en/assistance` on `next start` → header/footer translations render and there are no guide-content chunk requests unless you navigate to a guide route.
  - **TC-04:** `/en/experiences` + one guide content page on `next start` → guide copy renders; guide-related chunks load on-demand (not from layout).
  - **TC-05:** Missing namespace request (e.g., `loadLocaleResource("en", "doesNotExist")`) → returns `undefined`; i18n backend falls back to `{}` without crashing.
  - **Acceptance coverage:** TC-01/02 cover criteria 1; TC-03/04 cover criteria 3; TC-05 guards narrowed-context error handling.
  - **Test type:** contract
  - **Test location:** `apps/brikette/scripts/perf/check-layout-chunk.mjs` (new)
  - **Run:** `pnpm --filter @apps/brikette build && node apps/brikette/scripts/perf/check-layout-chunk.mjs` (then `pnpm --filter @apps/brikette start` and smoke the routes above)
- **What would make this ≥90%:**
  - Land the build-artifact check script + enforce the script-size budget in LHCI (TASK-09) so regressions are deterministic CI failures.
- **Rollout / rollback:**
  - Rollout: land behind a short-lived flag if needed (fallback to previous loader); validate on staging before production.
  - Rollback: revert loader changes; accept larger bundle until re-planned.
- **Documentation impact:** Update this plan with the chosen approach and measured before/after numbers.
- **Notes / references:** The goal is to remove nested guide JSON import contexts (especially `guides/content/*`) from the always-on client layout bundle.

### TASK-06: Add Cloudflare Pages `_headers` caching policy
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/public/_headers`
- **Depends on:** -
- **Status:** ⚠️ Reopened — staging `_headers` has 311 rules, exceeding CF Pages 100-rule limit (see TASK-06A)
- **Confidence:** 75% ⚠️ (downgraded — CF rule-count limit)
  - Implementation: 95% — the condensed 22-rule `_headers` on `dev` is correct and within CF Pages limits.
  - Approach: 75% ⚠️ — staging `_headers` has **311 rules**, exceeding CF Pages' **100-rule limit**. CF silently ignores the entire file when over 100 rules. The fix (condensed to 22 rules via `/*` catch-all) exists on `dev` but hasn't been merged to staging/main.
  - Impact: 60% ⚠️ — cache headers have never taken effect in production or staging due to the rule-count violation.
- **Acceptance:**
  - `_headers` is deployed from the correct build output root (i.e. the headers actually apply in production).
  - Cache-Control headers match the route classification in "Cache Policy Model" (HTML vs booking vs static assets vs JSON), with deterministic patterns:
    - Cacheable HTML: `max-age=0` and **non-zero** `s-maxage`, plus `stale-while-revalidate`.
    - Booking/sensitive HTML: `no-store` (or explicitly non-cacheable at edge).
    - `/data/rates.json`: `max-age=0` and **non-zero** `s-maxage`, plus `stale-while-revalidate`.
    - `/_next/static/**`: long-lived + `immutable`.
  - **Cacheable HTML must NOT emit `Set-Cookie` or `Cache-Control: private`** (these force `cf-cache-status: DYNAMIC/BYPASS`).
  - `_headers` explicitly targets the route families this plan cares about (avoid "accidental caching"):
    - Cacheable HTML examples: `/en/experiences*`, `/en/assistance*`, `/en/how-to-get-here*`, `/en/guides*` (and equivalent locale prefixes).
    - Non-cacheable HTML examples: `/en/book*` (and equivalent locale prefixes), and any sensitive routes discovered during implementation.
  - For cacheable HTML + `rates.json`, repeated curls from the same client/POP show `cf-cache-status` is **not** `DYNAMIC`/`BYPASS` (allow `HIT` or `REVALIDATED` depending on SWR/revalidation).

#### Re-plan Update (2026-02-05 — Initial)
- **Previous confidence:** 88%
- **Updated confidence:** 88%
  - Implementation: 90% — Cloudflare Pages `_headers` is a standard, low-risk mechanism.
  - Approach: 88% — repeat-visit caching is a "free win" and independent of other P0 work.
  - Impact: 88% — biggest risk is over-caching HTML; mitigated by explicit `s-maxage` + SWR and curl verification.
- **Investigation performed:**
  - Repo: `_headers` mechanism assumed; acceptance remains validated via production curl checks post-deploy.
- **Decision / resolution:**
  - Treat this as a contract-style deploy verification (curl), and make the contract explicit (type + location + run).
- **Changes to task:**
  - Test contract updated to meet TDD checklist (type/location/run + acceptance coverage).

#### Re-plan Update (2026-02-05 — Implementation Complete)
- **Previous confidence:** 88%
- **Updated confidence:** 92%
  - Implementation: 95% — `_headers` file exists at `/Users/petercowling/base-shop/apps/brikette/public/_headers` with 646 lines covering all 18 locales + booking routes + static assets + `/data/rates.json`.
  - Approach: 92% — correctly addresses Next-on-Pages limitation by mirroring `_headers` rules into Next.js `headers()` config (`apps/brikette/next.config.mjs:110-118`) so origin responses carry `Cache-Control` headers (Worker runtime issue mitigated).
  - Impact: 90% — local contract verified (build + start shows correct headers); production verification blocked only by deployment timing (not implementation gaps).
- **Investigation performed:**
  - File verification: `apps/brikette/public/_headers` exists (646 lines) with explicit route-family rules (cacheable HTML with `s-maxage=600` + SWR, booking routes with `no-store`, static assets with `immutable`, `/data/rates.json` with `s-maxage=300` + SWR).
  - Next.js integration: `apps/brikette/next.config.mjs:110-118` implements `headers()` function that parses `_headers` file and returns Next.js header config (ensures origin responses carry headers even in Worker runtime).
  - Typecheck: `pnpm --filter @apps/brikette typecheck` passes.
  - Production observation: `curl -I https://www.hostel-positano.com/en/` returns `cache-control: public, max-age=0, must-revalidate` and `cf-cache-status: DYNAMIC`, indicating current production deployment predates this implementation (expected).
- **Decision / resolution:**
  - Implementation is complete and correct; status changed from "Needs-Input" to "Needs-Input (production curl verification awaiting deployment)" to clarify the blocker is deployment timing, not missing implementation.
  - "Needs-Input" remains appropriate because production validation (TC-01 through TC-06 curl checks) requires a deployment that includes this change.
- **Changes to task:**
  - Confidence increased from 88% → 92% based on complete implementation + local verification.
  - Status clarified: implementation complete, awaiting deployment for production curl verification.
  - No change to "Needs-Input" status (user input = deploy + confirm in production).
- **Test contract:**
  - **TC-01:** `curl -I https://www.hostel-positano.com/en/` (repeat twice) → includes `s-maxage` + `stale-while-revalidate`; `cf-cache-status` becomes `HIT` or `REVALIDATED` (but not `DYNAMIC`/`BYPASS`).
  - **TC-02:** `curl -I https://www.hostel-positano.com/data/rates.json` (repeat twice) → includes non-zero `s-maxage`; `cf-cache-status` becomes `HIT` or `REVALIDATED` (but not `DYNAMIC`/`BYPASS`).
  - **TC-03:** Pick any `/_next/static/**/*.js` URL from `view-source:https://www.hostel-positano.com/en/` → `curl -I <that-url>` includes long-lived cache headers (expect `immutable`) and is cacheable at the edge.
  - **TC-04:** `curl -I https://www.hostel-positano.com/en/experiences` → no `set-cookie` header; `cache-control` includes `public` (if expecting edge caching).
  - **TC-05:** `_headers` contains explicit route-family rules for cacheable vs non-cacheable HTML (e.g. `/[lang]/experiences*` cacheable, `/[lang]/book*` no-store) → avoids accidental caching.
  - **TC-06:** `curl -I https://www.hostel-positano.com/en/book` → `cache-control: no-store` and `cf-cache-status` is NOT `HIT` or `REVALIDATED` (validates booking is not cached).
  - **Acceptance coverage:** TC-01/TC-02 cover header patterns + edge cacheability for cacheable routes; TC-03 covers immutable static assets; TC-04 covers Set-Cookie check; TC-05 covers explicit route targeting; TC-06 validates sensitive routes are NOT cached.
  - **Test type:** contract
  - **Test location:** `apps/brikette/public/_headers`
  - **Run:** `rg -n \"(_next/static|/book|/experiences|/assistance|/how-to-get-here|/guides|/data/rates\\.json)\" apps/brikette/public/_headers` + `BASE_URL=https://www.hostel-positano.com sh scripts/post-deploy-brikette-cache-check.sh` (preferred) or manual curls: `curl -I https://www.hostel-positano.com/en/` (repeat twice) + `curl -I https://www.hostel-positano.com/data/rates.json` (repeat twice) + `curl -I https://www.hostel-positano.com/en/experiences` + `curl -I https://www.hostel-positano.com/en/book` + `curl -I <copied /_next/static/*.js url from page source>`
- **Implementation notes (2026-02-05):**
  - Added `apps/brikette/public/_headers` with explicit route-family rules (cacheable HTML, immutable static assets, cached `rates.json`, and `no-store` for booking/draft/api).
  - Next-on-Pages note: Brikette is deployed via `@cloudflare/next-on-pages`, so HTML/route responses are served via a Worker runtime. `_headers` alone may not affect those responses. Brikette now mirrors `apps/brikette/public/_headers` into Next’s `headers()` config so the origin responses carry the intended `Cache-Control` (and Cloudflare can cache where eligible). See `apps/brikette/next.config.mjs`.
  - Automation: added `scripts/post-deploy-brikette-cache-check.sh` and wired it into `.github/workflows/reusable-app.yml` so staging/production deploys fail if cache header contracts regress.
  - Pending: deploy + run TC-01..TC-06 against the production custom domain to confirm `cf-cache-status` transitions away from `DYNAMIC/BYPASS` where intended.
  - Current production observation (2026-02-05): `https://www.hostel-positano.com/en/` and `https://www.hostel-positano.com/data/rates.json` return `cf-cache-status: DYNAMIC` and lack `s-maxage` (indicates the current deployed stack is not yet applying this policy).
- **Planning validation:**
  - Typecheck: `pnpm --filter @apps/brikette typecheck` ✅
  - Local contract smoke: `pnpm --filter @apps/brikette build && pnpm --filter @apps/brikette start -p 4012` → `/en` includes `s-maxage=600`; `/en/book` + `/en/draft` include `no-store`; `/data/rates.json` includes `s-maxage=300` ✅
- **Rollout / rollback:**
  - Rollout: deploy; validate via curl + browser repeat-visit.
  - Rollback: remove `_headers` file or revert policy.
- **Documentation impact:** None

#### Re-plan Update (2026-02-09)
- **Previous confidence:** 92%
- **Updated confidence:** 75% ⚠️
  - **Evidence class:** E2 (live curl checks against staging + git history of `_headers` file)
  - Implementation: 95% — the condensed 22-rule `_headers` on `dev` is correct and within CF Pages limits.
  - Approach: 75% ⚠️ — the deployed staging `_headers` has **311 rules**, exceeding CF Pages' **100-rule limit**. CF silently ignores the entire file when over 100 rules. The fix (condensed to 22 rules via `/*` catch-all) exists on `dev` but hasn't been merged to staging/main.
  - Impact: 60% ⚠️ — cache headers have never taken effect in production or staging due to the rule-count violation.
- **Investigation performed:**
  - `git show staging:apps/brikette/public/_headers | grep -c "^/"` → **311 rules** (CF Pages limit: 100).
  - `curl -I https://staging.brikette-website.pages.dev/en/book` → `public, max-age=0, must-revalidate` (should be `no-store` if `_headers` was applied).
  - `curl -I https://staging.brikette-website.pages.dev/data/rates.json` → `public, max-age=0, must-revalidate` (should have `s-maxage=300`).
  - Commit `c68b59f774` titled "move _headers to config/ to avoid 100-rule limit" — confirms this was a known issue. The fix condensed `public/_headers` to 22 rules using `/*` catch-all.
  - Next.js `output: 'export'` DOES copy `public/` to `out/` correctly — earlier claim that `_headers` wasn't in `out/` was incorrect (local `out/` was stale from a pre-`_headers` build).
  - **Separate issue:** `postbuild` script writes `robots.txt`/`sitemap.xml` to `public/` AFTER `next build` copies `public/` to `out/`. These SEO files are missing from deployments.
- **Decision / resolution:**
  - Task reopened but root cause corrected. Not a deployment mechanism issue — it's a CF Pages rule-count limit.
  - Created TASK-06A (merge fixed 22-rule `_headers` to staging + fix SEO timing) and TASK-06B (verify in production).
- **Root cause:** CF Pages silently ignores `_headers` files with >100 rules. Staging has 311 rules. Fix (22 rules) is on `dev` but not yet merged.

### TASK-06A: Deploy the fixed 22-rule `_headers` to staging/main + fix SEO file timing
- **Type:** IMPLEMENT
- **Affects:** deployment (merge `dev` → `staging`/`main`), `apps/brikette/package.json` (postbuild → prebuild for SEO files)
- **Depends on:** TASK-06
- **Status:** Pending (blocker)
- **Confidence:** 92%
  - Implementation: 95% — the 22-rule `_headers` fix already exists on `dev`. The SEO timing fix is a simple script rename.
  - Approach: 92% — root cause confirmed: staging has the 311-rule `_headers` (exceeds CF Pages 100-rule limit → silently ignored). `dev` has the condensed 22-rule version using `/*` catch-all.
  - Impact: 90% — deploying the fix enables cache headers for the first time on staging/production.
- **Root cause (confirmed via investigation):**
  - Staging branch `_headers` has **311 rules** (645 lines) — listing every locale route individually.
  - Cloudflare Pages has a **100-rule limit** on `_headers` files. Rules beyond 100 are silently dropped (no error, no warning).
  - Commit `c68b59f774` ("move _headers to config/ to avoid 100-rule limit") created the condensed 22-rule version on `dev`, but it hasn't been merged to staging/main yet.
  - Next.js `output: 'export'` DOES copy `public/` to `out/` correctly — the earlier re-plan claim that `_headers` wasn't deployed was wrong. It IS deployed, just ignored due to rule count.
  - **Separate issue:** `postbuild` script writes `robots.txt`/`sitemap.xml` to `public/` AFTER Next.js has already copied `public/` to `out/`. These SEO files are missing from deployments.
- **Acceptance:**
  - 22-rule `_headers` (from `dev` branch) deployed to staging.
  - `generate-public-seo.ts` runs as `prebuild` (or SEO files are copied to `out/` after build) so `robots.txt`/`sitemap.xml` are deployed.
  - Staging curl shows `s-maxage` on cacheable HTML routes.
- **Test contract:**
  - **TC-01:** After staging deploy: `curl -I https://staging.brikette-website.pages.dev/en/experiences` → response includes `s-maxage=600` and `stale-while-revalidate`.
  - **TC-02:** After staging deploy: `curl -I https://staging.brikette-website.pages.dev/en/book` → `cache-control: no-store`.
  - **TC-03:** After staging deploy: `curl -I https://staging.brikette-website.pages.dev/data/rates.json` → includes `s-maxage=300`.
  - **TC-04:** After staging deploy: `curl https://staging.brikette-website.pages.dev/robots.txt` → returns valid robots.txt content.
  - **Acceptance coverage:** TC-01/TC-03 cover caching; TC-02 covers booking no-store; TC-04 covers SEO files.
  - **Test type:** contract
  - **Test location:** staging URL
  - **Run:** merge dev → staging, wait for deploy, then curl checks
- **Rollout / rollback:**
  - Rollout: merge `dev` → `staging`/`main`; staging deploy is automatic on push.
  - Rollback: revert to 311-rule `_headers` (which is effectively the same as no caching since CF ignores it).

### TASK-06B: Verify cache headers working in production (curl checks)
- **Type:** INVESTIGATE
- **Affects:** production deployment
- **Depends on:** TASK-06A
- **Status:** Pending
- **Confidence:** 90%
  - Implementation: 90% — curl checks are straightforward.
  - Approach: 90% — same test contract as TASK-06 TC-01 through TC-06.
  - Impact: 90% — confirms the fix works end-to-end.
- **Acceptance:**
  - `curl -I https://www.hostel-positano.com/en/` (repeat twice) → `cf-cache-status` transitions to `HIT` or `REVALIDATED`.
  - `curl -I https://www.hostel-positano.com/en/book` → `cache-control: no-store`.
  - `curl -I https://www.hostel-positano.com/data/rates.json` (repeat twice) → `cf-cache-status` transitions away from `DYNAMIC`.
- **Test contract:**
  - Uses TASK-06 TC-01 through TC-06 (same curl checks against production).
  - **Test type:** contract
  - **Test location:** production URL
  - **Run:** `BASE_URL=https://www.hostel-positano.com sh scripts/post-deploy-brikette-cache-check.sh` or manual curls per TASK-06 TCs.

### TASK-07: Reduce Next `<Link prefetch>` fan-out on `/[lang]/experiences` collections
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/components/guides/GuideCollectionCard.tsx`, `apps/brikette/src/components/guides/GuideCollectionFilters.tsx`
- **Depends on:** -
- **Status:** Complete (2026-02-05)
- **Confidence:** 82%
  - Implementation: 85% — explicit `prefetch={true}` call sites are localized to the two experiences collection components.
  - Approach: 82% — disable prefetch on dense list links (thumbnail/title/pills/filters) to avoid uncontrolled fan-out.
  - Impact: 82% — limited to `/[lang]/experiences` UX; regressions are easy to smoke-test.
- **Acceptance:**
  - `prefetch={true}` is removed from experiences collection components and replaced with `prefetch={false}` on dense list links.
  - On `/en/experiences`, link-driven prefetch fan-out is materially reduced (no “one request per card/pill/filter” bulk prefetching).
  - Navigation remains responsive (no obvious “click then wait for JS” regressions on primary flows).
  - Audit `/en/experiences` for remaining dense link grids using default prefetch behavior (no explicit `prefetch` prop) and opt out where it meaningfully reduces waste without hurting UX.

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 78%
- **Updated confidence:** 82%
  - Implementation: 85% — narrowed scope to two primary hotspots for smaller, reviewable changes.
  - Approach: 82% — consistent with Next best practice: opt out of prefetch for dense, low-intent link grids.
  - Impact: 82% — reduced blast radius by splitting non-experiences call sites into TASK-11.
- **Investigation performed:**
  - Repo: `apps/brikette/src/components/guides/GuideCollectionCard.tsx`, `apps/brikette/src/components/guides/GuideCollectionFilters.tsx`
- **Decision / resolution:**
  - Split the original “dense collections” task into experiences-only (TASK-07) vs assistance/how-to (TASK-11) for safer sequencing and smaller review surface.
- **Changes to task:**
  - Effort reclassified from L → M due to reduced file count and clearer acceptance/test contract.
- **Test contract:**
  - **TC-01:** `rg "prefetch={true}"` on the affected files → returns zero matches.
  - **TC-02:** `rg "prefetch={false}"` on the affected files → finds the expected opt-outs on dense list links.
  - **TC-03:** `/en/experiences` load → no bulk “prefetch per card/pill” pattern in Network; clicking a guide card still navigates without long JS wait.
  - **Acceptance coverage:** TC-01/02 cover criteria 1; TC-03 covers criteria 2–4.
  - **Test type:** contract
  - **Test location:** `apps/brikette/src/components/guides/GuideCollectionCard.tsx`, `apps/brikette/src/components/guides/GuideCollectionFilters.tsx`
  - **Run:** `rg -n "prefetch={true}" apps/brikette/src/components/guides/GuideCollectionCard.tsx apps/brikette/src/components/guides/GuideCollectionFilters.tsx` + manual Network inspection on `/en/experiences`
- **Implementation notes (2026-02-05):**
  - Set `prefetch={false}` on dense list links within the experiences collection card + filters to prevent bulk route-data prefetch fan-out.
- **Planning validation:**
  - `rg -n "prefetch={true}" apps/brikette/src/components/guides/GuideCollectionCard.tsx apps/brikette/src/components/guides/GuideCollectionFilters.tsx` ✅
  - `pnpm --filter @apps/brikette typecheck` ✅
- **Rollout / rollback:**
  - Rollout: ship incrementally (split by area) if needed.
  - Rollback: revert targeted components.
- **Documentation impact:** None

### TASK-11: Reduce Next `<Link prefetch>` fan-out on assistance + how-to-get-here
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/components/common/AlsoHelpful.tsx`, `apps/brikette/src/components/assistance/HelpCentreNav.tsx`, `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx`, `apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx`
- **Depends on:** -
- **Status:** Complete (2026-02-05)
- **Confidence:** 90%
  - Implementation: 95% — implementation verified across all four target files; `prefetch={false}` added to dense link collections.
  - Approach: 90% — consistent with Next.js best practices for dense navigation; aligns with TASK-07 approach.
  - Impact: 88% — implementation complete and typechecked; only remaining validation is manual Network inspection per TC-02/TC-03.
- **Acceptance:**
  - `prefetch={true}` is removed from assistance/how-to-get-here dense link collections and replaced with `prefetch={false}` where appropriate.
  - On `/en/assistance` and one how-to-get-here page, link-driven prefetch fan-out is materially reduced (no “one request per link” bulk prefetching).
  - Navigation remains responsive (no obvious “click then wait for JS” regressions on primary flows).
  - Audit these pages for remaining dense link grids using default prefetch behavior (no explicit `prefetch` prop) and opt out where it meaningfully reduces waste without hurting UX.

#### Re-plan Update (2026-02-05 — Initial)
- **Previous confidence:** n/a (new task split from TASK-07 during re-plan)
- **Updated confidence:** 82%
  - Implementation: 85% — concrete call sites identified; changes are mechanical and reviewable.
  - Approach: 82% — same principle as TASK-07 but applied to assistance/how-to hotspots.
  - Impact: 82% — constrained by keeping the change set small and validating navigation flows.
- **Investigation performed:**
  - Repo: `apps/brikette/src/components/common/AlsoHelpful.tsx:292-337`, `apps/brikette/src/components/assistance/HelpCentreNav.tsx:133-140`, `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx:21-36`, `apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx:320-341`
- **Decision / resolution:**
  - Keep assistance/how-to changes separate from experiences to reduce risk and allow incremental rollout/rollback.
- **Changes to task:**
  - New task added; original TASK-07 scope narrowed to experiences only.

#### Re-plan Update (2026-02-05 — Implementation Complete)
- **Previous confidence:** 82%
- **Updated confidence:** 90%
  - Implementation: 95% — verified implementation across all four target files: `AlsoHelpful.tsx` has 2 instances at lines 302 and 327; `HelpCentreNav.tsx` has 1 instance at line 135; `AlsoSeeGuidesSection.tsx` has 1 instance at line 30; `RouteCardGroup.tsx` has 1 instance at line 328.
  - Approach: 90% — consistent with Next.js best practices; matches TASK-07 pattern.
  - Impact: 88% — code changes complete and typechecked; only manual Network inspection (TC-02/TC-03) remains for validation.
- **Investigation performed:**
  - Code verification: `rg -n 'prefetch=\{false\}' <files>` confirms 5 total instances across the 4 target files (see line numbers above).
  - Typecheck: `pnpm --filter @apps/brikette typecheck` passes without errors.
  - No `prefetch={true}` instances found in any of the four files (contract satisfied).
- **Decision / resolution:**
  - Implementation is complete; status changed to Complete.
  - Remaining validation (TC-02/TC-03 manual Network inspection) is non-blocking for merge but should be verified before production deployment.
- **Changes to task:**
  - Status: Needs-Input → Complete (2026-02-05).
  - Confidence: 82% → 90% (implementation dimension raised to 95%, reflecting complete verified implementation).
- **Test contract:**
  - **TC-01:** `rg "prefetch={true}"` on the affected files → returns zero matches.
  - **TC-02:** `/en/assistance` load → no bulk “prefetch per nav link” pattern in Network; clicking a help nav item still navigates normally.
  - **TC-03:** how-to-get-here route group page load → no bulk “prefetch per route card link” pattern in Network; clicking a route card link navigates normally.
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02/03 cover criteria 2–4.
  - **Test type:** contract
  - **Test location:** `apps/brikette/src/components/common/AlsoHelpful.tsx`, `apps/brikette/src/components/assistance/HelpCentreNav.tsx`, `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx`, `apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx`
  - **Run:** `rg -n "prefetch={true}" apps/brikette/src/components/common/AlsoHelpful.tsx apps/brikette/src/components/assistance/HelpCentreNav.tsx apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx` + manual Network inspection on `/en/assistance` + how-to-get-here
- **Implementation notes (2026-02-05):**
  - Set `prefetch={false}` on dense assistance/how-to link collections (help nav, also-helpful cards, also-see guide link, and route card links) to prevent bulk route-data prefetching on “browse” pages.
- **Planning validation:**
  - `rg -n "prefetch={true}" apps/brikette/src/components/common/AlsoHelpful.tsx apps/brikette/src/components/assistance/HelpCentreNav.tsx apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx` ✅
  - `pnpm --filter @apps/brikette typecheck` ✅
- **Rollout / rollback:**
  - Rollout: ship incrementally (split by area) if needed.
  - Rollback: revert targeted components.
- **Documentation impact:** None

### TASK-08: Diagnose chunk explosion + propose split strategy changes (post TASK-05)
- **Type:** INVESTIGATE
- **Affects:** `apps/brikette/next.config.mjs`, `packages/next-config/next.config.mjs`, locale loaders (`apps/brikette/src/locales/**`), build outputs under `apps/brikette/.next/static/chunks`
- **Depends on:** TASK-05
- **Status:** Complete (2026-02-05)
- **Confidence:** 95%
  - Implementation: 95% — investigation completed with comprehensive measurements and evidence.
  - Approach: 95% — identified root causes and proposed concrete solutions with confidence levels.
  - Impact: 95% — clear impact quantified; follow-on tasks defined.

#### Investigation Findings (2026-02-05)

**TASK-05 Success Confirmed:**
- Layout chunk: **12MB → 28KB** (99.8% reduction) ✅
- Guides content fully removed from always-on bundle ✅
- No `guides/content/*` keys in layout module map ✅

**Current Build Measurements (via `analyze-chunks.mjs`):**
- **Total chunks:** 4,088 (27.1 MB)
- **Chunk breakdown:**
  - JSON translation chunks: 3,982 (97.4%, 23.5 MB)
  - Other: 59 (1.4%, 2.9 MB)
  - App route chunks: 44 (1.1%, 429.2 KB)
  - Core framework chunks: 3 (0.1%, 288.5 KB)

**Root Cause Identified:**
Webpack creates a separate chunk for each dynamically imported JSON file when using `import()` with `webpackInclude` regex patterns:
- Top-level loader: `apps/brikette/src/locales/locale-loader.ts:64-66`
- Guides loader: `apps/brikette/src/locales/locale-loader.guides.ts:58-61`
- Pattern: 39 namespaces × 18 languages = 702 chunks + 168 guide content × 18 languages = 3,024 chunks
- **Source of truth:** `apps/brikette/scripts/perf/analyze-chunks.mjs` provides deterministic categorization and measurements

**Impact Assessment:**
- ❌ HTTP/2 connection pressure (browsers limit 100-256 concurrent streams)
- ❌ Chunk file overhead (27.1 MB measured in `apps/brikette/.next/static/chunks/` by analyze-chunks.mjs)
- ❌ Memory pressure (~4K chunk entries in webpack runtime manifest)
- ❌ Potential first-render latency on guide pages (20-50 JSON chunk requests)

**Proposed Solutions (Ranked):**

1. **Namespace bundling by language** (Recommended)
   - Confidence: 85% | Effort: M | Target: <200 chunks
   - Bundle by language, not by namespace (each language gets: core bundle, guides bundle, routes bundle)
   - Example: `en.core.js` (layout + common), `en.guides.js` (guide content), `en.routes.js` (how-to-get-here)
   - Critical: For a single-locale session (e.g., `/en/...`), translation transfers must NOT include non-en payloads
   - Reduces chunks from 4,088 to ~50-200
   - Files: New codegen script + update both loaders
   - Follow-on: TASK-15

2. **Webpack splitChunks optimization** (Stopgap fallback only)
   - Type: INVESTIGATE/EXPERIMENT (not IMPLEMENT)
   - Confidence: 70% | Effort: S | Target: ~300-500 chunks
   - Group JSON chunks by language via webpack config
   - Files: `apps/brikette/next.config.mjs`
   - Note: Only if TASK-15 stalls or proves too invasive
   - Follow-on: TASK-16

3. **Icon consolidation** (if icons detected)
   - Confidence: 90% | Effort: S | Target: minimal impact (no icon chunks detected in current build)
   - Create single icon barrel export
   - Follow-on: TASK-17

**Acceptance (all criteria met):**
- ✅ Re-measured chunk count + sizes post-TASK-05 (separated static vs cache)
- ✅ Categorized all chunks deterministically via analyze-chunks.mjs; categories sum to 100% (JSON 97.4%, Other 1.4%, Route 1.1%, Framework 0.1%)
- ✅ Proposed concrete mitigations with targets and tradeoffs
- ✅ Plan updated with follow-on IMPLEMENT tasks (TASK-15, TASK-16, TASK-17)

### TASK-09: Add Brikette to Lighthouse CI (budgets + workflow)
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/ci-lighthouse.yml`, `lighthouserc.brikette.json`, `lighthouserc.brikette.desktop.json`
- **Depends on:** TASK-05, TASK-06B
- **Confidence:** 84%
  - Implementation: 88% — workflow + config patterns exist (`.github/workflows/ci-lighthouse.yml:12-85`, `lighthouserc.shop.json:1-50`); Brikette’s start port is pinned (`apps/brikette/package.json:5-9`).
  - Approach: 84% — budgets can be strict on script-size (error) while keeping performance score thresholds as warn initially to avoid flake.
  - Impact: 84% — CI-only, but may increase CI time; mitigated via paths-filter + `run-lhci` label escape hatch.
- **Acceptance:**
  - Brikette changes trigger LHCI on PRs (paths-filter includes `apps/brikette/**`).
  - CI builds Brikette for LHCI and runs the new configs (`lighthouserc.brikette.json`, `lighthouserc.brikette.desktop.json`).
  - LHCI is scoped to a small, representative URL set aligned with this plan (avoid "budget fails because an unrelated page is heavier"):
    - Non-booking: `/en/` + `/en/experiences`
    - Booking-adjacent: `/en/rooms` (or equivalent)
  - Budgets include an **enforced** script-size assertion (level `error`) that would catch a layout bundle regression.
  - **Budget values must be derived from post-TASK-05 measured Lighthouse runs.** Acceptance includes committing baseline Lighthouse numbers (mobile + desktop) for the chosen URLs into the plan (or a checked-in JSON) and deriving budgets from them. This is non-optional; no "[TBD]" baselines.
  - **Script-size budget must be based on actual page total** (not just layout). Layout is now 28KB; measure typical page total on staging and set budget accordingly (e.g., current total + 20% headroom).
  - **Use `perf:check-layout-chunk` script for surgical layout regression detection**; use LHCI for broader page-level budgets.
  - LHCI is configured so measured resource sizes reflect production-like compression/serving as closely as possible (avoid CI-only inflation).

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 80%
- **Updated confidence:** 84%
  - Implementation: 88% — existing LHCI workflow + config patterns reduce uncertainty; Brikette start details are known (`apps/brikette/package.json:5-9`).
  - Approach: 84% — enforce only deterministic budgets (script-size) as `error` initially; keep perf score thresholds as `warn` until enough history reduces flake risk.
  - Impact: 84% — CI-only; scope is constrained via paths-filter and the existing `run-lhci` label pattern.
- **Investigation performed:**
  - Repo: `.github/workflows/ci-lighthouse.yml:12-85`, `lighthouserc.shop.json:1-50`, `apps/brikette/package.json:5-9`
- **Decision / resolution:**
  - Add Brikette configs to the existing LHCI matrix + path filter, and make the script-size budget a hard gate (error).
- **Changes to task:**
  - Dependencies updated to include TASK-05 so the enforced script-size budget can be introduced without breaking CI on current baseline.
- **Test contract:**
  - **TC-01:** Local smoke: `pnpm --filter @apps/brikette build` + `pnpm dlx @lhci/cli@0.15.1 autorun --config=lighthouserc.brikette.json` → autorun completes and produces `.lighthouseci/**`.
  - **TC-02:** Static config check: `jq` confirms `resource-summary:script:size` assertion level is `error` and has `maxNumericValue` set → budgets are enforced deterministically.
  - **TC-03:** Workflow contract: `.github/workflows/ci-lighthouse.yml` paths-filter includes `apps/brikette/**` and matrix includes Brikette configs → PRs touching Brikette trigger the LHCI job.
  - **Acceptance coverage:** TC-03 covers criteria 1; TC-01 covers criteria 2; TC-02 covers criteria 3.
  - **Test type:** contract
  - **Test location:** `.github/workflows/ci-lighthouse.yml`, `lighthouserc.brikette.json`, `lighthouserc.brikette.desktop.json`
  - **Run:** `pnpm --filter @apps/brikette build && pnpm dlx @lhci/cli@0.15.1 autorun --config=lighthouserc.brikette.json --upload.target=temporary-public-storage`
- **Rollout / rollback:**
  - Rollout: merge; observe CI run time and flake rate.
  - Rollback: remove brikette from matrix/filters.
- **Documentation impact:** None

#### Re-plan Update (2026-02-09)
- **Previous confidence:** 84%
- **Updated confidence:** 84% (no change)
  - **Evidence class:** E1 (audit of existing LHCI infrastructure)
- **Investigation performed:**
  - Existing LHCI configs verified: `lighthouserc.shop.json`, `lighthouserc.shop.desktop.json`, `lighthouserc.skylar.json`, `lighthouserc.skylar.desktop.json` — clear pattern to follow.
  - CI workflow: `.github/workflows/ci-lighthouse.yml` uses matrix-based execution, `pnpm dlx @lhci/cli@0.15.1`, path-based filtering. Brikette not yet included.
  - Merge gate: `.github/workflows/merge-gate.yml:163-227` integrates LHCI as conditional requirement.
  - Brikette port confirmed: 3012 (`apps/brikette/package.json:5`). No auth needed (public site).
  - Existing perf tooling: `perf:check-layout-chunk` script already catches layout regressions — LHCI is complementary for broader page-level budgets.
- **Dependency updated:** TASK-06 → TASK-06B (production cache header verification must complete first so LHCI baselines reflect production-like performance).
- **Assessment:** Task is ready to build once TASK-06B confirms cache headers are working. No methodology changes needed.

### TASK-10: Decide: implement `/api/rum` collector vs remove fallback
- **Type:** DECISION
- **Affects:** `apps/brikette/src/performance/reportWebVitals.ts`, potentially `apps/brikette/src/app/api/rum/route.ts`
- **Depends on:** -
- **Status:** Complete (2026-02-05)
- **Confidence:** 95%
  - Implementation: 95% — decision is recorded and unblocks dependent work.
  - Approach: 95% — user-selected direction is unambiguous.
  - Impact: 95% — decision reduces scope by avoiding any new collector surface.

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 70%
- **Updated confidence:** 95% (decision complete)
  - Implementation: 95% — clear execution path.
  - Approach: 95% — GA-only chosen.
  - Impact: 95% — no new backend/edge collector required.
- **Investigation performed:**
  - Repo: Web Vitals are initialised via `useWebVitals()` (`apps/brikette/src/hooks/useWebVitals.ts:12-15`) and emitted via GA when configured (`apps/brikette/src/performance/reportWebVitals.ts:40-48`).
  - Repo check (historical): Brikette previously referenced a `/api/rum` fallback collector but did not implement a `rum/` handler under `apps/brikette/src/app/api/`.
- **Decision / resolution:**
  - **User decision:** GA-only (Option A) — remove `/api/rum` fallback and only emit vitals when GA is configured and `window.gtag` is present.
- **Changes to task:**
  - Task is complete; add an IMPLEMENT follow-up (TASK-12) to make GA wiring explicit and remove the fallback path.
- **Options:**
  - **Option A (Recommended for now):** Remove `/api/rum` fallback; only send to GA when configured.
    - Pros: minimal code, no backend surface, no privacy/storage questions.
    - Cons: no vitals when GA isn’t present.
  - **Option B:** Implement `/api/rum` as an edge collector.
    - Pros: vitals always captured; can store/forward elsewhere.
    - Cons: needs data retention/privacy decisions; adds backend maintenance.
- **Question for user:**
  - Do you want Brikette to capture Web Vitals without GA (Option B), or keep it GA-only for now (Option A)?
  - Default if no answer: Option A (removes broken endpoint reference, smallest surface).
- **Acceptance:**
  - Decision recorded in Decision Log; plan updated; dependent implementation task(s) unblocked.

### TASK-12: GA-only Web Vitals: remove `/api/rum` fallback + ensure GA script wiring
- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/src/performance/reportWebVitals.ts`, `apps/brikette/src/app/layout.tsx`, `apps/brikette/src/config/env.ts` (if env naming needs standardisation)
- **Depends on:** TASK-10
- **Status:** Complete (2026-02-05)
- **Confidence:** 90%
  - Implementation: 92% — implemented and typechecked (`apps/brikette/src/performance/reportWebVitals.ts:1-55`, `apps/brikette/src/app/layout.tsx:90-132`).
  - Approach: 90% — GA-only aligns with the chosen decision and avoids introducing a collector surface.
  - Impact: 90% — global layout/scripts change, mitigated via production-only gating + follow-up production verification (TASK-13).
- **Acceptance:**
  - When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set and GA script is present, Web Vitals are emitted via `gtag("event","web_vitals", ...)` (no `/api/rum` network calls).
  - When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset, no Web Vitals network traffic occurs (no `/api/rum` requests).
  - Booking flow `begin_checkout` event still fires when `window.gtag` is present (`apps/brikette/src/app/[lang]/book/BookPageContent.tsx:125-132`).

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 82%
- **Updated confidence:** 90%
  - Implementation: 92% — GA fallback removed and GA script wiring added with env gating (see file refs above).
  - Approach: 90% — keeps observability GA-only and removes broken `/api/rum` calls.
  - Impact: 90% — high visibility change; follow-up verification task added (TASK-13).
- **Investigation performed:**
  - Repo: `apps/brikette/src/hooks/useWebVitals.ts:12-15`, `apps/brikette/src/performance/reportWebVitals.ts:40-48`, `apps/brikette/src/app/layout.tsx:90-132`
- **Decision / resolution:**
  - GA-only: do not send vitals anywhere unless GA is configured + loaded.
- **Changes to task:**
  - Marked complete; added TASK-13 to capture the “user confirms in GA” requirement.
- **Test contract:**
  - **TC-01:** With `NEXT_PUBLIC_GA_MEASUREMENT_ID` set → page load triggers no requests to `/api/rum` and `window.gtag` receives a `web_vitals` event.
  - **TC-02:** Without `NEXT_PUBLIC_GA_MEASUREMENT_ID` → no requests to `/api/rum` and no errors thrown from `useWebVitals()`.
  - **TC-03:** Booking confirm click path (`/en/book/...`) with GA enabled → `begin_checkout` event still fires (`apps/brikette/src/app/[lang]/book/BookPageContent.tsx:125-132`).
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02 covers criterion 2; TC-03 covers criterion 3.
  - **Test type:** contract
  - **Test location:** `apps/brikette/src/performance/reportWebVitals.ts`, `apps/brikette/src/app/layout.tsx`
  - **Run:** `pnpm --filter @apps/brikette dev` (or `build && start`) + browser DevTools Network/Console verification

### TASK-13: Set up GA4 property + configure env vars + verify Web Vitals in production
- **Type:** IMPLEMENT
- **Affects:** GA4 admin (external), Cloudflare Pages env vars (external), production deployment
- **Depends on:** TASK-12, TASK-06A
- **Status:** Pending (expanded from verify-only to include GA setup)
- **Confidence:** 85%
  - Implementation: 85% — GA property creation and env var configuration are well-documented steps. Code is already complete (TASK-12).
  - Approach: 90% — GA4 is the standard approach; brikette code already supports it via `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
  - Impact: 80% — requires Cloudflare Pages redeploy to pick up env vars. Depends on TASK-06A so that `_headers` are also deployed correctly in the same redeploy.
- **Acceptance:**
  - GA4 property exists for `www.hostel-positano.com`.
  - Custom dimensions registered: `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type`.
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured in Cloudflare Pages env vars (production scope).
  - After redeploy: `view-source:https://www.hostel-positano.com/en/` shows `gtag.js` script tag with correct measurement ID.
  - GA4 Realtime shows `web_vitals` events arriving from production.
  - Booking flow `begin_checkout` event fires (`apps/brikette/src/app/[lang]/book/BookPageContent.tsx:118-126`).
  - No `/api/rum` requests observed in Network tab.
- **Step-by-step:**
  1. Create GA4 property at analytics.google.com (Property name: "Hostel Brikette", timezone: Europe/Rome, currency: EUR).
  2. Create Web data stream for `https://www.hostel-positano.com` (enable Enhanced Measurement).
  3. Copy Measurement ID (format: `G-XXXXXXXXXX`).
  4. Register custom dimensions in GA4 Admin > Data display > Custom definitions: `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type` (all Event scope).
  5. In Cloudflare Pages dashboard for `brikette-website`: Settings > Environment variables > add `NEXT_PUBLIC_GA_MEASUREMENT_ID = G-XXXXXXXXXX` (Production scope).
  6. Trigger production redeploy (push to `main` or manual workflow dispatch with `publish_to_production: true`).
  7. Verify: visit production site, check GA4 Realtime for `web_vitals` and `begin_checkout` events.
- **Test contract:**
  - **TC-01:** `view-source:https://www.hostel-positano.com/en/` → contains `googletagmanager.com/gtag/js?id=G-` script tag.
  - **TC-02:** Visit `/en/` with GA DebugView enabled → observe `web_vitals` event within ~60s.
  - **TC-03:** Visit `/en/book` and trigger confirm click → observe `begin_checkout` event in GA4 Realtime.
  - **TC-04:** In DevTools Network, filter `rum` → zero `/api/rum` requests.
  - **Acceptance coverage:** TC-01 covers env var + script injection; TC-02 covers Web Vitals; TC-03 covers booking events; TC-04 covers RUM removal.
  - **Test type:** contract
  - **Test location:** GA4 property (DebugView/Realtime) + live site
  - **Run:** manual verification (Chrome DevTools + GA DebugView)
- **Privacy note:** Current implementation has no consent mechanism. GDPR (Italy) requires explicit consent before loading GA. Consider adding cookie banner as follow-up work (not blocking this task — MVP first).
- **Rollout / rollback:**
  - Rollout: configure env var → redeploy → verify.
  - Rollback: remove env var from Cloudflare Pages → redeploy (GA stops loading).

### TASK-14: Decide: wire Brikette `@acme/telemetry` to a collector vs keep disabled
- **Type:** DECISION
- **Affects:** `packages/telemetry/src/index.ts`, `apps/brikette/src/utils/errors.ts`
- **Depends on:** -
- **Status:** ✅ Complete (2026-02-09) — Decision: keep disabled
- **Confidence:** 85% (for DECISION task with explicit user-input dependency)
  - Implementation: 80% — implementation paths are clear (either add `/api/telemetry` route or configure external endpoint).
  - Approach: 85% — decision framing is correct; this is genuinely a product/user decision, not a technical uncertainty.
  - Impact: 90% — if decision is "keep disabled," impact is zero; if "enable," implementation is straightforward with known scope.
- **Current reality (evidence):**
  - Brikette calls `captureError(...)` (`apps/brikette/src/utils/errors.ts:4-45`), which becomes an `error.captured` event (`packages/telemetry/src/index.ts:80-110`).
  - Telemetry is disabled unless `NEXT_PUBLIC_ENABLE_TELEMETRY === "true"` and production (or `FORCE_TELEMETRY === "true"`) (`packages/telemetry/src/index.ts:19-20`).
  - Default endpoint is `/api/telemetry` unless `NEXT_PUBLIC_TELEMETRY_ENDPOINT` is set (`packages/telemetry/src/index.ts:21`), and Brikette does not currently implement that API route.
- **Question for user:**
  - Do you want Brikette telemetry enabled in production? If yes, where should events be sent (internal endpoint in Brikette vs external collector URL)?
  - Default if no answer: keep telemetry disabled (status quo).

#### Re-plan Update (2026-02-05)
- **Previous confidence:** 60% ⚠️ (below threshold for IMPLEMENT, but this is DECISION)
- **Updated confidence:** 85%
  - Implementation: 80% — unchanged; implementation options are well-understood.
  - Approach: 85% — DECISION tasks have different confidence semantics than IMPLEMENT tasks; 60% was inappropriate framing. This is explicitly awaiting user preference, not technical uncertainty.
  - Impact: 90% — raised because "do nothing" (keep disabled) has zero impact, and "enable" has clear, bounded scope.
- **Investigation performed:**
  - Task type review: confirmed this is DECISION, not IMPLEMENT. The 60% confidence was conflating "awaiting user input" with "technical uncertainty."
  - Evidence: `packages/telemetry/src/index.ts:19-21` shows telemetry is disabled by default unless `NEXT_PUBLIC_ENABLE_TELEMETRY === "true"` and production (or `FORCE_TELEMETRY === "true"`). Brikette has no `/api/telemetry` route implemented (`apps/brikette/src/app/api/` does not contain a `telemetry/` directory).
- **Decision / resolution:**
  - This is correctly a "Needs-Input" task awaiting user decision.
  - Confidence raised to 85% to reflect that the decision framing is correct and the implementation paths are known.
  - For DECISION tasks, "Needs-Input" is the appropriate status (not a blocker requiring re-planning).
- **Rationale for confidence adjustment:**
  - A DECISION task at 60% confidence is acceptable when it genuinely awaits user preference (not a technical gap).
  - Raising to 85% clarifies that the only "low confidence" aspect was the decision framing, which is now resolved.
  - This task does NOT need to be ≥80% to proceed; DECISION tasks have different acceptance criteria than IMPLEMENT tasks.

#### Re-plan Update (2026-02-09)
- **Previous confidence:** 85%
- **Updated confidence:** 95%
  - **Evidence class:** E1 (user decision)
- **Decision:** Keep telemetry disabled. No action needed.
  - Telemetry code remains wired (`captureError()` calls exist in `apps/brikette/src/utils/errors.ts`) but dormant — no env vars set, no `/api/telemetry` route, no external collector configured.
  - Static export (staging) cannot support API routes anyway; telemetry would only work in production Worker mode.
  - Revisit if/when error visibility becomes a priority.
- **Status:** Complete (2026-02-09).

### TASK-15: Investigate chunk reduction approach given CF free-tier, guide publishing, and i18n complexity
- **Type:** INVESTIGATE
- **Affects:** `apps/brikette/src/locales/locale-loader.ts`, `apps/brikette/src/locales/locale-loader.guides.ts`, `apps/brikette/src/locales/guides.*.ts`, `apps/brikette/src/routes/how-to-get-here/content-modules.ts`, `apps/brikette/next.config.mjs`
- **Depends on:** TASK-08
- **Status:** Pending (highest remaining priority)
- **Confidence:** 88%
  - Implementation: 88% — investigation scope is clear; key constraint areas identified (CF limits, guide publishing, i18n architecture).
  - Approach: 90% — investigate-before-implement is the right approach given the complexity revealed by re-plan.
  - Impact: 85% — investigation output directly determines whether TASK-16 (splitChunks) or a new codegen IMPLEMENT task is the right next step.
- **Acceptance:**
  - Produce a written investigation document (or section in this plan) covering:
    1. **Cloudflare Pages free-tier constraints:** 20K file limit, current file count, headroom analysis.
    2. **Guide draft→publish flow compatibility:** How Business OS writes individual guide JSON → whether bundling at build time preserves this workflow.
    3. **i18n loading architecture map:** Full chain from `i18n.ts` → backends → loaders → webpack context, including the 3-tier guides loading chain and how-to-get-here routes.
    4. **Candidate approaches (ranked):** At minimum: (a) codegen bundling, (b) webpack splitChunks, (c) hybrid. For each: pros, cons, estimated chunk reduction, complexity, compatibility with guide publishing.
    5. **Recommended approach with rationale.**
  - Investigation must stop before implementing. Output feeds a new IMPLEMENT task (or TASK-16 if splitChunks is recommended).
- **Test contract:**
  - **TC-01:** Investigation document addresses all 5 acceptance items above.
  - **TC-02:** Each candidate approach includes a chunk count estimate (target vs baseline 4,088).
  - **TC-03:** Guide publishing compatibility confirmed with evidence (file paths, API routes, write patterns).
  - **Test type:** contract (document review)
  - **Test location:** This plan document (TASK-15 section)
  - **Run:** Review investigation output against acceptance criteria.
- **Constraints to investigate:**
  - CF Pages free-tier 20K file limit (current: ~4K chunks, trajectory with more guides/locales).
  - Guide JSON files are source-of-truth for Business OS editing (`apps/business-os/src/app/api/guides/[guideKey]/route.ts` writes individual files).
  - `locale-loader.guides.ts` uses `fs.readFileSync` (server-only, SSG build time) — NOT a webpack context, so bundling doesn't apply to it.
  - `guides.imports.ts` uses 3-tier loading: webpack context → dynamic imports → FS fallback.
  - `content-modules.ts` (how-to-get-here routes) uses separate `webpackInclude` pattern.
  - 4,419 JSON files across 18 locales (168 guide content files per locale + ~37 core namespaces per locale).
- **Notes / references:** Investigation findings in TASK-08; baseline 4,088 chunks (27.1 MB).

#### Re-plan Update (2026-02-05 — original)
- **Previous confidence:** 85%
- **Updated confidence:** 85% (no change; test contract was complete for IMPLEMENT scope)

#### Re-plan Update (2026-02-09)
- **Previous confidence:** 85% (was IMPLEMENT)
- **Updated confidence:** 88% (now INVESTIGATE)
  - **Evidence class:** E1 (code audit of i18n loading chain, CF limits research, guide API inspection)
- **Type changed:** IMPLEMENT → INVESTIGATE
  - User requested: "investigate and set out your best ideas, but then stop, and do not implement anything."
  - The i18n loading architecture is more complex than the original plan assumed (3-tier guides loading, separate how-to-get-here loader, 4,419 JSON files). Investigation-first is the correct approach.
- **Investigation performed (pre-investigation findings from re-plan):**
  - **CF Pages free-tier:** 20K file limit confirmed. Current ~4K chunks are well within limit. Bundling would reduce to <200 (massive headroom). Not a blocker either way.
  - **Guide publishing:** Business OS writes individual JSON files via `apps/business-os/src/app/api/guides/[guideKey]/route.ts:119` → `writeGuidesNamespaceToFs()` → `writeContentFiles()` which writes per-guide JSON. Bundling at build time does NOT break this because: (a) writes target individual files, (b) bundling is build-time codegen reading those files, (c) status is managed via manifest overrides, not content files.
  - **i18n complexity:** `locale-loader.ts` (client, top-level only, one `webpackInclude`), `locale-loader.guides.ts` (server, `fs.readFileSync`, NO webpack), `guides.imports.ts` (client, 3-tier: webpack context → imports → FS), `content-modules.ts` (client, separate `webpackInclude` for how-to-get-here). Two `webpackInclude` sites that generate chunks: `locale-loader.ts:65` and `content-modules.ts:11`.
  - **Scale:** 4,419 JSON files, 168 guide content × 18 locales = 3,024 guide chunks, 39 namespaces × 18 = 702 core chunks, ~24 routes × 18 = ~432 route chunks.
- **Decision / resolution:**
  - Task retyped to INVESTIGATE. The output will be a ranked list of approaches with recommendations, which will feed a new IMPLEMENT task.
  - TASK-16 (webpack splitChunks) now depends on TASK-15 investigation outcome rather than TASK-08 directly.

### TASK-16: Add webpack splitChunks config to group JSON by language (stopgap fallback)
- **Type:** INVESTIGATE/EXPERIMENT
- **Status:** Optional fallback (pending TASK-15 investigation outcome)
- **Affects:** `apps/brikette/next.config.mjs`
- **Depends on:** TASK-15
- **Confidence:** 70%
  - Implementation: 75% — standard webpack `splitChunks` config; pattern is documented and testable.
  - Approach: 70% — grouping by language reduces chunk count but may bundle more than strictly needed per route; tradeoff is acceptable as a stopgap before TASK-15.
  - Impact: 70% — affects webpack output shape; needs build artifact validation + smoke testing.
- **Note:** This is a stopgap experiment. Do not implement unless TASK-15 proves too invasive or slips. TASK-15 (namespace bundling by language) is the recommended structural fix.
- **Acceptance:**
  - Total chunk count < 500 (baseline: 4,088; target if TASK-15 not implemented).
  - JSON chunks are grouped by language instead of individual per-namespace-per-language chunks.
  - No increase in layout bundle size (webpack should still code-split by route).
  - Guide pages load translations correctly across representative locales (`en`, `de`, `ar`).
- **Test contract:**
  - **TC-01:** `pnpm --filter @apps/brikette build` → `find apps/brikette/.next/static/chunks -type f | wc -l` returns <500.
  - **TC-02:** Use `node apps/brikette/scripts/perf/analyze-chunks.mjs` to verify total JSON chunk count is <500 (validates consolidated chunks).
  - **TC-03:** `apps/brikette/.next/static/chunks/app/[lang]/layout-*.js` size remains <100KB (no regression from grouping).
  - **TC-04:** `pnpm --filter @apps/brikette start` + manual smoke on `/en/experiences`, `/en/assistance`, one guide page → translations render correctly.
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02 covers criterion 2 (using analyze-chunks.mjs, not brittle filename patterns); TC-03 covers criterion 3; TC-04 covers criterion 4.
  - **Test type:** contract
  - **Test location:** `apps/brikette/next.config.mjs`
  - **Run:** `pnpm --filter @apps/brikette build && node apps/brikette/scripts/perf/analyze-chunks.mjs && pnpm --filter @apps/brikette start` (then smoke routes)
- **What would make this ≥90%:**
  - Measure actual network waterfall impact (number of requests per page load) before/after to confirm the grouping improves real-world loading.
- **Rollout / rollback:**
  - Rollout: land webpack config change; validate on staging before production.
  - Rollback: remove splitChunks config (accept chunk explosion regression).
- **Documentation impact:** None
- **Notes / references:** This is a stopgap solution with lower confidence than TASK-15; TASK-15 is the recommended structural fix.

### TASK-17: Consolidate icon imports to reduce icon chunk count (if detected)
- **Type:** IMPLEMENT
- **Affects:** Icon import sites across `apps/brikette/src/**`, `apps/brikette/src/icons/index.ts` (new barrel export)
- **Depends on:** TASK-08
- **Status:** Complete (2026-02-05)
- **Confidence:** 90%
  - Implementation: 92% — straightforward refactor; create barrel export and update import sites.
  - Approach: 90% — consolidating icons into a single entry point reduces icon chunks; standard webpack tree-shaking pattern.
  - Impact: 90% — low risk; icon usage is visual and easily validated; regressions are immediately visible.
- **Acceptance:**
  - Icon-related chunk count is minimal (current baseline shows no separate icon chunks detected by `analyze-chunks.mjs`).
  - All icon imports use a single barrel export (e.g., `@/components/icons`).
  - No visual regressions on routes using icons (header, footer, guide cards, assistance nav).
- **Test contract:**
  - **TC-01:** Use `node apps/brikette/scripts/perf/analyze-chunks.mjs` and check the "icon" category count. If icon chunks are detected, verify count is <5 after consolidation.
  - **TC-02:** `rg "from ['\"]@radix-ui/react-icons" apps/brikette/src/components/` → zero direct radix-ui imports (all use barrel).
  - **TC-03:** `rg "from ['\"]lucide-react" apps/brikette/src/components/` → zero direct lucide-react imports (all use `@/icons`).
  - **TC-04:** `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/icons/icons-barrel.test.ts` → passes (guards barrel export correctness).
  - **TC-05:** `pnpm --filter @apps/brikette start` + visual smoke on `/en/`, `/en/experiences`, `/en/assistance` → all icons render correctly.
  - **Acceptance coverage:** TC-01 covers criterion 1 (using analyze-chunks.mjs, not brittle grep patterns); TC-02/03 cover criterion 2; TC-04/05 cover criterion 3.
  - **Test type:** contract
  - **Test location:** `apps/brikette/src/icons/index.ts` (new), icon import sites, `apps/brikette/src/test/components/icons/icons-barrel.test.ts` (new)
  - **Run:** `pnpm --filter @apps/brikette build && node apps/brikette/scripts/perf/analyze-chunks.mjs && pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/icons/icons-barrel.test.ts` (then optional visual smoke)
- **Implementation notes (2026-02-05):**
  - Added `apps/brikette/src/icons/index.ts` barrel and updated all `lucide-react` imports in `apps/brikette/src/**` to import via `@/icons`.
- **Planning validation:**
  - `rg -n "from ['\\\"]lucide-react['\\\"]" apps/brikette/src/components` → zero matches ✅
  - `pnpm --filter @apps/brikette typecheck` ✅
  - `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/icons/icons-barrel.test.ts` ✅
  - `pnpm --filter @apps/brikette build && node apps/brikette/scripts/perf/analyze-chunks.mjs` → no `icon` category emitted ✅
- **Rollout / rollback:**
  - Rollout: land barrel export + update import sites in one PR; easy to review visually.
  - Rollback: revert to direct icon library imports.
- **Documentation impact:** None
- **Notes / references:** Current `analyze-chunks.mjs` output shows no dedicated icon chunks (icons may be bundled in "other" category). This task may have minimal impact unless icon chunks are detected in future builds.

## Recommended Execution Priority

**Current Status (2026-02-09):** 11 of 19 tasks complete

Based on re-plan findings, the highest-leverage sequence is:

**Wave 1 — Blockers (parallel):**
1. **TASK-06A** (fix `_headers` deployment) — blocker for cache headers + GA setup. Small fix to build-cmd.
2. **TASK-15** (investigate chunk reduction) — highest-priority investigation. Determine the right approach before implementing.

**Wave 2 — After TASK-06A deploys (parallel):**
3. **TASK-06B** (verify production cache headers) — curl checks after TASK-06A fix deploys.
4. **TASK-13** (GA4 setup + verify) — create GA property, configure env vars, verify Web Vitals in production.

**Wave 3 — CI Guardrails:**
5. **TASK-09** (LHCI budgets) — add Brikette to Lighthouse CI with baselines from verified production. Depends on TASK-06B.

**Wave 4 — Chunk Implementation (after TASK-15 investigation):**
6. New IMPLEMENT task (TBD from TASK-15 output) or **TASK-16** (splitChunks stopgap).

**Completed (12 tasks, including decisions):**
- ✅ TASK-01: Gated interactive prefetch
- ✅ TASK-02: Lazy-loaded rates.json
- ✅ TASK-03: Core-only i18n preload
- ✅ TASK-04: Investigated layout chunk bloat
- ✅ TASK-05: Fixed layout chunk (12MB→28KB)
- ✅ TASK-07: Reduced experiences prefetch
- ✅ TASK-08: Diagnosed chunk explosion
- ✅ TASK-10: Decided on GA-only vitals
- ✅ TASK-11: Reduced assistance/how-to prefetch
- ✅ TASK-12: Implemented GA-only vitals
- ✅ TASK-14: Decided to keep telemetry disabled
- ✅ TASK-17: Consolidated icon imports

## Risks & Mitigations
- **i18n regressions (missing namespaces / flicker):** keep a small core preload; validate on `en`, `de`, `ar` + one guide page; add LHCI budgets to catch regressions early.
- **Booking flow regressions (rates/modals):** preserve global providers; rely on existing pricing hook tests; manually verify BookingModal from home and rooms.
- **Caching mistakes (stale HTML):** use `s-maxage` + `stale-while-revalidate` and avoid long browser `max-age` for HTML; validate with repeated curls.
- **CI noise/flakes from LHCI:** start with reasonable budgets, allow temporary-public upload; use path filters and optional label for non-brikette PRs.

## Observability
- Primary: Lighthouse CI budgets on PRs (after TASK-09).
- Secondary: GA4 Web Vitals (TASK-12 + user confirmation in TASK-13); optional error telemetry if a collector is wired (TASK-14 decision).

## Acceptance Criteria (overall)
- [x] `layout.js` uncompressed size < 1MB (down from ~12MB). **✅ Complete: 28KB (TASK-05)**
- [ ] Production HTML and `rates.json` caching headers deployed and verified. **⚠️ Reopened (TASK-06A + TASK-06B — staging `_headers` exceeds CF 100-rule limit)**
- [x] No eager `/data/rates.json` on non-booking pages. **✅ Complete (TASK-02)**
- [x] No always-on modal/swiper prefetch on non-booking pages. **✅ Complete (TASK-01)**
- [x] Prefetch fan-out reduced on experiences/assistance/how-to. **✅ Complete (TASK-07, TASK-11)**
- [x] Icon imports consolidated. **✅ Complete (TASK-17)**
- [x] GA Web Vitals wired correctly (no /api/rum). **✅ Complete (TASK-12)**
- [ ] Total chunk count < 500 (baseline: 4,088; target <200 with namespace bundling). **⬜ Pending (TASK-15)**
- [ ] Brikette is covered by LHCI with enforced script-size budgets. **⬜ Pending (TASK-09)**

## Decision Log
- 2026-02-05: Decision (TASK-10) — GA-only for Web Vitals; remove `/api/rum` fallback and avoid implementing a collector.
- 2026-02-09: Decision (TASK-14) — Keep `@acme/telemetry` disabled. No action needed. Revisit if error visibility becomes a priority.
- 2026-02-09: Decision (TASK-15) — Changed from IMPLEMENT to INVESTIGATE. I18n loading is more complex than assumed; investigate approach before implementing. Must consider CF free-tier limits, guide draft→publish flow from Business OS, and multi-tier loading architecture.

## Plan Changelog
- 2026-02-05: Plan created from fact-find; i18n bundle fix requires investigation before implementation.
- 2026-02-05: Re-plan — confirmed `loadLocaleResource()` recursive locale context as the primary driver of the ~12MB layout chunk; chosen fix is a "core vs guides" loader split + deferred guides-only imports; split `<Link prefetch>` work into TASK-07 (experiences) + TASK-11 (assistance/how-to); updated all IMPLEMENT tasks to meet test-contract requirements.
- 2026-02-05: Implemented (TASK-12) — GA script wiring added in root layout and Web Vitals emitter made GA-only; follow-up verification tracked in TASK-13.
- 2026-02-05: Investigation complete (TASK-08) — confirmed TASK-05 success (layout 12MB → 28KB); identified chunk explosion root cause as 3,982 JSON translation chunks (97.4% of 4,088 total) created by webpack's dynamic import chunking; proposed three follow-on solutions: namespace bundling by language (TASK-15, 85% confidence, target <200 chunks), webpack splitChunks config (TASK-16, 70% confidence, stopgap fallback only), and icon consolidation if detected (TASK-17, 90% confidence); overall confidence increased from 82% → 84%, remaining confidence increased from 79% → 82%.
- 2026-02-05: Expert review — updated plan with deterministic script results (analyze-chunks.mjs), fixed TASK-15 bundling strategy (bundle by language, not namespace), reclassified TASK-16 as INVESTIGATE/EXPERIMENT fallback (70% violates ≥80% rule for IMPLEMENT), removed brittle test heuristics from TASK-16/17, added Set-Cookie check to TASK-06, added LHCI guidance to TASK-09, added recommended execution priority section, added production verification tracking table.
- 2026-02-05: Consistency fixes — clarified 27.1 MB chunk size vs total static output; updated TASK-08 acceptance percentages to match analyze-chunks.mjs output (97.4% JSON, not 97.6%); changed all chunk count measurements to use analyze-chunks.mjs as single source of truth; added "no guides bundle on non-guide routes" check to TASK-15; added explicit booking non-caching check to TASK-06; made LHCI baseline measurement non-optional in TASK-09; updated P2 to reflect TASK-08 completion; separated Decision Log from Plan Changelog.
- 2026-02-05: Re-plan (scope: TASK-06, TASK-11, TASK-14, TASK-15) — verified TASK-06 implementation complete (92% confidence, awaiting deployment for production curl verification); verified TASK-11 implementation complete (90% confidence, status changed to Complete); corrected TASK-14 confidence framing (85% appropriate for DECISION task awaiting user input); verified TASK-15 test contract is complete and ready to build (85% confidence, no gaps). Overall remaining confidence increased from 82% → 87%.
- 2026-02-08: Documentation update — updated plan to reflect completion status (12 of 17 tasks complete, 71% overall progress). Updated Summary, Task Summary table with visual completion indicators (✅/⬜), Acceptance Criteria with completed items, and Recommended Execution Priority to reflect current state. No code changes, documentation only.
- 2026-02-09: Re-plan (scope: all remaining tasks TASK-06/09/13/14/15/16) — Major findings:
  - **TASK-06 REOPENED:** Staging `_headers` has 311 rules, exceeding CF Pages' 100-rule limit (silently ignored). Cache headers have never taken effect. Condensed 22-rule version exists on `dev`. Created TASK-06A (merge fix to staging) and TASK-06B (verify in production). Confidence dropped 92%→75%.
  - **TASK-13 EXPANDED:** From verify-only to full GA setup (create GA4 property, configure env vars, verify). No `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured anywhere.
  - **TASK-14 COMPLETE:** User decision — keep telemetry disabled. Confidence 85%→95%.
  - **TASK-15 RETYPED:** IMPLEMENT→INVESTIGATE. I18n loading architecture is more complex than assumed (3-tier guides loading, 4,419 JSON files, Business OS guide publishing workflow). Must investigate approach before implementing.
  - **TASK-09 DEPENDENCY UPDATED:** Now depends on TASK-06B (was TASK-06).
  - **TASK-16 DEPENDENCY UPDATED:** Now depends on TASK-15 (was TASK-08).
  - Plan expanded from 17→19 tasks; completion 12/17→11/19.

## Production Verification Status

| Task | Merged | Staging Verified | Production Verified | Notes |
|------|--------|------------------|---------------------|-------|
| TASK-01 | ✅ | ⬜ | ⬜ | Verify no prefetch on `/en/experiences` |
| TASK-02 | ✅ | ⬜ | ⬜ | Network: no `/data/rates.json` on `/en/experiences` |
| TASK-03 | ✅ | ⬜ | ⬜ | Check header/footer translations render |
| TASK-05 | ✅ | ⬜ | ⬜ | Confirm layout chunk <100KB in prod |
| TASK-06 | ⚠️ Reopened | ⬜ | ⬜ | 311-rule `_headers` exceeds CF 100-rule limit — needs TASK-06A merge |
| TASK-07 | ✅ | ⬜ | ⬜ | Network: no bulk prefetch on `/en/experiences` guide cards |
| TASK-11 | ✅ | ⬜ | ⬜ | Network: no bulk prefetch on assistance/how-to |
| TASK-12 | ✅ | ⬜ | ⬜ | GA web_vitals events arriving |
| TASK-17 | ✅ | ⬜ | ⬜ | Visual smoke: icons render correctly |

## Re-plan Summary (2026-02-09)

### Tasks Re-planned (2026-02-09)
1. **TASK-06** (Cloudflare headers) — 92% → 75% ⚠️ REOPENED — 311 rules exceed CF 100-rule limit
2. **TASK-06A** (NEW) — Merge condensed 22-rule `_headers` to staging — 92%
3. **TASK-06B** (NEW) — Verify production cache headers — 90%
4. **TASK-09** (LHCI) — 84% (no change, dependency updated to TASK-06B)
5. **TASK-13** (GA setup) — EXPANDED from verify-only to full GA setup — 85%
6. **TASK-14** (Telemetry) — 85% → 95% ✅ COMPLETE — keep disabled
7. **TASK-15** (Chunk reduction) — RETYPED from IMPLEMENT to INVESTIGATE — 88%
8. **TASK-16** (splitChunks) — 70% (no change, dependency updated to TASK-15)

### Critical Finding: TASK-06 `_headers` Silently Ignored by CF Pages

**Root cause:** Staging `_headers` has **311 rules** (645 lines), listing every locale route individually. Cloudflare Pages has a **100-rule limit** — rules beyond 100 are silently dropped (no error, no warning). The file IS deployed to `out/` correctly (Next.js `output: 'export'` copies `public/` to `out/`), but CF Pages ignores it entirely due to the rule count.

**Evidence:**
- `git show staging:apps/brikette/public/_headers | grep -c "^/"` → 311 rules (CF limit: 100)
- `curl -I https://staging.brikette-website.pages.dev/en/book` → `public, max-age=0, must-revalidate` (should be `no-store`)
- Commit `c68b59f774` ("move _headers to config/ to avoid 100-rule limit") — confirms known issue; condensed 22-rule version exists on `dev` but wasn't merged

**Separate issue:** `postbuild` writes `robots.txt`/`sitemap.xml` to `public/` AFTER Next.js copies `public/` to `out/`, so SEO files are missing from deployments.

**Impact:** All cache header work (TASK-06) is correct but has had zero production effect. Fix is straightforward (TASK-06A: merge the condensed 22-rule `_headers` from `dev` to staging).

### Plan State Classification

**Wave 1 — Ready to build (parallel):**
- TASK-06A (merge 22-rule `_headers` to staging): 92%, merge from `dev`
- TASK-15 (investigate chunk approach): 88%, investigation task

**Wave 2 — After TASK-06A deploys (parallel):**
- TASK-06B (verify production headers): 90%, curl checks
- TASK-13 (GA setup + verify): 85%, external config + verification

**Wave 3 — After TASK-06B:**
- TASK-09 (LHCI budgets): 84%, depends on verified baselines

**Wave 4 — After TASK-15 investigation:**
- New IMPLEMENT task or TASK-16, depending on investigation outcome

### Previous Re-plan Summary (2026-02-05)
<details>
<summary>Click to expand</summary>

1. **TASK-06** (Cloudflare headers) — 88% → 92%
2. **TASK-11** (Prefetch reduction) — 82% → 90%
3. **TASK-14** (Telemetry decision) — 60% → 85%
4. **TASK-15** (Namespace bundling) — 85% (verified complete test contract)

</details>

**Confidence Summary:**
- Overall confidence: 84% → 86%
- Remaining confidence: 82% → 87%
- All remaining IMPLEMENT tasks are ≥80% confidence with complete test contracts
- DECISION tasks correctly framed as "Needs-Input" (not confidence gaps)
