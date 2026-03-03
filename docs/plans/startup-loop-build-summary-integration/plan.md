---
Type: Plan
Status: Complete
Domain: Business-OS
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-build-summary-integration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Build Summary Integration Plan

## Summary
This plan adds a deterministic Build Summary surface into the canonical startup-loop output registry page and wires it to generated JSON. The implementation is split into generator + tests + UI integration + validation to keep behavior reproducible and easy to audit. The data contract uses strict inclusion/exclusion, stem dedupe precedence, UTC timestamp normalization, conservative text extraction, and stable serialization. The UI path remains static-only (`./_data/build-summary.json`) with client-side filters and explicit empty/error states. The plan is auto-build eligible because all IMPLEMENT tasks are unblocked and >=80 confidence.

## Active tasks
- [x] TASK-01: Implement deterministic Build Summary generator + CLI wiring
- [x] TASK-02: Add generator test coverage (determinism, contracts, extraction rules)
- [x] TASK-03: Integrate Build Summary UI section into registry HTML
- [x] TASK-04: Generate JSON and run validation/idempotence checks

## Goals
- Add `#build-summary` to `docs/business-os/startup-loop-output-registry.user.html` with nav anchor entry.
- Produce `docs/business-os/_data/build-summary.json` from deterministic source rules.
- Enforce strict row schema and no-fabrication fallback (`why`/`intended` -> `"—"`).
- Keep filtering static-site compatible (client-side only, no backend).
- Verify idempotent generation and targeted tests.

## Non-goals
- Creating a second Build Summary page.
- Introducing server endpoints, API routes, or live data services.
- Adding KPI inference beyond source-documented content.

## Constraints & Assumptions
- Constraints:
  - Canonical page path is fixed: `docs/business-os/startup-loop-output-registry.user.html`.
  - Data path is fixed: `docs/business-os/_data/build-summary.json`.
  - Link mapping is fixed: `href = "/" + sourcePath`.
  - Renderer must use safe text rendering (`textContent`, no extracted-text `innerHTML`).
- Assumptions:
  - `http://localhost:8080` serves repo-root path links beginning `/docs/...`.
  - Existing source docs are parseable enough for deterministic heading/frontmatter extraction with conservative fallback.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-build-summary-integration/fact-find.md`
- Key findings used:
  - Existing registry file has no Build Summary section and no `_data` fetch path.
  - Business catalog is available in `docs/business-os/strategy/businesses.json`.
  - Deterministic generator/testing pattern already exists in `scripts/src/startup-loop/*`.

## Proposed Approach
- Option A: Inline static rows in HTML and manually update.
- Option B: Deterministic generator emits JSON; HTML fetches and renders with client-side filtering.
- Chosen approach: Option B (deterministic generator + static JSON + client renderer).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Build deterministic generator + package script wiring | 85% | M | Completed | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add tests for generator/determinism/schema | 85% | M | Completed | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add Build Summary section + client-side renderer/filtering to registry HTML | 85% | M | Completed | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Generate JSON and run targeted validation/idempotence checks | 90% | S | Completed | TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Data contract and helper APIs must exist first |
| 2 | TASK-02, TASK-03 | TASK-01 | Tests and UI integration can proceed in parallel after generator contract stabilizes |
| 3 | TASK-04 | TASK-02, TASK-03 | Validation gate after code+tests+UI are in place |

## Tasks

### TASK-01: Implement deterministic Build Summary generator + CLI wiring
- **Type:** IMPLEMENT
- **Deliverable:** New generator at `scripts/src/startup-loop/generate-build-summary.ts`, new root script entry `startup-loop:build-summary` in `package.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `scripts/src/startup-loop/generate-build-summary.ts`, `package.json`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - precedent exists for deterministic generators and CLI guards.
  - Approach: 85% - source inclusion/exclusion + dedupe + extraction rules are explicit.
  - Impact: 90% - isolated additive behavior in startup-loop scripts and package script map.
- **Acceptance:**
  - Script discovers only allowed source families and applies all exclusion rules.
  - Stem dedupe precedence implemented (`.user.md` > `.md` > `.user.html`).
  - Output row schema exact: `date,business,domain,what,why,intended,links,sourcePath`.
  - Output serialization deterministic (`JSON.stringify(rows, null, 2) + "\n"`).
- **Validation contract (TC-01):**
  - TC-01: `pnpm startup-loop:build-summary` completes and writes `docs/business-os/_data/build-summary.json`.
  - TC-02: Two reruns without source changes produce byte-identical JSON.
  - TC-03: Timestamps normalized through UTC ISO (`toISOString()`) for both git and fallback mtime.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed deterministic generator/test patterns in `generate-stage-operator-views.ts` and `manifest-update.ts`.
  - Validation artifacts: `scripts/src/startup-loop/generate-stage-operator-views.ts`, `scripts/src/startup-loop/manifest-update.ts`.
  - Unexpected findings: none.
- **Scouts:** None: source rules and output contract are explicit.
- **Edge Cases & Hardening:** invalid/missing dates, empty extraction sections, duplicate stems across extensions.
- **What would make this >=90%:** fixture-based integration tests across markdown + html variants.
- **Rollout / rollback:**
  - Rollout: commit generator and script mapping.
  - Rollback: revert commit.
- **Documentation impact:** none.
- **Notes / references:** `docs/plans/startup-loop-build-summary-integration/fact-find.md`.
- **Completion evidence (2026-02-25):**
  - Added generator: `scripts/src/startup-loop/generate-build-summary.ts`
  - Added npm script: `package.json` -> `"startup-loop:build-summary": "node --import tsx scripts/src/startup-loop/generate-build-summary.ts"`
  - Implemented deterministic scope controls:
    - authoritative business filter from `docs/business-os/strategy/businesses.json` (when present)
    - source-scope enforcement for `startup-baselines/<BUSINESS>-*` top-level files only
    - stable dedupe precedence and UTC timestamp normalization

### TASK-02: Add generator test coverage (determinism, contracts, extraction rules)
- **Type:** IMPLEMENT
- **Deliverable:** New test file `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - existing startup-loop tests already cover deterministic patterns and temp fixture usage.
  - Approach: 85% - helper functions can be exported and tested as pure units.
  - Impact: 90% - test-only scope.
- **Acceptance:**
  - Tests cover include/exclude logic, stem precedence, domain mapping, text sanitization/capping, and sorting.
  - Deterministic serialization validated with repeated outputs.
  - At least one test validates fallback `"—"` for missing `why`/`intended`.
- **Validation contract (TC-02):**
  - TC-01: targeted Jest suite for `generate-build-summary` passes.
  - TC-02: deterministic output hash equality test passes.
  - TC-03: schema field-order expectation matches contract.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed `generate-stage-operator-views.test.ts` + `manifest-update.test.ts` for fixture and determinism pattern.
  - Validation artifacts: existing startup-loop test files.
  - Unexpected findings: none.
- **Scouts:** None: explicit helper surface can be exported.
- **Edge Cases & Hardening:** html extraction fallback behavior when heading content is noisy.
- **What would make this >=90%:** add integration test that runs generator against temp repo-like fixture tree.
- **Rollout / rollback:**
  - Rollout: commit tests with generator.
  - Rollback: revert commit.
- **Documentation impact:** none.
- **Completion evidence (2026-02-25):**
  - Added tests: `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`
  - Coverage now includes:
    - stem precedence
    - source exclusion rules
    - top-level-only startup-baselines behavior
    - authoritative business catalog filtering
    - deterministic sorting + serialization newline
    - fallback `"—"` for missing `why`/`intended`

### TASK-03: Integrate Build Summary UI section into registry HTML
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop-output-registry.user.html` with:
  - nav anchor link `Build Summary -> #build-summary`
  - new `#build-summary` section
  - client-side fetch/render/filter logic for `./_data/build-summary.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Completed
- **Affects:** `docs/business-os/startup-loop-output-registry.user.html`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - existing page already supports inline JS behavior (tab switching).
  - Approach: 85% - filter logic and state messages are fully specified.
  - Impact: 85% - one large file, but additive and localized to new section/script block.
- **Acceptance:**
  - Header nav includes Build Summary anchor link.
  - Table columns in exact order with business/timeframe controls.
  - Defaults: Business=All, Timeframe=7 days, sorted by date desc then sourcePath asc.
  - Empty state exact text: `No outputs in selected timeframe.`
  - Error state exact text: `Build Summary data unavailable.`
  - Renderer uses safe text assignment (`textContent`) for textual cells.
- **Validation contract (TC-03):**
  - TC-01: nav anchor scrolls to section.
  - TC-02: filter invariant holds (`c1 <= c3 <= c7`) for Business=All.
  - TC-03: business filter emits only selected business rows.
  - TC-04: link `href` values start with `/docs/business-os/`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: inspected existing nav + script structure and insertion points in registry HTML.
  - Validation artifacts: `docs/business-os/startup-loop-output-registry.user.html`.
  - Unexpected findings: none.
- **Scouts:** None: no additional design-system dependency required.
- **Edge Cases & Hardening:** invalid JSON payload, missing fields, malformed date strings.
- **What would make this >=90%:** page-level automated DOM test for error and empty states.
- **Rollout / rollback:**
  - Rollout: commit section/style/script update.
  - Rollback: revert commit.
- **Documentation impact:** none.
- **Completion evidence (2026-02-25):**
  - Updated `docs/business-os/startup-loop-output-registry.user.html`:
    - nav link `Build Summary -> #build-summary`
    - new `#build-summary` section with controls and required table columns
    - client-side fetch/render/filter logic from `./_data/build-summary.json`
    - exact empty state text: `No outputs in selected timeframe.`
    - exact unavailable state text: `Build Summary data unavailable.`

### TASK-04: Generate JSON and run validation/idempotence checks
- **Type:** IMPLEMENT
- **Deliverable:** Generated artifact `docs/business-os/_data/build-summary.json` plus validation evidence captured in plan notes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Completed
- **Affects:** `docs/business-os/_data/build-summary.json`, `docs/plans/startup-loop-build-summary-integration/plan.md`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - deterministic command path and validation checks are straightforward.
  - Approach: 90% - idempotence and targeted tests are explicit.
  - Impact: 90% - finalizes artifact and acceptance evidence.
- **Acceptance:**
  - JSON generated at required path.
  - Second run unchanged (byte-identical).
  - Targeted tests/typecheck/lint for affected area pass.
- **Validation contract (TC-04):**
  - TC-01: `pnpm startup-loop:build-summary` exits 0.
  - TC-02: SHA256 unchanged across two immediate runs.
  - TC-03: targeted test suite for generator passes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None.
- **Edge Cases & Hardening:** ensure `docs/business-os/_data` is created if absent.
- **What would make this >=90%:** already at 90%.
- **Rollout / rollback:**
  - Rollout: generate and commit JSON.
  - Rollback: revert commit.
- **Documentation impact:** update plan with completion evidence.
- **Completion evidence (2026-02-25):**
  - `pnpm startup-loop:build-summary` generated `docs/business-os/_data/build-summary.json` (177 rows)
  - Idempotence check passed:
    - run-1 SHA256: `682c8dcf27768f78784acf6a3ce83e7bca6f8b6e8ca546233e8fb8d2177dc01f`
    - run-2 SHA256: `682c8dcf27768f78784acf6a3ce83e7bca6f8b6e8ca546233e8fb8d2177dc01f`
  - Targeted tests passed:
    - `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --runTestsByPath scripts/src/startup-loop/__tests__/generate-build-summary.test.ts --no-coverage`
  - Validation gate passed:
    - `bash scripts/validate-changes.sh`

## Risks & Mitigations
- Link contract drift -> enforce one canonical mapping in generator/UI and assert prefix in validation.
- Heterogeneous document structures -> conservative extraction with deterministic fallback `"—"`.
- Timestamp instability -> normalize all timestamps via `toISOString()`.
- UI regressions in large HTML file -> additive section/script changes only; keep existing tab script behavior intact.

## Observability
- Logging: CLI emits generated file path and row count.
- Metrics: None: static-doc feature.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] `Build Summary` link exists in header nav and anchors to `#build-summary`.
- [x] `#build-summary` table renders required columns and filter controls.
- [x] Timeframe filter invariant holds (`c1 <= c3 <= c7`) for Business=`All`.
- [x] Business filter limits rows to selected business.
- [x] Empty/error state messages match exact required text.
- [x] `docs/business-os/_data/build-summary.json` generated and idempotent across reruns.
- [x] No fabricated `why`/`intended` fields; missing values are `"—"`.

## Decision Log
- 2026-02-25: Chose generator+JSON over inline embedded dataset to preserve deterministic regeneration and minimize manual drift.
- 2026-02-25: Standardized link mapping to `"/" + sourcePath` to remove environment-dependent branching.

## Overall-confidence Calculation
- Weights (S=1, M=2, L=3): TASK-01(M), TASK-02(M), TASK-03(M), TASK-04(S)
- Weighted score = `(85*2 + 85*2 + 85*2 + 90*1) / (2+2+2+1) = 600/7 = 85.7%`
- Overall-confidence: **85%**

## Section Omission Rule
None: all core sections are populated for this run.
