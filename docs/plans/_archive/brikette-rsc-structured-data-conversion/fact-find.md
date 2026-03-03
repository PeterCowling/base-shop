---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: brikette-rsc-structured-data-conversion
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-rsc-structured-data-conversion/plan.md
Trigger-Source: dispatch-routed
Trigger-Why: RSC structured data conversion improves SSR completeness — structured data currently emits only after client hydration, reducing reliability for crawlers that do not execute JavaScript.
Trigger-Intended-Outcome: type: operational | statement: Structured data for /rooms and /experiences pages appears in the initial HTML response without requiring JavaScript hydration, verifiable via curl on the deployed staging build. | source: operator
Dispatch-ID: IDEA-DISPATCH-20260226-0014
---

# RSC Structured Data Conversion — Fact-Find Brief

## Scope

### Summary

`RoomsStructuredData` and `ExperiencesStructuredData` are client components that call `useCurrentLanguage()` (which calls `useParams()` and `usePathname()`) and `useTranslation`. Because they are inside client boundaries, their JSON-LD output is not present in the initial server-rendered HTML — it only appears after JavaScript hydration. This matters for search crawlers that prioritise the raw HTML response.

The TASK-10 investigation (completed 2026-02-25) confirmed both components can be converted to RSC variants. TASK-11 (the implementation) was never executed before the parent plan was archived. This fact-find confirms current state, validates TASK-10 findings, and prepares the plan.

A partial implementation already landed: commit `903ee09342` delivered the `getTranslations` pre-warm fix for both pages and the `serverTitle`/`serverSubtitle` hero props for `/rooms`. The structured data RSC conversion itself has NOT been done — no `RoomsStructuredDataRsc` or `ExperiencesStructuredDataRsc` components exist.

### Goals

- Create `RoomsStructuredDataRsc` — a server-only component accepting `lang: AppLanguage` that emits the rooms OfferCatalog JSON-LD without client hooks.
- Create `ExperiencesStructuredDataRsc` — a server-only component accepting `lang: AppLanguage` that emits the experiences ItemList JSON-LD without client hooks.
- Integrate both into their respective RSC page wrappers (`rooms/page.tsx`, `experiences/page.tsx`).
- Remove the client-side structured data renders from `RoomsPageContent` and `ExperiencesPageContent`.
- Confirm structured data appears in the initial HTML `curl` response.

### Non-goals

- H1 extraction from `RoomsPageContent` into `rooms/page.tsx` RSC wrapper (already partially done via `serverTitle` props; not required here).
- `/how-to-get-here` structured data (TASK-10 Priority 3 — separate, lower-ROI item).
- `ExperiencesHero` RSC conversion (separate investigation needed for `CfImage` server compatibility).
- Filter/topic state changes in `ExperiencesPageContent`.
- New `HowToGetHereStructuredData` component.

### Constraints & Assumptions

- Constraints:
  - `roomsCatalog.ts`'s `getRoomsCatalog()` function imports and uses the client-side `i18n` singleton (`i18n.getDataByLanguage()`). This function cannot be called naively in an RSC without addressing the i18n data source. The `loadRoomsCatalog()` async variant calls `loadI18nNs` first to populate the i18n singleton, then falls through to `getRoomsCatalog()` — this is the correct server-side path.
  - `i18n-server.ts` is marked `server-only` and must not be imported into client components.
  - Structured data scripts use `dangerouslySetInnerHTML` — the RSC variant must not add `suppressHydrationWarning` (which is a client-component prop). Pure RSC `<script>` tags with static HTML content do not require it.
  - The two translation systems (server: `getTranslations` via `i18n-server.ts`; client: `useTranslation` via `react-i18next`) must not be mixed.
  - `ExperiencesStructuredData.tsx` currently has `suppressHydrationWarning` on the script tag — this prop is valid only in client components and must be removed in the RSC variant.

- Assumptions:
  - `loadRoomsCatalog(lang)` is the correct server-safe path for getting localized room data; it handles i18n bundle loading before calling `getRoomsCatalog`.
  - For the experiences structured data, translations can be obtained via `getTranslations(lang, "experiencesPage")` since `experiences/page.tsx` now calls this before rendering — the bundle will be in the i18n cache.
  - The `ExperiencesStructuredData` component's fallback strings (`SECTION_DEFAULTS`, `FALLBACK_NAME`, etc.) are still needed in the RSC variant for robustness.
  - `getSlug("experiences", lang)` and `getSlug("rooms", lang)` work in server context — these are pure data lookups with no hooks.
  - `BASE_URL`, `WEBSITE_ID`, `HOTEL_ID` are server-safe constants (no client hooks, no browser globals).
  - `buildCanonicalUrl` from `@acme/ui/lib/seo` is a pure function — server-safe. Verified: implementation at `packages/seo/src/metadata/buildCanonicalUrl.ts` uses `new URL()` with string-concat fallback only; no browser globals or hooks.
  - `serializeJsonLdValue` from `@/utils/seo/jsonld` (now at `src/utils/seo/jsonld/`) is a pure function — server-safe.

## Outcome Contract

- **Why:** RSC conversion improves SSR completeness. Structured data currently emits only after client hydration, reducing reliability for crawlers. Moving it to RSC makes JSON-LD present in the initial HTML response for every request.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both `/rooms` and `/experiences` pages emit their JSON-LD structured data in the initial server HTML response (verifiable via `curl` without JavaScript), with no regression in schema validity.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/rooms/page.tsx` — RSC wrapper for `/rooms`. Currently calls `getTranslations(validLang, ["roomsPage", "_tokens"])` and passes `serverTitle`/`serverSubtitle` to `RoomsPageContent`. Does NOT render structured data. The `<RoomsStructuredData />` call lives inside `RoomsPageContent` (client).
- `apps/brikette/src/app/[lang]/experiences/page.tsx` — RSC wrapper for `/experiences`. Currently calls `await getTranslations(validLang, ["experiencesPage", "guides"])` for pre-warm (TASK-11 fix already landed). Does NOT render structured data. The `<ExperiencesStructuredData />` call lives inside `ExperiencesPageContent` (client).

### Key Modules / Files

- `apps/brikette/src/components/seo/RoomsStructuredData.tsx` — Client-only component (no `"use client"` directive present but it calls `useCurrentLanguage()` which is marked `"use client"`). Emits an `OfferCatalog` JSON-LD graph with `HotelRoom` and `Offer` nodes for each room. Uses `getRoomsCatalog(lang, { fallbackLang })` — this calls `i18n.getDataByLanguage()` which requires the client i18n bundle to be loaded. The `lang` is obtained from `useCurrentLanguage()` (calls `useParams()` + `usePathname()`). No `"use client"` directive in the file itself, but it is used inside a `"use client"` component (`RoomsPageContent`).
- `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` — Explicitly uses `memo` from React and calls `useCurrentLanguage()`, `usePathname()`, and `useTranslation("experiencesPage", { lng: lang })`. Has `suppressHydrationWarning` on the `<script>` tag. Emits an `ItemList` JSON-LD schema for 3 experience sections (bar, hikes, concierge). Falls back to hardcoded English strings if translations are not ready. The `!ready` guard at line 88 (`if (!ready) return ""`) is the specific mechanism causing absent JSON-LD in the initial HTML — on SSR, `ready` is false because `useTranslation`'s readiness flag reflects client-side bundle availability, not server-side pre-warming. This is the precise reason the RSC conversion resolves the absence.
- `apps/brikette/src/utils/roomsCatalog.ts` — Exports `getRoomsCatalog(lang, opts)` (synchronous, uses `i18n.getDataByLanguage()`) and `loadRoomsCatalog(lang, opts)` (async, calls `loadI18nNs` first). The RSC variant must use `loadRoomsCatalog` — not `getRoomsCatalog` directly — to ensure the i18n bundle is loaded on the server before data is read.
- `apps/brikette/src/app/_lib/i18n-server.ts` — Server-only i18n utilities. `getTranslations(lang, namespace)` preloads namespaces and returns a `TFunction`. The shared i18n singleton is populated after `getTranslations` returns — so `getRoomsCatalog` (which reads from the singleton) would work AFTER `loadRoomsCatalog` has been called.
- `apps/brikette/src/utils/schema/builders.ts` — `buildOffer(input)`, `buildHotelNode()`, `buildHomeGraph()`. These are pure data functions (no hooks). `buildOffer` is used by `RoomsStructuredData` and can be used in the RSC variant without modification.
- `apps/brikette/src/utils/schema/types.ts` — Exports `WEBSITE_ID`, `HOTEL_ID`, `ORG_ID` constants. Pure, server-safe.
- `apps/brikette/src/utils/seo/jsonld/` — Directory (not a single file). Contains `serialize.ts`, `index.ts`, etc. `serializeJsonLdValue` is a pure function — server-safe.
- `apps/brikette/src/hooks/useCurrentLanguage.ts` — Marked `"use client"`. The `getLanguageFromParams(params)` export in the same file is server-safe and provides an equivalent function for RSC use.
- `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` — Client component. Currently renders `<RoomsStructuredData />` at the top of its JSX. After conversion, this import and render call must be removed.
- `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` — Client component. Currently renders `<ExperiencesStructuredData />` at line 205. After conversion, this import and render call must be removed.

### Patterns & Conventions Observed

- RSC wrapper pattern: page.tsx calls `getTranslations`, resolves server props, passes as props to client `PageContent` component. The `serverTitle`/`serverSubtitle` pattern in `rooms/page.tsx` demonstrates this correctly.
- Structured data placement: all other structured data components that do NOT use hooks (e.g. `SiteSearchStructuredData`) accept `lang` as a prop directly and are server-safe.
- `buildOffer` and schema builders in `utils/schema/builders.ts` are already used by both the home page RSC and the rooms components — they have no client-side dependencies.
- Test pattern: existing structured data tests use `renderWithProviders()` from `@tests/renderers`, access the `<script type="application/ld+json">` tag, and `JSON.parse` the contents. The same pattern applies for RSC component tests (render with minimal props, no providers needed since there are no hooks).

### Data & Contracts

- Types/schemas/events:
  - `AppLanguage` — `apps/brikette/src/i18n.config.ts` — union of supported locale codes.
  - `LocalizedRoom` — `apps/brikette/src/rooms/types.ts` — room data with translated title/description/amenities.
  - `OfferInput` — input type for `buildOffer()` in `utils/schema/builders.ts`.
  - `TFunction` — from `i18next`, returned by `getTranslations()`.

- Persistence:
  - Room data: `apps/brikette/src/data/roomsData.ts` (static import — no async needed for base data).
  - Locale bundles: loaded via `loadRoomsCatalog()` or `getTranslations()` from JSON files at `src/locales/<lang>/roomsPage.json`.

- API/contracts:
  - `RoomsStructuredDataRsc` proposed interface: `{ lang: AppLanguage }` — async RSC, no hooks.
  - `ExperiencesStructuredDataRsc` proposed interface: `{ lang: AppLanguage }` — async RSC, no hooks.
  - Both emit `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />` with no additional props.

### Dependency & Impact Map

- Upstream dependencies:
  - `rooms/page.tsx` → will render `<RoomsStructuredDataRsc lang={validLang} />` before `<RoomsPageContent>` — both are rendered; the RSC structured data component does not replace the page content component.
  - `experiences/page.tsx` → will render `<ExperiencesStructuredDataRsc lang={validLang} />`.
  - `loadRoomsCatalog` from `roomsCatalog.ts` → async, uses `loadI18nNs` internally.
  - `getTranslations` from `i18n-server.ts` → server-only, for experiences translation.
  - `buildOffer` from `utils/schema/builders.ts` → pure function.
  - `serializeJsonLdValue` from `utils/seo/jsonld/` → pure function.
  - `getSlug` from `utils/slug.ts` → pure lookup.

- Downstream dependents:
  - `RoomsPageContent.tsx` — will have `<RoomsStructuredData />` import removed.
  - `ExperiencesPageContent.tsx` — will have `<ExperiencesStructuredData />` import removed.
  - `RoomsStructuredData.tsx` — the original client component. Can either be deleted (if no other callers) or kept for back-compat but unused. Currently only used in `RoomsPageContent.tsx`.
  - `ExperiencesStructuredData.tsx` — currently only used in `ExperiencesPageContent.tsx`. Same applies.

- Likely blast radius:
  - Small. Changes are isolated to 4 files (2 page wrappers, 2 client page contents) plus 2 new files created. No shared utilities are modified.
  - The existing `RoomStructuredData.tsx` (singular, used on individual room detail pages) is unaffected — it already accepts `lang` as a prop and is used within client components at the room-detail level.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (jsdom)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: tests run in `reusable-app.yml` (currently skipped on staging branch per MEMORY.md). No Cypress/Playwright e2e for structured data.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `SiteSearchStructuredData` | Unit | `src/test/components/seo/SiteSearchStructuredData.test.tsx` | Accepts `lang` prop — already RSC-compatible pattern |
| `ApartmentStructuredData` | Unit | `src/test/components/seo/ApartmentStructuredData.test.tsx` | Baseline pattern for prop-accepting structured data |
| `TravelHelpStructuredData` | Unit | `src/test/components/seo/TravelHelpStructuredData.test.tsx` | Same pattern |
| `RoomsStructuredData` | None | — | No test exists for the current client component |
| `ExperiencesStructuredData` | None | — | No test exists for the current client component |

#### Coverage Gaps

- Untested paths:
  - `RoomsStructuredData` has zero test coverage. The RSC conversion is an opportunity to add tests.
  - `ExperiencesStructuredData` has zero test coverage. Same opportunity.
  - The i18n fallback logic in both components (what happens when translations are unavailable) is untested.

- Extinct tests:
  - None to remove — there were never tests for these components.

#### Testability Assessment

- Easy to test:
  - `RoomsStructuredDataRsc` — accepts `lang` prop, is an async RSC returning static HTML. Can be tested with `renderWithProviders()` since it has no hooks. The JSON-LD output is deterministic for a given `lang`.
  - `ExperiencesStructuredDataRsc` — same pattern. The `SECTION_DEFAULTS` fallbacks make it deterministic even without real i18n bundles in test.

- Hard to test:
  - True SSR HTML verification requires a running Next.js server. Unit tests can verify the JSON-LD script is in the component render tree, but not that it appears in the initial HTTP response.
  - Async RSC components (`Promise<JSX.Element>`) may require `await act()` wrapping or synchronous mocking of async functions in jest/jsdom. Verify `renderWithProviders` handles async components before writing tests — if not, mock `loadRoomsCatalog` and `getTranslations` to return synchronously, or wrap in `await act(() => render(...))`. Do not assume the existing `renderWithProviders` helper automatically awaits async RSC render.

- Test seams needed:
  - `loadRoomsCatalog` must be mockable for unit tests that don't want to load real locale bundles. The async function can be mocked via `jest.mock("@/utils/roomsCatalog")`.
  - For `ExperiencesStructuredDataRsc`, `getTranslations` must be mockable — wrap in `jest.mock("@/app/_lib/i18n-server")`.

#### Recommended Test Approach

- Unit tests for: `RoomsStructuredDataRsc` (JSON-LD output for "en", confirms OfferCatalog shape); `ExperiencesStructuredDataRsc` (JSON-LD output for "en", confirms ItemList shape, tests fallback when t() returns key strings).
- Integration tests for: Not required — the change is isolated to well-defined component boundaries.
- E2E tests for: Existing routing tests cover page rendering. A `curl`-based smoke check in CI would be ideal but is outside the current test infrastructure.
- Contract tests for: JSON-LD schema validity (can use `@/utils/seo/jsonld` serialize + parse round-trip).

### Recent Git History (Targeted)

- `903ee09342` — `fix(brikette): TASK-11 — SSR i18n pre-warm and server-resolved hero props` — This commit delivered: (a) `getTranslations` pre-warm in `experiences/page.tsx` (previously missing), (b) `serverTitle`/`serverSubtitle` props from the rooms RSC wrapper to the client component. The structured data RSC conversion was NOT part of this commit — it remains unimplemented.
- `49fdcacc0e` — `feat(brikette): harden booking funnel and crawler guardrails` — Prior SEO hardening work. Provides context that structured data reliability is an active concern.
- `dae0ad2556` — `fix(brikette): harden SSR SEO signals and expand user audit` — More SEO signal work; structured data may have been touched in this commit.

## Questions

### Resolved

- Q: Is the `getTranslations` pre-warm already added to `experiences/page.tsx`?
  - A: Yes. Commit `903ee09342` added `await getTranslations(validLang, ["experiencesPage", "guides"])` to the `ExperiencesPage` function body. The TASK-10 "5-minute fix" (Priority 1a) has already landed.
  - Evidence: `apps/brikette/src/app/[lang]/experiences/page.tsx` line 44.

- Q: Does `RoomsStructuredData.tsx` have a `"use client"` directive?
  - A: No explicit `"use client"` directive. However, it imports and calls `useCurrentLanguage()` which IS marked `"use client"`. This means the file will be treated as a client module transitively. The RSC variant must not import from `useCurrentLanguage`.
  - Evidence: `apps/brikette/src/components/seo/RoomsStructuredData.tsx` line 16; `apps/brikette/src/hooks/useCurrentLanguage.ts` line 7.

- Q: Can `getRoomsCatalog()` be called in a server component?
  - A: Not directly — it calls `i18n.getDataByLanguage()` which reads from the client-side i18n singleton that may not be populated on the server. The correct approach is `loadRoomsCatalog(lang)` which is async and calls `loadI18nNs` first to populate the singleton before reading. Alternatively, since `rooms/page.tsx` already calls `getTranslations(validLang, ["roomsPage", "_tokens"])` which populates the singleton, `getRoomsCatalog()` COULD work afterward — but using `loadRoomsCatalog` is safer and more explicit.
  - Evidence: `apps/brikette/src/utils/roomsCatalog.ts` lines 96-97 (`i18n.getDataByLanguage`), lines 203-225 (`loadRoomsCatalog` async variant).

- Q: Are there existing tests for the structured data components being converted?
  - A: No. Neither `RoomsStructuredData` nor `ExperiencesStructuredData` have any test files. This is a coverage gap that the implementation plan should address.
  - Evidence: `src/test/components/seo/` directory only contains `SiteSearchStructuredData.test.tsx`, `ApartmentStructuredData.test.tsx`, and `TravelHelpStructuredData.test.tsx`.

- Q: Is `serializeJsonLdValue` server-safe?
  - A: Yes. It lives in `apps/brikette/src/utils/seo/jsonld/serialize.ts` (and re-exported via `index.ts`). It is a pure function — no hooks, no browser globals. Confirmed by: no imports from `react`, `next/navigation`, or browser-specific APIs.
  - Evidence: `find /Users/petercowling/base-shop/apps/brikette/src/utils/seo -type f` — shows only `.ts` files (no `"use client"` directives in utility files).

- Q: What is the correct interface for `ExperiencesStructuredDataRsc`?
  - A: `async function ExperiencesStructuredDataRsc({ lang }: { lang: AppLanguage }): Promise<JSX.Element | null>`. The pathname can be computed server-side: `const pathname = \`/${lang}/${getSlug("experiences", lang)}\`` — eliminating the `usePathname()` dependency. The `getTranslations` call for `"experiencesPage"` provides all needed strings.
  - Evidence: TASK-10 proposed interface; `ExperiencesStructuredData.tsx` lines 83-84 show current hook usage.

- Q: What is the correct interface for `RoomsStructuredDataRsc`?
  - A: `async function RoomsStructuredDataRsc({ lang }: { lang: AppLanguage }): Promise<JSX.Element>`. Calls `loadRoomsCatalog(lang)` server-side to get `LocalizedRoom[]`. Then builds the OfferCatalog graph using existing `buildOffer` + room node logic from the current `RoomsStructuredData.tsx` implementation (lines 62-111). No hooks needed.
  - Evidence: `apps/brikette/src/components/seo/RoomsStructuredData.tsx` full file; `apps/brikette/src/utils/roomsCatalog.ts` lines 203-225.

- Q: Should the old client components (`RoomsStructuredData`, `ExperiencesStructuredData`) be deleted or kept?
  - A: Delete them (or mark deprecated and schedule deletion). After the RSC conversion, they have no callers in the production codebase. Keeping them creates confusion and maintenance debt. The `RoomStructuredData.tsx` (singular — individual room detail page) is a separate, unaffected component.
  - Evidence: `grep` confirms `RoomsStructuredData` is only imported in `RoomsPageContent.tsx`; `ExperiencesStructuredData` is only imported in `ExperiencesPageContent.tsx`.

- Q: Is the `suppressHydrationWarning` on `ExperiencesStructuredData`'s script tag needed?
  - A: No — not in the RSC variant. `suppressHydrationWarning` is a React client-side prop used to silence hydration warnings when the server-rendered HTML differs from client-rendered. In a pure RSC, there is no client-side re-render of this component — the HTML is static. Removing it in the RSC variant is correct.
  - Evidence: `ExperiencesStructuredData.tsx` line 163; RSC components do not participate in hydration for their own subtree.

### Open (Operator Input Required)

None. All questions are resolvable from repository evidence and documented constraints.

## Confidence Inputs

- Implementation: 92%
  - Evidence: TASK-10 provides complete component-level analysis. Both target components have no complex data dependencies beyond what is already handled by `loadRoomsCatalog` and `getTranslations`. The code path from RSC page wrapper → new RSC structured data component → JSON-LD output is clean and well-precedented in the codebase (see `SiteSearchStructuredData` pattern). Commit `903ee09342` already delivered the related pre-warm changes, confirming the team can execute this class of change cleanly.
  - Residual 8%: whether `loadRoomsCatalog` works correctly in the concurrent static-export execution context (10 locales, parallel `generateStaticParams`). A successful `pnpm build` run would close this fully.

- Approach: 92%
  - Evidence: The "create RSC variant, integrate into RSC page wrapper, remove from client component" pattern is proven in this codebase (the `serverTitle`/`serverSubtitle` precedent for rooms). The `ExperiencesStructuredDataRsc` approach of computing the canonical URL server-side instead of using `usePathname()` is straightforward — `getSlug` is a pure function. `buildCanonicalUrl` confirmed server-safe (verified during fact-find).
  - Residual 8%: whether `renderWithProviders` in the jest harness correctly handles async RSC components. A test harness check before writing TASK-06 would close this.

- Impact: 85%
  - Evidence: Structured data in initial HTML is a known crawler reliability improvement. Google's documentation confirms that while Googlebot does execute JavaScript, structured data present in the initial HTML is more reliably indexed. For multi-language SEO, having JSON-LD with `inLanguage` in the raw response prevents potential delays.
  - Residual 15%: measured business impact (Search Console rich results improvements) requires 2–4 weeks post-deploy to be observable. The technical correctness is high-confidence; the measured business signal requires time to materialise.

- Delivery-Readiness: 95%
  - Evidence: All dependencies are in-repo, well-understood, and no external blockers. The scope is clearly bounded: 2 new RSC files, 2 page wrapper edits, 2 client component edits, 2 test files. Commit `903ee09342` demonstrates the team can make equivalent changes without breaking the build.
  - Residual 5%: confirming `pnpm typecheck && pnpm lint` pass after implementation. No structural blockers exist.

- Testability: 85%
  - Evidence: RSC components accepting `lang` props are directly testable with `renderWithProviders()` — no mock providers needed for hooks. The JSON-LD output is deterministic. The test pattern from `SiteSearchStructuredData.test.tsx` is directly applicable.
  - Residual 15%: whether the test harness correctly awaits async RSC component resolution. If `renderWithProviders` does not handle `Promise<JSX.Element>` natively, tests must mock async functions to return synchronously. This is a known unknown that a test harness check before TASK-06 would close.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `loadRoomsCatalog` async call in RSC fails in static export (generateStaticParams) | Low | Medium | `loadRoomsCatalog` uses `loadI18nNs` which handles Node FS paths. Static export runs Node — the FS fallback in `loadI18nNs` should cover this. Verify with a local `pnpm build` in static export mode before merging. |
| `buildCanonicalUrl` from `@acme/ui/lib/seo` uses browser globals | Resolved | None | Verified server-safe during fact-find: implementation uses `new URL()` with string-concat fallback only — no browser globals, no hooks. No action needed. |
| i18n singleton state leak between requests in production (multi-request server context) | Low | Medium | The shared i18n singleton is a known pattern already used by `getTranslations` in page wrappers. RSC components calling `loadRoomsCatalog` follow the same pattern. No new risk introduced. |
| Removing `<RoomsStructuredData />` from client component causes hydration mismatch | Very Low | Low | The server will now emit the JSON-LD in the initial HTML. The client component will no longer render it. Since the script tag is now only server-rendered, there is no hydration counterpart — no mismatch. The `suppressHydrationWarning` on the old client component confirms this was a concern before; it can be dropped in the RSC. |
| Test mocking complexity for `loadRoomsCatalog` | Low | Low | Standard `jest.mock("@/utils/roomsCatalog")` pattern. Return a deterministic array of LocalizedRoom objects. Well-precedented. |
| `memo()` wrapper incompatible with RSC | Certain (known) | None | RSC components cannot use `memo()`. Remove the memo wrapper. This is expected — RSC renders are server-side, no re-render optimisation applies. |
| Duplicate JSON-LD emitted if RSC structured data added and client render not removed in same deploy | Medium | Medium | TASK-03 and TASK-04 must be delivered in a single atomic commit. See sequencing note in Suggested Task Seeds. |

## Planning Constraints & Notes

- Must-follow patterns:
  - New RSC components should be placed in `apps/brikette/src/components/seo/` alongside the existing structured data components.
  - File names should follow the RSC naming convention used in the dispatch packet: `RoomsStructuredDataRsc.tsx` and `ExperiencesStructuredDataRsc.tsx`. No `"use client"` directive, no `memo()` wrapper.
  - Import `"server-only"` at the top of each new RSC file to enforce the boundary at compile time.
  - Use `loadRoomsCatalog(lang)` (async) rather than `getRoomsCatalog(lang)` (sync) in the RSC context to ensure bundle loading.
  - The RSC page wrappers (`rooms/page.tsx`, `experiences/page.tsx`) should render the RSC structured data components **before** the client page content components, so the JSON-LD is the first thing in the HTML body for that route.

- Rollout/rollback expectations:
  - No feature flag required. This is a pure server-rendering improvement — the visible output is identical; only the HTML delivery timing changes.
  - Rollback: revert the 4 file edits and delete the 2 new RSC files. Straightforward.

- Observability expectations:
  - Verify with `curl -s https://staging.brikette-website.pages.dev/<lang>/rooms | grep "application/ld+json"` before and after.
  - Check Google Search Console rich results over 2–4 weeks post-deploy for structured data coverage improvements.

## Suggested Task Seeds (Non-binding)

1. **TASK-01**: Create `RoomsStructuredDataRsc` server component — new file at `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx`. Accepts `lang: AppLanguage`, calls `loadRoomsCatalog(lang)`, builds OfferCatalog JSON-LD using existing logic from `RoomsStructuredData.tsx`, returns `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />`. Add `import "server-only"`.

2. **TASK-02**: Create `ExperiencesStructuredDataRsc` server component — new file at `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx`. Accepts `lang: AppLanguage`. Computes pathname from `getSlug("experiences", lang)`. Calls `getTranslations(lang, "experiencesPage")` for translations. Port the existing `translateOrFallback` logic and fallback constants from `ExperiencesStructuredData.tsx`. Returns ItemList JSON-LD or `null` if required data missing. Add `import "server-only"`.

3. **TASK-03**: Integrate both RSC components into their page wrappers. In `rooms/page.tsx`: add `<RoomsStructuredDataRsc lang={validLang} />` before `<RoomsPageContent .../>`. In `experiences/page.tsx`: add `<ExperiencesStructuredDataRsc lang={validLang} />` before `<ExperiencesPageContent .../>`.

4. **TASK-04**: Remove client-side structured data from client components. In `RoomsPageContent.tsx`: remove the `import RoomsStructuredData` and `<RoomsStructuredData />` render call. In `ExperiencesPageContent.tsx`: remove the `import ExperiencesStructuredData` and `<ExperiencesStructuredData />` render call.

   **CRITICAL SEQUENCING**: TASK-03 and TASK-04 MUST be delivered in a single atomic commit. If TASK-03 lands before TASK-04, the page will emit two JSON-LD scripts for the same schema type (one from the RSC wrapper, one from the client component) — this can cause conflicting structured data signals for crawlers. Never merge the addition without the removal in the same deploy.

5. **TASK-05**: Delete (or deprecate) the old client-only components `RoomsStructuredData.tsx` and `ExperiencesStructuredData.tsx` once they have no remaining callers.

6. **TASK-06**: Write unit tests for `RoomsStructuredDataRsc` and `ExperiencesStructuredDataRsc` — following the `SiteSearchStructuredData.test.tsx` pattern. Mock `loadRoomsCatalog` and `getTranslations`. Assert `@type: OfferCatalog` / `ItemList`, correct `inLanguage` field, and non-empty `itemListElement`/room nodes.

7. **TASK-07**: Smoke-test structured data in initial HTML on staging deploy using `curl`.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/brikette/src/components/seo/RoomsStructuredDataRsc.tsx` — new file, RSC, no client hooks
  - `apps/brikette/src/components/seo/ExperiencesStructuredDataRsc.tsx` — new file, RSC, no client hooks
  - `apps/brikette/src/app/[lang]/rooms/page.tsx` — updated to render RSC structured data
  - `apps/brikette/src/app/[lang]/experiences/page.tsx` — updated to render RSC structured data
  - `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` — `<RoomsStructuredData />` removed
  - `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` — `<ExperiencesStructuredData />` removed
  - `apps/brikette/src/components/seo/RoomsStructuredData.tsx` — deleted or marked deprecated
  - `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` — deleted or marked deprecated
  - `src/test/components/seo/RoomsStructuredDataRsc.test.tsx` — new test file
  - `src/test/components/seo/ExperiencesStructuredDataRsc.test.tsx` — new test file
- Post-delivery measurement plan:
  - `curl` verification on staging for both routes in at least 2 locales.
  - `pnpm typecheck && pnpm lint` pass.
  - All Jest tests in `brikette` pass.
  - Google Search Console rich results report checked at +2 weeks and +4 weeks post-deploy.

## Evidence Gap Review

### Gaps Addressed

- **`buildCanonicalUrl` server-safety**: Verified during fact-find by reading `packages/seo/src/metadata/buildCanonicalUrl.ts`. The implementation uses `new URL()` with a string-concat fallback only — no browser globals, no hooks, no client-side dependencies. Confirmed server-safe. The assumption in `Constraints & Assumptions` can be treated as resolved; TASK-02 does not need to re-verify this.
- **`roomsCatalog.ts` server-side behavior**: Confirmed via code read that `getRoomsCatalog` uses `i18n.getDataByLanguage()` (reads from singleton) and that `loadRoomsCatalog` async variant calls `loadI18nNs` first. The safe server path is `loadRoomsCatalog`.
- **Test coverage for target components**: Confirmed zero tests exist. Addressed by TASK-06 seed.
- **Git history**: Confirmed commit `903ee09342` delivered the `getTranslations` pre-warm and hero props changes. The structured data RSC conversion is genuinely not yet implemented.

### Confidence Adjustments

- TASK-10 claimed both components have no RSC variants. Confirmed: glob search shows no `*Rsc*` files in `components/seo/`.
- TASK-10 claimed `ExperiencesStructuredData` uses `useCurrentLanguage()`, `usePathname()`, and `useTranslation`. Confirmed by reading the file.
- TASK-10 claimed the `experiences/page.tsx` was missing `getTranslations` pre-warm. This was ALREADY FIXED by commit `903ee09342`. The fact-find confidence for this sub-item is 100% — it is done and does not need to be repeated.

### Remaining Assumptions

- `loadRoomsCatalog` will work correctly in the static export build context (low risk given the FS fallback; validate with `pnpm build` smoke test). The concurrent-locale case (10 locales built in parallel in static export) is low-risk given `onceCache` in `loadI18nNs`, but a full `next build` run before merge is the recommended validation gate.
- The `memo()` removal from both RSC variants will not cause any issues (correct — RSC components cannot use `memo()`).
- `renderWithProviders` in the test harness correctly handles async RSC components — verify before writing TASK-06 tests; if not, use synchronous mocks for async dependencies.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan brikette-rsc-structured-data-conversion --auto`
