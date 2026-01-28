---
Type: Plan
Status: Active
Domain: UI
Created: 2026-01-28
Last-updated: 2026-01-28 (TASK-01 complete)
Feature-Slug: guides-hydration-fix
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Guides Hydration Error Fix Plan

## Summary

Fix React hydration errors in the guides system by eliminating server/client divergence that causes structural mismatches during hydration. The primary verified issue is `PreviewBanner` conditionally rendering on the client but not in SSR due to `window.location.search` usage, creating `<div>` vs `<script>` structural mismatches. Secondary issues include render-time DOM mutation in `HeadSection` and `localStorage`-based status divergence in dev mode. This plan establishes hydration testing infrastructure and fixes all identified divergence sources.

## Goals

- Eliminate all hydration mismatches in guide pages (dev/preview and published)
- Establish hydration regression testing to prevent future issues
- Maintain SEO structured data functionality
- Keep dev-mode features (GuideEditorialPanel, DevStatusPill, PreviewBanner) working correctly

## Non-goals

- Redesigning the guides architecture
- Changing guide content authoring workflow
- General performance optimization unrelated to hydration
- Removing all `suppressHydrationWarning` (only remove where structural mismatches are fixed)

## Constraints & Assumptions

- **Constraints:**
  - Must maintain Next.js 15 App Router patterns (server components by default)
  - Cannot break existing guide routes or SEO structured data
  - Dev-mode components (GuideEditorialPanel, DevStatusPill) must remain client-only
  - Must follow `docs/testing-policy.md` (targeted tests only, no broad suites)
- **Assumptions:**
  - Primary hydration error is from dev/preview work (user-confirmed)
  - Published guides may have latent hydration issues from i18n timing or conditional structured data
  - Tests will catch hydration regressions once infrastructure is in place
  - **Status source nuance (important for task accuracy):**
    - `PreviewBanner` uses `getEffectiveGuideStatus()` → `GUIDE_STATUS_BY_KEY` (from `src/data/guides.index.ts`) plus optional client-only `localStorage` overrides (`src/utils/guideStatus.ts`).
    - Editorial/manifest logic uses `guide-manifest.ts` status (via `useGuideManifestState`).
      Tasks that mention “draft/published” must specify which status source they mean.

## Fact-Find Reference

- Related brief: `docs/plans/guides-hydration-fix-fact-find.md`
- Key findings:
  - **Primary cause (verified):** `search` derived from `window.location.search` causes `PreviewBanner` to appear on client but not SSR, creating `<div>` vs `<script>` mismatch
  - **Contributing factor:** `localStorage`-based guide status overrides in dev mode (client-only)
  - **Contributing factor:** `HeadSection` mutates `document.head` during render (violates React expectations)
  - **Testing gap:** No hydration-specific tests exist; coverage tests don't verify SSR → client hydration cycle
  - **Pattern precedent:** `ArticleStructuredData` already uses `useOptionalRouterPathname()` for hydration-safe pathname access

## Existing System Notes

- **Key modules/files:**
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx:114` — Uses `typeof window` for search params (root cause)
  - `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx` — Conditionally renders div
  - `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx:60-169` — DOM mutation during render
  - `apps/brikette/src/utils/guideStatus.ts:40-46` — `localStorage` reads (client-only)
  - `apps/brikette/src/components/seo/locationUtils.ts` — Contains `useOptionalRouterPathname()` helper
  - `apps/brikette/src/components/seo/ArticleStructuredData.tsx:38` — Reference implementation using `useOptionalRouterPathname()`
- **Patterns to follow:**
  - Use `useOptionalRouterPathname()` from `locationUtils.ts` for pathname (existing pattern in `ArticleStructuredData`)
  - Use `next/dynamic` with `{ ssr: false }` for client-only components (already used for `GuideEditorialPanel`)
  - Use `useEffect` for client-only side effects (standard React pattern)
  - Write test stubs for L-effort tasks (per plan-feature requirements)

## Proposed Approach

**Primary fix (highest leverage):** Make `search` param hydration-safe by using Next.js hooks instead of `window.location`.

**Option A (Preferred): SSR-consistent search params**

- Add `useSearchParams()` hook to `_GuideSeoTemplate` to get search params from Next.js router
- This removes the explicit `typeof window` branch and should make `search` consistent _when Next router context is available during the server render_
- PreviewBanner sees a router-derived `search` value rather than a client-only `window.location.search`
- **Trade-off:** `_GuideSeoTemplate.tsx` does not currently include an explicit `"use client"` directive; it is treated as client code today because it’s imported from client entrypoints. If any server import path appears later, Next will error. Consider adding `"use client"` defensively when touching this file.
- **Benefit:** Most robust fix; preview banner appears immediately; no layout shift

**Option C (Recommended safety net): Stabilize PreviewBanner markup**

- Ensure `PreviewBanner` (or its immediate wrapper) renders a stable element on both server and first client render, so eligibility differences can’t cause `<div>`↔`<script>` mismatches.
- This protects against client-only inputs beyond `search` (notably `localStorage`-backed status overrides).
- **Trade-off:** May require `suppressHydrationWarning` or a “mounted” gate for the banner’s _contents_, but avoids structural hydration failures.

**Option B (Acceptable): Defer banner until after mount**

- Make `PreviewBanner` check `mounted` state (via `useEffect`) before checking eligibility
- SSR and first client render both return `null`, eliminating mismatch
- **Trade-off:** Banner appears slightly later (after hydration)
- **Benefit:** Simpler change; doesn't require router context

**Chosen: Option A + Option C** — Use `useSearchParams()` to remove explicit window-branching, and also make PreviewBanner structurally hydration-safe so we’re protected even when other client-only inputs (like localStorage overrides) differ.

**Secondary fixes:**

1. Move `HeadSection` DOM mutations to `useEffect` (eliminate render-time side effects)
2. Defer `localStorage` reads in `guideStatus.ts` to after mount (eliminate dev-mode divergence)
3. Create hydration test infrastructure (SSR render → hydrate with `onRecoverableError`)
4. Add regression tests for published + preview guides

**Rollout strategy:**

- Phase 1: Create hydration test infrastructure (foundation)
- Phase 2: Fix primary issue (search params) with regression test
- Phase 3: Fix secondary issues (HeadSection, guideStatus)
- Phase 4: Validate with production-equivalent tests (published guides)

## Task Summary

| Task ID | Type        | Description                                                        | Confidence | Effort | Status  | Depends on      |
| ------- | ----------- | ------------------------------------------------------------------ | ---------: | -----: | ------- | --------------- |
| TASK-01 | IMPLEMENT   | Create hydration test utilities                                    |        88% |      M | Complete (2026-01-28) | -               |
| TASK-02 | IMPLEMENT   | Add hydration regression test for preview guide                    |        85% |      M | Pending | TASK-01         |
| TASK-03 | IMPLEMENT   | Fix PreviewBanner hydration mismatch (search + stable markup)      |        90% |      S | Pending | TASK-02         |
| TASK-04 | IMPLEMENT   | Move HeadSection DOM mutations to useEffect                        |        85% |      M | Pending | TASK-01         |
| TASK-05 | IMPLEMENT   | Remove localStorage-driven initial-render divergence (dev/preview) |        88% |      S | Pending | TASK-01         |
| TASK-06 | IMPLEMENT   | Add hydration regression test for published guide                  |        90% |      S | Pending | TASK-01,TASK-03 |
| TASK-07 | INVESTIGATE | Verify i18n doesn't cause structural script divergence             |     70% ⚠️ |      S | Pending | TASK-06         |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Create hydration test utilities

- **Type:** IMPLEMENT
- **Status:** Complete (2026-01-28)
- **Affects:**
  - `apps/brikette/src/test/helpers/hydrationTestUtils.ts` (new)
  - Optional: add `apps/brikette/src/test/helpers/index.ts` to re-export helpers (directory currently only contains `loadGuidesForTest.ts`)
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 90% — Standard React testing pattern (renderToString → hydrateRoot with onRecoverableError). Similar utilities exist in React testing docs.
  - Approach: 90% — Correct pattern for detecting hydration mismatches. Captures errors that suppressHydrationWarning masks.
  - Impact: 85% — Self-contained test helper. No runtime impact. Minor risk: tests may be flaky if environment setup is wrong.
- **Acceptance:**
  - [x] `hydrationTestUtils.ts` exports `renderWithHydration({ server, client }, options)` (or equivalent) so tests can intentionally simulate SSR vs client divergence
  - [x] Function performs SSR render using `renderToString` (client components; not RSC)
  - [x] SSR phase runs in a **server-like global environment** (important): temporarily clear `globalThis.window` and `globalThis.document` so `typeof window` branches behave like real SSR (Jest default is JSDOM)
  - [x] Function hydrates server HTML on client with `hydrateRoot` and uses `act()` to flush hydration work
  - [x] Function captures hydration errors via `onRecoverableError` callback
  - [x] Returns object with `{ serverHTML, hydrationErrors, container }`
  - [x] Helper function `expectNoHydrationErrors(result)` asserts errors array is empty
- **Test plan:**
  - Add: `apps/brikette/src/test/helpers/__tests__/hydrationTestUtils.test.ts` — unit test the helper itself
  - Run: `pnpm --filter @apps/brikette test -- hydrationTestUtils.test.ts`
  - Test cases: (1) component with no mismatch → no errors, (2) component with deliberate mismatch → errors captured
- **Planning validation:**
  - Tests run: Existing guide tests pass (`guide-diagnostics.test.ts` — 16 passed)
  - Test stubs written: N/A (M-effort, stubs not required)
  - Unexpected findings: None. Tests use real data and pass consistently.
- **What would make this ≥90%:**
  - Add example hydration test in the utilities file itself (self-documenting pattern)
  - Validate in Next.js 15 App Router context (not just standalone React)
- **Rollout / rollback:**
  - Rollout: Test utility only; no production impact. Add to repo immediately.
  - Rollback: Delete file if tests are unreliable; no dependencies on it yet.
- **Documentation impact:**
  - Update `docs/testing-policy.md` — add section "Hydration Testing" with usage example
- **Notes / references:**
  - React docs: https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content
  - Next.js hydration: https://nextjs.org/docs/messages/react-hydration-error

#### Build Completion (2026-01-28)

- **Status:** Complete
- **Commits:** 882425d07d
- **TDD cycle:**
  - Tests written: `apps/brikette/src/test/helpers/__tests__/hydrationTestUtils.test.tsx`
  - Initial test run: FAIL (expected — module not found)
  - Post-implementation: PASS (7 tests passed)
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette test -- hydrationTestUtils.test.tsx --maxWorkers=1` — PASS (7 tests)
  - Ran: `pnpm --filter @apps/brikette test -- guide-diagnostics.test.ts --maxWorkers=1` — PASS (16 tests, baseline confirmed)
- **Documentation updated:** `docs/testing-policy.md` — added "Hydration Testing" section with usage patterns and examples
- **Implementation notes:**
  - Utility successfully captures hydration errors via both `onRecoverableError` and thrown exceptions (React 19 behavior)
  - SSR simulation clears `window`/`document` globals during server render phase
  - All test cases pass, including mismatch detection and consistent rendering scenarios

### TASK-02: Add hydration regression test for preview guide

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/test/routes/guides/__tests__/hydration/preview-guide-hydration.test.tsx` (new)
- **Depends on:** TASK-01
- **Confidence:** 85%
  - Implementation: 85% — Using utilities from TASK-01. In Jest, `@/config/env` is globally mocked, so tests must explicitly mock `PREVIEW_TOKEN` (it is not exported by default in `src/test/__mocks__/config-env.ts`).
  - Approach: 90% — Correct test pattern. Validates the exact scenario that causes the reported error (preview mode with search params).
  - Impact: 80% — Test-only change. Risk: test may not accurately simulate App Router SSR context; may need adjustments.
- **Acceptance:**
  - [ ] Test targets the core mismatch directly by hydrating `HeadSection`/`PreviewBanner` (component-level), rather than relying on full Next route SSR
  - [ ] Server render uses `search=""` (banner ineligible)
  - [ ] Client hydration uses `search="?preview=token"` with `PREVIEW_TOKEN="token"` (banner eligible)
  - [ ] Use a guideKey that is **draft** in `GUIDE_STATUS_BY_KEY` (e.g., `rules`) so eligibility is deterministic without `localStorage`
  - [ ] Test uses `renderWithHydration` from TASK-01
  - [ ] Test expects **zero** hydration errors after TASK-03 (no structural mismatch)
  - [ ] Test asserts banner content is present after hydration (sanity check)
- **Test plan:**
  - Add: `preview-guide-hydration.test.tsx` as described
  - Run: `pnpm --filter @apps/brikette test -- preview-guide-hydration.test.tsx`
  - Helper validation: rely on TASK-01’s unit test mismatch case to prove the harness catches errors (avoid committing a deliberately failing/skip test here)
  - Mocking note (Jest): use `jest.doMock("@/config/env", () => ({ ...jest.requireActual("@/config/env"), PREVIEW_TOKEN: "token" }))` (or equivalent) so `shouldShowPreviewBanner()` can be eligible in tests.
- **Planning validation:**
  - Tests run: `guide-diagnostics.test.ts` passes, confirming test infrastructure is stable
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Add explicit check that PreviewBanner HTML is present in both server and client output after fix
  - Test multiple guides (not just one) to ensure fix is general
- **Rollout / rollback:**
  - Rollout: Test only; commit once TASK-03 is in place so the suite stays green.
  - Rollback: Remove test if it proves flaky or unreliable.
- **Documentation impact:** None (test file is self-documenting)
- **Notes / references:**
  - Fact-find RCA: `PreviewBanner` conditional rendering is verified root cause
  - Related code: `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx`

### TASK-03: Fix PreviewBanner hydration mismatch (search + stable markup)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx:114` (stop deriving `search` from `window.location.search`)
  - `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx` (ensure stable markup; prevent `<div>`↔`<script>` mismatches)
- **Depends on:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — Replace the explicit window branch with router-derived search (try `useSearchParams()`), and make `PreviewBanner` structurally hydration-safe so mismatches can’t occur even if eligibility differs.
  - Approach: 90% — This directly targets the verified failure mode (structural `<div>`↔`<script>` mismatch) and hardens against other client-only inputs (e.g., localStorage status overrides).
  - Impact: 85% — Affects all guide pages. Risk: `useSearchParams()` requires Next navigation context; mitigate by guarding with try/catch and/or keeping `PreviewBanner` structurally stable regardless.
- **Acceptance:**
  - [ ] `_GuideSeoTemplate.tsx` no longer derives `search` from `window.location.search` during render
  - [ ] `search` is derived from `useSearchParams()` when available (and gracefully falls back to `""` when not)
  - [ ] `PreviewBanner` renders a stable element during SSR and first client render (no element-type/order changes)
  - [ ] `PreviewBanner` eligibility can change without causing structural hydration errors (e.g., `search` empty on server vs present on client)
  - [ ] TASK-02 test passes (no hydration errors)
  - [ ] Existing guide tests still pass (no regressions)
  - [ ] Preview banner appears correctly in dev/preview mode
- **Test plan:**
  - Update: TASK-02 test should pass after this change
  - Run: `pnpm --filter @apps/brikette test -- guide-diagnostics.test.ts` (no regressions)
  - Run: `pnpm --filter @apps/brikette test -- preview-guide-hydration.test.tsx` (now passes)
  - Manual: Test in browser with `?preview=token` to confirm banner appears without hydration errors
- **Planning validation:**
  - Tests run: `guide-diagnostics.test.ts` — 16 passed (confirms no breaking changes expected)
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 90%. Could add coverage for multiple URL patterns (with/without query params, with hash, etc.)
- **Rollout / rollback:**
  - Rollout: Deploy to dev environment first; verify preview mode works. Then deploy to production.
  - Rollback: Revert commit. Previous behavior is safe (produces hydration errors but doesn't break functionality).
- **Documentation impact:** None (internal implementation detail)
- **Notes / references:**
  - Next.js useSearchParams: https://nextjs.org/docs/app/api-reference/functions/use-search-params
  - Pattern reference: `apps/brikette/src/components/seo/ArticleStructuredData.tsx:38` (uses `useOptionalRouterPathname()`)

### TASK-04: Move HeadSection DOM mutations to useEffect

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx:60-169` (refactor DOM writes)
- **Depends on:** TASK-01
- **Confidence:** 85%
  - Implementation: 85% — Move `document.head` mutations from render body into `useEffect` hook. Standard React pattern. Risk: timing changes may affect tests that query DOM immediately after render.
  - Approach: 90% — Correct React pattern. Render-time side effects violate React expectations and make hydration unpredictable.
  - Impact: 80% — Affects all guides. Risk: tests may break if they rely on synchronous DOM updates. Mitigation: update tests to use `waitFor` or similar async patterns.
- **Acceptance:**
  - [ ] All `document.head` mutations moved into `useEffect` hook
  - [ ] `useEffect` only runs on client (guard with `typeof document !== 'undefined'` if needed)
  - [ ] Tests updated to wait for DOM updates if needed (`waitFor` from testing-library)
  - [ ] Existing guide tests still pass
  - [ ] Meta tags still appear correctly in browser (manual verification)
- **Test plan:**
  - Update: Guide coverage tests may need `waitFor` for DOM assertions
  - Run: `pnpm --filter @apps/brikette test -- coverage/sorrento-gateway-guide.coverage.test.tsx`
  - Run: `pnpm --filter @apps/brikette test -- guide-diagnostics.test.ts`
  - Manual: Verify meta tags in browser DevTools
- **Planning validation:**
  - Tests run: `guide-diagnostics.test.ts` passes (16 tests)
  - Test stubs written: N/A (M-effort)
  - Unexpected findings: None. Current tests don't appear to depend on synchronous DOM updates based on code review.
- **What would make this ≥90%:**
  - Run coverage tests to verify they don't depend on synchronous DOM updates
  - Add comment in HeadSection explaining why useEffect is required (SSR/hydration safety)
- **Rollout / rollback:**
  - Rollout: Deploy with TASK-03 as a batch. Both fix hydration issues.
  - Rollback: Revert commit. Previous behavior works but violates React patterns.
- **Documentation impact:** None (internal implementation detail)
- **Notes / references:**
  - React docs on useEffect: https://react.dev/reference/react/useEffect#connecting-to-an-external-system
  - Fact-find: Lines 60-169 perform direct document.head writes during render

### TASK-05: Remove localStorage-driven initial-render divergence (dev/preview)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/routes/guides/guide-seo/components/DevStatusPill.tsx` (stop consulting `localStorage` during initial render)
  - `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx` (avoid `localStorage`-driven eligibility differences during initial render)
  - Optional: `apps/brikette/src/utils/guideStatus.ts` (add an API to read “default status” without `localStorage`, or a flag to ignore overrides)
- **Depends on:** TASK-01
- **Confidence:** 88%
  - Implementation: 80% — `getEffectiveGuideStatus()` reads `localStorage` only on the client, which can differ from SSR output. The safest fix is to ensure any `localStorage`-based override is applied **after mount** (via `useEffect`) and/or make the affected components structurally hydration-safe (Option C).
  - Approach: 90% — Correct pattern for client-only state. Reduces dev-only hydration churn and keeps the initial HTML deterministic.
  - Impact: 85% — Dev-mode only. No production impact. Risk: brief delay/flash before localStorage-driven overrides apply.
- **Acceptance:**
  - [ ] `DevStatusPill` initial state does **not** depend on `localStorage` (SSR and first client render match)
  - [ ] After mount, `DevStatusPill` may apply localStorage overrides (if any)
  - [ ] `PreviewBanner` initial render does **not** depend on `localStorage` (or is structurally hydration-safe if it does)
  - [ ] No hydration errors attributable to localStorage-driven status divergence
- **Test plan:**
  - Add: Unit test(s) verifying hydration safety with localStorage overrides present
  - Run: targeted tests for the new unit test files
  - Manual: In dev mode, toggle status (localStorage override) and confirm banner/pill update post-mount without hydration errors
- **Planning validation:**
  - Tests run: `guide-diagnostics.test.ts` passes
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Add hydration test specifically for DevStatusPill with localStorage override set
- **Rollout / rollback:**
  - Rollout: Dev-mode only; low risk. Deploy with other hydration fixes.
  - Rollback: Revert if status pill behavior is confusing to developers.
- **Documentation impact:** None (dev-mode internal behavior)
- **Notes / references:**
  - Pattern: Similar to "mounted" pattern in `PreviewBanner` Option B (deferred approach)
  - Code: `apps/brikette/src/utils/guideStatus.ts` (`localStorage` overrides are the source of divergence)

### TASK-06: Add hydration regression test for published guide

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/test/routes/guides/__tests__/hydration/published-guide-hydration.test.tsx` (new)
- **Depends on:** TASK-01, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — Using utilities from TASK-01. Test published guide (status=published, no preview params). Should have zero hydration errors after TASK-03 fix.
  - Approach: 95% — Validates production-equivalent scenario. Ensures fixes don't only work for preview mode.
  - Impact: 85% — Test-only. Risk: may not catch all production edge cases (e.g., different locales, different guide types).
- **Acceptance:**
  - [ ] Test renders a published guide (status=published, no search params)
  - [ ] Test uses `renderWithHydration` from TASK-01
  - [ ] Test expects zero hydration errors
  - [ ] Test covers multiple locales (en + one other, e.g., de or es)
  - [ ] Test passes consistently in CI
- **Test plan:**
  - Add: `published-guide-hydration.test.tsx` as described
  - Run: `pnpm --filter @apps/brikette test -- published-guide-hydration.test.tsx`
  - Should pass after TASK-03 is complete
- **Planning validation:**
  - Tests run: `guide-diagnostics.test.ts` passes
  - Test stubs written: N/A (S-effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Already at 90%. Could test more guides or edge cases (guides with/without FAQs, guides with HowTo structured data).
- **Rollout / rollback:**
  - Rollout: Test only; commit after TASK-03 is complete
  - Rollback: Remove test if flaky
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find: "Still required (prod assurance)" — validate published routes don't have hydration issues

### TASK-07: Verify i18n doesn't cause structural script divergence

- **Type:** INVESTIGATE
- **Affects:**
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` (HowTo structured data conditional rendering)
  - `apps/brikette/src/routes/guides/guide-seo/template/useHowToJson.ts` (HowTo generation)
  - `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx:182-184` (conditional HowTo script)
- **Depends on:** TASK-06
- **Confidence:** 70% ⚠️ BELOW THRESHOLD
  - Implementation: 75% — Known area to investigate (HowTo script conditional on i18n content). Unknown: exact timing of i18n content resolution during SSR vs client.
  - Approach: 70% — Investigation task; approach is "read code + add test to verify". Outcome unknown until investigation complete.
  - Impact: 65% — If i18n causes divergence, it affects guides with HowTo structured data. Unknown blast radius until investigated.
- **Blockers / questions to answer:**
  - Does `howToJson` value differ between SSR and first client render due to i18n content timing?
  - Do guides with `includeHowToStructuredData={true}` have hydration errors from conditionally rendered `<script>` tags?
  - Does `useGuideContent` hook always return same structured arrays on SSR and client?
  - Are there guides where HowTo script appears on client but not SSR (or vice versa)?
- **Testability constraints (important):**
  - Jest runs with JSDOM globals by default; SSR simulation must explicitly clear `window`/`document` during the SSR phase (TASK-01).
  - In Jest, `@/i18n` and `@/utils/loadI18nNs` are globally module-mapped to mocks (see `apps/brikette/jest.config.cjs`). This means we **cannot** directly verify real i18n namespace timing in Jest by importing those modules “for real”.
  - Verification in Jest should therefore focus on **structural stability** under simulated i18n readiness divergence (e.g., `useGuideContent` returning empty sections on SSR and non-empty on client).
  - A “real runtime” check (dev/preview + production build) remains necessary to confirm actual namespace timing behavior.
- **Pre-test / evidence gathered (to date):**
  - `apps/brikette/src/test/routes/guides/__tests__/howto-manifest-default.test.ts` is green and confirms multiple manifests declare `HowTo` (e.g., `pathOfTheGods`, `capriDayTrip`, `laundryPositano`).
  - `apps/brikette/src/locales/en/guides/content/pathOfTheGods.json` has non-empty structured content (`sections: 5`), so if `includeHowToStructuredData` is true and content is available at render time, `howToJson` should be non-null.
  - Manifest contains ~30 `HowTo` keys (mix of experience + transport directions), so there is enough surface area to pick 1–2 representative guides for hydration verification.
  - Candidate “published + HowTo” guide key for tests: `pathOfTheGods` (published by default in `GUIDE_STATUS_BY_KEY`, and declares `HowTo` in the manifest).
  - Jest config excludes the existing `loadI18nNs.client-and-preload.test.ts` (vitest-only), so TASK-07 should not rely on that test in this package’s Jest suite.

- **Acceptance:**
  - [ ] Code review of `useHowToJson` and `useGuideContent` to trace i18n content resolution
  - [ ] Add hydration test for guide with HowTo structured data (if not already covered), using simulated i18n readiness divergence:
    - SSR: `sections=[]` → `howToJson=null` → no HowTo script
    - Client: `sections=[...]` → `howToJson!=null` → HowTo script present
    - Confirm whether this produces a hydration error today; if it can, decide whether to (a) stabilize script presence or (b) guarantee consistent section readiness at first render
  - [ ] Confirm whether HowTo script rendering is stable across SSR → client hydration
  - [ ] If divergence found: create new IMPLEMENT task to fix it
  - [ ] If no divergence: document findings and mark complete
  - [ ] Update plan with confidence adjustment based on findings
- **Notes / references:**
  - Fact-find: "Plausible but needs verification" — i18n content readiness could change script presence
  - Code: `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx:182-184`
  - Code: `apps/brikette/src/routes/guides/guide-seo/template/useHowToJson.ts`
  - Likely remediation options (only if divergence is real):
    - Prefer: ensure `guides` resources needed for initial render are available on the client **before** hydration (so SSR and first client render both compute the same `sections` and `howToJson`)
    - Risky: defer HowTo `<script>` insertion until after mount (reduces SSR structured data; SEO risk)
    - Risky: always render a placeholder `<script>` (can be structurally safe but may introduce empty/invalid JSON-LD; SEO risk)

## Risks & Mitigations

- **Risk:** `useSearchParams()` may not be available in all contexts
  - **Mitigation:** Wrap in try/catch with fallback to empty string (same as current behavior)
- **Risk:** Moving DOM mutations to useEffect breaks tests
  - **Mitigation:** Update tests to use `waitFor` for async DOM updates
- **Risk:** Hydration tests are flaky or don't accurately simulate Next.js SSR
  - **Mitigation:** Start with simple cases (TASK-02, TASK-06) and iterate. Use `renderToString` or Next.js testing utilities.
- **Risk:** Fixes break SEO structured data rendering
  - **Mitigation:** Validate structured data is present after fixes (manual + test assertions)
- **Risk:** i18n timing causes additional hydration issues (TASK-07)
  - **Mitigation:** Investigation task will identify any issues; create follow-up IMPLEMENT task if needed

## Observability

- **Logging:**
  - Log hydration errors in production (if not already captured by error monitoring)
  - Add dev-mode console warning when `suppressHydrationWarning` is used (track removal progress)
- **Metrics:**
  - Track hydration error rate in production (if error monitoring supports it)
  - Track guide page load time (hydration errors cause full client re-render = slower)
- **Alerts/Dashboards:**
  - Alert if hydration error rate spikes after deployment
  - Dashboard showing guide page performance (Time to Interactive, Largest Contentful Paint)

## Acceptance Criteria (overall)

- [ ] No hydration errors in dev/preview mode (with `?preview=token`)
- [ ] No hydration errors in published guide mode (production-equivalent)
- [ ] PreviewBanner appears correctly when eligible (no delayed flash)
- [ ] DevStatusPill works correctly in dev mode (may have brief flash during mount)
- [ ] All existing guide tests pass (no regressions)
- [ ] Hydration regression tests pass in CI
- [ ] SEO structured data (JSON-LD) renders correctly
- [ ] GuideEditorialPanel still works in dev mode

## Decision Log

- 2026-01-28: Chose Option A (`useSearchParams`) plus Option C (stabilize PreviewBanner markup). Rationale: remove explicit window-branching, and also guarantee structural hydration safety even when other client-only inputs (e.g., localStorage status overrides) differ.
- 2026-01-28: Created TASK-07 (INVESTIGATE) for i18n divergence instead of IMPLEMENT task. Rationale: Insufficient evidence to confirm issue exists; investigation required before committing to fix approach.
