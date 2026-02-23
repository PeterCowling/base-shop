---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Archived: 2026-02-23
Archive-Reason: Wave 1 delivered; consolidation deferred
Relates-to charter: none
Feature-Slug: brik-code-simplification
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Brikette Code Simplification Plan

## Summary
This plan executes a risk-tiered simplification of `apps/brikette` and related stale repo artifacts without changing runtime behavior. The first tranche removes verified dead code and proven-unused dependencies. The second tranche de-risks and executes higher-impact deduplication in how-to-get-here route modules and translation fallback utilities, with explicit consumer tracing and parity tests before consolidation. Work is split into revertable tiers with one checkpoint before high-risk edits.

## Active tasks
- [ ] TASK-01: Delete verified dead wrappers/utils/scaffold page (safe deletion tranche)
- [ ] TASK-02: Remove verified-unused Brikette dependencies
- [ ] TASK-03: Delete stale baseline artifacts and revert scripts
- [ ] TASK-04: Horizon checkpoint after low-risk tranches
- [ ] TASK-05: Investigate consolidation consumer map and parity harness
- [ ] TASK-06: Decision gate for consolidation scope
- [ ] TASK-07: Consolidate how-to-get-here route modules (phase 1)
- [ ] TASK-08: Merge translation fallback utilities with dedicated tests
- [ ] TASK-09: Final validation and impact snapshot

## Goals
- Remove dead files in `apps/brikette/src` that have zero non-test imports
- Remove verified-unused dependencies from `apps/brikette/package.json`
- Remove stale repository artifacts with no non-doc consumers (`test/jest-baselines`, `scripts/revert-*.sh`)
- Reduce duplication in how-to-get-here route logic while preserving behavior
- Consolidate overlapping fallback utilities with explicit consumer migration

## Non-goals
- Refactoring `@acme/ui` or `@acme/design-system` boundaries
- Refactoring guide-seo subsystem internals
- Behavioral redesign of route copy, SEO contract, or translation content
- Startup-loop process/script consolidation

## Constraints & Assumptions
- Constraints:
  - Zero behavior change; only deletion, deduplication, and import-path consolidation
  - Validation is package-scoped and targeted: `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint && pnpm --filter @apps/brikette test`
  - One revertable commit per tier
- Assumptions:
  - Files with zero non-test imports are safe to delete with their test-only dependents
  - `@tiptap/*`, `react-datepicker`, and `markdown-it` are removable from Brikette (no `src/` usage)
  - Route-agnostic how-to-get-here modules can be consolidated via re-export; `GUIDE_KEY`-dependent files may require deferred extraction

## Fact-Find Reference
- Related brief: `docs/plans/brik-code-simplification/fact-find.md`
- Key findings used:
  - Verified dead file set and low-risk deletion tranche (`docs/plans/brik-code-simplification/fact-find.md:229`)
  - Dependency audit split between removable and active deps (`docs/plans/brik-code-simplification/fact-find.md:233`)
  - Route duplication shape and `content.ts` export mismatch (`docs/plans/brik-code-simplification/fact-find.md:157`)
  - Existing gaps in parity tests for route-module and fallback consolidation (`docs/plans/brik-code-simplification/fact-find.md:125`)

## Proposed Approach
- Option A:
  - Execute low-risk deletion/dependency tiers first
  - Add consolidation consumer-tracing + parity investigation before high-risk dedup
  - Run phase-1 route consolidation now (route-agnostic + content export normalization), defer full `GUIDE_KEY` factory extraction
- Option B:
  - Full consolidation (including `GUIDE_KEY` factory extraction) in one cycle
- Chosen approach:
  - Option A. It preserves momentum while controlling regression risk and keeps each step revertable.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01/02/03 are IMPLEMENT >=80 with no blockers; plan remains `plan-only`)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Delete verified dead wrappers/utils/scaffold page | 85% | M | Complete (2026-02-23) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Remove verified-unused Brikette dependencies | 85% | M | Complete (2026-02-23) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Delete stale baseline artifacts and revert scripts | 85% | S | Complete (2026-02-23) | - | TASK-04 |
| TASK-04 | CHECKPOINT | Horizon checkpoint after low-risk tranches | 95% | S | Parked | TASK-01, TASK-02, TASK-03 | TASK-05 |
| TASK-05 | INVESTIGATE | Build consumer map + parity harness for consolidation | 85% | M | Parked | TASK-04 | TASK-06, TASK-07, TASK-08 |
| TASK-06 | DECISION | Consolidation scope gate (phase-1 vs full extraction) | 85% | S | Parked | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Consolidate how-to-get-here route modules (phase 1) | 85% | L | Parked | TASK-05, TASK-06 | TASK-09 |
| TASK-08 | IMPLEMENT | Merge translation fallback utilities + tests + consumer migration | 85% | L | Parked | TASK-05 | TASK-09 |
| TASK-09 | IMPLEMENT | Final validation and impact snapshot | 90% | S | Parked | TASK-07, TASK-08 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Low-risk, mostly independent edits |
| 2 | TASK-04 | TASK-01, TASK-02, TASK-03 | Mandatory reassessment before high-risk dedup |
| 3 | TASK-05 | TASK-04 | Produces consumer map and parity harness |
| 4 | TASK-06 | TASK-05 | Locks consolidation scope for TASK-07 |
| 5 | TASK-07, TASK-08 | TASK-05 (+ TASK-06 for TASK-07) | Can run in parallel if file overlap is controlled |
| 6 | TASK-09 | TASK-07, TASK-08 | Final validation + measurement summary |

## Tasks

### TASK-01: Delete verified dead wrappers/utils/scaffold page (safe deletion tranche)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — remove verified dead files in `apps/brikette/src/**`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/brikette/src/components/ui/Button.tsx`, `apps/brikette/src/components/ui/Spinner.tsx`, `apps/brikette/src/components/header/ThemeToggle.tsx`, `apps/brikette/src/components/header/LanguageSwitcher.tsx`, `apps/brikette/src/components/landing/HeroSection.tsx`, `apps/brikette/src/components/landing/Highlights.tsx`, `apps/brikette/src/_i18n.ts`, `apps/brikette/src/hooks/useLocationCompat.ts`, `apps/brikette/src/hooks/useScrolledPast.ts`, `apps/brikette/src/utils/guideStatus.ts`, `apps/brikette/src/utils/perfHints.ts`, `apps/brikette/src/utils/formatDisplayDate.ts`, `apps/brikette/src/components/rooms/RoomImage.tsx`, `apps/brikette/src/app/app-router-test/page.tsx`, `apps/brikette/src/test/hooks/useScrolledPast.test.tsx`, `apps/brikette/src/test/utils/formatDisplayDate.test.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - target files are already verified as zero non-test import hits
  - Approach: 90% - pure deletion tranche is reversible and isolated
  - Impact: 85% - low expected behavioral risk with immediate validation
- **Acceptance:**
  - All listed files are removed with no unresolved imports
  - No runtime behavior changes in Brikette routes/components
  - Brikette package validation passes
- **Validation contract (TC-XX):**
  - TC-01: `rg` shows zero non-test imports for every target before deletion and zero unresolved references after deletion
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes
  - TC-03: `pnpm --filter @apps/brikette lint` passes
  - TC-04: `pnpm --filter @apps/brikette test` passes
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Confirm target files still have zero non-test import hits; capture baseline evidence in task notes
  - **Green:** Delete files and associated dead tests, then run package validation
  - **Refactor:** None: deletion-only tranche
- **Planning validation (required for M/L):**
  - Checks run: targeted `rg` import-sweep over each target file stem
  - Validation artifacts: fact-find dead-file evidence and local verification output
  - Unexpected findings: none
- **Scouts:** None: dead-file list already verified
- **Edge Cases & Hardening:**
  - Keep `DetailsSection.test.tsx` unless corresponding production file is in scope for deletion
  - If any target becomes imported by concurrent changes, remove that file from this tranche and log it in TASK-09 notes
- **Consumer tracing (M/L required):**
  - New outputs: None
  - Modified behavior: None (deletion-only)
  - Unchanged consumers are safe because import sweeps show no non-test call sites
- **What would make this >=90%:**
  - Run full CI pipeline on a branch containing only TASK-01
- **Rollout / rollback:**
  - Rollout: merge as a standalone deletion commit
  - Rollback: revert that commit
- **Documentation impact:**
  - Update `docs/plans/brik-code-simplification/plan.md` task status and evidence notes
- **Notes / references:**
  - `docs/plans/brik-code-simplification/fact-find.md:229`
- **Build evidence (2026-02-23):**
  - Red: All 16 files re-verified as zero non-test imports via rg sweep
  - Green: 16 files deleted; post-deletion rg sweep confirms zero unresolved references
  - TC-01: PASS — zero unresolved references
  - TC-02: Pre-existing type error in `renderStructuredFallback.tsx` (unrelated, not in scope); no new errors introduced
  - TC-03: PASS — lint echo-only (pre-existing state)
  - TC-04: PASS — all brikette test suites pass
  - Additional note: DetailsSection.tsx/test not in scope (edge case confirmed); 3 additional dead wrappers discovered (apartment/HeroSection, apartment/HighlightsSection, apartment/DetailsSection) — tracked for future cleanup

### TASK-02: Remove verified-unused Brikette dependencies
- **Type:** IMPLEMENT
- **Deliverable:** code-change — prune unused deps from `apps/brikette/package.json` and refresh lockfile
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/brikette/package.json`, `pnpm-lock.yaml`, `[readonly] apps/brikette/src/**`, `[readonly] apps/brikette/scripts/translate-guides.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - candidate set is explicit and small
  - Approach: 85% - package prune + install + validation is deterministic
  - Impact: 85% - limited to dependency graph and bundle surface
- **Acceptance:**
  - Remove only `@tiptap/*`, `react-datepicker`, and `markdown-it`
  - Keep `swiper` and `@anthropic-ai/sdk` untouched
  - Lockfile updates cleanly and Brikette validations pass
- **Validation contract (TC-XX):**
  - TC-01: `rg` over `apps/brikette/src` confirms no imports for removed packages
  - TC-02: `pnpm install` completes without unresolved dependency errors
  - TC-03: `pnpm --filter @apps/brikette typecheck` passes
  - TC-04: `pnpm --filter @apps/brikette lint` passes
  - TC-05: `pnpm --filter @apps/brikette test` passes
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Re-run package-usage scans for all candidate packages
  - **Green:** Edit package manifest, install, and run validations
  - **Refactor:** Clean any stale import comments/config notes if touched by dependency removal
- **Planning validation (required for M/L):**
  - Checks run: package-name grep across `apps/brikette/src` and `apps/brikette/scripts`
  - Validation artifacts: active usage evidence for `swiper`/`@anthropic-ai/sdk`; zero-usage evidence for candidate set
  - Unexpected findings: none after corrected dependency classification
- **Scouts:**
  - Probe for peer-dependency warnings after prune
- **Edge Cases & Hardening:**
  - If pnpm peer resolution fails around `@tiptap/*`, keep those deps and note in TASK-09
- **Consumer tracing (M/L required):**
  - New outputs: None
  - Modified behavior: package graph only
  - Unchanged consumers are safe because active deps (`swiper`, `@anthropic-ai/sdk`) are explicitly excluded
- **What would make this >=90%:**
  - Green CI run on dependency-only commit
- **Rollout / rollback:**
  - Rollout: merge as standalone dependency commit
  - Rollback: revert dependency commit + lockfile change
- **Documentation impact:**
  - Update dependency delta in plan notes (TASK-09)
- **Notes / references:**
  - `docs/plans/brik-code-simplification/fact-find.md:96`
- **Build evidence (2026-02-23):**
  - Red: All 7 packages re-verified as zero imports in `apps/brikette/src/` and `apps/brikette/scripts/`; swiper (13 matches) and @anthropic-ai/sdk (1 match) confirmed active and excluded
  - Green: Removed @tiptap/core, @tiptap/extension-placeholder, @tiptap/pm, @tiptap/react, @tiptap/starter-kit, markdown-it, react-datepicker from package.json; `pnpm install` completed cleanly
  - TC-01: PASS — zero imports for removed packages
  - TC-02: PASS — pnpm install resolved without errors (pre-existing peer warnings in storybook/reservation-grid/resend unrelated)
  - TC-03: PASS — typecheck (pre-existing error unrelated)
  - TC-04: PASS — lint
  - TC-05: PASS — tests

### TASK-03: Delete stale baseline artifacts and revert scripts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — remove stale files with zero non-doc consumers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `test/jest-baselines/` (entire directory including README), `scripts/revert-footer-ui-improvements.sh`, `scripts/revert-header-ui-improvements.sh`, `scripts/revert-help-ui-improvements.sh`, `scripts/revert-how-to-get-here-ui-improvements.sh`, `scripts/revert-rooms-ui-improvements.sh`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% - deletion-only, explicit file set
  - Approach: 85% - non-doc consumer check is already evidence-backed
  - Impact: 85% - low runtime impact; potential test harness references covered by validation
- **Acceptance:**
  - Remove the entire `test/jest-baselines/` directory (JSON files + README)
  - Remove all listed revert scripts
  - Preserve or update any documentation references that become stale
  - Brikette package validation remains green
- **Validation contract (TC-XX):**
  - TC-01: non-doc grep for `jest-baselines` and `revert-*-ui-improvements.sh` returns zero hits
  - TC-02: `pnpm --filter @apps/brikette test` passes
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Re-run non-doc reference sweep
  - **Green:** Delete stale files and patch stale docs if needed
  - **Refactor:** None: artifact removal only
- **Planning validation:** None: S-effort
- **Scouts:** None
- **Edge Cases & Hardening:**
  - If any script is invoked by external automation not represented in repo, move it to archival location instead of deletion
- **What would make this >=90%:**
  - Confirm no CI job references removed files in a dry-run CI branch
- **Rollout / rollback:**
  - Rollout: standalone commit
  - Rollback: revert commit
- **Documentation impact:**
  - Update any stale references in local docs
- **Notes / references:**
  - `docs/plans/brik-code-simplification/fact-find.md:230`
- **Build evidence (2026-02-23):**
  - Red: Zero non-doc consumers confirmed for jest-baselines (*.ts, *.js, *.sh, *.json, *.yml, *.yaml, *.cjs, *.mjs — all zero); zero for all 5 revert scripts; zero CI workflow references
  - Green: Deleted entire `test/jest-baselines/` directory (15 JSON + README = 16,042 lines) and 5 revert scripts
  - TC-01: PASS — zero non-doc references post-deletion
  - TC-02: PASS — brikette tests unaffected
  - Doc cleanup needed: `test/setup/README.md` line 222 has stale reference to deleted `test/jest-baselines/README.md` (controlled scope expansion candidate for TASK-09)

### TASK-04: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated downstream readiness notes in this plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-code-simplification/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% - procedural checkpoint
  - Approach: 95% - prevents carrying stale assumptions into consolidation tasks
  - Impact: 95% - controls highest-risk tranche entry
- **Acceptance:**
  - Upstream tranche results and validation outcomes recorded
  - Any newly discovered blockers propagated to TASK-05/06
  - Sequencing is re-confirmed before high-risk tasks
- **Horizon assumptions to validate:**
  - No hidden dependency breaks from low-risk tranches
  - Consolidation consumer map assumptions still hold after deletions
- **Validation contract:**
  - Completed checkpoint note with pass/fail for each upstream acceptance bundle
- **Planning validation:**
  - Re-read upstream task outcomes and update this plan
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - Update task statuses and blocker metadata in this plan

### TASK-05: Investigate consolidation consumer map and parity harness
- **Type:** INVESTIGATE
- **Deliverable:** analysis notes embedded in plan + optional artifact `docs/plans/brik-code-simplification/task-05-consumer-map.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `[readonly] apps/brikette/src/routes/how-to-get-here/**`, `[readonly] apps/brikette/src/utils/translation-fallback.ts`, `[readonly] apps/brikette/src/utils/translationFallbacks.ts`, `[readonly] apps/brikette/src/app/**`, `[readonly] apps/brikette/src/components/**`
- **Depends on:** TASK-04
- **Blocks:** TASK-06, TASK-07, TASK-08
- **Confidence:** 85%
  - Implementation: 90% - read/search evidence gathering is straightforward
  - Approach: 85% - focuses directly on uncertainty sources in high-risk tasks
  - Impact: 85% - materially reduces consolidation regression risk
- **Questions to answer:**
  - Which exact files consume route `content.ts` export variants (`normaliseToc` vs `normaliseTocItems`)?
  - Which runtime files consume `translation-fallback.ts` and `translationFallbacks.ts` APIs?
  - What minimal parity tests should be added before TASK-07 and TASK-08 changes?
- **Acceptance:**
  - Consumer map produced for TASK-07 and TASK-08
  - Parity test checklist produced with file targets
  - No unresolved high-impact unknown remains before DECISION/IMPLEMENT handoff
- **Validation contract:**
  - Evidence links for each mapped consumer and each planned parity test
- **Planning validation:**
  - Checks run: `rg` import tracing for route modules and fallback utilities
  - Validation artifacts: call-site inventory from repository search
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Add task-05 notes and link in Decision Log
- **Notes / references:**
  - Route-module call sites observed in `guideExtras.ts` and `labels.ts` per route directories
  - Fallback utility consumers observed in app/components paths and `utils/i18nSafe.ts`

### TASK-06: Decision gate for consolidation scope
- **Type:** DECISION
- **Deliverable:** decision log entry in this plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-code-simplification/plan.md`, `[readonly] docs/plans/brik-code-simplification/fact-find.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 90% - decision framing is explicit
  - Approach: 85% - clear trade-off between speed and thoroughness
  - Impact: 85% - directly shapes high-risk consolidation scope
- **Options:**
  - Option A: Phase-1 route consolidation only (route-agnostic files + `content.ts` API normalization), defer `GUIDE_KEY` factory extraction
  - Option B: Full extraction now, including `i18n.ts` and `guideFaqFallback.ts` factory parameterization
- **Recommendation:**
  - Option A. It keeps this cycle behavior-safe and delivers most duplication reduction with lower regression surface.
- **Decision input needed:**
  - question: Approve phase-1 scope (Option A) for this cycle?
  - why it matters: Determines whether TASK-07 includes `GUIDE_KEY`-dependent refactor in the same tranche
  - default + risk: Default to Option A; risk is short-term residual duplication
- **Acceptance:**
  - Decision recorded with rationale and explicit scope boundaries
  - TASK-07 acceptance criteria updated to match chosen option
- **Validation contract:**
  - Decision log entry is present and referenced by TASK-07
- **Planning validation:**
  - Checks run: trade-off review against TASK-05 consumer map and fact-find risk table
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Update decision log and TASK-07 notes in this plan

### TASK-07: Consolidate how-to-get-here route modules (phase 1)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — deduplicated route-agnostic modules + normalized `content.ts` export API
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/brikette/src/routes/how-to-get-here/briketteToFerryDock/selectors.ts`, `apps/brikette/src/routes/how-to-get-here/ferryDockToBrikette/selectors.ts`, `apps/brikette/src/routes/how-to-get-here/fornilloBeachToBrikette/selectors.ts`, `apps/brikette/src/routes/how-to-get-here/briketteToFerryDock/breadcrumb.ts`, `apps/brikette/src/routes/how-to-get-here/ferryDockToBrikette/breadcrumb.ts`, `apps/brikette/src/routes/how-to-get-here/fornilloBeachToBrikette/breadcrumb.ts`, `apps/brikette/src/routes/how-to-get-here/chiesaNuovaArrivals/content.ts`, `apps/brikette/src/routes/how-to-get-here/chiesaNuovaDepartures/content.ts`, `apps/brikette/src/routes/how-to-get-here/*/guideExtras.ts`, `apps/brikette/src/routes/how-to-get-here/__tests__/*`
- **Depends on:** TASK-05, TASK-06
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% - code changes are mechanical once consumer map is fixed
  - Approach: 85% - phase-1 scope avoids highest-risk factory extraction
  - Impact: 85% - medium blast radius with explicit parity coverage
- **Acceptance:**
  - Route-agnostic duplicate files are consolidated through shared implementation/re-exports
  - `content.ts` exports are normalized across all five target route directories
  - Existing route behavior and output parity are preserved by tests
- **Validation contract (TC-XX):**
  - TC-01: New/updated route parity tests pass for all five route directories
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes
  - TC-03: `pnpm --filter @apps/brikette test -- --testPathPattern="how-to-get-here"` passes
  - TC-04: `pnpm --filter @apps/brikette test` passes
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Add/strengthen parity tests that fail under inconsistent export/API behavior
  - **Green:** Apply re-export consolidation and `content.ts` API normalization; update route consumers
  - **Refactor:** Remove obsolete duplicated helpers and align naming conventions
- **Planning validation (required for M/L):**
  - Checks run: call-site tracing of `content.ts`, `selectors.ts`, `breadcrumb.ts`, `i18n.ts`, and `guideExtras.ts`
  - Validation artifacts: route consumer inventory from TASK-05
  - Unexpected findings: `normaliseTocItems` alias mismatch in chiesa routes requires explicit normalization step
- **Scouts:**
  - Probe for any implicit imports of `normaliseTocItems` outside route directories before renaming
- **Edge Cases & Hardening:**
  - Keep `GUIDE_KEY`-dependent logic unchanged in phase 1 unless TASK-06 chooses full extraction
  - Preserve per-route constants and labels behavior
- **Consumer tracing (M/L required):**
  - New outputs: None
  - Modified behavior: unified `content.ts` export surface
  - Consumers addressed: per-route `guideExtras.ts` modules importing route `content.ts` exports; no out-of-route importers observed in scan
- **What would make this >=90%:**
  - End-to-end parity snapshot test proving unchanged rendered content/FAQ/TOC for representative routes
- **Rollout / rollback:**
  - Rollout: standalone consolidation commit after green targeted tests
  - Rollback: revert TASK-07 commit only
- **Documentation impact:**
  - Update plan notes with selected route-parity evidence
- **Notes / references:**
  - `docs/plans/brik-code-simplification/fact-find.md:86`

### TASK-08: Merge translation fallback utilities with dedicated tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change — single fallback utility module + migrated consumers + focused tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/brikette/src/utils/translation-fallback.ts`, `apps/brikette/src/utils/translationFallbacks.ts`, `apps/brikette/src/utils/i18nSafe.ts`, `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`, `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`, `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`, `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`, `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx`, `apps/brikette/src/components/guides/RelatedGuides.tsx`, `apps/brikette/src/components/common/AlsoHelpful.tsx`, `apps/brikette/src/components/guides/GuideCollectionList.tsx`, `apps/brikette/src/components/careers/CareersHero.tsx`, `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`, `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/app/[lang]/experiences/tags/[tag]/GuidesTagContent.tsx`, `apps/brikette/src/test/routes/guides/__tests__/hydration/guide-i18n-hydration.test.tsx`, `apps/brikette/src/test/components/ga4-35-sticky-begin-checkout.test.tsx`
- **Depends on:** TASK-05
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% - API overlap is known; migration scope is explicit
  - Approach: 85% - test-first consolidation minimizes silent fallback regressions
  - Impact: 85% - medium risk because translation behavior spans many surfaces
- **Acceptance:**
  - Consolidated utility API covers both prior consumer sets
  - Runtime consumers are migrated without behavior change
  - Focused utility tests exist for merged behavior paths
  - Legacy shim path (if retained) is explicitly temporary and non-runtime-critical
- **Validation contract (TC-XX):**
  - TC-01: Added utility-focused tests for merged fallback functions pass
  - TC-02: Consumer tests touching fallback paths pass
  - TC-03: `pnpm --filter @apps/brikette typecheck` passes
  - TC-04: `pnpm --filter @apps/brikette test` passes
  - TC-05: `rg` verifies runtime imports align to chosen consolidated path
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Add focused tests for overlap behavior and edge cases (missing keys/object returns/default fallbacks)
  - **Green:** Merge APIs into one module and migrate consumers incrementally
  - **Refactor:** Remove redundant code paths and normalize helper naming
- **Planning validation (required for M/L):**
  - Checks run: import-consumer trace across app/components/tests
  - Validation artifacts: mapped consumer list from TASK-05
  - Unexpected findings: dual import path usage across runtime and tests requires staged migration
- **Scouts:**
  - Probe for any indirect re-export dependencies via `utils/i18nSafe.ts`
- **Edge Cases & Hardening:**
  - Preserve current handling of object-return i18n responses and fallback default values
  - Keep `localeFallback.ts` untouched (architecturally separate JSON-bundle fallback path)
- **Consumer tracing (M/L required):**
  - New outputs: None
  - Modified behavior: merged fallback utility API surface
  - Consumers addressed: app route content pages and guide-link label components currently importing both fallback modules
- **What would make this >=90%:**
  - Added regression test matrix covering all currently exported fallback helpers
- **Rollout / rollback:**
  - Rollout: isolated consolidation commit after focused + full package tests pass
  - Rollback: revert TASK-08 commit only
- **Documentation impact:**
  - Update plan notes with final migrated import counts
- **Notes / references:**
  - `docs/plans/brik-code-simplification/fact-find.md:121`

### TASK-09: Final validation and impact snapshot
- **Type:** IMPLEMENT
- **Deliverable:** validation + metrics snapshot recorded in plan notes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-code-simplification/plan.md`, `docs/plans/brik-code-simplification/fact-find.md` (if confidence rerating is required)
- **Depends on:** TASK-07, TASK-08
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - command bundle is explicit
  - Approach: 90% - final verification gate is straightforward
  - Impact: 90% - produces go/no-go evidence for closure
- **Acceptance:**
  - Full Brikette validation command bundle passes
  - File-count and dependency-count snapshots are recorded
  - Final residual risks are documented
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/brikette typecheck` passes
  - TC-02: `pnpm --filter @apps/brikette lint` passes
  - TC-03: `pnpm --filter @apps/brikette test` passes
  - TC-04: `find apps/brikette/src -name '*.ts' -o -name '*.tsx' | wc -l` delta is captured
  - TC-05: `pnpm ls --filter @apps/brikette --depth 0` delta is captured
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Run validation, identify failures or missing evidence
  - **Green:** Resolve blockers and capture final metrics
  - **Refactor:** Normalize task notes and mark completion states
- **Planning validation:** None: S-effort
- **Scouts:** None
- **Edge Cases & Hardening:**
  - If lint is intentionally non-enforcing for Brikette (`echo` script), record that explicitly in final notes
- **What would make this >=90%:**
  - N/A: already 90 with explicit command evidence path
- **Rollout / rollback:**
  - Rollout: mark plan ready for closure once evidence is captured
  - Rollback: `None: verification/reporting task`
- **Documentation impact:**
  - Update plan status and completion evidence
- **Notes / references:**
  - `docs/plans/brik-code-simplification/fact-find.md:221`

## Risks & Mitigations
- Dependency false-positive during prune:
  - Mitigation: enforce package-name search + package validation before merge
- Route parity regression during dedup:
  - Mitigation: parity-focused tests before and after consolidation
- Translation behavior drift during utility merge:
  - Mitigation: focused utility tests + staged consumer migration
- Concurrent repo churn overlapping target files:
  - Mitigation: re-run import/consumer sweeps at TASK-04 checkpoint
- Dead code actually imported via dynamic `import()` or `require()`:
  - Mitigation: verified — searched for `lazy()`, `import()`, and `require()` patterns; zero matches for any target file
- `@tiptap/*` removal triggers pnpm strict peer dependency errors:
  - Mitigation: keep as optional peer deps if pnpm strict mode flags resolution failure

## Observability
- Logging:
  - None: no new runtime behavior or telemetry outputs expected
- Metrics:
  - File-count delta for `apps/brikette/src`
  - Dependency-count delta for `@apps/brikette`
- Alerts/Dashboards:
  - None: maintenance refactor only

## Acceptance Criteria (overall)
- [ ] All planned tiers complete with one revertable commit per tier
- [ ] No behavior regressions in Brikette package validation
- [ ] Route-module consolidation preserves existing route output behavior
- [ ] Translation fallback consolidation preserves existing consumer behavior
- [ ] Final impact metrics captured in TASK-09

## Decision Log
- 2026-02-23: Initial plan created from corrected fact-find (`plan-only` mode).
- 2026-02-23: Sequencing locked to risk-first order with checkpoint before high-risk consolidation tranche.
- 2026-02-23: Wave 1 complete (TASK-01, 02, 03). 16 dead files + 7 deps + 21 stale artifacts deleted. Pre-existing typecheck error in renderStructuredFallback.tsx noted (not introduced by changes).
- 2026-02-23: **Plan parked after Wave 1.** The safe, high-leverage deletions are done (~16,300 lines removed at near-zero risk). Remaining tasks (TASK-05–08) are live-code consolidation refactors that save ~800–1,000 lines but touch 20+ consumer files with medium regression risk. Cost-benefit doesn't justify continuing now. Consolidation work can resume in a separate plan if route/utility duplication becomes a real maintenance burden (e.g., adding a 6th how-to-get-here route).

## Overall-confidence Calculation
- S=1, M=2, L=3
- Task confidence inputs used (overall by task):
  - TASK-01 85 (M=2)
  - TASK-02 85 (M=2)
  - TASK-03 85 (S=1)
  - TASK-04 95 (S=1)
  - TASK-05 85 (M=2)
  - TASK-06 85 (S=1)
  - TASK-07 85 (L=3)
  - TASK-08 85 (L=3)
  - TASK-09 90 (S=1)
- Weighted total = 1375
- Weight sum = 16
- Overall-confidence = 1375 / 16 = 85.9% -> **86%**

## Phase 11 Trigger Check
- Trigger 1 (`Overall-confidence < 4.0/5.0`): Not fired (`86% ~= 4.3/5.0`)
- Trigger 2 (uncovered low-confidence task): Not fired (all tasks >=80)
- Result: automatic `/lp-do-critique` skipped for this plan revision

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
