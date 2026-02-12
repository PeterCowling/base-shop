---
Type: Plan
Status: Active
Domain: Brikette/SEO
Workstream: Engineering
Created: 2026-02-10
Last-updated: 2026-02-10
Last-reviewed: 2026-02-10
Feature-Slug: brikette-ssr-seo-signal-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: wf-build
Supporting-Skills: wf-replan,meta-user-test
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact) per task; overall is effort-weighted average (S=1,M=2,L=3)
Relates-to charter: none
Fact-Find-Ref: docs/audits/user-testing/2026-02-10-5bd676c0-brikette-website-pages-staging-en-expanded-rerun.md
---

# Brikette SSR + SEO Signal Hardening Plan

## Summary

This plan addresses the current gap between automated audit pass signals and what the initial server HTML actually serves on staging. The key issues are untranslated i18n keys on `/en`, CSR bailouts producing shell HTML for top-nav routes, deals metadata/body mismatch, and stale social-proof values without clear date provenance.

The implementation strategy is to make high-intent pages render meaningful server HTML first, keep query-driven behavior as progressive enhancement, and harden no-JS audit checks so the same class of issues is blocked before staging promotion. The social-proof policy will be converted to a dated snapshot model (November 2025) across visible UI and structured data.

## Goals

- Eliminate i18n key leakage in initial HTML for homepage above-the-fold sections.
- Remove top-nav route shell/CSR bailout behavior from initial HTML for `/en/rooms`, `/en/experiences`, and `/en/how-to-get-here`.
- Align deals metadata with deal lifecycle content shown on the page.
- Apply a dated social-proof snapshot policy (November 2025) consistently across UI and schema outputs.
- Close the audit blind spot by adding deterministic no-JS HTML checks alongside SEO/Lighthouse checks.

## Non-goals

- Reworking the broader guides SEO architecture that was completed in earlier archived plans.
- Changing production/staging robots policy for immutable preview URLs.
- Adding live OTA scraping in runtime paths.
- Redesigning page UI beyond what is required to fix content and machine-readability integrity.

## Constraints & Assumptions

- Constraints:
  - Cloudflare Pages staging previews are immutable URLs and expected to fail Lighthouse `is-crawlable` due noindex policy.
  - Existing locale routing and slug translation behavior must be preserved.
  - Changes must maintain changed-code scoped CI and existing branch flow (`dev -> staging -> main`).
- Assumptions:
  - Query-param driven filters can be preserved while still rendering meaningful server-first content.
  - A snapshot-style social-proof disclosure (`as of November 2025`) is acceptable for trust/compliance UX.

## TDD Safety Gate (Non-negotiable)

- Every IMPLEMENT task follows strict Red -> Green -> Refactor.
- Red is mandatory before code edits: add or unskip targeted tests tied to the task TC contract, then capture an expected failing run.
- Implementation may start only after red evidence is captured; task is complete only when the same test set is green.
- No task is merge-ready unless targeted tests, affected-package lint, and affected-package typecheck pass.
- i18n-sensitive tasks must include server-HTML checks for raw translation-key leakage (for example heroSection.*, socialProof.*, locationSection.*).
- Route-rendering tasks must include no-JS SSR checks that assert: no BAILOUT_TO_CLIENT_SIDE_RENDERING markers, required H1 presence, and meaningful body content.
- If a task cannot be driven by tests first, work pauses and the task is converted to INVESTIGATE or wf-replanned.
## Validation Foundation Check (from Fact-Find)

Primary wf-fact-find input is an audit artifact (`docs/audits/user-testing/2026-02-10-5bd676c0-brikette-website-pages-staging-en-expanded-rerun.md`) plus manual no-JS HTML probes. The audit artifact does not include full wf-fact-find confidence inputs (`Delivery-Readiness`, `Testability`) in canonical wf-fact-find format.

Mitigation in this plan:
- Add explicit audit-contract hardening work (BSS-01, BSS-08) before final regression gate closure.
- Apply a confidence penalty to SSR-bailout implementation tasks until strategy mapping completes (BSS-05 prerequisite).

## Fact-Find Reference

- Primary: `docs/audits/user-testing/2026-02-10-5bd676c0-brikette-website-pages-staging-en-expanded-rerun.md`
- Prior baseline: `docs/audits/user-testing/2026-02-09-5d811679-brikette-website-pages-dev-en.md`
- Supporting evidence (local probe captures):
  - i18n keys in initial HTML on `/en`
  - `BAILOUT_TO_CLIENT_SIDE_RENDERING` on `/en/rooms`, `/en/experiences`, `/en/how-to-get-here`
  - deals metadata/body mismatch
  - social proof values present without synchronized dated provenance

## Existing System Notes

- Homepage server route renders client content without server translation preload:
  - `apps/brikette/src/app/[lang]/page.tsx:47-51`
  - `apps/brikette/src/app/[lang]/HomeContent.tsx:54-126`
- Key leakage surfaces:
  - `packages/ui/src/organisms/LandingHeroSection.tsx:156-159`
  - `apps/brikette/src/components/landing/SocialProofSection.tsx:45-50`
  - `apps/brikette/src/components/landing/LocationMiniBlock.tsx:34-39`
- CSR bailout route paths:
  - `apps/brikette/src/app/[lang]/rooms/page.tsx:58-60`
  - `apps/brikette/src/app/[lang]/experiences/page.tsx:45-47`
  - `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx:45-47`
  - `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx:109`
  - `apps/brikette/src/routes/how-to-get-here/useDestinationFilters.ts:70`
  - `packages/ui/src/organisms/RoomsSection.tsx:24`
- Deals metadata and deal window data:
  - `apps/brikette/src/locales/en/dealsPage.json:4-6`
  - `apps/brikette/src/routes/deals/deals.ts:31-38`
- Social-proof sources and schema:
  - `apps/brikette/src/config/hotel.ts:10-12`
  - `apps/brikette/src/schema/hostel-brikette/hotel.jsonld:408-423`
  - `apps/brikette/src/schema/hostel-brikette/graph.jsonld:14664-14679`
  - `apps/brikette/src/utils/schema/builders.ts:86-93`
  - `packages/ui/src/atoms/RatingsBar.tsx:141`

## Evidence and Planning Validation

Executed during planning:

- `pnpm --filter @apps/brikette test -- --testPathPattern="i18n-parity-quality-audit|seo-jsonld-contract" --maxWorkers=2`
  - Result: `seo-jsonld-contract.test.tsx` passed (4/4).
- `pnpm --filter @apps/brikette exec jest --ci --runInBand --passWithNoTests --testPathPattern=i18n-parity-quality-audit`
  - Result: `i18n-parity-quality-audit.test.ts` passed (2/2).

Finding from validation:
- Existing tests pass but do not currently detect the no-JS SSR regressions observed in staging HTML, confirming an audit/test coverage gap rather than a flaky runtime signal.

## Proposed Approach

### Option A: Server-first content with client-enhanced filters (chosen)

- Ensure route-level server render produces meaningful body content and stable headings.
- Move query-param-dependent rendering behind progressive enhancement and pass server-safe defaults into client components.
- Keep filter UX behavior but remove structural SSR/client divergence.

Trade-offs:
- Requires careful refactor at `useSearchParams` call sites.
- Delivers durable SEO/no-JS safety and reduces hydration risk.

### Option B: Keep CSR-heavy behavior and add fallback placeholders

- Keep current client-first behavior, improve placeholders.

Trade-offs:
- Lower code churn short-term.
- Does not resolve crawlability/content integrity risk in initial HTML.

Chosen: Option A, because it is the long-term stable architecture and directly addresses the verified failure mode.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| BSS-01 | INVESTIGATE | Canonicalize no-JS audit contract and baseline evidence map | 88% | S | Pending | - | BSS-02,BSS-03,BSS-04,BSS-05,BSS-08 |
| BSS-02 | IMPLEMENT | Fix homepage initial HTML i18n key leakage | 83% | M | Pending | BSS-01 | BSS-09 |
| BSS-03 | IMPLEMENT | Align deals metadata with deal lifecycle body state | 86% | M | Pending | BSS-01 | BSS-09 |
| BSS-04 | IMPLEMENT | Social proof snapshot policy: show “as of November 2025” across UI + schema | 84% | M | Pending | BSS-01 | BSS-09 |
| BSS-05 | INVESTIGATE | Define SSR-safe strategy for top-nav routes currently using `useSearchParams` | 82% | M | Pending | BSS-01 | BSS-06,BSS-07 |
| BSS-06 | IMPLEMENT | Remove `/en/rooms` initial-HTML bailout and ship SSR-first room body | 83% | M | Pending | BSS-05 | BSS-10 |
| BSS-07 | IMPLEMENT | Remove `/en/experiences` + `/en/how-to-get-here` initial-HTML bailout and ship SSR-first bodies | 76% (→82% with BSS-05 evidence) | L | Pending | BSS-05 | BSS-10 |
| BSS-08 | IMPLEMENT | Expand user-testing audit to enforce no-JS SSR/SEO checks and newest staging URL resolution | 85% | M | Pending | BSS-01 | BSS-09,BSS-10 |
| BSS-09 | IMPLEMENT | Add regression tests for i18n/deals/social-proof contracts | 80% | M | Pending | BSS-02,BSS-03,BSS-04,BSS-08,BSS-10 | - |
| BSS-10 | CHECKPOINT | Horizon checkpoint: re-score remaining route-hardening and final gate tasks | 95% | S | Pending | BSS-06,BSS-07 | BSS-09 |

> Effort scale: S=1, M=2, L=3

## Active tasks

- BSS-01: Canonicalize no-JS audit contract and baseline evidence map.
- BSS-02: Fix homepage initial HTML i18n key leakage.
- BSS-03: Align deals metadata with deal lifecycle body state.
- BSS-04: Apply social-proof snapshot policy (November 2025) across UI and schema.
- BSS-05: Define SSR-safe strategy for top-nav routes currently using useSearchParams.
- BSS-06: Remove /en/rooms initial-HTML bailout and ship SSR-first body.
- BSS-07: Remove /en/experiences and /en/how-to-get-here initial-HTML bailouts and ship SSR-first bodies.
- BSS-08: Expand user-testing audit to enforce no-JS SSR/SEO checks and newest staging URL resolution.
- BSS-09: Add regression tests for i18n/deals/social-proof contracts.
- BSS-10: Re-score remaining route-hardening and final gate tasks before closing regression-net work.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | BSS-01 | - | Establish deterministic baseline and issue contract |
| 2 | BSS-02, BSS-03, BSS-04, BSS-05, BSS-08 | BSS-01 | Can run in parallel across content + audit + route strategy |
| 3 | BSS-06, BSS-07 | BSS-05 | Route-hardening execution after strategy lock |
| 4 | BSS-10 | BSS-06, BSS-07 | Re-assess confidence before final coverage closure |
| 5 | BSS-09 | BSS-02, BSS-03, BSS-04, BSS-08, BSS-10 | Final regression net aligned to implemented contracts |

Max parallelism: 5 tasks in Wave 2

## Tasks

### BSS-01: Canonicalize no-JS audit contract and baseline evidence map

- **Type:** INVESTIGATE
- **Deliverable:** baseline contract note embedded in this plan’s Decision Log + acceptance fixtures for `/en`, `/en/rooms`, `/en/experiences`, `/en/how-to-get-here`, `/en/deals`
- **Execution-Skill:** wf-replan
- **Affects:** `docs/audits/user-testing/2026-02-10-5bd676c0-brikette-website-pages-staging-en-expanded-rerun.md`, `[readonly] .claude/skills/meta-user-test/SKILL.md`
- **Depends on:** -
- **Blocks:** BSS-02, BSS-03, BSS-04, BSS-05, BSS-08
- **Confidence:** 88%
  - Implementation: 90% — existing probe commands and target URLs are already known.
  - Approach: 88% — codifying deterministic no-JS checks closes the known audit blind spot.
  - Impact: 88% — low blast radius, improves signal quality for all downstream tasks.
- **Acceptance:**
  - Route-by-route baseline checklist is documented with exact failure predicates.
  - Existing automated audit limitations are explicitly listed.
  - Upstream/derived issue IDs are stable for re-audit comparison.
- **Notes / references:**
  - `docs/audits/user-testing/2026-02-10-5bd676c0-brikette-website-pages-staging-en-expanded-rerun.md`

### BSS-02: Fix homepage initial HTML i18n key leakage

- **Type:** IMPLEMENT
- **Deliverable:** server HTML on `/en` contains resolved copy (not key tokens) for hero/section labels and alt text
- **Execution-Skill:** wf-build
- **Affects:** `apps/brikette/src/app/[lang]/page.tsx`, `apps/brikette/src/app/[lang]/HomeContent.tsx`, `packages/ui/src/organisms/LandingHeroSection.tsx`, `apps/brikette/src/components/landing/SocialProofSection.tsx`, `apps/brikette/src/components/landing/LocationMiniBlock.tsx`
- **Depends on:** BSS-01
- **Blocks:** BSS-09
- **Confidence:** 83%
  - Implementation: 84% — code paths are localized and root cause is clear.
  - Approach: 83% — server-first translation resolution aligns with App Router expectations.
  - Impact: 83% — homepage-only blast radius with known copy surfaces.
- **Acceptance:**
  - `/en` initial HTML has no `heroSection.*`, `introSection.*`, `socialProof.*`, `locationSection.*` tokens.
  - Hero image `alt` is real localized copy in server response.
  - Hydration does not reintroduce key-token flashes for those sections.
- **Validation contract:**
  - TC-01: `curl` normalized HTML for `/en` contains no key-token patterns.
  - TC-02: Hero/section headings resolve to readable text in initial HTML.
  - TC-03: Existing i18n parity audits still pass.
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02 covers criteria 2; TC-03 covers criteria 3.
  - **Validation type:** integration + unit regression.
  - **Validation location/evidence:** no-JS audit artifacts + i18n audit test output.
  - **Run/verify:** `pnpm --filter @apps/brikette exec jest --ci --runInBand --passWithNoTests --testPathPattern=i18n-parity-quality-audit`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Tests run: i18n parity audit passed (2/2).
  - Unexpected findings: Existing test suite does not currently catch this leakage in route HTML.
- **What would make this >=90%:** add dedicated route-HTML contract tests for `/en` key leakage.
- **Rollout / rollback:**
  - Rollout: ship behind standard staging verify cycle.
  - Rollback: revert page/i18n preload changes only.
- **Documentation impact:**
  - Update meta-user-test procedure docs to include homepage key-token gate.

### BSS-03: Align deals metadata with deal lifecycle body state

- **Type:** IMPLEMENT
- **Deliverable:** `/en/deals` title/description/OG/Twitter metadata match active/expired state rendered in body content
- **Execution-Skill:** wf-build
- **Affects:** `apps/brikette/src/locales/en/dealsPage.json`, `apps/brikette/src/routes/deals/deals.ts`, `apps/brikette/src/app/[lang]/deals/page.tsx`
- **Depends on:** BSS-01
- **Blocks:** BSS-09
- **Confidence:** 86%
  - Implementation: 87% — deal window config and metadata source are explicit.
  - Approach: 86% — single source of truth for deal state removes drift.
  - Impact: 86% — constrained to deals route + metadata output.
- **Acceptance:**
  - Metadata does not claim active offer when only expired deals are shown.
  - If an active offer exists, body includes explicit terms matching title claim.
  - Deals page remains localization-safe.
- **Validation contract:**
  - TC-01: expired-only state yields neutral/expired metadata.
  - TC-02: active-offer state yields metadata/body parity on percent and date window.
  - TC-03: `/en/deals` no-JS HTML parity check passes.
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02 covers criterion 2; TC-03 covers criterion 3.
  - **Validation type:** unit + integration.
  - **Validation location/evidence:** deals route tests + raw HTML probe artifact.
  - **Run/verify:** targeted deals tests and audit script route check.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Evidence reviewed from staging HTML and config files.
- **What would make this >=90%:** add deal-window parameterized tests for all lifecycle states.
- **Rollout / rollback:**
  - Rollout: release with staging snapshot comparison.
  - Rollback: revert metadata state wiring.
- **Documentation impact:**
  - Update deals content runbook with title/body parity rule.

### BSS-04: Social proof snapshot policy (November 2025) across UI and schema

- **Type:** IMPLEMENT
- **Deliverable:** social-proof values explicitly labeled as November 2025 snapshot in visible UI and schema-relevant outputs
- **Execution-Skill:** wf-build
- **Affects:** `apps/brikette/src/config/hotel.ts`, `packages/ui/src/atoms/RatingsBar.tsx`, `apps/brikette/src/components/landing/SocialProofSection.tsx`, `apps/brikette/src/schema/hostel-brikette/hotel.jsonld`, `apps/brikette/src/schema/hostel-brikette/graph.jsonld`, `apps/brikette/src/utils/schema/builders.ts`, `apps/brikette/src/locales/en/ratingsBar.json`
- **Depends on:** BSS-01
- **Blocks:** BSS-09
- **Confidence:** 84%
  - Implementation: 85% — sources are centralized and enumerated.
  - Approach: 84% — snapshot-with-date is explicit and resilient.
  - Impact: 84% — touches UI + schema, but contracts are well-defined.
- **Acceptance:**
  - Homepage social-proof cards show values with clear "as of November 2025" disclosure.
  - Ratings bar date and social-proof disclosure are consistent.
  - Structured data does not present undated aggregate/review counts that conflict with displayed snapshot policy.
- **Validation contract:**
  - TC-01: `/en` initial HTML includes snapshot date text for social-proof module.
  - TC-02: ratings bar date reflects November 2025 policy.
  - TC-03: JSON-LD contract tests pass and include consistent snapshot semantics.
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02 covers criterion 2; TC-03 covers criterion 3.
  - **Validation type:** unit + contract + integration.
  - **Validation location/evidence:** schema tests, UI tests, no-JS HTML probe.
  - **Run/verify:** targeted schema/UI tests and route audit command.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Existing `seo-jsonld-contract.test.tsx` passed (4/4), but lacks snapshot-date assertions.
- **What would make this >=90%:** add explicit snapshot-date assertions in schema/UI contract tests.
- **Rollout / rollback:**
  - Rollout: deploy with staged content sanity check.
  - Rollback: revert snapshot/date updates in config + schema templates.
- **Documentation impact:**
  - Add social-proof data currency rule to content governance docs.

### BSS-05: Define SSR-safe strategy for query-param routes

- **Type:** INVESTIGATE
- **Deliverable:** route strategy note with exact remediations for `rooms`, `experiences`, `how-to-get-here`
- **Execution-Skill:** wf-replan
- **Affects:** `[readonly] apps/brikette/src/app/[lang]/rooms/page.tsx`, `[readonly] apps/brikette/src/app/[lang]/experiences/page.tsx`, `[readonly] apps/brikette/src/app/[lang]/how-to-get-here/page.tsx`, `[readonly] apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`, `[readonly] apps/brikette/src/routes/how-to-get-here/useDestinationFilters.ts`, `[readonly] packages/ui/src/organisms/RoomsSection.tsx`
- **Depends on:** BSS-01
- **Blocks:** BSS-06, BSS-07
- **Confidence:** 82%
  - Implementation: 84% — all bailout call sites are known.
  - Approach: 82% — strategy is clear but cross-route compatibility must be validated.
  - Impact: 82% — high-traffic routes, moderate blast radius.
- **Acceptance:**
  - Final strategy defines server-safe defaults and client enhancement boundaries per route.
  - Strategy includes fallback behavior for no-JS users.
  - Task confidence uplift criteria for BSS-06/BSS-07 are explicit.
- **Notes / references:**
  - `BAILOUT_TO_CLIENT_SIDE_RENDERING` evidence in current staging HTML.

### BSS-06: Remove `/en/rooms` initial-HTML bailout and ship SSR-first room body

- **Type:** IMPLEMENT
- **Deliverable:** `/en/rooms` initial HTML has meaningful room body (heading/cards/CTA path) and no bailout marker
- **Execution-Skill:** wf-build
- **Affects:** `apps/brikette/src/app/[lang]/rooms/page.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`
- **Depends on:** BSS-05
- **Blocks:** BSS-10
- **Confidence:** 83%
  - Implementation: 85% — single consumer confirmed, `useSearchParams` scope narrowed to booking params only, `roomsData` is static import.
  - Approach: 83% — decomposition is concrete: server-render heading + room grid + structured data, progressive enhancement for booking params.
  - Impact: 83% — single consumer (`RoomsPageContent.tsx`), no cross-package regression, room filtering uses `useState` (not search params).
- **Acceptance:**
  - No `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker on `/en/rooms` initial HTML.
  - Initial HTML contains H1 and room listing/CTA content.
  - Query-param behavior still works after hydration.
- **Validation contract:**
  - TC-01: raw HTML probe for `/en/rooms` returns H1 count >=1.
  - TC-02: bailout marker absent from route HTML.
  - TC-03: booking CTA flow remains functional with query params (checkin/checkout/pax).
  - **Acceptance coverage:** TC-01/TC-02 cover criteria 1-2; TC-03 covers criterion 3.
  - **Validation type:** integration + e2e smoke.
  - **Validation location/evidence:** `apps/brikette/src/test/routes/rooms/ssr-contract.test.tsx` (new) + route probe in expanded audit script.
  - **Run/verify:** `pnpm --filter @apps/brikette test -- --testPathPattern="rooms/ssr-contract"` + audit script route check.
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** staged A/B evidence of equal conversion funnel continuity after SSR shift.
- **Rollout / rollback:**
  - Rollout: staging-first verify with updated audit contract.
  - Rollback: revert rooms route strategy changes.
- **Documentation impact:**
  - Update route rendering guidance for query-driven pages.

#### Re-plan Update (2026-02-10)
- **Previous confidence:** 79%
- **Updated confidence:** 83%
  - **Evidence class:** E1 (static code audit)
  - Implementation: 81% → 85% — consumer audit: `RoomsSection` has single real consumer (`apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx`). Re-export in `apps/brikette/src/components/rooms/RoomsSection.tsx` is pass-through only. `useSearchParams()` at `packages/ui/src/organisms/RoomsSection.tsx:24-28` reads only `checkin`, `checkout`, `pax` booking params — NOT used for room filtering. Room filtering uses `useState<RoomFilter>("all")` at line 30. `roomsData` is a static import — room grid is server-renderable.
  - Approach: 79% → 83% — decomposition strategy confirmed: extract `<h1>` + `RoomsStructuredData` + room grid rendering to server component; wrap only booking-param-dependent rate/link behavior in a smaller client Suspense boundary. Default state (all rooms, today's dates) is meaningful SSR content.
  - Impact: 79% → 83% — single consumer confirmed, no cross-package blast radius. Room filtering (`useState`) unaffected by SSR shift. Booking CTA flow preserved as progressive enhancement.
- **Investigation performed:**
  - Repo: `packages/ui/src/organisms/RoomsSection.tsx` (useSearchParams scope, useState filter, roomsData import), `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` (component structure), `apps/brikette/src/app/[lang]/rooms/page.tsx` (Suspense boundary), `apps/brikette/src/components/rooms/RoomsSection.tsx` (re-export)
  - Consumer audit: `rg "RoomsSection" --glob "**/*.{tsx,ts}"` → single real consumer + barrel exports
  - Pattern: analogous to `/en/book` page which already uses `Suspense` + `useSearchParams` client component
- **Decision / resolution:**
  - BSS-06 can proceed with E1 evidence alone. The rooms route's `useSearchParams` scope is narrower than initially assumed (booking params only, not filtering). Dependency on BSS-05 retained for cross-route consistency, but rooms-specific implementation risk is resolved.

### BSS-07: Remove `/en/experiences` and `/en/how-to-get-here` bailouts, ship SSR-first bodies

- **Type:** IMPLEMENT
- **Deliverable:** both routes serve meaningful SSR body content and no bailout marker in initial HTML
- **Execution-Skill:** wf-build
- **Affects:** `apps/brikette/src/app/[lang]/experiences/page.tsx`, `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx`, `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`, `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`, `apps/brikette/src/routes/how-to-get-here/useDestinationFilters.ts`
- **Depends on:** BSS-05
- **Blocks:** BSS-10
- **Confidence:** 76% (→82% with BSS-05 evidence)
  - Implementation: 79% — both routes' data sources confirmed static (`GUIDES_INDEX`, translation JSON). `useSearchParams` scope mapped. Default states (no params) produce meaningful content.
  - Approach: 76% — shared pattern confirmed (server-render default state, filter as progressive enhancement), but cross-route decomposition details still need BSS-05 formal strategy.
  - Impact: 76% — `GroupedGuideCollection` and `useDestinationFilters` are primary integration points. How-to-get-here has deeper toolbar/dialog integration than experiences.
- **Acceptance:**
  - `/en/experiences` initial HTML has H1 and guide/index body links.
  - `/en/how-to-get-here` initial HTML has H1 and transport-guide index links.
  - Bailout markers are absent for both routes in initial HTML.
- **Validation contract:**
  - TC-01: `/en/experiences` raw HTML has H1 >=1 and no bailout marker.
  - TC-02: `/en/how-to-get-here` raw HTML has H1 >=1 and no bailout marker.
  - TC-03: experiences topic filter interaction preserves guide listing after hydration.
  - TC-04: how-to-get-here destination/transport filter interaction preserves route listing after hydration.
  - TC-05: experiences FAQ and CTA sections render in initial HTML without search-param dependency.
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02 covers criterion 2; TC-03/TC-04 cover criterion 3; TC-05 covers criterion 1.
  - **Validation type:** integration + e2e.
  - **Validation location/evidence:** `apps/brikette/src/test/routes/experiences/ssr-contract.test.tsx` (new) + `apps/brikette/src/test/routes/how-to-get-here/ssr-contract.test.tsx` (new) + route probe in expanded audit script.
  - **Run/verify:** `pnpm --filter @apps/brikette test -- --testPathPattern="(experiences|how-to-get-here)/ssr-contract"` + audit script route checks.
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** post-implementation run evidence across 10 consecutive staging audits with no regressions.
- **Rollout / rollback:**
  - Rollout: staged deploy with explicit route-by-route signoff.
  - Rollback: revert route-level strategy changes for affected pages.
- **Documentation impact:**
  - Update transport/experiences route rendering conventions.

#### Re-plan Update (2026-02-10)
- **Previous confidence:** 74%
- **Updated confidence:** 76% (→82% conditional on BSS-05)
  - Confidence cannot be promoted to ≥80% until BSS-05 strategy completes and provides unified decomposition approach.
  - **Evidence class:** E1 (static code audit)
  - Implementation: 77% → 79% — confirmed: experiences uses `useSearchParams()` at `ExperiencesPageContent.tsx:109` for `topic`/`tag` params only. Guide data from static `GUIDES_INDEX` import. Default state (no params) renders all guides grouped by topic — this IS the SEO-meaningful content. How-to-get-here uses `useDestinationFilters` (`useDestinationFilters.ts:70`) for transport/direction/destination filters. Default state: all "all" → shows all destination sections. Content from `useHowToGetHereContent()` uses only `useTranslation` — no other client-side dependencies.
  - Approach: 74% → 76% — shared pattern confirmed across both routes: default state (no search params) = meaningful SSR content, filters = progressive enhancement. However, how-to-get-here has significantly deeper integration (toolbar, filters dialog, highlighted route, scroll-to behavior) compared to experiences. BSS-05 strategy needed to formalize the decomposition boundary, especially for the toolbar/dialog interaction pattern.
  - Impact: 74% → 76% — integration points mapped: `GroupedGuideCollection` (`useSearchParams` at `GroupedGuideCollection.tsx:68`), `GuideCollection` (`useSearchParams` at `GuideCollection.tsx:79`), `TagFilterBar` (`useSearchParams` at `TagFilterBar.tsx:22`), `useDestinationFilters` (`useSearchParams` at `useDestinationFilters.ts:70`). How-to-get-here has deeper regression surface due to toolbar + filters dialog + route picker interaction.
- **Investigation performed:**
  - Repo: `ExperiencesPageContent.tsx` (full read — hero/guides/FAQ/CTA structure), `HowToGetHereIndexContent.tsx` (full read — header/toolbar/intro/destinations/rome/experiences/filters), `useDestinationFilters.ts` (full read — filter state management), `useHowToGetHereContent.ts` (full read — content normalization from i18n)
  - `useSearchParams` audit: `rg "useSearchParams" apps/brikette/src` → 12 call sites mapped across 10 files
  - Data source check: `GUIDES_INDEX` is static build-time import; how-to-get-here content is i18n JSON
- **Decision / resolution:**
  - Keep as single L task — both routes share the same SSR pattern and benefit from BSS-05's unified strategy. Experiences is simpler (similar to rooms pattern) while how-to-get-here is genuinely complex, which correctly justifies L effort.
  - Test contract expanded from 3 TCs to 5 TCs per L-effort requirement.

### BSS-08: Expand user-testing audit for no-JS SSR/SEO checks and newest staging URL selection

- **Type:** IMPLEMENT
- **Deliverable:** audit skill/tooling enforces raw-HTML checks and automatically targets newest staging preview URL
- **Execution-Skill:** wf-build
- **Affects:** `.claude/skills/meta-user-test/SKILL.md`, `.claude/skills/meta-user-test/scripts/resolve-brikette-staging-url.mjs`, `.claude/skills/meta-user-test/scripts/run-meta-user-test.mjs`, `.claude/skills/meta-user-test/references/report-template.md`
- **Depends on:** BSS-01
- **Blocks:** BSS-09
- **Confidence:** 85%
  - Implementation: 87% — skill/scripts already exist and were used in prior runs.
  - Approach: 85% — adding deterministic no-JS predicates directly targets observed gap.
  - Impact: 85% — improves detection quality with low app runtime risk.
- **Acceptance:**
  - Audit output includes explicit no-JS checks for key leakage, bailout markers, H1 presence, deals parity, and social-proof snapshot/date coverage.
  - Audit uses newest Cloudflare staging deployment by default.
  - SEO/Lighthouse checks remain included and labeled separately from no-JS checks.
- **Validation contract:**
  - TC-01: audit run fails when key-token pattern exists in homepage initial HTML.
  - TC-02: audit run fails when bailout markers/H1 predicates fail on top-nav routes.
  - TC-03: audit run reports SEO/Lighthouse and no-JS results in separate sections.
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02 covers criteria 1-2; TC-03 covers criterion 3.
  - **Validation type:** integration (script-level).
  - **Validation location/evidence:** generated audit markdown/json artifacts in `docs/audits/user-testing/`.
  - **Run/verify:** execute updated meta-user-test pipeline against staging URL.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Existing audit report currently shows false-green; gap confirmed by manual probe.
- **What would make this >=90%:** two consecutive staging audits where introduced synthetic failures are correctly detected.
- **Rollout / rollback:**
  - Rollout: merge skill/script updates with docs.
  - Rollback: revert audit script changes only.
- **Documentation impact:**
  - Update skill instructions and report template in the same change.

### BSS-09: Add regression tests for i18n/deals/social-proof contracts

- **Type:** IMPLEMENT
- **Deliverable:** automated tests cover the fixed issue classes at unit/integration/contract layers
- **Execution-Skill:** wf-build
- **Affects:** `apps/brikette/src/test/**/*`, `packages/ui/src/**/*.test.tsx`, `scripts/**` (if audit check harness assertions are added)
- **Depends on:** BSS-02, BSS-03, BSS-04, BSS-08, BSS-10
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 82% — test patterns and file locations now mapped to existing infrastructure.
  - Approach: 80% — existing contract test templates (`seo-jsonld-contract.test.tsx`, `raw-content-key-tokens.test.ts`) provide clear patterns to follow.
  - Impact: 80% — test additions follow existing directory structure, no architectural risk.
- **Acceptance:**
  - New tests fail against pre-fix behavior and pass against fixed behavior.
  - Tests include no-JS content contract checks for target routes.
  - CI-targeted test guidance remains performant and scoped.
- **Validation contract:**
  - TC-01: homepage route contract test fails on key-token leakage.
  - TC-02: deals metadata/body contract test enforces state parity.
  - TC-03: social-proof snapshot/date contract test covers UI + schema.
  - TC-04: audit-script integration test validates no-JS predicate enforcement.
  - **Acceptance coverage:** TC-01 covers criterion 1; TC-02/TC-03 cover criterion 2; TC-04 covers criterion 3.
  - **Validation type:** unit + integration + contract.
  - **Validation location/evidence:**
    - TC-01: `apps/brikette/src/test/content-readiness/i18n/homepage-key-leakage.test.ts` (new, neighbors `raw-content-key-tokens.test.ts`)
    - TC-02: `apps/brikette/src/test/components/deals-page.test.tsx` (extend existing with state-parity assertions)
    - TC-03: `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx` (extend existing with snapshot-date assertions)
    - TC-04: `.claude/skills/meta-user-test/scripts/__tests__/no-js-predicates.test.ts` (new)
  - **Run/verify:** `pnpm --filter @apps/brikette test -- --testPathPattern="homepage-key-leakage|deals-page|seo-jsonld-contract"` + `pnpm --filter @apps/brikette test -- --testPathPattern="no-js-predicates"`
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** stable 10-run CI signal with no flaky failures.
- **Rollout / rollback:**
  - Rollout: add in phased manner with focused patterns.
  - Rollback: isolate flaky additions and keep deterministic subset.
- **Documentation impact:**
  - Update testing policy notes for no-JS route contracts.

#### Re-plan Update (2026-02-10)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - **Evidence class:** E1 (static code audit)
  - Implementation: 80% → 82% — mapped test infrastructure: 80+ existing test files in `apps/brikette/src/test/` with clear subdirectory conventions (content-readiness, components, routes, lib). Existing contract tests provide templates: `seo-jsonld-contract.test.tsx` (4 tests), `i18n-parity-quality-audit.test.ts` (2 tests), `raw-content-key-tokens.test.ts`, `deals-page.test.tsx`.
  - Approach: 78% → 80% — existing test patterns confirm the approach: contract tests use static data assertions (no runtime dependency), content-readiness tests use file-based validation. Each TC maps to a proven pattern.
  - Impact: 78% → 80% — test additions follow existing directory structure. No architectural changes to test infrastructure needed. Extensions to existing files (`deals-page.test.tsx`, `seo-jsonld-contract.test.tsx`) carry lowest integration risk.
- **Investigation performed:**
  - Repo: `apps/brikette/src/test/` (full directory listing — 80+ test files mapped)
  - Existing patterns: `seo-jsonld-contract.test.tsx` (contract pattern), `raw-content-key-tokens.test.ts` (content-readiness pattern), `deals-page.test.tsx` (component test pattern), `experiences-page.test.tsx` (route component pattern)
  - Test location decisions: new files placed alongside existing neighbors; extensions to existing files where contract scope overlaps
- **Decision / resolution:**
  - Specific test file locations locked down. TC-01 through TC-04 each have a concrete file path (2 new files, 2 extensions to existing). Run commands specified per test pattern.

### BSS-10: Horizon checkpoint — reassess remaining plan

- **Type:** CHECKPOINT
- **Deliverable:** confidence re-score and sequence adjustment after top-nav SSR hardening
- **Execution-Skill:** wf-replan
- **Affects:** `docs/plans/brikette-ssr-seo-signal-hardening-plan.md`
- **Depends on:** BSS-06, BSS-07
- **Blocks:** BSS-09
- **Confidence:** 95%
  - Implementation: 95% — checkpoint process is deterministic.
  - Approach: 95% — reduces long-chain risk before final regression net closure.
  - Impact: 95% — planning-only gate with high leverage.
- **Acceptance:**
  - Re-score BSS-09 using concrete evidence from BSS-06/BSS-07.
  - Confirm or revise any remaining implementation path.
  - Document revised risk and confidence notes in Decision Log.

## Risks & Mitigations

- Risk: route SSR changes break filter UX.
  - Mitigation: BSS-05 strategy first, then route-specific implementation with interaction smoke tests.
- Risk: audit remains falsely green despite regressions.
  - Mitigation: BSS-08 no-JS predicate checks and fixture-based assertions.
- Risk: social-proof policy creates conflicting UI/schema semantics.
  - Mitigation: BSS-04 enforces single snapshot policy across all surfaces.
- Risk: scope creep into unrelated SEO subsystems.
  - Mitigation: non-goals and strict route/surface boundaries.

## Observability

- Track per-run no-JS predicates:
  - key-token leakage count
  - bailout marker count by route
  - H1 presence on key routes
  - deals metadata/body parity result
  - social-proof snapshot/date parity result
- Track SEO/Lighthouse summary separately from no-JS predicates to avoid false confidence.

## Acceptance Criteria (overall)

- Deterministic no-JS HTML checks pass for targeted routes on staging.
- Homepage initial HTML contains resolved localized copy for hero/section core text.
- Top-nav routes render meaningful initial HTML content without bailout markers.
- Deals metadata accurately represents rendered deal state.
- Social-proof snapshot policy is dated and consistent (November 2025) across UI and schema.
- Regression tests and expanded audit automation catch these classes of failures going forward.

## Decision Log

- 2026-02-10: Enforced strict TDD gate for all IMPLEMENT tasks (mandatory red proof before code edits, plus i18n SSR raw-HTML checks).

- 2026-02-10: Selected server-first route strategy (Option A) over placeholder-only CSR fallback.
- 2026-02-10: Kept top-nav route hardening split with a prerequisite strategy task (BSS-05) due confidence below build threshold.
- 2026-02-10: Adopted dated social-proof snapshot policy (November 2025) as requested.
- 2026-02-10: Added explicit CHECKPOINT before final regression-net closure to prevent long-chain planning drift.
- 2026-02-10 (wf-replan): BSS-06 promoted 79%→83% via E1 code audit (single consumer, static data, narrow useSearchParams scope). BSS-07 updated 74%→76% with tightened evidence and expanded test contract (5 TCs for L effort); conditional target →82% on BSS-05 confirmed credible. BSS-09 promoted 78%→80% via E1 test infrastructure mapping.

## Overall-confidence calculation

Task confidence × effort weight:
- BSS-01 88 × 1 = 88
- BSS-02 83 × 2 = 166
- BSS-03 86 × 2 = 172
- BSS-04 84 × 2 = 168
- BSS-05 82 × 2 = 164
- BSS-06 83 × 2 = 166
- BSS-07 76 × 3 = 228
- BSS-08 85 × 2 = 170
- BSS-09 80 × 2 = 160
- BSS-10 95 × 1 = 95

Total weighted score = 1577
Total weight = 19
Overall-confidence = 1577 / 19 = 83.0% -> 83%

## Build Gate View

### Additional TDD release gate

- For each IMPLEMENT task, execution evidence must include:
  1. Red proof (failing test run for that task TC scope)
  2. Green proof (same scope passing)
  3. Refactor proof (same scope still passing after cleanup)
- Any task missing red proof is not eligible for merge, even if final tests are green.

Ready (>=80 IMPLEMENT):
- BSS-02, BSS-03, BSS-04, BSS-06, BSS-08, BSS-09

Caution (60-79 IMPLEMENT):
- BSS-07 (76%, conditional →82% on BSS-05)

Blocked (<80 by prerequisite confidence condition):
- BSS-07 requires BSS-05 outputs for confidence uplift.

Recommended next action:
- Start `/wf-build` with Wave 1 (BSS-01) then Wave 2 (BSS-02/BSS-03/BSS-04/BSS-05/BSS-08 in parallel). BSS-06 is ready for Wave 3 after BSS-05. BSS-07 remains conditional — promote after BSS-05 completion via `/wf-replan`.
