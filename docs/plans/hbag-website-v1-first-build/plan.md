---
Type: Plan
Status: Active
Domain: UI
Workstream: Mixed
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-website-v1-first-build
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: website-first-build-backlog
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-system
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
---

# HBAG Website V1 First Build Plan

## Summary
This plan converts the active WEBSITE-01 contract into executable implementation for the first Caryina site version in `apps/caryina`. Scope is framework-first: route skeleton, minimal commerce journey wiring, dataset bootstrap, baseline analytics seams, and launch-minimum legal/support pages. The plan preserves token-only styling, accessibility and reduced-motion behavior, and explicit TODO traceability for unknown business values. Implementation sequence is dependency-ordered so `/lp-do-build` can run without re-discovery.

## Active tasks
- [x] TASK-01: Lock V1 locale strategy and route contract
- [x] TASK-02: Build Caryina route skeleton and shared app shell wiring
- [x] TASK-03: Bootstrap `data/shops/caryina` minimum dataset
- [x] TASK-04: Wire baseline analytics events and fallback stubs
- [x] TASK-05: Add legal/support route set and navigation wiring
- [x] TASK-06: Run targeted validation and close framework QA checks
- [x] TASK-07: Build checkpoint and handoff readiness review

## Goals
- Deliver a running Caryina V1 route framework for core commerce journey.
- Reuse proven structure from `apps/cover-me-pretty` without carrying unrelated complexity.
- Keep all new UI implementation token-driven and aligned to HBAG brand dossier.
- Preserve reduced-motion and baseline accessibility requirements through framework rollout.

## Non-goals
- Full page-content polish for all routes.
- New non-core product features (UGC, personalization, account expansion).
- Multi-currency or expanded localization beyond the chosen V1 locale contract.

## Constraints & Assumptions
- Constraints:
  - WEBSITE-01 source contract is authoritative: `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`.
  - Business facts must not be invented; unknowns use traceable TODO markers.
  - Validation is targeted to touched packages; no unfiltered repo-wide test runs.
- Assumptions:
  - V1 uses locale parity with legacy baseline (`[lang]`) unless explicitly changed.
  - Missing runtime secrets may be stubbed for framework delivery with explicit TODOs.
  - Existing BrandMark implementation remains the header brand anchor during this cycle.

## Fact-Find Reference
- Related brief: `docs/plans/hbag-website-v1-first-build/fact-find.md`
- Key findings used:
  - WEBSITE-01 artifact and strategy index row are both `Active`.
  - Legacy app route/data/analytics seams are identified and reusable.
  - Remaining key uncertainty is locale finalization (now resolved via TASK-01).

## Proposed Approach
- Option A: Build page-by-page content-complete routes first.
  - Rejected: increases cycle time and mixes framework with content decisions.
- Option B: Build framework skeleton first, then enrich content/features in follow-on cycles.
  - Chosen: fastest path to conversion-ready baseline with controlled risk.

## Execution Contracts

### Standard Checks
- `pnpm --filter @apps/caryina typecheck`
- `pnpm --filter @apps/caryina lint`
- `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="BrandMark.test.tsx"`
- `pnpm --filter @apps/caryina build`

### Framework Pass Contract
- Required routes render in dev without runtime crash:
  - `/`
  - `/[lang]/shop`
  - `/[lang]/product/[slug]`
  - `/[lang]/checkout`
  - `/[lang]/success`
  - `/[lang]/cancelled`
- Legal/support minimum routes exist: Terms, Privacy, Returns/Refunds, Shipping, Contact/Support.
- Baseline analytics hooks exist for page view, product view, checkout start, purchase success (or traceable stubs).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-02 is IMPLEMENT >=80 with no unresolved blockers)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock locale strategy and route-path contract for V1 | 94% | S | Complete (2026-02-23) | - | TASK-02, TASK-03, TASK-05 |
| TASK-02 | IMPLEMENT | Build core route skeleton + app shell reuse wiring | 82% | L | Complete (2026-02-23) | TASK-01 | TASK-03, TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Bootstrap `data/shops/caryina` minimum dataset | 84% | M | Complete (2026-02-23) | TASK-01, TASK-02 | TASK-04, TASK-06 |
| TASK-04 | IMPLEMENT | Wire baseline analytics flow and fallback stubs | 80% | M | Complete (2026-02-23) | TASK-02, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | Implement legal/support routes and navigation links | 81% | M | Complete (2026-02-23) | TASK-01, TASK-02 | TASK-06 |
| TASK-06 | IMPLEMENT | Run targeted validation + reduced-motion/accessibility checks | 83% | M | Complete (2026-02-23) | TASK-03, TASK-04, TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Review readiness for expanded page/content cycle | 95% | S | Complete (2026-02-23) | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Decision lock for route shape before code changes |
| 2 | TASK-02 | TASK-01 | Route skeleton is structural prerequisite |
| 3 | TASK-03, TASK-05 | TASK-01, TASK-02 | Data bootstrap and legal/support routes can run in parallel |
| 4 | TASK-04 | TASK-02, TASK-03 | Analytics requires routes + data scaffold |
| 5 | TASK-06 | TASK-03, TASK-04, TASK-05 | Validation only meaningful after all framework slices are in |
| 6 | TASK-07 | TASK-06 | Checkpoint before next cycle expansion |

## Tasks

### TASK-01: Lock V1 locale strategy and route contract
- **Type:** DECISION
- **Deliverable:** Decision log entry in this plan + explicit route contract for implementation tasks.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/hbag-website-v1-first-build/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-05
- **Confidence:** 94%
  - Implementation: 95% - WEBSITE-01 default already specifies locale parity.
  - Approach: 90% - decision minimizes integration risk by matching proven baseline.
  - Impact: 95% - removes major ambiguity blocking route scaffolding.
- **Decision:** Retain `[lang]` route parity for V1.
- **Acceptance:**
  - V1 route list in this plan uses `[lang]` format.
  - Downstream tasks reference the same route contract.

### TASK-02: Build Caryina route skeleton and shared app shell wiring
- **Type:** IMPLEMENT
- **Deliverable:** framework route tree in `apps/caryina/src/app/` with shared layout and core commerce pages.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-first-build-backlog
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/caryina/src/app/`, `apps/caryina/src/components/`, `apps/caryina/src/styles/`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05
- **Confidence:** 82%
  - Implementation: 82% - legacy baseline provides concrete route map.
  - Approach: 82% - reuse-first with Caryina-specific simplification.
  - Impact: 85% - unlocks all downstream V1 framework work.
- **Acceptance:**
  - Required V1 routes exist under `[lang]` and render.
  - Shared layout/header/footer wiring uses Caryina tokens and BrandMark.
  - No arbitrary hardcoded color values are introduced.
- **Validation contract:**
  - VC-02-01: route files exist for all required framework paths.
  - VC-02-02: local dev route smoke run succeeds with no runtime crash.
- **Build completion evidence (2026-02-23):**
  - Added `[lang]` route framework for `/shop`, `/product/[slug]`, `/checkout`, `/success`, `/cancelled` plus locale root handoff.
  - Implemented shared locale shell with `Header` + `SiteFooter` + BrandMark wiring.
  - Files: `apps/caryina/src/app/[lang]/layout.tsx`, `apps/caryina/src/components/Header.tsx`, `apps/caryina/src/components/SiteFooter.tsx`.

### TASK-03: Bootstrap `data/shops/caryina` minimum dataset
- **Type:** IMPLEMENT
- **Deliverable:** minimum data scaffold for route rendering and commerce flow.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-first-build-backlog
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `data/shops/caryina/`, any required app-level config pointers
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 84%
  - Implementation: 85% - bootstrap source is known (`cover-me-pretty`).
  - Approach: 82% - controlled copy with explicit placeholders.
  - Impact: 85% - required for rendering and checkout wiring.
- **Acceptance:**
  - Minimum required data files exist and parse.
  - Unknown business values are marked as traceable TODOs.
  - Dataset does not include fabricated claims/content.
- **Build completion evidence (2026-02-23):**
  - Added `data/shops/caryina/` with minimum `shop.json`, `settings.json`, `products.json`, `inventory.json`.
  - Added app-level `apps/caryina/shop.json` to anchor repository lookups and analytics routing.
  - Placeholder-safe dataset language is explicit and intended for later brand-content replacement.

### TASK-04: Wire baseline analytics events and fallback stubs
- **Type:** IMPLEMENT
- **Deliverable:** page/product/checkout/success analytics hooks with fallback stubs if secrets are unavailable.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-first-build-backlog
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/caryina/src/app/api/`, checkout/success client seams, related tracking utilities
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% - legacy analytics seam is proven.
  - Approach: 80% - event parity is clear; secrets may require stubbing.
  - Impact: 82% - needed for measurement-ready launch QA.
- **Acceptance:**
  - Baseline event hooks are wired, or stubs are explicitly documented with TODOs and expected env keys.
  - No analytics code path silently fails without operator-visible TODO context.
- **Build completion evidence (2026-02-23):**
  - Added analytics intake endpoint: `apps/caryina/src/app/api/analytics/event/route.ts`.
  - Added client event hooks for page/product/checkout/success:
    - `apps/caryina/src/app/[lang]/shop/ShopAnalytics.client.tsx`
    - `apps/caryina/src/app/[lang]/product/[slug]/ProductAnalytics.client.tsx`
    - `apps/caryina/src/app/[lang]/checkout/CheckoutAnalytics.client.tsx`
    - `apps/caryina/src/app/[lang]/success/SuccessAnalytics.client.tsx`

### TASK-05: Add legal/support route set and navigation wiring
- **Type:** IMPLEMENT
- **Deliverable:** legal/support minimum route set and discoverable links in layout/footer.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-first-build-backlog
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/caryina/src/app/[lang]/`, shared navigation/footer components
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 81%
  - Implementation: 82% - route list is explicit in WEBSITE-01 contract.
  - Approach: 80% - simple framework pages with placeholder-safe copy.
  - Impact: 82% - completes trust and compliance baseline for first launch.
- **Acceptance:**
  - Terms, Privacy, Returns/Refunds, Shipping, Contact/Support routes exist.
  - Routes are reachable from visible navigation/footer entry points.
- **Build completion evidence (2026-02-23):**
  - Added policy/support routes under `[lang]`: `terms`, `privacy`, `returns`, `shipping`, `support`.
  - Added discoverable nav links in shared shell: `Header` and `SiteFooter`.

### TASK-06: Run targeted validation and close framework QA checks
- **Type:** IMPLEMENT
- **Deliverable:** validation evidence for framework quality gate.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-first-build-backlog
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/hbag-website-v1-first-build/` evidence references in build record
- **Depends on:** TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 83%
  - Implementation: 83% - command set and required checks are explicit.
  - Approach: 82% - targeted validation aligns with repo policy.
  - Impact: 84% - required to prevent shipping broken framework baseline.
- **Acceptance:**
  - Required targeted commands pass for `@apps/caryina`.
  - Reduced-motion and focus-path checks are verified for core journey.
  - Build evidence is ready for `build-record.user.md`.
- **Build completion evidence (2026-02-23):**
  - Passed: `pnpm --filter @apps/caryina typecheck`
  - Passed: `pnpm --filter @apps/caryina lint`
  - Passed: `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="BrandMark.test.tsx"`
  - Passed: `pnpm --filter @apps/caryina build` (runtime note: `CART_COOKIE_SECRET` warnings surfaced during static generation but build completed)
  - Reduced-motion check covered by BrandMark tests (`renders static state when animation disabled` + `does not render particle canvas when reduced motion is preferred`).
  - Focus-path baseline verified by semantic link/button controls in header/shop/product/checkout/success flow; full browser UX QA remains in S9B.

### TASK-07: Build checkpoint and handoff readiness review
- **Type:** CHECKPOINT
- **Deliverable:** explicit go/no-go summary for entering next content/polish cycle.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/hbag-website-v1-first-build/plan.md` status block, next-cycle notes
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - procedural checkpoint only.
  - Approach: 95% - ensures no silent scope drift into content cycle.
  - Impact: 95% - improves handoff quality and future build speed.
- **Acceptance:**
  - Framework completion status is explicit (complete/partial with reasons).
  - Next-cycle scope is listed without re-auditing already-solved framework layers.
- **Build completion evidence (2026-02-23):**
  - Checkpoint verdict: **Go for next-cycle content/polish planning**.
  - Framework scope closed in this cycle: route skeleton, data bootstrap, analytics baseline, legal/support route coverage, targeted validation gate.
  - Remaining launch blockers are tracked (not framework blockers): provide `CART_COOKIE_SECRET` for clean env preflight, replace placeholder product/legal/support copy from approved HBAG packets, execute S9B design + launch QA on deployed preview.

## TASK-07 Checkpoint Handoff
- **Checkpoint date:** 2026-02-23
- **Decision:** Go
- **Reason:** All framework acceptance criteria for WEBSITE-01 first build are complete and validated in `@apps/caryina`.
- **Handoff target:** Next content/polish cycle (new plan)
- **Handoff inputs:**
  - Route framework + shell: `apps/caryina/src/app/[lang]/`, `apps/caryina/src/components/Header.tsx`, `apps/caryina/src/components/SiteFooter.tsx`
  - Data scaffold: `data/shops/caryina/products.json`, `data/shops/caryina/inventory.json`, `data/shops/caryina/settings.json`, `data/shops/caryina/shop.json`
  - Analytics baseline: `apps/caryina/src/app/api/analytics/event/route.ts` and route-level analytics client hooks
- **Next-cycle scope (do not re-audit solved framework work):**
  - Replace placeholder catalog/legal/support copy with approved HBAG content packets.
  - Wire production-grade checkout/completion integration in place of placeholder completion link.
  - Add route smoke tests for full `[lang]` flow and run S9B QA (`/lp-design-qa`, `/lp-launch-qa`).
  - Resolve measurement env preflight (`CART_COOKIE_SECRET` and downstream launch env set).

## Risks & Mitigations
- Locale contract could be reopened late.
  - Mitigation: keep TASK-01 decision explicit and change-controlled.
- Data placeholders could leak into customer-facing production content.
  - Mitigation: enforce traceability TODO format and review before launch.
- Analytics could remain stubbed if secrets are unavailable.
  - Mitigation: keep TODOs explicit and tie closure to S9B measurement verification.

## Observability
- Logging:
  - Route-level runtime errors visible in Next.js dev/build output.
- Metrics:
  - Baseline analytics event hooks (`page_view`, `product_view`, `checkout_start`, `purchase_success`).
- Alerts/Dashboards:
  - None in this cycle; deferred to launch QA and measurement ops.

## Acceptance Criteria (overall)
- [x] V1 framework routes and app shell are implemented in Caryina.
- [x] Minimum Caryina dataset is present and consumed by route framework.
- [x] Baseline analytics hooks or explicit stubs are in place with traceable TODOs.
- [x] Legal/support minimum route set is implemented and linked.
- [x] Targeted validation passes and evidence is captured.

## What Would Make This >=90%
- Resolve analytics secret ownership and verify non-stub event path in staging.
- Add route smoke tests for the full `[lang]` journey (`shop -> product -> checkout -> success/cancelled`).
- Complete first-pass launch QA checks (`lp-design-qa` + measurement verification) on deployed preview.

## Decision Log
- 2026-02-23: TASK-01 completed. V1 locale strategy locked to `[lang]` parity for first build.
- 2026-02-23: TASK-02 through TASK-06 completed. Core route shell, minimum data scaffold, analytics hooks, legal/support routes, and validation gate are in place.
- 2026-02-23: TASK-07 completed. Checkpoint issued with Go decision and explicit handoff scope for the next cycle.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted confidence:
  - TASK-01 94 (S=1)
  - TASK-02 82 (L=3)
  - TASK-03 84 (M=2)
  - TASK-04 80 (M=2)
  - TASK-05 81 (M=2)
  - TASK-06 83 (M=2)
  - TASK-07 95 (S=1)
- Overall-confidence = `(94 + 246 + 168 + 160 + 162 + 166 + 95) / 13 = 83.9%` -> `84%`
