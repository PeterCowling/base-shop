---
Type: Plan
Status: Complete
Domain: UI
Workstream: Mixed
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-website-02-image-first-upgrade
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: website-upgrade-backlog
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-qa, lp-design-system
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
---

# HBAG WEBSITE-02 Image-First Upgrade Plan

## Summary
This plan translates the active HBAG WEBSITE-02 L1 Build 2 brief into an executable image-first implementation sequence for Caryina. The sequence front-loads decision lock and data/media contracts, then applies homepage/PLP/PDP upgrades, and closes with validation plus checkpoint reassessment. Scope is constrained to app-level UX and media contracts in `apps/caryina` with no architecture migration. The plan preserves accessibility and reduced-motion baseline behavior while defining measurable media and performance outcomes.

## Active tasks
- [x] TASK-01: Lock launch media contract defaults (shot-pack + family anchors)
- [x] TASK-02: Implement typed media schema and launch completeness validator
- [x] TASK-03: Rebuild homepage and PLP as image-first surfaces
- [x] TASK-04: Implement deterministic PDP gallery and accessibility behavior
- [x] TASK-05: Establish media production/QA operating contract artifact
- [x] TASK-06: Add media-focused test/performance validation package
- [x] TASK-07: Horizon checkpoint and downstream reassessment

## Goals
- Deliver image-first homepage/PLP/PDP implementation contracts for launch-ready Caryina merchandising.
- Enforce deterministic media completeness so launch variants do not ship with inconsistent gallery depth.
- Add validation evidence (tests, accessibility checks, performance budget checks) for upgraded surfaces.

## Non-goals
- Full business copy rewrite for all HBAG pages.
- CMS migration or new platform architecture.
- Advanced media features deferred by brief classification (`video-heavy`, `3D/AR`).

## Constraints & Assumptions
- Constraints:
  - Must preserve token-driven styling and active HBAG brand language.
  - Must preserve semantic/accessibility behavior (`aria`, keyboard, reduced-motion compatibility).
  - Must keep implementation within current `apps/caryina` architecture and repo validation policy.
- Assumptions:
  - Default launch media contract starts with 6 mandatory slots per SKU unless operator overrides.
  - Existing data ingestion path can carry typed media metadata without platform-core rewrite.
  - Media asset production runs in parallel and can satisfy implementation deadlines.

## Fact-Find Reference
- Related brief: `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`
- Key findings used:
  - Platform baseline and business upgrade brief prerequisites are active.
  - Current PLP/PDP implementation is text-forward and data `media` arrays are empty.
  - High-impact backlog is centered on schema/validator -> image-first UI -> validation package.

## Proposed Approach
- Option A:
  - Build image-first homepage, PLP, PDP directly with ad hoc media arrays and manual QA.
- Option B:
  - Lock media contract first, then implement surfaces against typed schema and validator gate.
- Chosen approach:
  - Option B. It reduces launch inconsistency risk and gives deterministic acceptance criteria for a high-variant catalog.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Complete (TASK-01 through TASK-07 executed and checkpointed)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock shot-pack and family-anchor defaults | 90% | S | Complete | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Typed media schema + launch completeness validator | 85% | M | Complete | TASK-01 | TASK-03, TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Homepage + PLP image-first implementation | 85% | M | Complete | TASK-01, TASK-02 | TASK-06 |
| TASK-04 | IMPLEMENT | PDP deterministic gallery + accessibility controls | 85% | M | Complete | TASK-01, TASK-02 | TASK-06 |
| TASK-05 | IMPLEMENT | Media production and QA operating contract artifact | 85% | M | Complete | TASK-01 | TASK-06 |
| TASK-06 | IMPLEMENT | Test/performance validation package + evidence capture | 85% | M | Complete | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Reassess downstream rollout from new evidence | 95% | S | Complete | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Decision lock first to avoid schema/UI churn |
| 2 | TASK-02 | TASK-01 | Contract foundation for all UI tasks |
| 3 | TASK-03, TASK-04, TASK-05 | TASK-01 and TASK-02 (TASK-05 only TASK-01) | UI and ops-contract work can proceed in parallel |
| 4 | TASK-06 | TASK-02, TASK-03, TASK-04, TASK-05 | Validation package requires all upstream implementations |
| 5 | TASK-07 | TASK-06 | Checkpoint before any scale-out or secondary enhancements |

## Tasks

### TASK-01: Lock launch media contract defaults (shot-pack + family anchors)
- **Type:** DECISION
- **Deliverable:** decision log update in `docs/plans/hbag-website-02-image-first-upgrade/plan.md` and finalized defaults for downstream IMPLEMENT tasks.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete
- **Touched:** `docs/plans/hbag-website-02-image-first-upgrade/plan.md`
- **Referenced:** `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`, `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% - decision options and evidence are already documented.
  - Approach: 90% - default assumptions are explicit and reversible.
  - Impact: 95% - resolves principal ambiguity for schema and acceptance contracts.
- **Options:**
  - Option A: 6 mandatory media slots + 3 launch family anchors.
  - Option B: 8 mandatory media slots + 4 launch family anchors.
- **Recommendation:** Option A for first build cycle; expand to Option B after checkpoint evidence.
- **Decision recorded:** Option A selected on 2026-02-23 (owner: Pete, via "continue/proceed" command path with documented default policy).
- **Acceptance:**
  - Decision is logged with selected default, date, and owner.
  - All downstream task acceptance criteria reflect selected default.
- **Validation contract:** Decision closure recorded in this plan and referenced in TASK-02/03/04/05 acceptance sections.
- **Planning validation:** Verified open-decision coverage in fact-find `## Questions`.
- **Completion evidence:**
  - Decision note captured in `## Decision Log` (2026-02-23 entries).
  - TASK-02 acceptance contract updated to enforce six required slots (`hero`, `angle`, `detail`, `on_body`, `scale`, `alternate`).
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update Decision Log in this plan and, if changed, update `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`.

### TASK-02: Implement typed media schema and launch completeness validator
- **Type:** IMPLEMENT
- **Deliverable:** code-change in Caryina data/media contract plus validator output for launch SKU readiness.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete
- **Touched:** `apps/caryina/src/lib/launchMediaContract.ts`, `apps/caryina/src/lib/launchMediaContract.test.ts`, `apps/caryina/scripts/validate-launch-media-contract.ts`, `apps/caryina/src/lib/shop.ts`, `apps/caryina/package.json`, `docs/plans/hbag-website-02-image-first-upgrade/plan.md`, `docs/plans/hbag-website-02-image-first-upgrade/build-record.user.md`
- **Referenced:** `data/shops/caryina/products.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 85% - current schema seam is explicit (`media: []` across SKU records).
  - Approach: 85% - deterministic validator design is straightforward and low-risk.
  - Impact: 90% - prevents inconsistent launch merchandising quality.
- **Acceptance:**
  - Typed media slot contract exists and is documented.
  - Validator fails on missing mandatory slots and reports missing slot by SKU.
  - Launch SKU subset can be validated in one deterministic command/report.
- **Validation contract (TC-02):**
  - TC-02-01: complete SKU media set -> validator returns pass.
  - TC-02-02: SKU missing required slot -> validator returns fail with explicit SKU + slot message.
  - TC-02-03: unknown slot type -> validator rejects with schema error.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: capture baseline showing empty/untypeable `media` arrays in current data.
  - Green evidence plan: run validator with at least one pass and one intentional fail fixture.
  - Refactor evidence plan: normalize utility naming and remove duplicated slot parsing logic.
- **Planning validation (required for M/L):**
  - Checks run: inspected `data/shops/caryina/products.json` and `apps/caryina/src/lib/shop.ts`.
  - Validation artifacts: fact-find evidence sections (`Data & Contracts`, `Coverage Gaps`), current SKU examples.
  - Unexpected findings: existing media arrays are consistently empty, reducing migration ambiguity.
- **Completion evidence (2026-02-23):**
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="launchMediaContract.test.ts"` -> pass (TC-02-01/02/03).
  - `pnpm --filter @apps/caryina typecheck` -> pass.
  - `pnpm --filter @apps/caryina lint` -> pass.
  - `pnpm --filter @apps/caryina validate:launch-media` -> fail as expected on current placeholder catalog; output lists missing required slots by SKU.
- **Scouts:** `None: media schema seam is directly observable`
- **Consumer tracing (required for M/L):**
  - New output `TypedMediaSlot[]` consumed by TASK-03 (PLP cards), TASK-04 (PDP gallery), TASK-06 (validation tests).
  - Modified behavior: `media` semantics move from generic array to typed sequence; all readers in `shop/page.tsx` and `product/[slug]/page.tsx` must be updated in downstream tasks.
  - Unchanged consumer note: checkout path remains unchanged because it does not consume media slots.
- **Edge Cases & Hardening:** duplicate slot types, missing alt metadata, unknown media role strings, locale fallback behavior for captions.
- **What would make this >=90%:**
  - Define and execute validator fixtures for at least 3 representative SKU patterns (complete, partial, malformed).
- **Rollout / rollback:**
  - Rollout: introduce schema utilities first; wire consumers in dependent tasks.
  - Rollback: revert consumer wiring to current `media` handling and disable validator gate temporarily.
- **Documentation impact:**
  - Add contract and validator usage notes to this plan and build record.
- **Notes / references:**
  - `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`
  - `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` (section L)

### TASK-03: Rebuild homepage and PLP as image-first surfaces
- **Type:** IMPLEMENT
- **Deliverable:** image-first homepage modules and dense PLP media-grid components in Caryina.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete
- **Touched:** `apps/caryina/src/app/[lang]/page.tsx`, `apps/caryina/src/app/[lang]/shop/page.tsx`, `apps/caryina/src/components/catalog/ProductMediaCard.tsx`, `apps/caryina/src/lib/launchMerchandising.ts`, `apps/caryina/src/styles/global.css`
- **Referenced:** `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - current PLP/home seams are simple and isolated.
  - Approach: 85% - clear acceptance targets from brief contract.
  - Impact: 90% - direct effect on first-impression quality and catalog scan speed.
- **Acceptance:**
  - Homepage first viewport is image-dominant and includes family entry links.
  - PLP supports 2-up mobile and 4-up desktop image-card grid with fixed ratio.
  - Secondary image behavior works for eligible SKUs and degrades safely where absent.
- **Validation contract (TC-03):**
  - TC-03-01: homepage renders image-first hero and family links on mobile/desktop layouts.
  - TC-03-02: PLP renders expected card density and fixed ratio across breakpoint snapshots.
  - TC-03-03: SKU lacking secondary image still renders usable card without layout shift.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: capture baseline screenshots/state showing text-forward homepage/PLP.
  - Green evidence plan: capture updated screenshot set proving new hierarchy and card density.
  - Refactor evidence plan: extract reusable media card primitives and remove inline style duplication.
- **Planning validation (required for M/L):**
  - Checks run: reviewed `apps/caryina/src/app/[lang]/page.tsx`, `apps/caryina/src/app/[lang]/shop/page.tsx`, `apps/caryina/src/app/[lang]/layout.tsx`.
  - Validation artifacts: fact-find `Entry Points` and `Best-Of Synthesis Matrix`.
  - Unexpected findings: homepage currently redirects directly to `/shop`; merchandising surface must be newly introduced.
- **Completion evidence (2026-02-23):**
  - Homepage route replaced redirect with image-first merchandising surface and launch-family rail.
  - PLP updated to 2-up mobile and 4-up desktop card density with secondary-image hover behavior on pointer devices.
  - Media fallbacks provided through `buildCatalogCardMedia` for missing slot resilience.
- **Scouts:** verify route-level i18n assumptions for new homepage copy/labels.
- **Consumer tracing (required for M/L):**
  - New output `ProductCardMediaModel` consumed by homepage highlight rails and PLP grid.
  - Modified behavior: `shop/page.tsx` card rendering logic changes from text-heavy to media-first; downstream analytics hooks must remain attached (existing `ShopAnalytics.client.tsx`).
  - Unchanged consumer note: legal/support routes untouched because no dependency on media card components.
- **Edge Cases & Hardening:** missing media fallback art, long product names, low-bandwidth image loading, no-hover devices.
- **What would make this >=90%:**
  - Add representative visual regression snapshots covering mobile/desktop/no-secondary-image states.
- **Rollout / rollback:**
  - Rollout: behind branch-level rollout; enable homepage modules with default-safe fallback.
  - Rollback: revert to current list/card rendering and keep schema validator in place.
- **Documentation impact:**
  - Document new PLP/home media component conventions in build record.
- **Notes / references:**
  - `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` (sections E/F/L)

### TASK-04: Implement deterministic PDP gallery and accessibility behavior
- **Type:** IMPLEMENT
- **Deliverable:** deterministic PDP media gallery with required slot order and keyboard/mobile accessibility behavior.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete
- **Touched:** `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`, `apps/caryina/src/components/catalog/ProductGallery.client.tsx`, `apps/caryina/src/lib/launchMerchandising.ts`
- **Referenced:** `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - PDP surface is currently minimal and isolated, enabling focused replacement.
  - Approach: 85% - explicit slot order from brief provides deterministic UX contract.
  - Impact: 90% - addresses premium proof gap nearest purchase action.
- **Acceptance:**
  - PDP gallery renders required ordered slots and accessible navigation controls.
  - Gallery works with keyboard focus and mobile swipe/next behavior.
  - Missing optional slots do not break ordering or CTA visibility.
- **Validation contract (TC-04):**
  - TC-04-01: complete slot set renders in required sequence.
  - TC-04-02: keyboard navigation cycles gallery items with visible focus.
  - TC-04-03: missing optional slot falls back without runtime error/layout collapse.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: capture current PDP state (no gallery sequence).
  - Green evidence plan: demonstrate ordered gallery behavior across desktop/mobile test states.
  - Refactor evidence plan: isolate gallery state management from page-level data fetching.
- **Planning validation (required for M/L):**
  - Checks run: reviewed `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` and related analytics seam usage.
  - Validation artifacts: fact-find `Coverage Gaps` and `Recommended Test Approach`.
  - Unexpected findings: current PDP CTA is simple and likely to regress if gallery controls alter layout flow.
- **Completion evidence (2026-02-23):**
  - Deterministic gallery sequence (`hero`, `angle`, `detail`, `on_body`, `scale`, `alternate`) implemented via `buildProductGalleryItems`.
  - Keyboard and touch controls implemented in `ProductGallery.client.tsx` with ordered navigation and visible position indicator.
  - PDP layout preserves CTA visibility while adding gallery, proof checklist, and related-image strip.
- **Scouts:** confirm touch + keyboard interactions do not conflict with existing navigation focus order.
- **Consumer tracing (required for M/L):**
  - New output `ProductGalleryViewModel` consumed by PDP media frame and thumbnail controls.
  - Modified behavior: PDP rendering flow now depends on typed media contract from TASK-02.
  - Unchanged consumer note: checkout page logic remains unchanged because it consumes selected SKU and price only.
- **Edge Cases & Hardening:** duplicate media IDs, empty gallery fallback, reduced-motion interactions, focus trap avoidance.
- **What would make this >=90%:**
  - Add gallery-focused integration tests covering keyboard, swipe, and missing-slot behaviors.
- **Rollout / rollback:**
  - Rollout: enable new gallery component with fallback to single-image rendering when contract unmet.
  - Rollback: revert to prior PDP body while preserving schema groundwork.
- **Documentation impact:**
  - Record ordered gallery contract and accessibility expectations in build record.
- **Notes / references:**
  - `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` (sections F/L)

### TASK-05: Establish media production and QA operating contract artifact
- **Type:** IMPLEMENT
- **Deliverable:** business artifact capturing shot production workflow, readiness checks, and operator sign-off criteria for launch SKUs.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete
- **Artifact-Destination:** `docs/business-os/site-upgrades/HBAG/2026-02-23-image-production-contract.user.md` (or dated successor)
- **Reviewer:** Pete
- **Approval-Evidence:** reviewer note captured in artifact frontmatter (`Status` transition + `Last-reviewed`)
- **Measurement-Readiness:** media completeness dashboard/validator output reviewed per launch cycle in `docs/plans/hbag-website-02-image-first-upgrade/build-record.user.md`
- **Touched:** `docs/business-os/site-upgrades/HBAG/2026-02-23-image-production-contract.user.md`, `docs/business-os/site-upgrades/HBAG/2026-02-23-image-production-contract.user.html`, `docs/plans/hbag-website-02-image-first-upgrade/artifacts/fixtures/launch-media-missing-on-body.json`
- **Referenced:** `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - structure and required fields are already defined by active brief contract.
  - Approach: 85% - artifact-first QA improves coordination between media production and build.
  - Impact: 85% - lowers risk of launch with inconsistent media depth.
- **Acceptance:**
  - Contract defines mandatory slot checklist, ownership, and pass/fail gate for launch SKUs.
  - Contract includes explicit fallback process for SKUs failing media readiness.
  - Reviewer sign-off is recorded with date.
- **Validation contract (VC-05):**
  - VC-05-01: At least one launch-candidate SKU is walked through checklist and yields deterministic pass/fail outcome by review date.
  - VC-05-02: Fallback path for failed SKU is documented with owner, SLA, and revalidation step.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: show current absence of operator-facing media QA workflow document.
  - Green evidence plan: produce contract artifact and complete one checklist rehearsal.
  - Refactor evidence plan: tighten checklist wording based on rehearsal ambiguity points.
- **Planning validation (required for M/L):**
  - Checks run: reviewed active upgrade brief section L and fact-find open questions.
  - Validation artifacts: `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`, `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`.
  - Unexpected findings: open media decisions currently sit in fact-find and require explicit artifact closure.
- **Completion evidence (2026-02-23):**
  - Published active contract artifact with mandatory slot checklist, owner/SLA fallback path, and reviewer sign-off.
  - Added deterministic fail fixture to validate fallback workflow (`missing on_body` case).
  - Rendered HTML companion for operator-consumable review.
- **Scouts:** verify contract format aligns with existing `.user.md` artifact conventions in business-os.
- **Consumer tracing (required for M/L):**
  - New output `ImageProductionContract` consumed by TASK-06 validation checks and TASK-07 checkpoint go/hold decision.
  - Modified behavior: media readiness evaluation moves from implicit checklist to explicit pass/fail contract.
  - Unchanged consumer note: homepage/PLP/PDP rendering components remain unchanged by this task directly; they consume outputs in downstream validation only.
- **Edge Cases & Hardening:** partially available slots, supplier delay, mixed aspect ratios, duplicate SKU references.
- **What would make this >=90%:**
  - Complete two rehearsal runs across different SKU quality states and incorporate reviewer feedback.
- **Rollout / rollback:**
  - Rollout: publish contract as active operational gate for launch media.
  - Rollback: revert to previous checklist version while preserving signed change log.
- **Documentation impact:**
  - New contract artifact linked from HBAG site-upgrade pointer notes.
- **Notes / references:**
  - `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` (sections K/L)

### TASK-06: Add media-focused test/performance validation package
- **Type:** IMPLEMENT
- **Deliverable:** targeted tests, performance checks, and evidence capture for upgraded homepage/PLP/PDP behavior.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** website-upgrade-backlog
- **Effort:** M
- **Status:** Complete
- **Touched:** `apps/caryina/src/components/catalog/ProductGallery.client.test.tsx`, `apps/caryina/src/lib/launchMediaContract.test.ts`, `docs/plans/hbag-website-02-image-first-upgrade/artifacts/performance-evidence.md`, `docs/plans/hbag-website-02-image-first-upgrade/build-record.user.md`
- **Referenced:** `apps/caryina/.next/build-manifest.json`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% - validation seams and command scaffolding already exist in workspace.
  - Approach: 85% - captures core regressions before rollout.
  - Impact: 90% - directly reduces launch risk and provides go/no-go evidence.
- **Acceptance:**
  - Tests cover media schema utility and at least one PLP/PDP interaction path.
  - Targeted Caryina validation commands pass.
  - Performance evidence is captured against declared image-heavy acceptance thresholds:
    - root main client JS gzip payload <= 120000 bytes;
    - production build completes with all static targets generated.
- **Validation contract (TC-06):**
  - TC-06-01: media schema unit tests pass for complete/missing/invalid role fixtures.
  - TC-06-02: gallery/PLP interaction test(s) pass without accessibility regressions.
  - TC-06-03: targeted `typecheck`, `lint`, and scoped tests pass for `@apps/caryina`.
  - TC-06-04: image-heavy performance check evidence recorded with explicit pass/fail thresholds in `artifacts/performance-evidence.md`.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: baseline lacks direct media-surface tests and performance evidence.
  - Green evidence plan: add and pass media-focused tests; capture performance report.
  - Refactor evidence plan: remove duplicated test setup and consolidate helper fixtures.
- **Planning validation (required for M/L):**
  - Checks run: `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="BrandMark.test.tsx"` (pass, 2026-02-23).
  - Validation artifacts: command output captured in fact-find `Test Infrastructure`.
  - Unexpected findings: only BrandMark tests currently exist for Caryina; media surfaces have zero direct coverage.
- **Completion evidence (2026-02-23):**
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="launchMediaContract.test.ts|ProductGallery.client.test.tsx"` -> pass (5 tests).
  - `pnpm --filter @apps/caryina typecheck` -> pass.
  - `pnpm --filter @apps/caryina lint` -> pass.
  - `pnpm --filter @apps/caryina build` -> pass.
  - `pnpm --filter @apps/caryina validate:launch-media` -> pass (3/3 active SKUs).
  - `pnpm --filter @apps/caryina validate:launch-media --file ../../docs/plans/hbag-website-02-image-first-upgrade/artifacts/fixtures/launch-media-missing-on-body.json` -> expected fail for fallback rehearsal.
  - Performance thresholds/results captured in `docs/plans/hbag-website-02-image-first-upgrade/artifacts/performance-evidence.md`.
- **Scouts:** confirm if visual regression should run via existing playwright or jest snapshot seams.
- **Consumer tracing (required for M/L):**
  - New output `MediaValidationEvidencePack` consumed by TASK-07 checkpoint and later launch QA (`lp-launch-qa`) planning.
  - Modified behavior: build completion moves from generic Caryina validation to explicit media-focused gate evidence.
  - Unchanged consumer note: checkout business logic remains unchanged; this task validates media and UX surfaces only.
- **Edge Cases & Hardening:** no-image fallback regressions, keyboard-only flows, low-bandwidth image loading.
- **What would make this >=90%:**
  - Add one automated real-browser snapshot path for homepage/PLP/PDP media states.
- **Rollout / rollback:**
  - Rollout: require validation package completion before checkpoint.
  - Rollback: if tests are unstable, quarantine flaky paths and keep schema unit tests mandatory.
- **Documentation impact:**
  - Record validation commands and results in build-record artifact.
- **Notes / references:**
  - `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`

### TASK-07: Horizon checkpoint and downstream reassessment
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if downstream assumptions drift.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete
- **Touched:** `docs/plans/hbag-website-02-image-first-upgrade/plan.md`, `docs/plans/hbag-website-02-image-first-upgrade/build-record.user.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - process checkpoint contract is established.
  - Approach: 95% - prevents continuation on stale assumptions.
  - Impact: 95% - controls rollout risk before scale-out.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - downstream assumptions reassessed from TASK-06 evidence
  - plan update logged with go/hold decision
- **Horizon assumptions to validate:**
  - Media readiness contract remains feasible at target SKU count.
  - Performance and accessibility outcomes meet launch gate thresholds.
- **Validation contract:** checkpoint notes and decision update recorded in plan/build-record artifacts.
- **Planning validation:** `None: procedural control task`
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** add checkpoint decision and rationale in plan Decision Log.
- **Checkpoint result (2026-02-23):**
  - Go decision: proceed with WEBSITE-02 launch packaging.
  - Rationale: media contract gate passes active catalog, PDP/PLP/home image-first behavior implemented, and performance contract thresholds pass in local production build evidence.
  - Residual risks: real-device UX/performance observations remain a post-merge operator QA step.

## Risks & Mitigations
- Risk: Media production cannot satisfy required slots before implementation completion.
  - Mitigation: TASK-05 enforces explicit fallback and owner/SLA.
- Risk: UI upgrade degrades mobile performance.
  - Mitigation: TASK-06 includes explicit performance validation threshold evidence.
- Risk: Gallery/PLP interactions regress accessibility.
  - Mitigation: TASK-04 and TASK-06 include keyboard/focus-path validation contracts.
- Risk: Decision drift on shot-pack/family anchors causes rework.
  - Mitigation: TASK-01 runs first and blocks implementation tasks.

## Observability
- Logging:
  - UI and route-level runtime errors from Next.js app logs during validation.
- Metrics:
  - gallery interaction rate, PDP depth, checkout-start rate, media validator pass/fail counts.
- Alerts/Dashboards:
  - None: add to follow-on measurement ops after first implemented cycle.

## Acceptance Criteria (overall)
- [x] Decision defaults for media contract are locked before implementation begins.
- [x] Typed media schema and validator gate exist and are exercised with pass/fail fixtures.
- [x] Homepage/PLP/PDP image-first behavior is implemented with accessibility parity.
- [x] Media-focused tests and performance evidence are captured and passing.
- [x] Checkpoint verdict is recorded with explicit go/hold rationale.

## Decision Log
- 2026-02-23: Plan created from `docs/plans/hbag-website-02-image-first-upgrade/fact-find.md` in plan-only mode.
- 2026-02-23: Auto-build held at planning stage until TASK-01 decision is closed and user requests build handoff.
- 2026-02-23: TASK-01 closed with Option A defaults (6 required slots + 3 family anchors); owner Pete via continue/proceed instruction sequence.
- 2026-02-23: TASK-02 completed; typed media contract + validator command added and validated (`test`, `typecheck`, `lint`, plus failing baseline validator report against placeholder catalog).
- 2026-02-23: Launch family anchors locked as `Top Handle`, `Shoulder`, `Mini`; campaign video remains deferred (static-image-first launch).
- 2026-02-23: TASK-03 completed; homepage and PLP migrated to image-first layouts with family-filter rails and media-card fallback contract.
- 2026-02-23: TASK-04 completed; PDP deterministic gallery shipped with keyboard/touch controls and ordered slot rendering.
- 2026-02-23: TASK-05 completed; image production and QA contract artifact published and reviewer-signed.
- 2026-02-23: TASK-06 completed; media-focused test/performance evidence package captured (tests/typecheck/lint/build/media gate).
- 2026-02-23: TASK-07 checkpoint executed with `Go` verdict for launch packaging; residual real-device checks documented.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted confidence:
  - TASK-01: 90 (S=1)
  - TASK-02: 85 (M=2)
  - TASK-03: 85 (M=2)
  - TASK-04: 85 (M=2)
  - TASK-05: 85 (M=2)
  - TASK-06: 85 (M=2)
  - TASK-07: 95 (S=1)
- Overall-confidence = `(90 + 170 + 170 + 170 + 170 + 170 + 95) / 12 = 86.25%` -> `86%`
