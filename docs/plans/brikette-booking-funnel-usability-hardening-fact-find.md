---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Brikette/UX
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Feature-Slug: brikette-booking-funnel-usability-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: meta-user-test,lp-replan
Related-Plan: docs/plans/brikette-booking-funnel-usability-hardening-plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
Relates-to charter: none
---

# Brikette Booking Funnel Usability Hardening Fact-Find Brief

## Scope

### Summary

This lp-fact-find converts the latest Brikette usability-testing findings into a planning-ready engineering brief for booking-funnel reliability, translation integrity, and no-JS server HTML quality.

Primary intent: ensure users can complete booking-critical actions even when hydration is delayed or fails, and remove trust-eroding untranslated strings in the conversion funnel.

### Goals

- Guarantee booking-critical CTAs have reliable, accessible fallback behavior in initial HTML.
- Eliminate i18n key leakage in booking-funnel surfaces (`/en`, `/en/rooms`, `/en/rooms/[id]`, rate/price UI).
- Ensure major discovery routes return meaningful initial HTML (H1 + core body text) without CSR bailout markers.
- Expand audit/CI checks to fail on booking-funnel key leakage and CTA fallback regressions.

### Non-goals

- Full visual redesign of rooms/experiences/how-to pages.
- Replatforming away from current modal booking UX.
- Changing branch/deploy workflow or staging URL resolution mechanics.

### Constraints & Assumptions

- Constraints:
  - Booking-funnel paths must remain usable under no-JS or hydration-delayed conditions.
  - Existing localization/slug routing must remain compatible.
  - Changes should be compatible with current Next.js App Router + i18n architecture.
- Assumptions:
  - Existing modal-first booking UX can remain as progressive enhancement if a deterministic fallback route exists.
  - Existing social-proof snapshot policy (`As of {{date}}`) is acceptable if surfaced consistently.

## User-Testing Findings Triage (Input -> Evidence)

| Finding from usability test                                                                                       | Reproduced in current staging HTML (`https://14dbef55.brikette-website.pages.dev`) | Notes                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Check availability` appears JS-dependent / fallback unclear                                                      | Yes                                                                                | Found as `<button>` (not `<a>`) in initial HTML header/nav.                                                       |
| Room detail shows `loadingPrice` / key-like placeholders                                                          | Yes                                                                                | `/en/rooms/room_12` initial HTML includes `loadingPrice`, `roomImage.photoAlt`, `roomImage.clickToEnlarge`.       |
| Booking CTA fallback risk (`Book Now`)                                                                            | Yes                                                                                | Sticky CTA rendered as button with JS navigation (`window.location.href`) path.                                   |
| `/en/rooms`, `/en/how-to-get-here`, `/en/experiences` discovery pages missing meaningful initial headings/content | Yes                                                                                | Current initial HTML on these routes includes bailout marker and no `<h1>` in response body.                      |
| How-to-get-here planner leaks i18n keys (`romePlanner.*`, `filters.resultsCount`, etc.)                           | Partially                                                                          | Key strings are present in source paths; current staging no-JS HTML often bails out before route content appears. |
| Footer email not `mailto:` and social icons unlabeled                                                             | Not reproduced on this deployment                                                  | Footer source includes `mailto:` and social `aria-label` wiring. Keep as monitor item, not immediate blocker.     |

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/layout.tsx:24` - wraps all locale routes with client layout.
- `apps/brikette/src/app/[lang]/ClientLayout.tsx:1` - client-only root wrapper (`"use client"`) with `I18nextProvider`.
- `apps/brikette/src/components/layout/AppLayout.tsx:29` - client composition for header/footer/providers.
- `apps/brikette/src/app/[lang]/rooms/page.tsx:55` - rooms route renders `RoomsPageContent` client component.
- `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx:77` - room detail route renders `RoomDetailContent` client component.
- `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx:45` - index route renders client content component.
- `apps/brikette/src/app/[lang]/experiences/page.tsx:42` - experiences route renders client content component.

### Key Modules / Files

- `packages/ui/src/organisms/DesktopHeader.tsx:129` - desktop `Check availability` is a button opening modal.
- `packages/ui/src/organisms/MobileNav.tsx:91` - mobile `Check availability` is a button opening modal.
- `packages/ui/src/organisms/StickyBookNow.tsx:111` - booking CTA uses JS redirect in click handler.
- `packages/ui/src/molecules/RoomCard.tsx:147` - rate actions are button callbacks only.
- `apps/brikette/src/components/rooms/RoomCard.tsx:153` - `loadingPrice` and room image key lookups.
- `apps/brikette/src/components/landing/LocationMiniBlock.tsx:59` - map/directions copy uses translation keys that leaked in no-JS probe.
- `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx:56` - client translation-driven planner shell.
- `apps/brikette/src/routes/how-to-get-here/components/HowToToolbar.tsx:156` - `filters.resultsCount` translation key usage.

### Patterns & Conventions Observed

- Route pages are server files but primary content trees are client components.
- Booking CTAs favor modal + JS event handlers instead of canonical href fallback paths.
- Translation fallback logic is inconsistent: some components sanitize key-like values, others render key tokens directly.
- Audit script currently has route-level no-JS checks but narrow key-pattern coverage (homepage-focused pattern list).

### Data & Contracts

- i18n namespaces/contracts:
  - `roomsPage` keys like `checkRatesNonRefundable`, `checkRatesFlexible`, `loadingPrice`, `moreAboutThisRoom`.
  - `howToGetHere` keys such as `filters.resultsCount`, `jumpTo.*`, route planner labels.
  - `ratingsBar.snapshotAsOf` exists (`apps/brikette/src/locales/en/ratingsBar.json:10`).
- Booking deep-link contract:
  - Sticky CTA creates Octorate URL with `codice`, `checkin`, `checkout`, `pax` (`packages/ui/src/organisms/StickyBookNow.tsx:99`).
- Route quality contract (from current audit tooling):
  - `hasMeaningfulH1`, `hasNoBailoutMarker`, plus limited home/deals checks (`.claude/skills/meta-user-test/scripts/run-meta-user-test.mjs:275`).

### Dependency & Impact Map

- Upstream dependencies:
  - Next.js App Router render model and client/server boundaries.
  - `react-i18next` runtime readiness in client components.
  - Modal context (`ModalProvider`) behavior for booking flows.
- Downstream dependents:
  - Header and nav conversion funnels across all pages.
  - Room listing/detail conversion and price perception.
  - No-JS/SEO audit results used in release confidence gates.
- Likely blast radius:
  - `apps/brikette` route/component layer and `packages/ui` header/booking/card atoms.
  - user-testing audit script + contract tests.

### Performance Patterns (affected paths)

- Client-heavy route shells increase risk of empty/low-value initial HTML and delayed interaction on constrained devices.
- Booking CTAs and pricing states are hydration-sensitive; placeholder leakage (`loadingPrice`) degrades perceived responsiveness.

### Security Boundaries (affected paths)

- These are public marketing/booking-entry routes; no auth boundaries are crossed by current changes.
- Primary security concern is integrity/reliability of navigation intent (users must reach a booking endpoint reliably), not authorization.

### Test Landscape

#### Test Infrastructure

- Frameworks:
  - Jest for unit/integration in app/package tests.
  - Playwright/Lighthouse via audit script for deployed URL checks.
- Commands:
  - `pnpm --filter @apps/brikette test -- <pattern>`
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
  - `bash scripts/validate-changes.sh`
- CI/contract hooks:
  - Audit script contract test at `scripts/__tests__/meta-user-test-contract.test.ts`.

#### Existing Test Coverage

| Area                               | Test Type         | Files                                                                                  | Coverage Notes                                                                                         |
| ---------------------------------- | ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| No-JS policy (source-level guard)  | unit              | `apps/brikette/src/test/routes/no-js/ssr-bailout-policy.test.ts`                       | Guards `useSearchParams` in selected files only; does not validate rendered HTML outcomes.             |
| i18n placeholder detection utility | unit              | `apps/brikette/src/test/content-readiness/i18n/detectRenderedI18nPlaceholders.test.ts` | Validates detector behavior; not wired to route-level HTML probes in booking funnel.                   |
| locale/content parity              | integration-style | `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`      | Detects raw-key-like values in locale files; does not assert no-JS route HTML for booking pages.       |
| user-testing audit script contract | unit              | `scripts/__tests__/meta-user-test-contract.test.ts`                                | Ensures script contains current no-JS predicates, but misses booking-funnel-specific predicate checks. |

#### Coverage Gaps (Planning Inputs)

- No deterministic contract that `Check availability` and `Book Now` have no-JS fallback routes.
- No audit predicate for booking-funnel key patterns (`roomImage.*`, `loadingPrice`, `checkRates*`, `filters.*`, `romePlanner.*`).
- No route-level assertion that `/en/rooms`, `/en/how-to-get-here`, `/en/experiences` return meaningful non-bailout body in production HTML.
- No explicit assertion that booking-funnel H1 content is present in initial HTML for top-nav discovery pages.

#### Testability Assessment

- Easy to test:
  - No-JS HTML checks via existing audit script extension.
  - i18n key-pattern detection expansion in static HTML probes.
- Hard to test:
  - Hydration timing vs fallback path behavior for modal-dependent CTAs.
  - Balancing SSR-first rendering with query-param-driven UX on routes currently implemented as client pages.
- Test seams needed:
  - Route-level no-JS contracts for booking-funnel pages.
  - CTA semantics checks (button-only vs link/fallback path) in raw HTML snapshots.

#### Recommended Test Approach

- Unit/contract tests:
  - Extend `scripts/__tests__/meta-user-test-contract.test.ts` to enforce booking-funnel predicates.
- Integration/no-JS probes:
  - Extend audit script route checks for room/detail/how-to planner key leakage + CTA fallback semantics.
- Targeted component tests:
  - Header/mobile/sticky CTA rendering semantics and fallback href behavior.

### Recent Git History (Targeted)

- `508966f28d` - `fix(brikette): keep listing routes static under export`.
- `dae0ad2556` - `fix(brikette): harden SSR SEO signals and expand user audit`.
- `ed7675b921` - `fix(brikette): address audit findings and codify expanded seo audit workflow`.

Implication: hardening has started, but current usability input exposes remaining booking-funnel and CTA-fallback gaps.

## Deployment Probe Snapshot (2026-02-11)

Manual raw-HTML probe against `https://14dbef55.brikette-website.pages.dev`:

| Route                 | H1 count | Has `BAILOUT_TO_CLIENT_SIDE_RENDERING` | Key leakage sample                                               | Notes                                                       |
| --------------------- | -------: | -------------------------------------: | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `/en`                 |        1 |                                    yes | `location.getDirections`, `locationSection.mapLabel`             | Home still emits key-like copy in initial HTML.             |
| `/en/rooms`           |        0 |                                    yes | none surfaced (route shell)                                      | No meaningful route heading/body in initial HTML.           |
| `/en/rooms/room_12`   |        1 |                                     no | `roomImage.photoAlt`, `roomImage.clickToEnlarge`, `loadingPrice` | Booking-critical room detail shows key/placeholder leakage. |
| `/en/how-to-get-here` |        0 |                                    yes | none surfaced (route shell)                                      | No meaningful initial heading/body.                         |
| `/en/experiences`     |        0 |                                    yes | none surfaced (route shell)                                      | No meaningful initial heading/body.                         |

CTA semantics probe highlights:

- `Check availability` appears as `<button>` in initial HTML on home/room pages, not as `<a>` fallback.
- Sticky `Book Now` CTA appears as button with JS click redirect pattern (`aria-label="Book Now"`), no non-JS href fallback element.

## Existing Plan Drift / Confidence Impact

Existing active plan `docs/plans/brikette-ssr-seo-signal-hardening-plan.md` overlaps this work, but current usability findings add unplanned P0/P1 scope:

- Missing explicit task for booking CTA no-JS fallback semantics (`Check availability`, `Book Now`).
- Missing explicit booking-funnel key leakage predicates in automated no-JS audit contract.
- Discovery-route H1 and bailout objectives exist, but acceptance package needs tighter conversion-funnel emphasis.

Confidence impact on the active plan:

- `BSS-06/BSS-07` impact confidence should be treated as lower until CTA fallback design and booking-funnel no-JS contracts are added.
- Recommendation: `/lp-replan` current active plan (or supersede with dedicated booking-funnel hardening plan) before build execution.

## External Research (If needed)

- Not required for this lp-fact-find. All critical findings came from repo evidence and live deployment HTML probes.

## Questions

### Resolved

- Q: Are booking CTAs currently hydration-dependent in initial HTML?
  - A: Yes, both global and sticky booking CTAs render as buttons with JS handlers.
  - Evidence: `packages/ui/src/organisms/DesktopHeader.tsx:129`, `packages/ui/src/organisms/MobileNav.tsx:91`, `packages/ui/src/organisms/StickyBookNow.tsx:111`.

- Q: Is untranslated/key-like content reaching booking-funnel HTML?
  - A: Yes, at least on room detail and home location surfaces.
  - Evidence: `apps/brikette/src/components/rooms/RoomCard.tsx:153`, `apps/brikette/src/components/landing/LocationMiniBlock.tsx:59`, deployment probe snapshot above.

- Q: Do discovery pages currently return bailout markers and weak initial HTML?
  - A: Yes for `/en/rooms`, `/en/how-to-get-here`, `/en/experiences` on current staging URL.
  - Evidence: deployment probe snapshot above.

### Open (User Input Needed)

- None blocking for planning.

## Confidence Inputs (for /lp-plan)

- Implementation: 86%
  - Why: root causes and concrete files are identified; extension points for audit checks are clear.
  - To reach >=90: complete a small technical spike defining one canonical non-JS fallback URL contract for header + sticky + room actions.

- Approach: 82%
  - Why: server-first + progressive enhancement is directionally correct, but route-level decomposition and CTA fallback consistency choices must be formalized.
  - To reach >=90: finalize design decision record for CTA fallback semantics and SSR/client split per route.

- Impact: 84%
  - Why: blast radius is bounded to `apps/brikette`, `packages/ui`, and audit scripts, but affects high-traffic conversion surfaces.
  - To reach >=90: add and pass targeted no-JS regression suite on staging URL candidate.

- Delivery-Readiness: 87%
  - Why: owner/scope/artifacts are clear and quality gates exist, but predicates need expansion before execution.
  - To reach >=90: land audit-contract expansion first, then re-baseline staging report.

- Testability: 83%
  - Why: existing script/test scaffolding is reusable; current assertions are incomplete for booking funnel.
  - To reach >=90: add predicate coverage for booking CTA semantics and booking-funnel key patterns in script + contract tests.

## Planning Constraints & Notes

- Must-follow patterns:
  - Preserve accessibility semantics (interactive elements must be keyboard/screen-reader valid).
  - Keep modal booking UX as enhancement, not single point of failure.
  - Prefer deterministic server HTML for headings and high-intent CTAs.
- Rollout/rollback expectations:
  - Roll out behind staging verification using fresh immutable deployment URL.
  - Roll back by feature-level revert if fallback or translation regressions emerge.
- Observability expectations:
  - Audit artifact must report route-by-route no-JS predicates and explicit booking-funnel key checks.

## Suggested Task Seeds (Non-binding)

- Add a shared booking CTA component contract with required fallback behavior (`href` or server route) for header/mobile/sticky contexts.
- Refactor room-detail CTA path to guarantee non-JS navigation route while preserving hydrated deep-link optimization.
- Remove booking-funnel placeholder leakage (`loadingPrice`/room image key tokens) by rendering stable server-safe copy or guarded skeleton text.
- Refactor `/en/rooms` route to ship meaningful initial body (H1 + room list summary + stable booking entry links) without bailout marker.
- Refactor `/en/how-to-get-here` and `/en/experiences` index routes for meaningful initial H1/body while keeping interactive filters as enhancement.
- Extend no-JS audit predicates to include booking-funnel key patterns: `rooms.`, `roomImage.`, `loadingPrice`, `checkRates`, `romePlanner.`, `filters.`.
- Extend audit predicates to detect CTA fallback regressions (button-only booking CTAs without canonical fallback link route).
- Add targeted tests for footer/header/contact semantics as regression guard, while keeping them non-blocking if already green.

## Execution Routing Packet

- Primary execution skill:
  - `lp-build`
- Supporting skills:
  - `meta-user-test`
  - `lp-replan`
- Deliverable acceptance package:
  - Updated code for booking CTA fallback + route rendering/i18n integrity.
  - Updated no-JS audit script and contract tests covering booking-funnel predicates.
  - Staging re-audit artifact showing predicate pass for core booking/discovery routes.
- Post-delivery measurement plan:
  - Compare pre/post no-JS predicate tables on fresh staging deployments.
  - Track reduction in untranslated key occurrences and bailout markers across target routes.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - Proceed to `/lp-plan` using this brief and either supersede or lp-replan `docs/plans/brikette-ssr-seo-signal-hardening-plan.md` to include booking-funnel P0 scope.
