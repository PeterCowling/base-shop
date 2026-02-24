---
Type: Plan
Status: Draft
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-usability-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-qa, lp-refactor
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: plan
---

# XA Uploader Usability Hardening Plan

## Summary
This plan hardens the `apps/xa-uploader` operator experience by fixing broken sync dependencies, improving action feedback, normalizing localized error handling, and expanding test coverage from utility-only tests to hook/API/E2E flows. The plan starts with one INVESTIGATE task and one DECISION gate so implementation work is grounded in measurable outcomes and confirmed scope. Implementation tasks are sequenced to stabilize core behavior first (sync preflight + action-state architecture), then layer usability polish and regression protection. A CHECKPOINT is inserted before end-to-end rollout work to avoid executing downstream tasks on stale assumptions. This plan is `plan-only`; no automatic build handoff is requested.

## Active tasks
- [x] TASK-01: Establish baseline usability KPI + operator journey evidence (Complete 2026-02-23)
- [x] TASK-02: Decision gate on sync ownership and auth UX scope (Complete 2026-02-23)
- [x] TASK-03: Implement sync dependency preflight and actionable failure contract (Complete 2026-02-23)
- [x] TASK-04: Implement scoped action feedback model (status + success + errors) (Complete 2026-02-23)
- [x] TASK-05: Localize validation and API error surfaces (EN/ZH parity) (Complete 2026-02-23)
- [x] TASK-06: Refactor `useCatalogConsole` domains and add hook/component tests (Complete 2026-02-23)
- [x] TASK-07: Add API contract tests and test-runner scoping guardrails (Complete 2026-02-23)
- [x] TASK-08: Horizon checkpoint before E2E rollout (Complete 2026-02-23)
- [x] TASK-09: Add E2E operator flows + accessibility/usability hardening (Complete 2026-02-23)
- [x] TASK-10: Final validation and KPI delta snapshot (Complete 2026-02-23)

## Goals
- Remove known operator-facing breakage and friction in sync, save/delete, and submission flows.
- Improve operator confidence through contextual success/error feedback and better recoverability.
- Bring usability-critical paths under automated test coverage (hook, API, and E2E).
- Make impact measurable via a baseline KPI and post-change delta report.

## Non-goals
- Replace CSV persistence with a new datastore.
- Rebuild uploader as a new app or migrate away from Next.js.
- Introduce a new identity provider in this iteration.

## Constraints & Assumptions
- Constraints:
  - CSV + schema contracts remain source-of-truth boundaries (`docs/plans/xa-uploader-usability-hardening/fact-find.md:89`).
  - Local filesystem-dependent submission behavior must remain supported (`docs/plans/xa-uploader-usability-hardening/fact-find.md:49`).
  - Auth/session boundaries must remain strict in internal mode (`docs/plans/xa-uploader-usability-hardening/fact-find.md:50`).
- Assumptions:
  - Sync remains in-scope for uploader unless TASK-02 decides otherwise.
  - Operator priority is error-rate reduction first, throughput second (default from fact-find open questions).

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-usability-hardening/fact-find.md`
- Key findings used:
  - Sync route references missing script paths (`docs/plans/xa-uploader-usability-hardening/fact-find.md:99`).
  - Current test coverage is utility-heavy and misses UI/API behavior (`docs/plans/xa-uploader-usability-hardening/fact-find.md:143`).
  - Success feedback is not consistently surfaced for non-submission actions (`docs/plans/xa-uploader-usability-hardening/fact-find.md:189`).
  - Baseline usability KPI is currently undefined (`docs/plans/xa-uploader-usability-hardening/fact-find.md:207`).

## Proposed Approach
- Option A:
  - Implement all UX changes directly, then backfill tests and metrics.
  - Pros: fastest visible UI change.
  - Cons: high regression risk, low confidence in impact claims.
- Option B:
  - Establish KPI + scope gate first, then implement in layered slices with tests and checkpoint.
  - Pros: better change safety and measurable impact.
  - Cons: slightly longer planning/build cycle.
- Chosen approach:
  - Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (`plan-only`; upstream INVESTIGATE/DECISION tasks must execute first)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Baseline KPI + journey evidence | 85% | M | Complete (2026-02-23) | - | TASK-02, TASK-10 |
| TASK-02 | DECISION | Sync/auth scope gate + owner sign-off | 85% | S | Complete (2026-02-23) | TASK-01 | TASK-03, TASK-04, TASK-09 |
| TASK-03 | IMPLEMENT | Sync preflight + failure contract | 85% | M | Complete (2026-02-23) | TASK-02 | TASK-07, TASK-08 |
| TASK-04 | IMPLEMENT | Scoped action feedback architecture | 85% | L | Complete (2026-02-23) | TASK-02 | TASK-05, TASK-06, TASK-08 |
| TASK-05 | IMPLEMENT | EN/ZH validation + API error parity | 85% | M | Complete (2026-02-23) | TASK-04 | TASK-07, TASK-08 |
| TASK-06 | IMPLEMENT | Hook domain refactor + behavior tests | 85% | L | Complete (2026-02-23) | TASK-04 | TASK-08 |
| TASK-07 | IMPLEMENT | API contract tests + test-scope guardrails | 85% | M | Complete (2026-02-23) | TASK-03, TASK-05 | TASK-08 |
| TASK-08 | CHECKPOINT | Re-assess downstream assumptions | 95% | S | Complete (2026-02-23) | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | E2E flows + accessibility hardening | 80% | L | Complete (2026-02-23) | TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Final validation + KPI delta snapshot | 90% | S | Complete (2026-02-23) | TASK-01, TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish measurable baseline before build claims |
| 2 | TASK-02 | TASK-01 | Scope decision lock-in |
| 3 | TASK-03, TASK-04 | TASK-02 | Core technical foundation; different files but shared console context |
| 4 | TASK-05, TASK-06 | TASK-04 (+ TASK-03 context for TASK-05 error contracts) | i18n/error parity and hook modularization |
| 5 | TASK-07 | TASK-03, TASK-05 | API contract protection and test-scope hardening |
| 6 | TASK-08 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | Mandatory checkpoint before E2E rollout |
| 7 | TASK-09 | TASK-08 | User-flow verification and usability polish |
| 8 | TASK-10 | TASK-01, TASK-09 | Final quality gate + KPI report |

## Tasks

### TASK-01: Establish baseline usability KPI + operator journey evidence
- **Type:** INVESTIGATE
- **Deliverable:** analysis artifact at `docs/plans/xa-uploader-usability-hardening/artifacts/usability-baseline.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Created `docs/plans/xa-uploader-usability-hardening/artifacts/usability-baseline.md` with (a) primary KPI definition `CJDBR`, (b) reproducible baseline `1/2 = 50%` deterministic blocked journeys, (c) pre-committed TASK-10 threshold `0/2`, (d) two operator journeys with timing baselines and failure points, and (e) rerunnable command evidence for missing sync scripts and current test-surface shape. Validation contract satisfied: artifact contains concrete evidence pointers and rerun procedure.
- **Affects:** `docs/plans/xa-uploader-usability-hardening/plan.md`, `docs/plans/xa-uploader-usability-hardening/fact-find.md`, `docs/plans/xa-uploader-usability-hardening/artifacts/usability-baseline.md`, `[readonly] apps/xa-uploader/src/**`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-10
- **Confidence:** 85%
  - Implementation: 90% - artifact-only investigation with explicit source paths
  - Approach: 85% - KPI definition method is standard and bounded
  - Impact: 85% - output directly resolves open critique issue 1-01
- **Questions to answer:**
  - Which single KPI best represents uploader usability for this cycle (time-to-publish, error rate, retry rate)?
  - What is the reproducible baseline from current behavior?
  - Which two operator journeys are required for post-change comparison?
  - What post-change KPI threshold will count as success/failure for TASK-10 go/no-go?
- **Acceptance:**
  - Baseline KPI definition and collection method documented
  - At least two operator journeys documented with step timings/failure points
  - Baseline artifact includes KPI formula, denominator/window, and pre-committed target threshold
  - Decision owner for KPI sign-off recorded
- **Validation contract:**
  - Baseline artifact cites concrete logs/observations, includes threshold rationale, and can be re-run by another operator
- **Planning validation:**
  - Checks run: script-path existence probes, action-state path audit, uploader test-surface inventory
  - Validation artifacts: `docs/plans/xa-uploader-usability-hardening/artifacts/usability-baseline.md`, `docs/plans/xa-uploader-usability-hardening/fact-find.md`
  - Unexpected findings: none
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update plan task status + add artifact link in Decision Log
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/critique-history.md`
  - Downstream confidence propagation: neutral-affirming. TASK-02 and TASK-10 assumptions are now evidence-backed; confidence values unchanged (already above threshold, no new implementation unknowns introduced).

### TASK-02: Decision gate on sync ownership and auth UX scope
- **Type:** DECISION
- **Deliverable:** decision record in `docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added `docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md` and recorded operator decision to proceed with default recommendation (Sync Option A + Auth Option C). Decision owner/date and downstream task impacts captured for TASK-03/TASK-04/TASK-09.
- **Affects:** `docs/plans/xa-uploader-usability-hardening/plan.md`, `docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md`, `[readonly] docs/plans/xa-uploader-usability-hardening/fact-find.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-09
- **Confidence:** 85%
  - Implementation: 90% - decision artifact path and options are explicit
  - Approach: 85% - options/tradeoffs are already identified in fact-find questions
  - Impact: 85% - scope clarity prevents expensive rework downstream
- **Options (Sync ownership):**
  - Option A: Keep sync in uploader; implement script preflight and resilient operator messaging.
  - Option B: Remove/deprecate sync from uploader; keep submission-only workflow.
- **Options (Auth UX scope):**
  - Option C: Keep token-only auth and harden UX (mask/reveal, expiry messaging, safer copy/paste handling).
  - Option D: Start migration toward shared identity/session UX in this cycle.
- **Recommendation:**
  - Default to Option A + Option C, unless owner explicitly authorizes scope expansion to Option D.
- **Decision input needed:**
  - question: Should sync stay in uploader for this cycle?
  - why it matters: Directly changes TASK-03 and TASK-09 scope.
  - default + risk: Keep sync; risk is retaining script-coupling complexity.
  - question: Is auth scope limited to token-UX hardening, or expanded to shared identity/session work?
  - why it matters: Changes TASK-04/TASK-09 acceptance criteria and rollout risk.
  - default + risk: Keep token-UX hardening only; risk is deferred SSO/session ergonomics debt.
- **Acceptance:**
  - Decision outcomes for both sync ownership and auth UX scope recorded with owner/date
  - Explicit downstream task impact list captured for TASK-03/TASK-04/TASK-09
- **Validation contract:**
  - Decision record contains rationale, chosen path for both decision domains, and affected task IDs
- **Planning validation:**
  - Checks run: fact-find question review + dependency scan
  - Validation artifacts: `docs/plans/xa-uploader-usability-hardening/fact-find.md:193`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update TASK-03/TASK-04/TASK-09 notes with final scope
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md`
  - Downstream confidence propagation: affirming. TASK-03/TASK-04/TASK-09 dependency gate cleared with explicit scope bounds; confidence values unchanged.

### TASK-03: Implement sync dependency preflight and actionable failure contract
- **Type:** IMPLEMENT
- **Deliverable:** code-change in sync API route and related test coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Implemented script preflight in sync route with deterministic payload (`error: sync_dependencies_missing`, `recovery: restore_sync_scripts`, `missingScripts`) and non-zero branch recovery codes for validate/sync failures. Added actionable sync failure mapping in console hook and rendered sync-local notice in sync panel. Added route and sync-feedback tests covering missing-script, validate-fail, sync-fail, and localized actionable UI messaging. Validation results: `pnpm --filter @apps/xa-uploader typecheck` PASS; `pnpm --filter @apps/xa-uploader lint` PASS; targeted Jest (`route.test.ts` + `sync-feedback.test.tsx`) PASS (6/6).
- **Affects:** `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/*`, `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 85%
  - Implementation: 85% - missing script references are explicit and localized
  - Approach: 85% - preflight + normalized error contract is established pattern
  - Impact: 85% - directly resolves high-impact sync failure mode
- **Acceptance:**
  - Sync route checks script existence before spawn and returns actionable error payload when missing
  - Console surfaces clear sync failure reason and recovery action
  - Tests cover missing-script and failing-script branches
- **Validation contract (TC-03):**
  - TC-01: missing script path -> API returns deterministic `ok:false` error payload with explicit reason
  - TC-02: script returns non-zero -> API returns `validation_failed` or `sync_failed` with logs
  - TC-03: UI sync panel renders localized actionable message for both failure classes
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add route tests reproducing current missing-script failure path
  - **Green:** implement script preflight + user-facing message mapping
  - **Refactor:** centralize sync error mapping in one helper
- **Planning validation (required for M/L):**
  - Checks run: script existence probe + route path audit
  - Validation artifacts: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:91`, `docs/plans/xa-uploader-usability-hardening/fact-find.md:99`
  - Unexpected findings: none
- **Scouts:**
  - Probe whether fallback script path contract should be env-driven
- **Edge Cases & Hardening:**
  - Prevent leaking full filesystem paths in error messages
  - Ensure vendor mode still hard-404s sync endpoint
- **Consumer tracing (M/L required):**
  - New outputs: normalized sync error codes and optional recovery hint field
  - Consumers: `useCatalogConsole` sync handler and `CatalogSyncPanel` render path
  - Modified behavior: sync endpoint failure semantics; all known callers are uploader-local
- **What would make this >=90%:**
  - Add contract tests validating response schema and localization wiring
- **Rollout / rollback:**
  - Rollout: ship with route + UI + tests in one atomic change
  - Rollback: revert commit; previous behavior restored
- **Documentation impact:**
  - Update fact-find resolved question for sync operability
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/fact-find.md:99`
  - Scope expansion: added `CatalogConsole.client.tsx` and `sync-feedback.test.tsx` to wire and validate sync-panel messaging contract.

### TASK-04: Implement scoped action feedback model (status + success + errors)
- **Type:** IMPLEMENT
- **Deliverable:** code-change introducing scoped feedback channels per action domain
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Build evidence:** Replaced global `error`/`syncNotice` state with scoped `actionFeedback` domains (`login`, `draft`, `submission`, `sync`) and added shared helper methods for update/clear semantics. Added a busy-lock ref guard for async actions to prevent duplicate in-flight submits while preserving existing disabled UI behavior. Routed scoped feedback into login/product/submission/sync panels, including explicit localized draft/sync success messages (`saveSucceeded`, `deleteSucceeded`, `syncSucceeded`). Added hook-level TC-04 coverage in `action-feedback.test.tsx` plus sync panel test update for typed feedback. Validation results: `pnpm --filter @apps/xa-uploader typecheck` PASS; `pnpm --filter @apps/xa-uploader lint` PASS; targeted Jest (`action-feedback.test.tsx`, `sync-feedback.test.tsx`, `route.test.ts`) PASS (10/10).
- **Affects:** `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogLoginForm.client.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx`, `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05, TASK-06, TASK-08
- **Confidence:** 85%
  - Implementation: 85% - current global error state is centralized and replaceable
  - Approach: 85% - scoped status model aligns with existing action boundaries
  - Impact: 90% - directly improves operator clarity and recoverability
- **Acceptance:**
  - Replace single global `error` channel with scoped action feedback (`login`, `draft`, `submission`, `sync`)
  - Add explicit positive success feedback for save and delete actions
  - Keep busy/disabled semantics consistent across affected panels
- **Validation contract (TC-04):**
  - TC-01: failed login sets only login error state and leaves other panels unaffected
  - TC-02: successful save/delete sets localized success state visible in product panel
  - TC-03: submission and sync status updates do not overwrite draft feedback state
  - TC-04: busy flag still prevents duplicate submits during in-flight actions
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add failing hook/component tests asserting state collisions with global error
  - **Green:** implement scoped feedback model and success messages
  - **Refactor:** extract feedback state helpers for maintainability
- **Planning validation (required for M/L):**
  - Checks run: action handler audit across `useCatalogConsole`
  - Validation artifacts: `docs/plans/xa-uploader-usability-hardening/fact-find.md:187`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - Unexpected findings: none
- **Scouts:**
  - Evaluate whether message lifetimes should auto-expire or require explicit clear
- **Edge Cases & Hardening:**
  - Clear success state when storefront changes to avoid stale context
  - Ensure partial failures do not wipe unrelated in-progress status messages
- **Consumer tracing (M/L required):**
  - New outputs: scoped feedback state object per action domain
  - Consumers: login form, product form, submission panel, sync panel
  - Modified behavior: state update semantics in all existing action handlers
- **What would make this >=90%:**
  - Add deterministic state-transition tests for all action handlers
- **Rollout / rollback:**
  - Rollout: ship with tests that lock new feedback contract
  - Rollback: revert scoped state changes and panel bindings
- **Documentation impact:**
  - Add short operator note describing new status/success surface locations
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/fact-find.md:189`
  - Scope expansion: added `CatalogConsole.client.tsx` and new hook test `action-feedback.test.tsx` to validate panel wiring and TC-04 busy-lock contract.
  - Downstream confidence propagation: affirming. TASK-05/TASK-06/TASK-08 dependency gate from TASK-04 is now satisfied with passing scoped-feedback tests.

### TASK-05: Localize validation and API error surfaces (EN/ZH parity)
- **Type:** IMPLEMENT
- **Deliverable:** code-change for error message localization and mapping
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added localized schema-issue mapping in `catalogConsoleUtils` and routed `toErrorMap` through `useCatalogConsole` with locale-aware translation. Added deterministic machine-code route contracts for products/delete/submission errors (`invalid`, `missing_product`, `not_found`, `conflict`, `internal_error`) with explicit `reason` tokens and no raw exception leakage. Added client-side API error-code mapping to localized operator copy, including safe fallback for `internal_error`. Added EN/ZH keys for validation and API error surfaces. Added targeted tests for localized schema output and API-class mapping (`catalogConsoleUtils.test.ts`, `error-localization.test.tsx`) plus route contract tests (`products/route.test.ts`, `products/[slug]/route.test.ts`, `submission/route.test.ts`). Validation results: `pnpm --filter @apps/xa-uploader typecheck` PASS; `pnpm --filter @apps/xa-uploader lint` PASS; targeted Jest (`action-feedback`, `sync-feedback`, `error-localization`, `catalogConsoleUtils`, `sync route`, `products route`, `products/[slug] route`, `submission route`) PASS (22/22).
- **Affects:** `apps/xa-uploader/src/components/catalog/catalogConsoleUtils.ts`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-uploader/src/app/api/catalog/products/route.ts`, `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`, `apps/xa-uploader/src/app/api/catalog/submission/route.ts`, `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleUtils.test.ts`, `apps/xa-uploader/src/components/catalog/__tests__/error-localization.test.tsx`, `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`
- **Depends on:** TASK-04
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 85%
  - Implementation: 85% - current messages are centralized but mixed in source
  - Approach: 85% - map machine/API/schema errors to i18n keys at boundaries
  - Impact: 85% - reduces operator confusion for zh locale usage
- **Acceptance:**
  - Validation and API-facing errors display localized operator-safe messages in EN/ZH
  - Machine/internal error tokens remain available for debugging without leaking raw internals to users
  - Existing success/error UX from TASK-04 remains stable
- **Validation contract (TC-05):**
  - TC-01: schema validation failure shows locale-specific field message
  - TC-02: API `missing_product`/`invalid`/`not_found` classes map to localized copy
  - TC-03: unknown server error maps to localized fallback without raw stack/path exposure
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** add tests for current non-localized branches
  - **Green:** introduce error-code-to-i18n mapping and localized schema messages
  - **Refactor:** dedupe mapping logic into shared utility
- **Planning validation (required for M/L):**
  - Checks run: string key and route response audit
  - Validation artifacts: `docs/plans/xa-uploader-usability-hardening/fact-find.md:116`, `docs/plans/xa-uploader-usability-hardening/fact-find.md:261`
  - Unexpected findings: none
- **Scouts:**
  - Probe whether zod message generation should be locale-aware at parse time vs post-parse mapping
- **Edge Cases & Hardening:**
  - Ensure fallback to EN for unknown locale or missing key
  - Keep API contract deterministic for tests while UI localizes display copy
- **Consumer tracing (M/L required):**
  - New outputs: normalized localized message keys and mapping function
  - Consumers: `toErrorMap` output path, route error readers in console handlers
  - Modified behavior: user-visible error text generation path
- **What would make this >=90%:**
  - Add EN/ZH snapshot tests for representative failure matrices
- **Rollout / rollback:**
  - Rollout: ship mapping with tests and key inventory updates
  - Rollback: revert mapping layer and restore previous message pipeline
- **Documentation impact:**
  - Update uploader localization notes in plan artifacts
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/fact-find.md:122`
  - Scope expansion: added route-level contract tests and localization-focused component/unit tests to satisfy TC-05 deterministically.
  - Downstream confidence propagation: affirming. TASK-07/TASK-08 dependencies from TASK-05 are now satisfied with passing route/UI localization contracts.

### TASK-06: Refactor `useCatalogConsole` domains and add hook/component tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change splitting console hook domains and adding deterministic tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Build evidence:** Refactored monolithic hook internals into focused domain modules: `catalogConsoleFeedback.ts` (feedback/error contract + busy-lock helpers), `catalogConsoleActions.ts` (auth/draft/submission/sync action handlers + submission toggle invariant helper), and a slimmed `useCatalogConsole.client.ts` orchestration shell. Preserved external hook return shape consumed by `CatalogConsole` and existing panels. Hardened logout reset behavior to clear submission selection/action + sync output. Added deterministic TC-06 behavior coverage in `useCatalogConsole-domains.test.tsx` for (1) login/logout state-slice transitions, (2) save/delete revision + success feedback transitions, (3) submission toggle max-cap/export/upload invariants, and (4) storefront switch reset semantics with default-category reset. Validation results: `pnpm --filter @apps/xa-uploader typecheck` PASS; `pnpm --filter @apps/xa-uploader lint` PASS; targeted Jest (`action-feedback`, `sync-feedback`, `error-localization`, `catalogConsoleUtils`, `useCatalogConsole-domains`, `sync route`, `products route`, `products/[slug] route`, `submission route`) PASS (26/26).
- **Affects:** `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`, `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`, `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx`
- **Depends on:** TASK-04
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - existing hook already has logical subdomains that can be isolated
  - Approach: 85% - refactor-first with behavior tests reduces regression risk
  - Impact: 85% - improves maintainability and supports future UX changes
- **Acceptance:**
  - Split console hook into focused domain modules without changing external behavior contract
  - Add tests for key state transitions (login/save/delete/submission/sync)
  - Preserve existing storefront persistence and selection behavior
- **Validation contract (TC-06):**
  - TC-01: login/logout transitions set session and state slices correctly
  - TC-02: save/delete handlers update draft/revision/success state as expected
  - TC-03: submission toggle/export/upload actions preserve selection invariants
  - TC-04: storefront switch resets scoped state and draft defaults safely
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** capture current behavior in tests around monolithic hook
  - **Green:** extract domain modules and keep public return shape stable
  - **Refactor:** collapse duplicated state transitions/helpers
- **Planning validation (required for M/L):**
  - Checks run: handler map audit + state ownership map
  - Validation artifacts: `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:625`, `docs/plans/xa-uploader-usability-hardening/fact-find.md:67`
  - Unexpected findings: none
- **Scouts:**
  - Probe candidate seams for pure-function extraction to reduce hook complexity
- **Edge Cases & Hardening:**
  - Prevent stale closures in async handlers after refactor
  - Keep `busy` and `submissionAction` semantics stable under concurrent action attempts
- **Consumer tracing (M/L required):**
  - New outputs: none (internal modularization)
  - Modified behavior: internal state transition code paths for all console consumers
  - Consumers: `CatalogConsole` and all child panel props derived from hook return
- **What would make this >=90%:**
  - Add regression tests for previously failing edge transitions from QA
- **Rollout / rollback:**
  - Rollout: merge refactor only with full hook/component test pass
  - Rollback: revert modularization commit
- **Documentation impact:**
  - Update plan notes with module map for future contributors
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/fact-find.md:145`
  - Scope expansion: narrowed from legacy planned touchpoints (`catalogDraft.ts`, `catalogSubmissionClient.ts`, `CatalogConsole.client.tsx`) to dedicated domain modules and hook-domain tests after validating no call-site contract changes were required.
  - Downstream confidence propagation: affirming. TASK-08 dependency gating moved to TASK-07 completion and checkpoint protocol execution.

### TASK-07: Add API contract tests and test-runner scoping guardrails
- **Type:** IMPLEMENT
- **Deliverable:** code-change adding route contract tests and scoped test execution guidance/guardrails
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Build evidence:** Added uploader auth/session route contract suites for login/logout/session endpoints and extended API route contract coverage across catalog routes. Added uploader-scoped governed test scripts in `apps/xa-uploader/package.json` (`test:api`, `test:local`) and documented explicit scope caveats in `docs/testing-policy.md` under a dedicated XA uploader section. Verified scoped command behavior: `test:api` executed only API route suites (`src/app/api/**/__tests__/route.test.ts`), and `test:local` executed only uploader operator-surface suites (`src/app/api/**` + `src/components/catalog/**`). Validation results: `pnpm --filter @apps/xa-uploader typecheck` PASS; `pnpm --filter @apps/xa-uploader lint` PASS; `pnpm --filter @apps/xa-uploader run test:api` PASS (7 suites / 20 tests); `pnpm --filter @apps/xa-uploader run test:local` PASS (12 suites / 36 tests).
- **Affects:** `apps/xa-uploader/src/app/api/uploader/login/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/uploader/logout/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/uploader/session/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, `apps/xa-uploader/package.json`, `docs/testing-policy.md`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - route boundaries and expected contracts are explicit
  - Approach: 85% - route tests + scoped invocation policy is straightforward
  - Impact: 85% - reduces regressions and false-negative confidence from cross-package test noise
- **Acceptance:**
  - API route tests cover auth/session, products CRUD errors, submission failure contracts, and sync failure contracts
  - Scoped test command guidance prevents accidental unrelated-suite execution for uploader work
  - CI-safe command examples documented in plan/doc references
- **Validation contract (TC-07):**
  - TC-01: route tests fail before fixes and pass after implementations
  - TC-02: uploader-local test command executes uploader suites only
  - TC-03: governed runner path is documented with explicit scope caveat
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** author failing tests for current uncovered contracts
  - **Green:** implement minimal code updates required to satisfy tests
  - **Refactor:** dedupe route test helpers/mocks
- **Planning validation (required for M/L):**
  - Checks run: package test script + governed runner invocation path audit
  - Validation artifacts: `apps/xa-uploader/package.json:10`, `scripts/tests/run-governed-test.sh:189`, `docs/plans/xa-uploader-usability-hardening/fact-find.md:193`
  - Unexpected findings: none
- **Scouts:**
  - Resolved: uploader now exposes `test:api` and `test:local` scoped governed aliases.
- **Edge Cases & Hardening:**
  - Keep tests robust under vendor/internal mode branch differences
  - Avoid brittle assertions on full error message strings where code is expected to evolve
- **Consumer tracing (M/L required):**
  - New outputs: route test suites and test command conventions
  - Consumers: uploader contributors and CI workflows running uploader validations
  - Modified behavior: quality gate behavior for route regressions
- **What would make this >=90%:**
  - Add CI job assertion for uploader-scoped test command in PR checks
- **Rollout / rollback:**
  - Rollout: merge tests + command docs as one guardrail change
  - Rollback: revert test/doc/command edits if CI policy conflict appears
- **Documentation impact:**
  - Update testing policy with uploader-specific scoped command guidance
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/fact-find.md:190`
  - Downstream confidence propagation: affirming. TASK-08 dependency chain is now fully satisfied (TASK-03/04/05/06/07 complete), so checkpoint execution is the next eligible build step.

### TASK-08: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if assumptions changed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Build evidence:** Executed checkpoint + checkpoint-mode replan over downstream scope. Assumptions 1-4 were validated from completed build evidence and current call-site wiring (scope decision + sync/auth/feedback/i18n/test coverage). Assumption 5 was initially invalidated (`apps/xa-uploader` lacked an E2E harness and command), so downstream TASK-09 was replanned with explicit runner/command/fixture strategy (Playwright, package-scoped `test:e2e`, temp CSV/image fixtures via `XA_UPLOADER_PRODUCTS_CSV_PATH`, and `XA_UPLOADER_MIN_IMAGE_EDGE=1`). Topology remained stable, so `/lp-sequence` was not required. Checkpoint decision: GO for TASK-09.
- **Affects:** `docs/plans/xa-uploader-usability-hardening/plan.md`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is deterministic
  - Approach: 95% - catches stale assumptions before E2E rollout
  - Impact: 95% - limits downstream risk and wasted effort
- **Acceptance:**
  - `/lp-do-build` executes checkpoint contract
  - downstream tasks reviewed against latest evidence
  - plan updated + re-sequenced if assumptions changed
- **Horizon assumptions to validate:**
  - Sync feature remains in uploader scope
  - Auth UX scope remains token-hardening only (unless TASK-02 selected expansion)
  - Scoped feedback model does not require broader UI redesign
  - API and hook tests provide sufficient pre-E2E confidence
  - E2E runner choice, command path, and fixture strategy are documented and runnable in app scope
- **Validation contract:**
  - checkpoint evidence includes explicit go/no-go for TASK-09
- **Planning validation:**
  - Replan evidence captured inline in TASK-09 runner/fixture/command updates
  - Topology change check: none
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan gate updates and task status refresh
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md`
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/caryina/e2e/logo.visual.spec.ts`
  - Downstream confidence propagation: affirming. TASK-09 remains above threshold with reduced execution ambiguity from explicit harness strategy.

### TASK-09: Add E2E operator flows + accessibility/usability hardening
- **Type:** IMPLEMENT
- **Deliverable:** code-change adding E2E flows and targeted usability polish
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Build evidence:** Implemented uploader-local Playwright E2E harness and flow specs at `apps/xa-uploader/e2e/catalog-console.spec.ts` with deterministic temp CSV/image fixtures from `apps/xa-uploader/e2e/helpers/uploaderHarness.ts`. Added package-scoped E2E command `pnpm --filter @apps/xa-uploader run test:e2e` and documented it in `docs/testing-policy.md`. Implemented targeted accessibility/usability hardening in login/product/submission/sync surfaces: token mask/reveal and autofocus, action feedback `role` + `aria-live`, retry-focus return for failed sync/submission actions, and stable test IDs for keyboard/focus assertions. Added deterministic non-production auth override path `XA_UPLOADER_E2E_ADMIN_TOKEN` in `uploaderAuth` so E2E login does not depend on operator secrets in `.env.local`. Validation results: `pnpm --filter @apps/xa-uploader typecheck` PASS; `pnpm --filter @apps/xa-uploader lint` PASS; `pnpm --filter @apps/xa-uploader run test:local` PASS (12 suites / 36 tests); `pnpm --filter @apps/xa-uploader run test:e2e` PASS (2 tests).
- **Affects:** `apps/xa-uploader/src/components/catalog/CatalogLoginForm.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`, `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`, `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx`, `apps/xa-uploader/src/lib/uploaderAuth.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-uploader/tsconfig.json`, `apps/xa-uploader/e2e/catalog-console.spec.ts`, `apps/xa-uploader/e2e/fixtures/**`, `apps/xa-uploader/e2e/helpers/**`, `apps/xa-uploader/package.json`, `docs/testing-policy.md`
- **Depends on:** TASK-08
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 75% - runner/fixture strategy is explicit, but harness code is not yet established
  - Approach: 80% - E2E confirms end-to-end operator reliability once harness is fixed
  - Impact: 85% - direct usability improvements with regression protection
- **Acceptance:**
  - E2E happy path: login -> create/edit product -> export ZIP
  - E2E failure-recovery path: sync failure surfaced with clear operator action
  - Selected E2E runner and exact uploader-scoped command are documented and reproducible (`pnpm --filter @apps/xa-uploader run test:e2e`)
  - Accessibility refinements implemented for token/login, focus management, and status readability
- **Validation contract (TC-09):**
  - TC-01: happy-path E2E passes on clean fixture data
  - TC-02: simulated sync failure E2E shows actionable localized guidance
  - TC-03: keyboard/focus checks pass for login and primary action controls
  - TC-04: uploader-scoped E2E command runs without launching unrelated app suites
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** implement Playwright app-local harness + fixtures (temp CSV + temp image file), wire `test:e2e`, then add failing happy/failure E2E specs
  - **Green:** implement required UX polish and wiring
  - **Refactor:** extract reusable test helpers/fixtures
- **Planning validation (required for M/L):**
  - Checks run: component-level UX hotspot audit + flow map
  - Validation artifacts: `docs/plans/xa-uploader-usability-hardening/fact-find.md:280`, `docs/plans/xa-uploader-usability-hardening/fact-find.md:283`
  - Unexpected findings: none
- **Scouts:**
  - Resolved (TASK-08 checkpoint): use Playwright for uploader E2E in this cycle; Cypress remains out of scope for this app.
- **Edge Cases & Hardening:**
  - Ensure status text remains readable under long error messages
  - Ensure focus returns to actionable control after failures
- **Consumer tracing (M/L required):**
  - New outputs: E2E test artifacts and accessibility behavior guarantees
  - Consumers: release confidence gate and future uploader maintenance work
  - Modified behavior: UI interaction ergonomics on error/success paths
- **What would make this >=90%:**
  - Run E2E on CI target environment with deterministic fixtures
- **Rollout / rollback:**
  - Rollout: ship with E2E and accessibility assertions green
  - Rollback: revert UX polish if E2E introduces instability
- **Documentation impact:**
  - Add E2E command notes to plan + testing policy references
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/fact-find.md:167`
  - `apps/caryina/e2e/logo.visual.spec.ts`
  - Scope expansion: included `uploaderAuth` non-production test-token override and stabilized hook-domain TC-06 test timing to keep local suite deterministic under broader scoped runs.
  - Downstream confidence propagation: affirming. TASK-10 dependency gate from TASK-09 is now satisfied with passing scoped E2E evidence.

### TASK-10: Final validation and KPI delta snapshot
- **Type:** IMPLEMENT
- **Deliverable:** validation report + KPI delta artifact
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Build evidence:** Produced final validation and KPI evidence artifacts at `docs/plans/xa-uploader-usability-hardening/artifacts/validation-summary.md` and `docs/plans/xa-uploader-usability-hardening/artifacts/usability-kpi-delta.md`. Validation gate results recorded from scoped package commands: typecheck PASS, lint PASS, `test:local` PASS (12 suites / 36 tests), `test:e2e` PASS (2 tests). KPI remeasurement executed against TASK-01 formula and threshold: post-change `CJDBR` measured `1/2 = 50%` (unchanged from baseline) due unresolved sync script dependency while J1 journey is now E2E-confirmed pass.
- **Affects:** `docs/plans/xa-uploader-usability-hardening/artifacts/validation-summary.md`, `docs/plans/xa-uploader-usability-hardening/artifacts/usability-kpi-delta.md`, `docs/plans/xa-uploader-usability-hardening/plan.md`
- **Depends on:** TASK-01, TASK-09
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - aggregation/reporting task with explicit inputs
  - Approach: 90% - deterministic validation checklist
  - Impact: 90% - final evidence package for go/no-go and retrospective
- **Acceptance:**
  - Validation summary includes typecheck, lint, targeted tests, route tests, and E2E results
  - KPI delta compares pre/post values using TASK-01 baseline
  - Remaining known issues listed with ownership
- **Validation contract (TC-10):**
  - TC-01: all required validation commands and outcomes documented
  - TC-02: KPI delta artifact includes method, values, and interpretation
  - TC-03: plan status and decision log updated from execution evidence
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** collect expected validation checklist and baseline references
  - **Green:** run validations and write delta report
  - **Refactor:** compress/normalize artifact format for future reuse
- **Planning validation:** None: S-effort
- **Scouts:** None: completion task
- **Edge Cases & Hardening:**
  - If KPI collection method changed mid-build, document comparability caveat explicitly
- **What would make this >=90%:**
  - Already at 90%; higher requires stable multi-run KPI trend
- **Rollout / rollback:**
  - Rollout: publish artifacts and mark plan progression state
  - Rollback: `None: reporting and validation output`
- **Documentation impact:**
  - final update to plan and linked artifacts
- **Notes / references:**
  - `docs/plans/xa-uploader-usability-hardening/critique-history.md`
  - `docs/plans/xa-uploader-usability-hardening/artifacts/usability-baseline.md`

## Validation Contracts
- TC-03: Sync dependency preflight and failure contract
- TC-04: Scoped action feedback model
- TC-05: EN/ZH error parity and safe fallback
- TC-06: Hook refactor behavior parity
- TC-07: API contract tests and scoped test guardrails
- TC-09: E2E happy/failure and accessibility checks
- TC-10: Final validation + KPI delta package

## Open Decisions
- None: TASK-02 resolved on 2026-02-23 (`docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md`).

## Risks & Mitigations
- Sync scope decision stalls implementation progress.
  - Mitigation: TASK-02 immediately after TASK-01 with explicit default fallback.
- Hook refactor introduces regressions in action state handling.
  - Mitigation: TASK-06 behavior tests and checkpoint before E2E.
- Localization changes break machine-readable API contract assumptions.
  - Mitigation: preserve machine error codes and localize only UI-facing mapping layer.
- E2E setup overhead delays completion.
  - Mitigation: checkpoint gate and scoped E2E to two critical flows.
- Auth scope expansion mid-cycle creates unplanned security and delivery risk.
  - Mitigation: lock auth decision in TASK-02 and reject mid-cycle scope changes without replan.

## Observability
- Logging:
  - Capture structured action result logs for sync, save, delete, submission actions.
- Metrics:
  - One primary KPI from TASK-01 plus supporting success/failure counters by action domain.
- Alerts/Dashboards:
  - None: internal tool; use artifact-based monitoring in this cycle.

## Acceptance Criteria (overall)
- [x] Known sync dependency failure is converted into deterministic, actionable operator feedback.
- [x] Scoped feedback model prevents cross-action message collisions.
- [x] EN/ZH error surfaces are consistent and operator-readable.
- [x] Hook/API/E2E coverage exists for core operator workflows.
- [x] KPI baseline and post-change delta are documented for impact claims.

## Decision Log
- 2026-02-23: Planning created from fact-find `docs/plans/xa-uploader-usability-hardening/fact-find.md`.
- 2026-02-23: TASK-01 completed; baseline artifact added at `docs/plans/xa-uploader-usability-hardening/artifacts/usability-baseline.md` with KPI formula, baseline, threshold, and journey evidence.
- 2026-02-23: TASK-02 completed; scope locked to Sync Option A + Auth Option C in `docs/plans/xa-uploader-usability-hardening/artifacts/scope-decision.md`.
- 2026-02-23: TASK-03 completed; sync preflight, actionable error contract, and targeted route/UI tests added.
- 2026-02-23: TASK-04 completed; scoped action feedback domains, busy-lock guard, panel wiring, and TC-04 hook tests added.
- 2026-02-23: TASK-05 completed; EN/ZH schema/API error localization and deterministic machine-code route contracts validated by targeted UI + API tests.
- 2026-02-23: TASK-06 completed; hook internals split into feedback/action domain modules with TC-06 transition/invariant coverage.
- 2026-02-23: TASK-07 completed; uploader auth/session API contracts and governed uploader-scoped test command guardrails documented and validated.
- 2026-02-23: TASK-08 completed; checkpoint-mode replan validated assumptions, resolved E2E runner strategy to Playwright, and cleared TASK-09 GO decision without topology changes.
- 2026-02-23: TASK-09 completed; Playwright uploader-scoped E2E harness/command and accessibility hardening shipped with passing `test:e2e` + `test:local` validation.
- 2026-02-23: TASK-10 completed; final validation and KPI delta artifacts published with explicit threshold result (`CJDBR` remains `50%` pending sync-script restoration).

## Overall-confidence Calculation
- Effort weights: S=1, M=2, L=3
- Task weighted points:
  - TASK-01: 85 * 2 = 170
  - TASK-02: 85 * 1 = 85
  - TASK-03: 85 * 2 = 170
  - TASK-04: 85 * 3 = 255
  - TASK-05: 85 * 2 = 170
  - TASK-06: 85 * 3 = 255
  - TASK-07: 85 * 2 = 170
  - TASK-08: 95 * 1 = 95
  - TASK-09: 80 * 3 = 240
  - TASK-10: 90 * 1 = 90
- Sum(weighted points) = 1700
- Sum(weights) = 20
- Overall-confidence = 1700 / 20 = 85.00% -> 85%

## Section Omission Rule
If a section is not relevant, write `None: <reason>`.
