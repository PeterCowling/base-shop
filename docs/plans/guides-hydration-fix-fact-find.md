---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: UI
Created: 2026-01-28
Last-updated: 2026-01-29
Feature-Slug: guides-hydration-fix
Related-Plan: docs/plans/guides-hydration-fix-plan.md
---

# Guides Hydration Error Fix Fact-Find Brief

## Scope

### Summary
React hydration errors in the guides system are caused by **server/client divergence** that produces structural mismatches during hydration. The most concrete mismatch is **`<script>` vs `<div>` inside the guides “head/structured data” subtree**:
- **Verified (dev/preview origin):** `PreviewBanner` eligibility can differ between SSR and the first client render due to client-only inputs (search params and optionally `localStorage` status overrides), shifting JSON-LD scripts in `HeadSection`.
- **Verified (published pages too):** `FaqStructuredDataBlock` can render a hidden placeholder element on the client while SSR renders an FAQ JSON-LD `<script>`, when `hasLocalizedContent` differs between SSR and the first client render (commonly due to i18n readiness differences).

This fact-find documents verified causes, contributing factors, testing gaps, and safe improvement opportunities.

### Goals
- Eliminate hydration mismatches in guides pages
- Establish hydration testing to prevent regressions
- Verify guide composition testing adequately covers SSR → client hydration cycle
- Ensure dev-mode GuideEditorialPanel doesn't cause hydration issues

### Non-goals
- Redesigning the guides architecture
- Changing the guide content authoring flow
- Performance optimization **unrelated** to hydration/SSR determinism

### Constraints & Assumptions
- **Constraints:**
  - Must maintain Next.js 15 App Router patterns
  - Cannot break existing guide routes or content
  - Dev-mode features (GuideEditorialPanel, DevStatusPill) must remain client-only
  - Structured data (JSON-LD) must remain functional for SEO
- **Assumptions:**
  - Hydration errors are causing the reported runtime errors
  - Hydration regression tests now exist, but they do not simulate full Next.js route SSR (component-level `renderToString` → `hydrateRoot`)
  - At least one systemic pattern exists (client-only inputs inside SSR-rendered client components), and it may affect multiple components beyond the verified PreviewBanner case

## Repo Audit (Current State)

### Entry Points
- `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx` — Main guide route (App Router)
- `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` — Core guide template component
- `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx` — Template body renderer

### Key Modules / Files

**Hydration-sensitive components:**
- `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx:~120` — Derives `search` via `useOptionalSearchParams()` (router-safe; avoids `window.location.search` branching)
- `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx:~40-160` — DOM writes (now in `useEffect`) used as a fallback for tests
- `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx:~1-30` — Always renders a container `<div>` before JSON-LD scripts (visibility/contents conditional)
- `apps/brikette/src/routes/guides/guide-seo/components/FaqStructuredDataBlock.tsx:37-50` — Eligibility/placeholder rendering can structurally diverge between SSR and client
- `apps/brikette/src/routes/guides/guide-seo/utils/preview.ts:21-24` — Preview banner eligibility depends on `search` + `PREVIEW_TOKEN` + guide status
- `apps/brikette/src/utils/guideStatus.ts:40-46` — Status can diverge server/client via `localStorage` overrides (dev-only, but affects rendering)
- `apps/brikette/src/routes/guides/guide-seo/components/DevStatusPill.tsx:44` — Conditional rendering based on IS_DEV
- `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx:208` — Layout classes vary based on shouldShowEditorialPanel

**Structured data components (use suppressHydrationWarning):**
- `apps/brikette/src/components/seo/FaqJsonLdScript.tsx:16`
- `apps/brikette/src/components/seo/ArticleStructuredData.tsx:58-63`
- `apps/brikette/src/components/seo/GuideFaqJsonLd.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx:183`

**Dev-mode components:**
- `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx` — Dynamically imported with `ssr: false` (line 22-24 in GuideSeoTemplateBody.tsx)
- `apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx`

**Testing infrastructure:**
- `apps/brikette/src/test/helpers/loadGuidesForTest.ts` — Loads real guide JSON from filesystem
- `apps/brikette/src/test/routes/guides/__tests__/coverage/*.coverage.test.tsx` — Per-guide coverage tests
- `apps/brikette/src/test/routes/guides/__tests__/guide-diagnostics.test.ts` — Guide content analysis tests
- `apps/brikette/src/test/routes/guides/__tests__/guide-manifest-completeness.test.ts` — Manifest validation

### Patterns & Conventions Observed
- **Dynamic imports for client-only components:** GuideEditorialPanel uses `next/dynamic` with `{ ssr: false }` to avoid SSR (correct pattern)
- **suppressHydrationWarning on JSON-LD scripts:** All structured data script tags use this prop (hides but doesn't fix hydration issues)
- **Direct DOM manipulation in HeadSection:** Mutates document.head (now in `useEffect`) instead of relying on framework metadata APIs
- **typeof window checks:** Used for browser-only logic but creates server/client divergence
- **Coverage tests per guide:** Each published guide has a `.coverage.test.tsx` file
- **Real data in tests:** `loadGuidesForTest()` loads actual JSON files, not mocks (good for authenticity)

### Verified Root Cause Analysis (RCA)

#### Symptom (What React is complaining about)
The hydration mismatch being reported is a **structural mismatch** (different element types / sibling ordering) early in the guide template. The concrete mismatch is:
- client expects a `<div>` from `PreviewBanner`
- server HTML has a `<script type="application/ld+json">` as the first node in `HeadSection`

This aligns with the current component ordering: `HeadSection` renders `PreviewBanner` *before* `ArticleStructuredData` / `BreadcrumbStructuredData` scripts.

Minimal repro diff (from a hydration harness):
```diff
<HeadSection ...>
  <PreviewBanner ...>
+   <div className="sticky ...">...</div>
-   <script type="application/ld+json">...</script>
```

#### Primary Cause (Verified)
**Client-only derivation of `search` changes whether `PreviewBanner` renders during the first client render.**

Concrete chain:
1. `_GuideSeoTemplate` previously set `search` via `window.location.search` when `window` exists, otherwise `""`. Current code derives `search` via `useOptionalSearchParams()` and still treats preview/banner eligibility as potentially different between SSR and hydration (so markup must be structurally stable regardless).
2. `GuideSeoTemplateBody` passes `search` into `HeadSection`.
3. `HeadSection` renders `<PreviewBanner … />` as the first child.
4. `PreviewBanner` conditionally returns a `<div>` when `shouldShowPreviewBanner(guideKey, search)` is true.
5. When the banner appears on the client but not in SSR, it **shifts the subsequent script tags**, producing a structural mismatch during hydration (`<div>` vs `<script>`).

#### Secondary Cause (Verified; affects published pages)
Published guide pages can hit the same class of failure when **structured data blocks render different element types** between SSR and the first client render due to **i18n readiness / content detection divergence**.

Observed on `http://localhost:3012/en/experiences/positano-beaches`:
- `FaqStructuredDataBlock` rendered a hidden placeholder on the client while SSR rendered the FAQ JSON-LD script.

Observed diff (from the Next hydration overlay):
```diff
<div suppressHydrationWarning style={{ display: "none" }} />
-<script type="application/ld+json">...</script>
```

Mitigation direction:
- When suppressing FAQ JSON-LD, prefer a **JSON-LD `<script>` placeholder** (valid but empty) over a `<div>` placeholder so element types remain stable even if eligibility differs.

#### Contributing Factors (Verified)
- Preview gating depends on `PREVIEW_TOKEN` and URL search params; SSR currently always sees an empty search string.
- Guide status can diverge between server and client in dev because `getEffectiveGuideStatus()` reads `localStorage` overrides on the client only (`guideStatus.ts`).
- `hasLocalizedContent` can diverge between SSR and the first client render (e.g., i18n readiness/resources differ), which can change whether structured data components render `<script>` nodes vs placeholders.

#### Why suppressHydrationWarning isn’t helping
`suppressHydrationWarning` on JSON-LD scripts can reduce noise for attribute/text differences, but it does not fix **structural** mismatches (different element types / sibling ordering) that cause React to discard the SSR tree.

### Opportunities / Improvements (Safe, High-Value)

#### 1) Make `search` hydration-safe (highest leverage, lowest risk)
Ensure `PreviewBanner` eligibility does not create structural SSR/client divergence. Prefer router-derived search params (`useOptionalSearchParams()` / `useSearchParams()`), but still treat eligibility as potentially divergent and keep markup structurally stable.

**Preferred (SSR-consistent):**
- Use `useSearchParams()` / `usePathname()` (App Router) instead of `window.location.*` so SSR and client compute the same `search`.

**Acceptable (banner appears after hydration):**
- Make `PreviewBanner` client-effect driven (`useEffect` sets a `show` state) so SSR and the first client render both omit it.

#### 2) Remove localStorage-driven SSR divergence from initial render (dev-only, but noisy)
`DevStatusPill` and preview banner eligibility can change based on `localStorage` overrides. To avoid “dev-only hydration churn”:
- Read overrides in `useEffect` and update state after hydration, or
- Gate these UI-only signals behind a “mounted” check so SSR == first client render.

#### 3) Stop mutating `document.head` during render
`HeadSection` performs DOM writes inside render to satisfy tests. This violates React’s expectations and makes hydration/debugging harder.
- Move DOM writes into `useEffect`, or
- Prefer test assertions against rendered output (or Next metadata exports) rather than imperative head mutation.

#### 4) Simplify and de-risk “test-driven caches”
`useAdditionalScripts` caches React nodes in a module-level `Map` and eagerly invokes function components. This is brittle and can hide SSR/hydration issues.
- Prefer `useMemo` with explicit deps and make tests resilient to StrictMode re-invocations.
- Avoid cross-request/global caches for SSR paths unless there is a measured performance need and a clear invalidation strategy.

### Data & Contracts
**Props flowing through template:**
- `GuideSeoTemplateProps` (50+ optional fields) → `GuideSeoTemplate` → `GuideSeoTemplateBody`
- `search` param derived from Next router search params (previously `window.location.search`; verified root cause for PreviewBanner mismatch when client and SSR differ)
- `shouldShowEditorialPanel` derived from manifest status + whether pathname includes `/draft/` (generally stable for published routes)
- `IS_DEV` from `@/config/env` (should be consistent, but still worth guarding because it gates dev-only rendering)

**Structured data:**
- JSON-LD scripts for Article, FAQ, Breadcrumb, HowTo
- Rendered via `dangerouslySetInnerHTML` with `suppressHydrationWarning`

### Dependency & Impact Map

**Upstream dependencies:**
- Next.js 15 App Router (usePathname, dynamic imports)
- React 19 (hydration behavior)
- i18next (translation lookups, could have async timing issues)
- `@/config/env` (IS_DEV, IS_SERVER, PREVIEW_TOKEN)

**Downstream dependents:**
- All 50+ guide routes in `/[lang]/experiences/[slug]`
- SEO structured data (critical for search rankings)
- Dev-mode authoring tools (GuideEditorialPanel)
- Guide status indicators (DevStatusPill)

**Blast radius:**
- Every guide page is potentially affected
- Hydration errors cause React to discard server HTML and re-render on client (performance hit)
- SEO impact if structured data fails to render
- Dev experience impact if editorial panel causes errors

### Tests & Quality Gates

**Existing tests:**
- **Unit tests for guide content:** `guide-diagnostics.test.ts` validates content presence using real data (good coverage)
- **Manifest completeness tests:** `guide-manifest-completeness.test.ts` ensures all guides have manifest entries
- **Per-guide coverage tests:** Each guide has a `.coverage.test.tsx` (e.g., `sorrento-gateway-guide.coverage.test.tsx`)
  - Tests render the route with `renderRoute({ route: "/en/guides/..." })`
  - Asserts on structured data attributes, meta tags, content presence
  - Uses mocked `genericContentMock` to verify content composition
  - **GAP:** Does NOT test SSR → client hydration cycle
  - **GAP:** Does NOT verify server HTML matches client render

**Gaps:**
- **Hydration tests exist (new):** A Jest hydration harness (`renderToString` → `hydrateRoot`) and targeted regression tests now exist, but coverage is still incomplete (not full-route SSR in Next).
- **No SSR snapshot tests:** No baseline of expected server HTML to compare against
- **No React Hydration Error detection:** Tests don't catch `suppressHydrationWarning` masking real issues
- **Dev components untested:** GuideEditorialPanel and DevStatusPill have no hydration tests
- **Environment variable consistency untested:** No tests verify IS_DEV is same on server/client

**Testing commands:**
```bash
# Run guide-specific tests
pnpm --filter @apps/brikette test -- guide-diagnostics.test.ts
pnpm --filter @apps/brikette test -- guide-manifest-completeness.test.ts
pnpm --filter @apps/brikette test -- coverage/sorrento-gateway-guide.coverage.test.tsx

# Run all guide tests (use with caution per testing-policy.md)
pnpm --filter @apps/brikette test -- --testPathPattern="guides"
```

### Recent Git History (Targeted)

Recent commits show active work on guides SEO and structured data:

```
fd66f96a12 docs(seo): archive completed SEO plan (100% done)
53c3f365ae docs(seo): mark TASK-SEO-3 complete (100% plan completion)
fad695ab8c feat(seo): enforce deep localization redirects in middleware (TASK-SEO-3)
233f76d85b test(seo): add machine-document contract tests (TASK-SEO-10)
244ec0cf26 docs(seo): mark TASK-SEO-9 complete
```

**Key file changes in current branch (work/agents-ci-motivation):**
- `ArticleStructuredData.tsx` — Modified (likely related to hydration?)
- `EventStructuredData.tsx` — Modified
- `GuideFaqJsonLd.tsx` — Modified
- Multiple guide JSON content files modified
- New test files: `guide-diagnostics.test.ts`, `guide-manifest-completeness.test.ts`

**Implication:** Recent SEO work may have introduced or exposed hydration issues. The structured data components were recently touched.

## External Research

Not required - this is a Next.js/React hydration issue with well-documented patterns. All necessary context is in the repo.

## Questions

### Resolved
- **Q: Where does the hydration error occur?**
  - **A (verified primary):** In the `HeadSection` subtree: `PreviewBanner` renders *before* JSON-LD scripts and can appear on the client but not in SSR.
  - **Evidence:** The component ordering (`HeadSection → PreviewBanner → ArticleStructuredData/BreadcrumbStructuredData`) and the concrete `<div>` vs `<script>` mismatch this ordering creates when `search` differs between SSR and the first client render.

- **Q: What causes server/client HTML differences?**
  - **A (primary, verified):**
    1. `search` eligibility (and thus `PreviewBanner` visibility) can differ between SSR and hydration; previously this was caused by `window.location.search`, and can still occur if search/status differ across environments.
  - **A (contributing, verified):**
    2. Guide status can diverge server/client in dev because `getEffectiveGuideStatus()` reads `localStorage` only on the client (`guideStatus.ts:40-46`).
  - **A (verified, published pages too):**
    3. i18n readiness/content detection divergence can change the presence/order of structured data scripts. This is **observed** with FAQ JSON-LD: SSR emitted `<script type="application/ld+json">` while the first client render emitted a placeholder node in `FaqStructuredDataBlock`, producing a structural mismatch.

- **Q: Do tests catch these hydration issues?**
  - **A:** No. Coverage tests render routes but don't verify SSR → hydration cycle.
  - **Evidence:** Reviewed coverage test files, no hydration assertions found

- **Q: Is GuideEditorialPanel tested?**
  - **A:** No dedicated tests. It's client-only (ssr: false) so it doesn't participate in SSR, but the conditional styling based on `shouldShowEditorialPanel` in the parent could cause layout shift.
  - **Evidence:** Grep for test files, no matches for GuideEditorialPanel tests

### Open (User Input Needed)
**Resolved (user-confirmed):** The reported `<div>`↔`<script>` hydration errors originated from **dev/preview work**.

**Still required (prod assurance):** We still need to ensure **published/production** guide pages are solid and cannot hit analogous structural mismatches.
  - Validate that published routes do not conditionally add/remove top-level nodes during initial render (especially in `HeadSection`).
  - Run a hydration regression test against 1–2 published guides (no preview token, status `published`) and confirm `onRecoverableError` is silent.
  - Specifically verify that i18n readiness cannot change the presence/order of structured data scripts (e.g., `howToJson`) between SSR and first client render.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - **Why:** The primary `<script>`↔`<div>` mismatch has a clear causal chain (search/status divergence → `PreviewBanner` eligibility → sibling ordering in the structured-data subtree).
  - **What's missing:** Confirm whether there are additional, production-facing hydration mismatches unrelated to preview/dev (e.g., i18n readiness changing structured scripts).
  - **To reach ≥90%:** Add a small hydration regression test harness (SSR render → hydrate with `onRecoverableError`) and validate against 1–2 representative guides (published + draft/preview).

- **Approach:** 80%
  - **Why:** There is a clear “minimal safe fix” (make `search` hydration-safe) and a clear “cleanup path” (remove render-time DOM mutation, reduce global caches).
  - **Tradeoffs:**
    - Deferring preview banner until after mount avoids mismatches but makes the banner appear slightly later.
    - Switching to `useSearchParams()` / `usePathname()` is cleaner but requires the template to be rendered inside a Next navigation context (tests may need small adjustments).
  - **To reach ≥90%:** Decide and document which approach is preferred for PreviewBanner (SSR-consistent vs after-mount), then implement with a hydration regression test.

- **Impact:** 80%
  - **Why:** Blast radius is clear (all 50+ guide pages). Risk is low if we have hydration tests as safety net.
  - **Risks:**
    - Breaking SEO structured data (critical for search rankings)
    - Breaking dev-mode authoring tools (blocks guide editing workflow)
    - Changing test behavior if we remove mock setups
  - **What's missing:** Rollout strategy (feature flag, gradual rollout, or big-bang fix). Monitoring plan for hydration errors in production.
  - **To reach ≥90%:** Add hydration error monitoring/alerting. Define rollback criteria. Create hydration test suite that runs in CI.

## Planning Constraints & Notes

**Must-follow patterns:**
- Use Next.js 15 App Router patterns (server components by default, client components when needed)
- Keep dev-mode components client-only (GuideEditorialPanel, DevStatusPill)
- Maintain structured data for SEO (JSON-LD must render correctly)
- Follow `docs/testing-policy.md` for test execution (targeted tests only, never broad suites)

**Rollout/rollback expectations:**
- Fixes should be testable per-guide (start with one guide as pilot)
- Must have hydration tests in place before deploying fix
- Rollback plan: revert commits if hydration errors spike in production

**Observability expectations:**
- Add hydration error detection to existing error monitoring
- Log when suppressHydrationWarning is used (to track removal progress)
- Monitor guide page performance (hydration errors cause full client re-render = slower)

## Suggested Task Seeds (Non-binding)

1. **Fix PreviewBanner hydration mismatch** — Make `search` hydration-safe (prefer `useSearchParams()`/`usePathname()`), or defer preview banner eligibility until after mount
2. **Create hydration test utilities** — SSR render → hydrate with `onRecoverableError` to detect structural mismatches
3. **Add 1–2 hydration regression tests** — Cover a published guide (prod-equivalent) and a draft/preview guide path
4. **Move HeadSection DOM manipulation to useEffect** — Remove render-time `document.head` writes; update tests accordingly
5. **De-risk dev-only SSR divergence** — Avoid `localStorage`-driven initial render differences (DevStatusPill + preview eligibility)
6. **Audit structured data scripts** — Reduce `suppressHydrationWarning` usage only after structural mismatches are eliminated
7. **Simplify caches** — Revisit `useAdditionalScripts` module-level caching + eager invocation
8. **Add CI hydration gate** — Run hydration regression tests in CI to prevent reintroducing mismatch patterns

## Planning Readiness
- **Status:** Ready-for-planning
- **Blocking items:** None
- **Recommended next step:** Proceed to `/plan-feature` with the following priorities:
  1. Fix PreviewBanner/search mismatch (eliminate `<div>`↔`<script>` root mismatch)
  2. Create hydration test infrastructure (SSR → hydrate) as a safety net
  3. Fix remaining high-impact issues (render-time head mutation, dev-only divergence)
  4. Reduce `suppressHydrationWarning` incrementally as structural mismatches are eliminated
