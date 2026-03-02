---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-loop-assessment-registry
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (all S=1)
Auto-Build-Intent: plan+auto
---

# BOS Loop Assessment Registry Plan

## Summary

The self-improving loop monitors standing artifacts via a registry, but no registry data file has ever existed — only the schema. This plan creates the initial `standing-registry.json` with 15 high-value assessment containers, extends the T1 semantic keyword list in `lp-do-ideas-trial.ts` to cover assessment sections (brand identity, solution decision, naming), wires the live hook's `--registry-path` argument to the new file, and adds unit tests for the new artifact class/domain combination. Once complete, changes to registered assessment artifacts (brand decisions, solution selections, business plans) will generate dispatch candidates for the first time.

## Active tasks
- [ ] TASK-01: Create `standing-registry.json` with initial 15 assessment artifacts
- [ ] TASK-02: Extend T1 keywords + wire `--registry-path` + update trial-contract.md
- [ ] TASK-03: Add unit tests for `source_reference ASSESSMENT` + T1 keyword match

## Goals
- Create the first standing registry data file with high-signal assessment entries
- Enable T1 keyword matching for the most common assessment section types
- Wire the live hook so the registry is actually read in production invocations
- Provide test coverage for the new `source_reference ASSESSMENT` path

## Non-goals
- CASS retrieval indexing of assessment containers (dispatch 0126)
- Post-build write-back to assessment containers (dispatch 0127)
- Registering all 104 assessment files (initial 15 only; expand after telemetry confirms quality)
- Updating `TrialOrchestratorOptions` to read `t1_semantic_sections` from registry at runtime (registry `t1_semantic_sections` is documentation/schema compliance only; runtime uses hardcoded `T1_SEMANTIC_KEYWORDS`)

## Constraints & Assumptions
- Constraints:
  - Registry data file must conform strictly to `lp-do-ideas-standing-registry.schema.json` (`additionalProperties: false`; `registry_version: "registry.v2"` required)
  - `artifact_id` format: `^[A-Z][A-Z0-9]+-[A-Z]+-[A-Z0-9_-]+$` (e.g. `BRIK-ASSESSMENT-BRAND-IDENTITY`)
  - T1-conservative threshold stays active — keyword additions must remain conservative (no wildcards, no free-text patterns)
  - Cannot add new `artifact_class` enum values — use existing `source_reference`
  - Cannot add new `domain` values — `ASSESSMENT` already exists in schema
- Assumptions:
  - `source_reference` is the correct class for assessment containers (authoritative strategic reference data)
  - `propagation_mode: source_task` is correct (changes trigger planning tasks, not mechanical auto-updates)
  - `trigger_policy: eligible` is appropriate for brand-identity, solution-decision, plan, and brand-profile artifacts
  - Distribution plans are assigned `trigger_policy: manual_override_only` (channel configuration changes have high blast radius; conservative policy is safer for initial registration)
  - Naming shortlists are not included in the initial 15 — they change frequently during active campaigns and would be assigned `manual_override_only` if added later
  - Registry file path: `docs/business-os/startup-loop/ideas/standing-registry.json` (sibling to schema)

## Inherited Outcome Contract

- **Why:** The self-improving loop has a structural blind spot: changes to assessment containers (brand decisions, solution selections, business plan updates) never trigger dispatch events. Closing this gap lets strategic decisions in the balance sheet inform the P&L — changes to what a business decides become visible to the loop automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Assessment artifact classes registered in the standing registry with appropriate `trigger_policy` and delta-signal semantics, enabling future changes to assessment containers to automatically surface as dispatch candidates.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-loop-assessment-registry/fact-find.md`
- Key findings used:
  - No registry data file exists anywhere in `docs/business-os/startup-loop/ideas/` — schema only
  - `ASSESSMENT` domain and `source_reference` class already in TS types and schema — no enum additions needed
  - `T1_SEMANTIC_KEYWORDS` (hardcoded in `lp-do-ideas-trial.ts` lines 27–49) does not include assessment section types — most assessment changes would be suppressed without extension
  - Live hook `--registry-path` has never been pointed to a real file; npm scripts in `scripts/package.json` omit this required arg entirely
  - `SOURCE_CLASSES` set at line 430 includes `"source_reference"` — orchestrator already handles this class

## Proposed Approach

- **Option A:** Create registry JSON + extend T1 keywords in TS + wire --registry-path + tests (chosen)
- **Option B:** Create registry JSON only + rely on T1 `offer` keyword matching `plan.user.md` pricing sections passively (rejected — assessment-specific sections would still be suppressed; wiring never happens)
- **Chosen approach:** Option A. All three components are required for the feature to function end-to-end. Tasks are small (all S-effort) and sequential. The `t1_semantic_sections` field in the registry file mirrors the TS constant for schema compliance and documentation, but the runtime reads the hardcoded constant — this is the correct design for T1-conservative posture.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `standing-registry.json` with 15 assessment artifacts | 88% | S | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Extend T1 keywords + wire --registry-path + update contract doc | 85% | S | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Unit tests for `source_reference ASSESSMENT` + T1 keyword match | 80% | S | Pending | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Creates registry file; all other tasks depend on it |
| 2 | TASK-02 | TASK-01 complete | Extends TS keywords + wires the path from TASK-01 |
| 3 | TASK-03 | TASK-01 + TASK-02 complete | Tests need both file and keywords |

## Tasks

---

### TASK-01: Create `standing-registry.json` with 15 assessment artifacts
- **Type:** IMPLEMENT
- **Deliverable:** New JSON file at `docs/business-os/startup-loop/ideas/standing-registry.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/business-os/startup-loop/ideas/standing-registry.json` (new)
  - `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 88%
  - Implementation: 92% — JSON creation with known schema; all field values are pre-determined from fact-find analysis
  - Approach: 92% — `source_reference` + `ASSESSMENT` + `eligible` + `source_task` is the correct classification per schema semantics; naming shortlists use `manual_override_only`
  - Impact: 88% — file is necessary but not sufficient until TASK-02 wires the path; still the critical foundation
- **Acceptance:**
  - `docs/business-os/startup-loop/ideas/standing-registry.json` exists and is valid JSON
  - File passes schema validation against `lp-do-ideas-standing-registry.schema.json`
  - File has `registry_version: "registry.v2"`, `trigger_threshold: "T1-conservative"`, `unknown_artifact_policy: "fail_closed_never_trigger"`
  - `t1_semantic_sections` array includes all 5 new assessment keywords: `brand identity`, `brand name`, `solution decision`, `naming`, `distribution plan` plus all existing T1 keywords
  - `artifacts` array contains exactly 15 entries, all with `domain: "ASSESSMENT"`, `artifact_class: "source_reference"`
  - All `artifact_id` values match pattern `^[A-Z][A-Z0-9]+-[A-Z]+-[A-Z0-9_-]+$`
  - All `path` values reference files that exist on disk
  - 14 entries have `trigger_policy: "eligible"`, 1 entry (HBAG distribution plan) has `trigger_policy: "manual_override_only"`
  - All entries have `active: true`
- **Validation contract (TC-01):**
  - TC-01-01: Valid schema — file validates against `lp-do-ideas-standing-registry.schema.json` with `ajv` or equivalent (zero errors)
  - TC-01-02: Path existence — all 15 `path` values reference files that exist at the stated repo-relative paths
  - TC-01-03: `artifact_id` format — all 15 IDs match `^[A-Z][A-Z0-9]+-[A-Z]+-[A-Z0-9_-]+$`
  - TC-01-04: No duplicate `artifact_id` values within the file
  - TC-01-05: `t1_semantic_sections` contains all 5 new keywords
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm no registry data file exists (fast check)
  - Green: Write `standing-registry.json` with 15 entries as specified below; validate JSON + schema
  - Refactor: Verify path existence for all 15 entries; adjust any outdated filenames
- **15 entries:**

  *Business plans — all 5 active businesses (trigger_policy: eligible):*
  1. `BRIK-ASSESSMENT-BUSINESS-PLAN` → `docs/business-os/strategy/BRIK/plan.user.md`
  2. `HBAG-ASSESSMENT-BUSINESS-PLAN` → `docs/business-os/strategy/HBAG/plan.user.md`
  3. `HEAD-ASSESSMENT-BUSINESS-PLAN` → `docs/business-os/strategy/HEAD/plan.user.md`
  4. `PWRB-ASSESSMENT-BUSINESS-PLAN` → `docs/business-os/strategy/PWRB/plan.user.md`
  5. `PET-ASSESSMENT-BUSINESS-PLAN` → `docs/business-os/strategy/PET/plan.user.md`

  *Brand identity dossiers — 4 businesses that have one (trigger_policy: eligible):*
  6. `BRIK-ASSESSMENT-BRAND-IDENTITY` → `docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md`
  7. `HBAG-ASSESSMENT-BRAND-IDENTITY` → `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md`
  8. `HEAD-ASSESSMENT-BRAND-IDENTITY` → `docs/business-os/strategy/HEAD/2026-02-21-brand-identity-dossier.user.md`
  9. `PET-ASSESSMENT-BRAND-IDENTITY` → `docs/business-os/strategy/PET/2026-02-17-brand-identity-dossier.user.md`

  *Solution decisions — 3 businesses with explicit solution-decision artifacts (trigger_policy: eligible):*
  10. `HBAG-ASSESSMENT-SOLUTION-DECISION` → `docs/business-os/strategy/HBAG/2026-02-20-solution-decision.user.md`
  11. `HEAD-ASSESSMENT-SOLUTION-DECISION` → `docs/business-os/strategy/HEAD/2026-02-20-solution-decision.user.md`
  12. `PWRB-ASSESSMENT-SOLUTION-DECISION` → `docs/business-os/strategy/PWRB/2026-02-26-solution-decision.user.md`

  *Brand profiles — 2 businesses (trigger_policy: eligible):*
  13. `HBAG-ASSESSMENT-BRAND-PROFILE` → `docs/business-os/strategy/HBAG/2026-02-21-brand-profile.user.md`
  14. `HEAD-ASSESSMENT-BRAND-PROFILE` → `docs/business-os/strategy/HEAD/2026-02-21-brand-profile.user.md`

  *Distribution plan — 1 (trigger_policy: manual_override_only — channel configuration changes have high blast radius; use conservative policy):*
  15. `HBAG-ASSESSMENT-DISTRIBUTION-PLAN` → `docs/business-os/strategy/HBAG/2026-02-21-launch-distribution-plan.user.md`

  Note: HBAG distribution plan uses `manual_override_only` because channel configuration changes can have high blast radius and are made deliberately. Only 14 entries will have `trigger_policy: eligible`; 1 will have `manual_override_only`.

- **Planning validation:**
  - Checks run: schema reviewed end-to-end; path existence verified for all 15 files via `find`; `artifact_id` format confirmed against regex pattern
  - Validation artifacts: schema at `lp-do-ideas-standing-registry.schema.json`; file list from `find docs/business-os/strategy -name "*.user.md"`
  - Unexpected findings: None
- **Scouts:** None: schema is fully defined; all required data is known from the fact-find
- **Edge Cases & Hardening:**
  - Schema `additionalProperties: false` — do not add any fields not in the schema
  - `last_known_sha: null` for all entries (first registration; SHAs initialized on first delta)
  - `depends_on: []` and `produces: []` for all entries (no cross-artifact dependencies in initial set)
  - `registered_at` field: use `2026-03-02T21:00:00.000Z`
- **What would make this >=90%:** Confirm HBAG distribution plan is suitable for `manual_override_only` vs `eligible` — verified by operator intent (conservative is safer for channel docs)
- **Rollout / rollback:**
  - Rollout: File is read-only until TASK-02 wires `--registry-path`; safe to commit independently
  - Rollback: Delete the file — no destructive effect; unregistered artifacts are ignored
- **Documentation impact:** None (TASK-02 updates trial-contract.md)
- **Notes / references:** Schema at `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`; `t1_semantic_sections` in the registry file is documentation/schema compliance — the runtime reads the hardcoded `T1_SEMANTIC_KEYWORDS` constant in `lp-do-ideas-trial.ts`

---

### TASK-02: Extend T1 keywords + wire `--registry-path` + update trial-contract.md
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-ideas-trial.ts` + updated `scripts/package.json` + updated `lp-do-ideas-trial-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
  - `scripts/package.json`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
  - `[readonly] docs/business-os/startup-loop/ideas/standing-registry.json` (created by TASK-01)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — T1 extension is a simple array append; npm script update is mechanical; trial-contract.md update is a doc edit. No orchestrator logic changes.
  - Approach: 90% — Extending `T1_SEMANTIC_KEYWORDS` directly is the minimal-risk approach; registry's `t1_semantic_sections` mirrors it for documentation purposes
  - Impact: 85% — Without this task, assessment changes are suppressed even with the registry file in place
- **Acceptance:**
  - `T1_SEMANTIC_KEYWORDS` in `lp-do-ideas-trial.ts` contains all 5 new keywords: `"brand identity"`, `"brand name"`, `"solution decision"`, `"naming"`, `"distribution plan"`
  - `scripts/package.json` `startup-loop:lp-do-ideas-live-run` and `startup-loop:lp-do-ideas-trial-run` scripts include `--registry-path docs/business-os/startup-loop/ideas/standing-registry.json --queue-state-path docs/business-os/startup-loop/ideas/trial/queue-state.json --telemetry-path docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
  - `lp-do-ideas-trial-contract.md` Section 3 table updated to include the 5 new assessment keyword rows
  - `lp-do-ideas-trial-contract.md` adds a new section (or note) documenting the `--registry-path` invocation pattern
- **Validation contract (TC-02):**
  - TC-02-01: All 5 new keywords present in `T1_SEMANTIC_KEYWORDS` array in `lp-do-ideas-trial.ts`
  - TC-02-02: `scripts/package.json` npm scripts include `--registry-path`, `--queue-state-path`, `--telemetry-path`
  - TC-02-03: TypeScript compiles without error in `scripts` package (no type regressions)
  - TC-02-04: `lp-do-ideas-trial-contract.md` Section 3 includes new assessment keyword entries
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm `matchesT1(["Brand Identity"])` returns false with current keywords (section heading doesn't match)
  - Green: Add keywords to `T1_SEMANTIC_KEYWORDS`; update npm scripts; update contract doc
  - Refactor: Verify no existing tests break (existing T1 keywords unchanged); confirm TypeScript compiles
- **Consumer tracing:**
  - `T1_SEMANTIC_KEYWORDS` is consumed by `matchesT1()` at line 582 → called at line 906 in orchestrator per-event loop
  - No callers outside `lp-do-ideas-trial.ts` use `T1_SEMANTIC_KEYWORDS` directly (exported but only for testing)
  - npm scripts: consumed by operator CLI invocations and any CI integration
- **Planning validation:**
  - Checks run: Confirmed `matchesT1` at line 580 uses `T1_SEMANTIC_KEYWORDS` (hardcoded); confirmed `SOURCE_CLASSES` at line 430 includes `"source_reference"`; confirmed live hook reads registry via `loadRegistryFromDisk(registryPath)` at line ~153
  - Validation artifacts: `scripts/src/startup-loop/lp-do-ideas-trial.ts` lines 27–49, 580–585; `scripts/package.json` scripts block
  - Unexpected findings: None — the `t1_semantic_sections` field in the registry schema is for documentation compliance only; the runtime does not read it from the registry object. Both TS constant and registry field should mirror each other.
- **Scouts:** None: all file locations and code paths are confirmed
- **Edge Cases & Hardening:**
  - `"brand identity"` is a substring — will match any heading containing those words (e.g. "Visual Brand Identity", "Brand Identity Dossier"). This is the intended T1-conservative behavior.
  - `"naming"` is a common word — will match "Naming" sections in candidate-names files. This is intentional; naming decisions are significant strategic signals.
  - Existing T1 keywords are NOT removed; only additions are made
- **What would make this >=90%:** Verify T1 keyword additions don't create false-positive dispatch rate issues in the first telemetry cycle
- **Rollout / rollback:**
  - Rollout: T1 keyword extension takes effect immediately for all future delta events processed via the orchestrator
  - Rollback: Remove the 5 new keywords from `T1_SEMANTIC_KEYWORDS` and npm script args
- **Documentation impact:** `lp-do-ideas-trial-contract.md` Section 3 updated; new invocation pattern documented
- **Notes / references:** `T1_SEMANTIC_KEYWORDS` is exported from `lp-do-ideas-trial.ts` and directly tested; extend the export accordingly

---

### TASK-03: Unit tests for `source_reference ASSESSMENT` + T1 keyword match
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/lp-do-ideas-trial.test.ts` with new test cases
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-trial.test.ts`
  - `[readonly] scripts/src/startup-loop/lp-do-ideas-trial.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — existing test patterns are clear; new tests follow the same fixture-based structure
  - Approach: 90% — unit tests at orchestrator level is the right layer; no integration tests needed
  - Impact: 80% — test coverage confirms the feature works, improves regression safety
- **Acceptance:**
  - New test case: `source_reference ASSESSMENT` artifact with `trigger_policy: eligible` and T1-matching section → `status: "fact_find_ready"`
  - New test case: `source_reference ASSESSMENT` artifact with `trigger_policy: eligible` and non-matching section → `status: "briefing_ready"` (T1 miss routes to briefing, not logged_no_action)
  - New test case: `source_reference ASSESSMENT` artifact with `trigger_policy: manual_override_only` → `suppression_reason: "trigger_policy_blocked"` (status `logged_no_action`)
  - New T1 keyword test: `matchesT1(["Brand Identity"])` returns `true`; `matchesT1(["Historical Data"])` returns `false`
  - All existing tests in the file continue to pass (no regressions)
- **Validation contract (TC-03):**
  - TC-03-01: `source_reference` + `ASSESSMENT` + T1 section match → `fact_find_ready`
  - TC-03-02: `source_reference` + `ASSESSMENT` + non-T1 section → `briefing_ready`
  - TC-03-03: `source_reference` + `ASSESSMENT` + `manual_override_only` → `logged_no_action` with suppression
  - TC-03-04: `matchesT1(["Brand Identity"])` = `true` (new keyword)
  - TC-03-05: `matchesT1(["Solution Decision"])` = `true` (new keyword)
  - TC-03-06: `matchesT1(["Historical Data Request"])` = `false` (non-keyword)
  - TC-03-07: All pre-existing test cases in `lp-do-ideas-trial.test.ts` pass (regression)
- **Execution plan:** Red → Green → Refactor
  - Red: Write test stubs for TC-03-01 through TC-03-06; confirm they fail with current code (before TASK-02 keywords)
  - Green: After TASK-02 completes, tests pass with new keywords
  - Refactor: Verify test isolation (no shared mutable state)
- **Planning validation:**
  - Checks run: Confirmed existing tests in `lp-do-ideas-trial.test.ts` use `source_process` fixtures at line 85; no `source_reference ASSESSMENT` test exists; confirmed test file exists at `scripts/src/startup-loop/lp-do-ideas-trial.test.ts`
  - Validation artifacts: `scripts/src/startup-loop/lp-do-ideas-trial.test.ts`
  - Unexpected findings: None
- **Scouts:** None: test patterns are clear from existing file
- **Edge Cases & Hardening:**
  - Ensure registry fixture passed to orchestrator is correctly typed as `{ artifacts: RegistryV2ArtifactEntry[] }` (not the full registry schema type)
  - `last_known_sha: null` in test fixtures is valid per schema
  - `depends_on: []` and `produces: []` required in `RegistryV2ArtifactEntry` — must be included in test fixtures
- **What would make this >=90%:** Add a test for the live-hook disk loading path with a `source_reference ASSESSMENT` fixture (optional follow-on)
- **Rollout / rollback:**
  - Rollout: Tests run in CI; no runtime changes
  - Rollback: N/A (test-only changes)
- **Documentation impact:** None
- **Notes / references:** `RegistryV2ArtifactEntry` type in `lp-do-ideas-registry-migrate-v1-v2.ts`; test pattern from existing `source_process` test cases

---

## Risks & Mitigations
- **T1 keyword `naming` is broad**: "Naming" appears in candidate-names files and naming shortlists. Most of these will use `manual_override_only` policy (not registered as `eligible`), so false-positive rate is bounded by the registry's `trigger_policy` gate. Acceptable.
- **Live hook invocation still requires `--business`**: The npm scripts wire the static args but not `--business`. Operator must pass `-- --business <BIZ>` at invocation time. This is documented in TASK-02's trial-contract update.
- **15-file initial set may miss the most-changed files**: Start conservatively; expand based on telemetry data from first cycle. Safe to add more entries without any code changes.

## Observability
- Logging: `trial/telemetry.jsonl` captures all suppressed/admitted events with `domain: "ASSESSMENT"` after wiring
- Metrics: First assessment-domain dispatches in `trial/queue-state.json` confirm end-to-end activation
- Alerts/Dashboards: None new; existing queue viewer (`ideas.user.html`) will surface ASSESSMENT-domain dispatches

## Acceptance Criteria (overall)
- [ ] `docs/business-os/startup-loop/ideas/standing-registry.json` exists, passes schema validation, contains 15 assessment entries with correct taxonomy
- [ ] `T1_SEMANTIC_KEYWORDS` in `lp-do-ideas-trial.ts` includes all 5 new assessment keywords
- [ ] npm scripts in `scripts/package.json` wire `--registry-path`, `--queue-state-path`, `--telemetry-path`
- [ ] `lp-do-ideas-trial-contract.md` updated with new keywords and invocation pattern
- [ ] Unit tests for `source_reference ASSESSMENT` + T1 combinations pass (TC-03-01 through TC-03-07)
- [ ] No existing tests regress

## Decision Log
- 2026-03-02: `t1_semantic_sections` in registry file is documentation/schema compliance only; runtime reads hardcoded `T1_SEMANTIC_KEYWORDS` constant. Updating `TrialOrchestratorOptions` to merge registry keywords at runtime is deferred (out of scope for this plan).
- 2026-03-02: HBAG distribution plan registered as `manual_override_only` (not `eligible`) — channel configuration changes have high blast radius; conservative policy is safer for initial registration.
- 2026-03-02: 15-file initial set chosen over all 104 files — validate signal quality before expanding.

## Overall-confidence Calculation
- S=1 weight each
- TASK-01: 88% × 1 = 88
- TASK-02: 85% × 1 = 85
- TASK-03: 80% × 1 = 80
- Overall = (88 + 85 + 80) / 3 = **84%**
- All tasks meet IMPLEMENT threshold ≥80% ✓

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create standing-registry.json | Yes — schema fully defined, all 15 file paths verified to exist | None | No |
| TASK-02: Extend T1 + wire + docs | Partial — depends on TASK-01 for the wired path value | [Minor] `t1_semantic_sections` in registry file is not read at runtime — the TS constant is the live source of truth. Both must be updated consistently; task scope covers both. | No — documented in Decision Log and task Notes |
| TASK-03: Unit tests | Partial — depends on TASK-01 + TASK-02 for registry fixture + extended keywords | None beyond correct dependency ordering | No |
