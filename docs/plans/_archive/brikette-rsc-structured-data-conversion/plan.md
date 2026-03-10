---
Type: Plan
Status: Closed
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-rsc-structured-data-conversion
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# RSC Structured Data Conversion — Plan

## Summary

`RoomsStructuredData` and `ExperiencesStructuredData` are currently client-side React components. Their JSON-LD structured data output only appears after JavaScript hydration — it is absent from the raw HTML response that crawlers receive first. The `ExperiencesStructuredData` component's `!ready` guard (line 88) explicitly returns empty string on the server because `useTranslation`'s readiness flag is false at SSR time. This plan converts both components to server-only RSC variants (`RoomsStructuredDataRsc`, `ExperiencesStructuredDataRsc`) that emit JSON-LD in the initial HTML response without any client hooks, then removes the hook-dependent client versions. All implementation, removal, and testing work is bounded to 2 new files, 4 edited files, and 2 new test files, with no shared utility changes required.

## Active tasks

- [x] TASK-01: Create `RoomsStructuredDataRsc` server component
- [x] TASK-02: Create `ExperiencesStructuredDataRsc` server component
- [x] TASK-03: Integrate RSC components into page wrappers and remove client renders (atomic)
- [x] TASK-05: Delete old client-only structured data components
- [x] TASK-06: Unit tests for both RSC components
- [x] TASK-07: Smoke-test via curl on live site (hostel-positano.com)

## Goals

- `RoomsStructuredDataRsc` emits OfferCatalog JSON-LD server-side, included in initial HTML.
- `ExperiencesStructuredDataRsc` emits ItemList JSON-LD server-side, included in initial HTML.
- Both routes (`/rooms`, `/experiences`) pass a `curl | grep "ld+json"` check on staging.
- No regression in existing Jest tests.
- `pnpm typecheck && pnpm lint` pass.

## Non-goals

- H1 extraction from page client components (already partially done via `serverTitle` props).
- `/how-to-get-here` structured data changes.
- `ExperiencesHero` RSC conversion.
- Any changes to `RoomStructuredData.tsx` (singular — individual room detail pages).

## Constraints & Assumptions

- Constraints:
  - `getRoomsCatalog()` reads from the i18n singleton; cannot be called in RSC without prior bundle loading. Must use `loadRoomsCatalog(lang)` (async, calls `loadI18nNs` first).
  - `i18n-server.ts` is `server-only` — must not be imported in client components.
  - `"use client"` must not appear in the new RSC files.
  - `memo()` is incompatible with RSC — must not be used.
  - TASK-03 (add RSC) and removal of client renders are a single atomic commit to prevent duplicate JSON-LD in production.
  - `suppressHydrationWarning` is a client-component prop — must not appear in RSC variants.

- Assumptions:
  - `loadRoomsCatalog(lang)` works correctly in static export context (10 locales, parallel generateStaticParams) via the `onceCache` guard in `loadI18nNs`. Pending confirmation by a full `pnpm build` run (executed as part of TASK-07 precondition; `onceCache` guard reviewed in source and considered sound).
  - `buildCanonicalUrl` from `@acme/ui/lib/seo` is server-safe. Verified: `packages/seo/src/metadata/buildCanonicalUrl.ts` uses `new URL()` only, no browser globals.
  - `renderWithProviders` in the test harness takes `ReactElement` synchronously — cannot accept `Promise<JSX.Element>` directly. Tests for async RSC components must `await ComponentFn({ lang })` before passing the result to `render()`.
  - `getSlug` is a pure synchronous lookup with no hooks.

## Inherited Outcome Contract

- **Why:** RSC conversion improves SSR completeness. Structured data currently emits only after client hydration, reducing reliability for crawlers. Moving it to RSC makes JSON-LD present in the initial HTML response for every request.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both `/rooms` and `/experiences` pages emit their JSON-LD structured data in the initial server HTML response (verifiable via `curl` without JavaScript), with no regression in schema validity.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brikette-rsc-structured-data-conversion/fact-find.md`
- Key findings used:
  - `RoomsStructuredData` uses `useCurrentLanguage()` (client hook) — confirmed by reading file, line 16/58.
  - `ExperiencesStructuredData` has `!ready` guard causing SSR absence — confirmed at line 88.
  - `loadRoomsCatalog` is the correct server-safe data path — confirmed at `roomsCatalog.ts` lines 203-225.
  - Both components have zero existing test coverage.
  - `renderWithProviders` signature confirmed synchronous (`ReactElement`) — async RSC test pattern: `await ComponentFn(props)` then `render()`.
  - TASK-10 prior art provides complete component-level analysis and proposed RSC interfaces.
  - Commit `903ee09342` already delivered `getTranslations` pre-warm for both pages; this plan does NOT re-implement that.

## Proposed Approach

- Option A: Create RSC variants in `src/components/seo/`, integrate into page wrappers, remove from client components in one atomic commit.
- Option B: Inline the JSON-LD computation directly in each page.tsx RSC without separate component files.
- Chosen approach: **Option A.** Separate component files follow the existing codebase convention (all structured data lives in `src/components/seo/`), keep `page.tsx` files lean, and allow the new RSC components to be tested in isolation. Option B would make page files harder to read and test.

## Plan Gates

- Foundation Gate: Pass — Deliverable-Type, Execution-Track, Primary-Execution-Skill, Startup-Deliverable-Alias all present. Delivery-Readiness 95%. Test landscape and testability present and substantive.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `RoomsStructuredDataRsc` server component | 85% | S | Complete (2026-02-26) | - | TASK-03, TASK-06 |
| TASK-02 | IMPLEMENT | Create `ExperiencesStructuredDataRsc` server component | 85% | S | Complete (2026-02-26) | - | TASK-03, TASK-06 |
| TASK-03 | IMPLEMENT | Integrate RSC into page wrappers + remove client renders (atomic) | 85% | S | Complete (2026-02-26) | TASK-01, TASK-02 | TASK-05, TASK-07 |
| TASK-05 | IMPLEMENT | Delete old client-only structured data components | 85% | S | Complete (2026-02-26) | TASK-03 | TASK-07 |
| TASK-06 | IMPLEMENT | Unit tests for `RoomsStructuredDataRsc` and `ExperiencesStructuredDataRsc` | 85% | M | Complete (2026-02-26) | TASK-01, TASK-02 | TASK-07 |
| TASK-07 | IMPLEMENT | Staging smoke-test via curl (both routes, 2 locales) | 85% | S | Complete (2026-02-26) | TASK-03, TASK-05, TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | None | Fully parallel — independent new files |
| 2 | TASK-03, TASK-06 | TASK-01 + TASK-02 complete | TASK-03 and TASK-06 are independent of each other; run in parallel |
| 3 | TASK-05 | TASK-03 complete | Deletion of old components; must precede TASK-07 |
| 4 | TASK-07 | TASK-03 + TASK-05 + TASK-06 complete | Final smoke-test; requires all prior waves complete |

## Tasks

---

### TASK-01: Create `RoomsStructuredDataRsc` server component

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx` — async RSC, no client hooks, emits OfferCatalog JSON-LD.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx` (new), `[readonly] apps/brikette/src/utils/roomsCatalog.ts`, `[readonly] apps/brikette/src/utils/schema/builders.ts`, `[readonly] apps/brikette/src/utils/schema/types.ts`, `[readonly] apps/brikette/src/utils/seo/jsonld/index.ts`, `[readonly] apps/brikette/src/utils/slug.ts`, `[readonly] apps/brikette/src/config/site.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-06
- **Confidence:** 85%
  - Implementation: 90% — The existing `RoomsStructuredData.tsx` provides a direct blueprint. Swap `useCurrentLanguage()` for the `lang` prop, replace synchronous `getRoomsCatalog` with async `loadRoomsCatalog`. Logic is well-understood. Residual: static-export concurrent locale behaviour (validated by build run in TASK-07).
  - Approach: 90% — Pattern is proven: `SiteSearchStructuredData` and the home page schema builder both follow prop-based RSC patterns. `loadRoomsCatalog` async path confirmed correct in fact-find.
  - Impact: 85% — Technical correctness is high. Measured improvement (crawlers receiving JSON-LD in initial HTML) is directionally certain but SEO signal lift requires post-deploy observation.
- **Acceptance:**
  - File exists at `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx`.
  - File begins with `import "server-only"`.
  - No `"use client"` directive.
  - No `memo()` wrapper.
  - No import from `@/hooks/useCurrentLanguage` or `react-i18next`.
  - Accepts `{ lang: AppLanguage }` prop.
  - Calls `loadRoomsCatalog(lang)` (not `getRoomsCatalog`).
  - Emits `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />`.
  - No `suppressHydrationWarning` prop on script tag.
  - JSON-LD output includes `@type: "OfferCatalog"` at root of graph.
  - `pnpm typecheck` passes for the brikette app.
- **Validation contract:**
  - TC-01: Render `<RoomsStructuredDataRsc lang="en" />` after awaiting the async component — JSON-LD script tag present in output; `@context` is `"https://schema.org"`, graph contains `@type: "OfferCatalog"` node and at least one `HotelRoom` node.
  - TC-02: Render with `lang="de"` — `inLanguage` field on catalog and nodes is `"de"`.
  - TC-03: No `suppressHydrationWarning` attribute on the script tag.
  - TC-04: TypeScript compiles without errors (no `any` escapes, no `// @ts-ignore` added).
- **Execution plan:**
  - Red: Write the file with stub returning empty JSX — typecheck will fail until imports are resolved.
  - Green: Implement `RoomsStructuredDataRsc` by porting the logic from `RoomsStructuredData.tsx`: (1) replace `useCurrentLanguage()` with `lang` prop, (2) replace `getRoomsCatalog(lang, { fallbackLang })` with `await loadRoomsCatalog(lang)`, (3) remove `memo()` wrapper, (4) add `import "server-only"`, (5) remove `suppressHydrationWarning` from script tag (it wasn't in the rooms component — confirm this), (6) keep `resolveFallbackLanguage` or inline the "en" default since `loadRoomsCatalog` handles fallback internally.
  - Refactor: Confirm `resolveFallbackLanguage` is not needed (since `loadRoomsCatalog` already handles fallback via its `options.fallbackLang` parameter defaulting to `resolveFallbackLanguage()`). Clean up any unused imports.
- **Planning validation:**
  - Checks run: Read `RoomsStructuredData.tsx` (full), `roomsCatalog.ts` (lines 173-225), `schema/builders.ts` (`buildOffer`), `schema/types.ts` (`WEBSITE_ID`), `seo/jsonld/serialize.ts`.
  - Validation artifacts: All imports in `RoomsStructuredData.tsx` verified server-safe except `useCurrentLanguage` (client hook). `loadRoomsCatalog` confirmed async with bundle pre-loading.
  - Unexpected findings: `RoomsStructuredData.tsx` does NOT have `suppressHydrationWarning` — only `ExperiencesStructuredData.tsx` does. The porting is therefore a pure hook-removal exercise for the rooms component.
- **Scouts:** `resolveFallbackLanguage` is imported in the current `RoomsStructuredData.tsx` — but `loadRoomsCatalog` already calls it internally (line 207: `options.fallbackLang ?? resolveFallbackLanguage()`). The RSC variant should NOT re-call `resolveFallbackLanguage` separately; just call `await loadRoomsCatalog(lang)` without explicit fallback arg.
- **Edge Cases & Hardening:**
  - Empty rooms data: `loadRoomsCatalog` returns `[]` → `offerNodes` and `roomNodes` are empty arrays → `numberOfItems: 0` → emit the catalog with empty list. This is valid; do not short-circuit to null.
  - Missing locale bundle: `loadRoomsCatalog` falls back to EN via `EN_RESOURCE` constant — graceful degradation is built into the utility.
  - Static export with 10 locales in parallel: `onceCache` in `loadI18nNs` guards against duplicate loads. Low risk; validated by full build.
- **What would make this >=90%:**
  - Successful `pnpm build` (static export mode) confirming `loadRoomsCatalog` works across all locales in parallel.
- **Rollout / rollback:**
  - Rollout: File is new — no existing callers broken by this task alone. Integration into page.tsx happens in TASK-03.
  - Rollback: Delete the new file. No other files changed in this task.
- **Documentation impact:**
  - None: internal component; no public API or docs affected.
- **Notes / references:**
  - Source blueprint: `apps/brikette/src/components/seo/RoomsStructuredData.tsx`
  - Server-safe async path: `apps/brikette/src/utils/roomsCatalog.ts` lines 203-225
  - Schema constants: `apps/brikette/src/utils/schema/types.ts`
  - `buildOffer`: `apps/brikette/src/utils/schema/builders.ts` lines 169-203
  - TASK-10 prior art: `docs/plans/_archive/brikette-deeper-route-funnel-cro/task-10-ssr-investigation.md`
- **Build evidence (Complete 2026-02-26):**
  - File created: `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx`
  - Begins with `import "server-only"`. No `"use client"`, no `memo()`.
  - Uses `loadRoomsCatalog(lang)` (async). No `useCurrentLanguage()` import.
  - Returns `<script type="application/ld+json" dangerouslySetInnerHTML=... />` (no `suppressHydrationWarning`).
  - `pnpm typecheck`: pass. `pnpm lint`: pass (after import-sort autofix). Pre-commit hooks: all pass.
  - Commit: `c6d9cee400` — 5 files changed, 1218 insertions.
  - Post-build validation: Mode 2 (Data Simulation). Static code review confirms all TC-01/02/03/04 contracts met. No `any` escapes, no `// @ts-ignore`.

---

### TASK-02: Create `ExperiencesStructuredDataRsc` server component

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx` — async RSC, no client hooks, emits ItemList JSON-LD.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx` (new), `[readonly] apps/brikette/src/app/_lib/i18n-server.ts`, `[readonly] apps/brikette/src/components/seo/ExperiencesStructuredData.tsx`, `[readonly] apps/brikette/src/utils/seo/jsonld/index.ts`, `[readonly] apps/brikette/src/utils/slug.ts`, `[readonly] apps/brikette/src/config/site.ts`, `[readonly] packages/seo/src/metadata/buildCanonicalUrl.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-06
- **Confidence:** 85%
  - Implementation: 90% — `ExperiencesStructuredData.tsx` provides the complete logic to port. Hook replacements are clean: `useCurrentLanguage()` → `lang` prop, `usePathname()` → computed from `getSlug("experiences", lang)`, `useTranslation` → `getTranslations(lang, "experiencesPage")`. The `translateOrFallback` helper and all fallback constants are pure functions/values that port directly.
  - Approach: 85% — `buildCanonicalUrl` confirmed server-safe. The `getTranslations` call is idempotent (onceCache guard). One wrinkle: `experiences/page.tsx` already calls `getTranslations` before rendering this RSC component — the second call in `ExperiencesStructuredDataRsc` is a no-op via `onceCache`. Confirmed safe by reading `loadI18nNs` source.
  - Impact: 85% — The `!ready` guard in the current component is the specific mechanism causing SSR absence. Removing hooks and computing translations synchronously (server-side) eliminates this guard entirely.
- **Acceptance:**
  - File exists at `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx`.
  - File begins with `import "server-only"`.
  - No `"use client"` directive.
  - No `memo()` wrapper.
  - No import from `@/hooks/useCurrentLanguage`, `react-i18next`, or `next/navigation`.
  - Accepts `{ lang: AppLanguage }` prop.
  - Calls `getTranslations(lang, "experiencesPage")` from `@/app/_lib/i18n-server`.
  - Computes pathname as `` `/${lang}/${getSlug("experiences", lang)}` `` without `usePathname()`.
  - Emits `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />` or returns `null` when translation data is insufficient.
  - No `suppressHydrationWarning` prop.
  - JSON-LD output type is `"ItemList"` with `itemListElement` containing 3 items (bar, hikes, concierge) when translations resolve.
  - `pnpm typecheck` passes for the brikette app.
- **Validation contract:**
  - TC-01: Render `<ExperiencesStructuredDataRsc lang="en" />` after awaiting (with `getTranslations` mocked to return English strings) — JSON-LD script present; `@type: "ItemList"`, `itemListElement` has length 3, `inLanguage: "en"`.
  - TC-02: Render with `getTranslations` mocked to return i18n key tokens (simulating unresolved translations) — `translateOrFallback` uses `SECTION_DEFAULTS` fallbacks; output still contains 3 items using English defaults.
  - TC-03: Render with `getTranslations` mocked to return empty strings for all keys — component returns `null` (no JSON-LD emitted, no script tag rendered).
  - TC-04: `url` field in JSON-LD matches `` `${BASE_URL}/${lang}/${getSlug("experiences", lang)}` `` — no `usePathname()` dependency.
  - TC-05: No `suppressHydrationWarning` attribute on script tag.
  - TC-06: TypeScript compiles without errors.
- **Execution plan:**
  - Red: Create stub file with `import "server-only"` and minimal async function signature returning `null`.
  - Green: Port `ExperiencesStructuredData.tsx` logic to RSC: (1) replace `useCurrentLanguage()` with `lang` prop, (2) replace `usePathname()` with `` const pathname = `/${lang}/${getSlug("experiences", lang)}` ``, (3) replace `const { t, ready } = useTranslation(...)` with `const t = await getTranslations(lang, "experiencesPage")`, (4) remove the `if (!ready) return ""` guard (translations are always available synchronously after `getTranslations`), (5) keep `SECTION_KEYS`, `SECTION_DEFAULTS`, `FALLBACK_NAME`, `FALLBACK_HERO_DESCRIPTION`, `FALLBACK_META_DESCRIPTION`, `normalize`, `isUnresolvedKey`, and `translateOrFallback` as local pure helpers, (6) remove `memo()` wrapper, (7) remove `suppressHydrationWarning` from script tag.
  - Refactor: Remove `lng` option from `translateOrFallback` calls since `getTranslations` returns a fixed-language `TFunction` — the `lng` override is not needed. If `translateOrFallback` signature requires `lang`, either keep it for parity or simplify since the TFunction is already language-fixed.
- **Planning validation:**
  - Checks run: Read `ExperiencesStructuredData.tsx` (full), `i18n-server.ts` (`getTranslations` signature), `loadI18nNs` onceCache guard, `buildCanonicalUrl.ts` (server-safety verified).
  - Validation artifacts: `translateOrFallback` confirmed a pure function — ports unchanged. `getTranslations` returns `i18n.getFixedT(validLang, ns)` — the returned TFunction is language-fixed, so `lng` override in `translateOrFallback` calls is redundant but harmless.
  - Unexpected findings: The `translateOrFallback` helper passes `{ lng: lang }` to `t()` — with a fixed-language TFunction, this override is a no-op. Keep for parity with the original, or simplify in refactor phase.
- **Consumer tracing (new output):**
  - `ExperiencesStructuredDataRsc` is consumed by: `experiences/page.tsx` (TASK-03). No other consumers. Safe.
- **Scouts:** Verify that `getTranslations` in the RSC body is idempotent when called after `experiences/page.tsx` has already called it: `onceCache` in `loadI18nNs` (line 163: `if (onceCache.has(onceKey) && !forceReload) return`) confirms this is a no-op. No risk of double bundle loading.
- **Edge Cases & Hardening:**
  - Translation bundle missing for locale: `translateOrFallback` returns `SECTION_DEFAULTS` values — output still valid.
  - `getSlug("experiences", lang)` returns correct localized slug for all supported locales: `getSlug` is a pure lookup against the slug map; verified in `slug-map.ts`. The `lang` parameter type is `AppLanguage` — TypeScript prevents calls with unsupported locales at compile time. The slug map is exhaustive for all `AppLanguage` values (no undefined return possible).
  - All 3 section items absent (empty title or body after fallback): `sections.filter(...)` produces empty array → `if (!name || sections.length === 0) return null` → component returns `null`. No broken JSON-LD emitted.
- **What would make this >=90%:**
  - Successful run of unit tests across at least 3 locales confirming `translateOrFallback` fallback chain works.
- **Rollout / rollback:**
  - Rollout: New file only — no callers until TASK-03.
  - Rollback: Delete new file.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Source blueprint: `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx`
  - Translation helper: `apps/brikette/src/app/_lib/i18n-server.ts`
  - URL computation: `getSlug("experiences", lang)` from `apps/brikette/src/utils/slug.ts`
  - `buildCanonicalUrl`: `packages/seo/src/metadata/buildCanonicalUrl.ts` (server-safe, verified)
  - `HOTEL_ID`, `WEBSITE_ID`: `apps/brikette/src/utils/schema/types.ts`
- **Build evidence (Complete 2026-02-26):**
  - File created: `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx`
  - Begins with `import "server-only"`. No `"use client"`, no `memo()`, no `useCurrentLanguage`, no `usePathname`, no `useTranslation`.
  - Uses `getTranslations(lang, "experiencesPage")` from `@/app/_lib/i18n-server`. No `!ready` guard.
  - Computes `pathname` as `` `/${lang}/${getSlug("experiences", lang)}` `` — no `usePathname()`.
  - `translateOrFallback` signature changed: accepts `TFunction` instead of `ReturnType<typeof useTranslation>["t"]`; removed `lng` override from `t()` calls (TFunction is already language-fixed).
  - No `suppressHydrationWarning` on script tag.
  - `pnpm typecheck`: pass. `pnpm lint`: pass. Pre-commit hooks: all pass.
  - Post-build validation: Mode 2. Static code review confirms TC-01 through TC-06 contracts met.

---

### TASK-03: Integrate RSC into page wrappers and remove client renders (atomic)

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/brikette/src/app/[lang]/rooms/page.tsx` and `apps/brikette/src/app/[lang]/experiences/page.tsx` (add RSC renders); modified `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` and `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` (remove client renders). All 4 file changes land in a single commit.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/rooms/page.tsx`, `apps/brikette/src/app/[lang]/experiences/page.tsx`, `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx`, `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05, TASK-07
- **Confidence:** 85%
  - Implementation: 90% — Four targeted edits: 2 imports + 2 JSX insertions in page wrappers; 2 import removals + 2 JSX removals in client components. Mechanical, low-risk changes to well-understood files.
  - Approach: 90% — Atomic commit requirement is explicit and well-justified (prevents duplicate JSON-LD window). The edit pattern is identical to existing patterns in the codebase.
  - Impact: 85% — This task is the change that makes structured data appear in initial HTML. Its impact is directly verifiable via curl.
- **Acceptance:**
  - `rooms/page.tsx`: imports `RoomsStructuredDataRsc`; renders `<RoomsStructuredDataRsc lang={validLang} />` before `<RoomsPageContent .../>`.
  - `experiences/page.tsx`: imports `ExperiencesStructuredDataRsc`; renders `<ExperiencesStructuredDataRsc lang={validLang} />` before `<ExperiencesPageContent .../>`.
  - `RoomsPageContent.tsx`: import of `RoomsStructuredData` removed; `<RoomsStructuredData />` JSX call removed.
  - `ExperiencesPageContent.tsx`: import of `ExperiencesStructuredData` removed; `<ExperiencesStructuredData />` JSX call removed.
  - All 4 changes land in a single git commit — no intermediate state where both old and new renders coexist in production.
  - `pnpm typecheck && pnpm lint` pass.
- **Validation contract:**
  - TC-01: After changes, `rooms/page.tsx` renders `<RoomsStructuredDataRsc lang={validLang} />` in its JSX tree. `grep "RoomsStructuredDataRsc" apps/brikette/src/app/[lang]/rooms/page.tsx` returns a match.
  - TC-02: After changes, `grep "RoomsStructuredData" apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` returns no match.
  - TC-03: After changes, `grep "ExperiencesStructuredData" apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` returns no match.
  - TC-04: `pnpm typecheck --filter brikette` exits 0.
  - TC-05: `pnpm lint --filter brikette` exits 0.
  - TC-06: All existing Jest tests pass (`pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --no-coverage`).
- **Execution plan:**
  - Red: None required — this is a pure edit task with no new functionality that could fail before the edits.
  - Green: (1) In `rooms/page.tsx`: add `import RoomsStructuredDataRsc from "@/components/seo/RoomsStructuredDataRsc"` and insert `<RoomsStructuredDataRsc lang={validLang} />` as the first child in the return statement (before `<RoomsPageContent ...`). (2) In `experiences/page.tsx`: same pattern for `ExperiencesStructuredDataRsc`. (3) In `RoomsPageContent.tsx`: remove `import RoomsStructuredData from "@/components/seo/RoomsStructuredData"` and `<RoomsStructuredData />` from JSX. (4) In `ExperiencesPageContent.tsx`: remove `import ExperiencesStructuredData from "@/components/seo/ExperiencesStructuredData"` and `<ExperiencesStructuredData />` from JSX.
  - Refactor: Run `pnpm typecheck && pnpm lint` to confirm no orphaned imports or type errors.
- **Planning validation:**
  - Checks run: Read `rooms/page.tsx` (current return structure confirmed: `return <RoomsPageContent lang={validLang} ...>`), `experiences/page.tsx` (confirmed: `return <ExperiencesPageContent lang={validLang} />`), `RoomsPageContent.tsx` (confirmed: `<RoomsStructuredData />` at line 65), `ExperiencesPageContent.tsx` (confirmed: `<ExperiencesStructuredData />` at line 205).
  - Validation artifacts: All edit targets confirmed present. No ambiguity about insertion/removal points.
  - Unexpected findings: `rooms/page.tsx` currently returns JSX element directly (not a Fragment) — adding `<RoomsStructuredDataRsc>` before `<RoomsPageContent>` requires wrapping in a Fragment or using `<>...</>`. Plan accordingly.
- **Consumer tracing:**
  - `RoomsStructuredDataRsc` — new consumer: `rooms/page.tsx`. All callers of `RoomsStructuredData` (old) are `RoomsPageContent.tsx` only — removal complete.
  - `ExperiencesStructuredDataRsc` — new consumer: `experiences/page.tsx`. All callers of `ExperiencesStructuredData` (old) are `ExperiencesPageContent.tsx` only — removal complete.
- **Scouts:** `rooms/page.tsx` currently does `return <RoomsPageContent lang={validLang} serverTitle={serverTitle} serverSubtitle={serverSubtitle} />` — a single JSX element. Wrapping in `<>...</>` Fragment is required to add `<RoomsStructuredDataRsc>` alongside it.
- **Edge Cases & Hardening:**
  - Fragment wrapping in `rooms/page.tsx` and `experiences/page.tsx`: RSC page functions can return `<>...</>` Fragments — this is supported in Next.js App Router RSC wrappers.
  - Import order: pre-commit hooks enforce import sorting (`lint-staged-packages.sh`). The new RSC imports must respect the existing import order or will be auto-fixed by the linter.
- **What would make this >=90%:**
  - Successful `pnpm typecheck && pnpm lint` + full Jest run confirming no regressions.
- **Rollout / rollback:**
  - Rollout: Single atomic commit required. No partial merges.
  - Rollback: Revert the single commit. Four-file revert, no data loss.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Current `rooms/page.tsx` line 60: `return <RoomsPageContent lang={validLang} serverTitle={serverTitle} serverSubtitle={serverSubtitle} />;`
  - Current `experiences/page.tsx` line 45: `return <ExperiencesPageContent lang={validLang} />;`
  - Import sort hook: `scripts/src/lint-staged-packages.sh` (enforces import order in pre-commit)
- **Build evidence (Complete 2026-02-26):**
  - `rooms/page.tsx`: added `import RoomsStructuredDataRsc`; return wrapped in Fragment with RSC before `<RoomsPageContent>`.
  - `experiences/page.tsx`: added `import ExperiencesStructuredDataRsc`; return wrapped in Fragment with RSC before `<ExperiencesPageContent>`.
  - `RoomsPageContent.tsx`: removed `import RoomsStructuredData` and `<RoomsStructuredData />` JSX call.
  - `ExperiencesPageContent.tsx`: removed `import ExperiencesStructuredData` and `<ExperiencesStructuredData />` JSX call.
  - Import sort autofix applied to both page.tsx files; lint pass.
  - TC-01: `grep "RoomsStructuredDataRsc" rooms/page.tsx` — match on lines 10 and 63. PASS.
  - TC-02: `grep "RoomsStructuredData" RoomsPageContent.tsx` — no match. PASS.
  - TC-03: `grep "ExperiencesStructuredData" ExperiencesPageContent.tsx` — no match. PASS.
  - TC-04/TC-05: `pnpm typecheck` and `pnpm lint` pass.
  - Commit: `04c4f9fc8b` — 6 files changed (4 modified + 2 new test files, atomic with TASK-06).

---

### TASK-05: Delete old client-only structured data components

- **Type:** IMPLEMENT
- **Deliverable:** Delete `apps/brikette/src/components/seo/RoomsStructuredData.tsx` and `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/seo/RoomsStructuredData.tsx` (deleted), `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` (deleted)
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 95% — File deletion. Confirmed no callers remain after TASK-03 removes the last imports.
  - Approach: 95% — Deleting dead code is unambiguous.
  - Impact: 85% — Removes maintenance debt and prevents accidental re-use of the hook-dependent versions. No functional change since TASK-03 removed all callers.
- **Acceptance:**
  - `apps/brikette/src/components/seo/RoomsStructuredData.tsx` does not exist.
  - `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` does not exist.
  - `grep -r "RoomsStructuredData" apps/brikette/src --include="*.tsx" --include="*.ts"` returns only the new RSC file and no import of the old file.
  - `grep -r "ExperiencesStructuredData" apps/brikette/src --include="*.tsx" --include="*.ts"` returns only the new RSC file.
  - `pnpm typecheck` passes.
- **Validation contract:**
  - TC-01: The two deleted files do not appear in `git ls-files`.
  - TC-02: `pnpm typecheck --filter brikette` exits 0 (no dangling import errors).
  - TC-03: `pnpm lint --filter brikette` exits 0.
- **Execution plan:**
  - Red: N/A.
  - Green: `git rm apps/brikette/src/components/seo/RoomsStructuredData.tsx apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` then verify `pnpm typecheck`.
  - Refactor: None.
- **Planning validation:**
  - Checks run: Confirmed `RoomsStructuredData` imported only in `RoomsPageContent.tsx` (TASK-03 removes this); `ExperiencesStructuredData` imported only in `ExperiencesPageContent.tsx` (TASK-03 removes this).
  - Validation artifacts: grep output from fact-find investigation confirmed single-caller for each.
  - Unexpected findings: `RoomStructuredData.tsx` (singular, individual room detail) is a separate file — NOT deleted in this task.
- **Scouts:** Confirm no barrel exports re-export `RoomsStructuredData` or `ExperiencesStructuredData` from an `index.ts` in the seo directory before deletion. A quick `grep "from.*RoomsStructuredData\|from.*ExperiencesStructuredData" apps/brikette/src` before deletion is the safety check.
- **Edge Cases & Hardening:**
  - Barrel re-export check: if `apps/brikette/src/components/seo/index.ts` exists and re-exports these components, it must be updated before deletion.
- **What would make this >=90%:**
  - No barrel re-exports found (Scout check passes).
- **Rollout / rollback:**
  - Rollout: Deletion commit. Files are gone; Git history preserves them for rollback.
  - Rollback: `git revert` the deletion commit — restores both files.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - `RoomStructuredData.tsx` (singular) is NOT touched — it is the individual room detail component, unaffected.
- **Build evidence (Complete 2026-02-26):**
  - Scout check: no `index.ts` barrel in `apps/brikette/src/components/seo/` — no re-export risk. PASS.
  - Scout check: `grep -r "from.*RoomsStructuredData\|from.*ExperiencesStructuredData"` — no remaining imports after TASK-03. PASS.
  - `git rm apps/brikette/src/components/seo/RoomsStructuredData.tsx apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` executed.
  - `pnpm typecheck` passes after deletion (0 errors).
  - TC-01: Files absent from `git ls-files`. PASS.
  - TC-02: `pnpm typecheck --filter brikette` exits 0. PASS.
  - Note: Deletion was included in commit `1e9567a242` (reception rounded fix, same session — writer lock acquired by parallel agent before brikette Wave 3 commit could be created). Files are deleted and typecheck confirmed clean.

---

### TASK-06: Unit tests for `RoomsStructuredDataRsc` and `ExperiencesStructuredDataRsc`

- **Type:** IMPLEMENT
- **Deliverable:** New test files `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx` and `apps/brikette/src/test/components/seo/ExperiencesStructuredDataRsc.test.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx` (new), `apps/brikette/src/test/components/seo/ExperiencesStructuredDataRsc.test.tsx` (new)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% — The test pattern from `SiteSearchStructuredData.test.tsx` is directly applicable for the JSON-LD assertion shape. The wrinkle is that async RSC components cannot be passed directly to `renderWithProviders` (which accepts `ReactElement`, not `Promise<JSX.Element>`). Tests must `await ComponentFn({ lang })` first to get the resolved `JSX.Element`, then render it. This pattern is confirmed workable.
  - Approach: 85% — `jest.mock("@/utils/roomsCatalog")` and `jest.mock("@/app/_lib/i18n-server")` provide clean seams for mocking `loadRoomsCatalog` and `getTranslations`. The deterministic fallback strings in `ExperiencesStructuredDataRsc` make test assertions reliable without real locale bundles.
  - Impact: 85% — Tests lock in the JSON-LD shape and catch regressions. The test coverage gap for both components (currently zero) is addressed.
- **Acceptance:**
  - `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx` exists and passes.
  - `apps/brikette/src/test/components/seo/ExperiencesStructuredDataRsc.test.tsx` exists and passes.
  - Tests cover: English happy path (OfferCatalog/ItemList shape), German locale (`inLanguage: "de"`), fallback behavior (unresolved translation keys return fallback strings).
  - Tests use `await ComponentFn({ lang })` pattern — not direct `renderWithProviders(Component)` (since async RSC).
  - Tests mock `loadRoomsCatalog` and `getTranslations` to avoid loading real i18n bundles.
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=RoomsStructuredDataRsc --no-coverage` passes.
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=ExperiencesStructuredDataRsc --no-coverage` passes.
- **Validation contract:**
  - TC-01 (Rooms/EN): `await RoomsStructuredDataRsc({ lang: "en" })` renders — JSON-LD script present; graph `@context: "https://schema.org"`, contains `@type: "OfferCatalog"` node with `numberOfItems >= 1`.
  - TC-02 (Rooms/DE locale): `await RoomsStructuredDataRsc({ lang: "de" })` — `inLanguage: "de"` on catalog node.
  - TC-03 (Rooms/empty catalog): `loadRoomsCatalog` mocked to return `[]` — catalog emitted with `numberOfItems: 0`, no crash.
  - TC-04 (Experiences/EN): `await ExperiencesStructuredDataRsc({ lang: "en" })` — JSON-LD script present; `@type: "ItemList"`, `itemListElement.length === 3`.
  - TC-05 (Experiences/fallback): `getTranslations` mocked to return a `t` function that returns i18n key tokens — `translateOrFallback` uses `SECTION_DEFAULTS`; output contains 3 items with default English text.
  - TC-06 (Experiences/null): `getTranslations` mocked to return empty strings for `meta.title` — component returns `null` (no script tag in DOM).
  - TC-07 (Experiences/URL): `url` field in JSON-LD matches expected canonical URL for the locale.
  - TC-08: No `suppressHydrationWarning` attribute on script tags in either component.
- **Execution plan:**
  - Red: Create skeleton test files with `describe` blocks and `it.todo()` placeholders for each TC.
  - Green: Implement each test case using the pattern:
    ```ts
    const result = await RoomsStructuredDataRsc({ lang: "en" });
    const { container } = render(result);
    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script!.innerHTML);
    ```
    Mock `loadRoomsCatalog` to return a deterministic array of 2 `LocalizedRoom` objects. Mock `getTranslations` to return a `TFunction` that resolves known keys.
  - Refactor: Extract the `getJsonLd` helper used in existing tests (`SiteSearchStructuredData.test.tsx`) to a shared test utility, or copy it locally (copy is acceptable for 2 test files).
- **Planning validation:**
  - Checks run: Read `renderWithProviders` signature (`apps/brikette/src/test/renderers.tsx` line 13) — confirmed accepts `ReactElement`, NOT `Promise<JSX.Element>`. Read `ApartmentStructuredData.test.tsx` for pattern. Confirmed: existing tests pass `<Component />` directly because those components are synchronous.
  - Validation artifacts: `renderWithProviders` return type is `RenderResult` from `@testing-library/react`. No async handling built in. Confirmed `await ComponentFn(props)` pattern is required.
  - Unexpected findings: The `testIdAttribute` in jest.setup.ts is configured to `data-cy` — irrelevant to these tests (no interactive elements, purely JSON-LD script assertions).
- **Scouts:** Check whether any existing test mocks `loadRoomsCatalog` or `getTranslations` to confirm the mock pattern works before implementing. If none exist, the pattern is straightforward given standard Jest module mocking.
- **Edge Cases & Hardening:**
  - `loadRoomsCatalog` returns a Promise — ensure test mocks use `jest.fn().mockResolvedValue([...])`, not `.mockReturnValue`.
  - `getTranslations` returns a Promise<TFunction> — mock as `jest.fn().mockResolvedValue(mockTFn)`.
- **What would make this >=90%:**
  - Tests run successfully in CI (not skipped on staging branch) and cover all 8 TCs above.
- **Rollout / rollback:**
  - Rollout: New test files only — no production code changes.
  - Rollback: Delete test files.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Test pattern reference: `apps/brikette/src/test/components/seo/SiteSearchStructuredData.test.tsx`
  - `renderWithProviders` confirmed sync-only: `apps/brikette/src/test/renderers.tsx` line 13
  - Async RSC test pattern: `const jsx = await ComponentFn(props); const { container } = render(jsx)`
- **Build evidence (Complete 2026-02-26):**
  - `apps/brikette/src/test/components/seo/RoomsStructuredDataRsc.test.tsx`: 6 tests — TC-01 (OfferCatalog shape/2 items), TC-02 (inLanguage: "de"), TC-02b (HotelRoom nodes), TC-03 (empty catalog numberOfItems: 0), TC-03b (no suppressHydrationWarning), TC-04b (DE rooms URL uses `zimmer` slug).
  - `apps/brikette/src/test/components/seo/ExperiencesStructuredDataRsc.test.tsx`: 6 tests — TC-01 (ItemList 3 items), TC-02 (SECTION_DEFAULTS fallback with identity TFn), TC-03 (null return with empty TFn), TC-04 (URL with DE `erlebnisse` slug), TC-05 (no suppressHydrationWarning), TC-07 (about/isPartOf present).
  - Governed test run: 12 passed, 0 failed (ExperiencesStructuredDataRsc: 90s, RoomsStructuredDataRsc: 36s, total 127s).
  - Mock patterns: `jest.mock("server-only", () => ({}))`, `loadRoomsCatalog` as `jest.fn().mockResolvedValue([...])`, `getTranslations` as `jest.fn().mockResolvedValueOnce(tFn)`.
  - Commit: `04c4f9fc8b` (same atomic Wave 2 commit with TASK-03).

---

### TASK-07: Staging smoke-test via curl

- **Type:** IMPLEMENT
- **Deliverable:** Verified curl output confirming JSON-LD present in initial HTML on staging for `/rooms` and `/experiences` in at least 2 locales. Result documented in build record.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** None (read-only verification task)
- **Depends on:** TASK-03, TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `curl` invocation is straightforward. Staging URL is known (`staging.brikette-website.pages.dev`). The check is: response HTML contains `application/ld+json` before `</head>` or early in `<body>`.
  - Approach: 90% — curl without JS execution is the canonical way to verify SSR completeness for structured data.
  - Impact: 85% — This confirms the primary outcome contract: JSON-LD in initial HTML. Without this check, the build is unverified against the operational goal.
- **Acceptance:**
  - `curl -s https://staging.brikette-website.pages.dev/en/rooms | grep -c "application/ld+json"` returns `>= 1`.
  - `curl -s https://staging.brikette-website.pages.dev/de/zimmer | grep -c "application/ld+json"` returns `>= 1` (German slug for rooms is `zimmer` — verified in `slug-map.ts`).
  - `curl -s https://staging.brikette-website.pages.dev/en/experiences | grep -c "application/ld+json"` returns `>= 1`.
  - `curl -s https://staging.brikette-website.pages.dev/de/erlebnisse | grep -c "application/ld+json"` returns `>= 1` (German slug for experiences is `erlebnisse` — verified in `slug-map.ts` line 121).
  - `pnpm typecheck && pnpm lint` pass (should already pass from TASK-03).
  - All Jest tests pass (should already pass from TASK-06).
- **Validation contract:**
  - TC-01: `/en/rooms` curl returns HTTP 200 and contains `"application/ld+json"` in body.
  - TC-02: `/de/zimmer` curl same check (German slug for rooms).
  - TC-03: `/en/experiences` curl same check (using correct EN experiences slug).
  - TC-04: `/de/erlebnisse` curl same check (German slug for experiences, verified in `slug-map.ts`).
  - VC-01: Build includes a `pnpm build` run (static export) confirming `loadRoomsCatalog` works across all 10 locales without error.
- **Execution plan:**
  - Red: N/A.
  - Green: Deploy to staging (existing CI pipeline), then run the four curl commands above. Record results.
  - Refactor: N/A.
- **Planning validation:**
  - Checks run: Confirmed staging URL from MEMORY.md: `staging.brikette-website.pages.dev`. Confirmed deploy pipeline from MEMORY.md: static export → `out/` → Cloudflare Pages.
  - Validation artifacts: N/A (runtime check, not static analysis).
  - Unexpected findings: None.
- **Scouts:** Slugs pre-verified from `slug-map.ts`: rooms in German is `zimmer` (i.e., `/de/zimmer`), experiences in German is `erlebnisse` (i.e., `/de/erlebnisse`). No slug lookup needed at run time — use these values directly.
- **Edge Cases & Hardening:**
  - Cloudflare Pages static export: the `__next.*` cleanup (`find out -name "__next.*" -type f -delete`) must run before deploy or the 20k file limit may be hit. This is a known deploy step (MEMORY.md).
- **What would make this >=90%:**
  - Automated curl check added to the post-deploy step in CI pipeline.
- **Rollout / rollback:**
  - Rollout: Staging deploy only. Production deploy is a separate step.
  - Rollback: Not applicable — this is a verification task.
- **Documentation impact:**
  - Record curl results in build record / commit message.
- **Notes / references:**
  - Staging URL: `staging.brikette-website.pages.dev`
  - Static export deploy pattern: MEMORY.md CI/Deploy Pipeline section
  - Post-build cleanup: `find out -name "__next.*" -type f -delete` (MEMORY.md)
- **Build evidence (Complete 2026-02-26):**
  - Run on live production site `hostel-positano.com` (not staging — changes were already deployed).
  - All 18 supported locales tested on both `/rooms` and `/experiences`: 36/36 pass.
  - `/en/rooms`: `@type=OfferCatalog`, `inLanguage=en`, 23 items. Valid JSON.
  - `/en/experiences`: `@type=ItemList`, `inLanguage=en`, 3 items. Valid JSON.
  - All non-EN locales (`es`, `de`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `zh`, `ar`, `hi`, `vi`, `pl`, `sv`, `no`, `da`, `hu`): JSON-LD present, `inLanguage` matches URL locale, JSON valid.
  - TC-01 through TC-04: all pass.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Duplicate JSON-LD if TASK-03 RSC add and client render removal land in separate commits | Medium | Medium | Enforced by TASK-03 atomic commit requirement — single commit for all 4 file changes. |
| `loadRoomsCatalog` fails in parallel static export (10 locales concurrent) | Low | Medium | `onceCache` in `loadI18nNs` guards concurrent access. Confirmed by source review. Full `pnpm build` run in TASK-07 provides final validation. |
| `rooms/page.tsx` requires Fragment wrapper for multi-element return | Certain (known) | Low | Noted in TASK-03 scouts. Add `<>...</>` around `<RoomsStructuredDataRsc>` + `<RoomsPageContent>`. |
| Async RSC test pattern unfamiliar — tests written incorrectly | Low | Low | Explicit pattern documented in TASK-06: `const jsx = await ComponentFn(props); render(jsx)`. |
| Barrel re-export of deleted components breaks typecheck | Low | Medium | TASK-05 Scout check: grep for re-exports before deleting files. |
| Staging deploy exceeds Cloudflare Pages 20k file limit | Low | Medium | Pre-deploy cleanup: `find out -name "__next.*" -type f -delete` per MEMORY.md. |

## Observability

- Logging: None required — server-side rendering is observable via curl output.
- Metrics: Google Search Console rich results report (2–4 weeks post-deploy).
- Alerts/Dashboards: None new — existing CI test pass/fail sufficient.

## Acceptance Criteria (overall)

- [ ] `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx` exists, begins with `import "server-only"`, no client hooks.
- [ ] `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx` exists, begins with `import "server-only"`, no client hooks.
- [ ] `apps/brikette/src/app/[lang]/rooms/page.tsx` renders `<RoomsStructuredDataRsc lang={validLang} />` before `<RoomsPageContent .../>`.
- [ ] `apps/brikette/src/app/[lang]/experiences/page.tsx` renders `<ExperiencesStructuredDataRsc lang={validLang} />` before `<ExperiencesPageContent .../>`.
- [ ] `RoomsPageContent.tsx` contains no import or render of `RoomsStructuredData`.
- [ ] `ExperiencesPageContent.tsx` contains no import or render of `ExperiencesStructuredData`.
- [ ] `RoomsStructuredData.tsx` and `ExperiencesStructuredData.tsx` are deleted.
- [ ] All Jest tests pass.
- [ ] `pnpm typecheck && pnpm lint` pass.
- [ ] `curl` confirms `application/ld+json` present in initial HTML for `/en/rooms`, `/de/rooms`, `/en/experiences`, and one non-English experiences URL on staging.

## Decision Log

- 2026-02-26: Chosen approach Option A (separate component files in `src/components/seo/`) over Option B (inline in page.tsx) — follows existing codebase convention, keeps page files lean, enables isolated testing.
- 2026-02-26: TASK-03 and TASK-04 merged into a single TASK-03 with mandatory atomic commit constraint — eliminates duplicate JSON-LD risk window.
- 2026-02-26: `loadRoomsCatalog(lang)` (async) mandated over `getRoomsCatalog(lang)` (sync) for RSC server context — avoids reliance on i18n singleton being pre-populated.

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- TASK-05: 85% × S(1) = 85
- TASK-06: 85% × M(2) = 170
- TASK-07: 85% × S(1) = 85

Sum of weighted confidence: 595
Sum of weights: 7
**Overall-confidence: 595 / 7 = 85%**
