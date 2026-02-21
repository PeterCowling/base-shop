---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: startup-loop-integrity-audit
Execution-Track: mixed
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-integrity-audit/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Integrity Audit Fact-Find Brief

## Scope
### Summary
Comprehensive integrity audit of the startup loop system to surface inconsistencies — type/runtime gaps, stale docs, missing gate implementations, and factually incorrect diagrams — that could cause silent failures for operators or block correct loop execution. The audit covered: TypeScript script layer (`scripts/src/startup-loop/`), authoritative spec (`loop-spec.yaml`), stage-operator dictionary and generated map, operator skill modules (`cmd-start.md`, `cmd-advance.md`), SKILL.md stage table, and artifact registry.

Six medium-severity issues found (action required) and nine low-severity warnings (advisory).

### Goals
- Fix all medium-severity issues that could cause runtime errors, operator confusion, or undetected spec drift
- Document the warning-tier items in a backlog for future resolution
- Ensure the v1.7.0 (22-stage) model is fully consistent across all layers: TypeScript, YAML spec, operator skills, and docs

### Non-goals
- New startup loop feature development
- Stage additions or topology changes
- Demand/supply tool changes outside the loop integrity scope

### Constraints & Assumptions
- Constraints:
  - Writer lock required for all commits
  - No breaking changes to existing stage IDs or public API signatures
  - Tests must target only the affected files; no unfiltered `pnpm test`
- Assumptions:
  - The 22-stage model (v1.7.0) is canonical; no topology changes are in flight
  - `run_aborted` is a first-class run-level event and should be handled additively (not removed) to preserve abort auditability
  - GATE-S3B-01 implementation gap is a genuine omission, not an in-progress draft

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/` — TypeScript implementation layer (derive-state, event-validation, stage-addressing, bottleneck-detector, growth-metrics-adapter, funnel-metrics-extractor)
- `docs/business-os/startup-loop/loop-spec.yaml` — authoritative spec (v1.7.0, 22 stages)
- `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` — bottleneck system documentation
- `.claude/skills/startup-loop/` — operator skill modules (SKILL.md, cmd-start.md, cmd-advance.md)
- `docs/business-os/startup-loop/artifact-registry.md` — artifact dependency diagram
- `scripts/src/startup-loop/__tests__/` — test suite

### Key Modules / Files
- `scripts/src/startup-loop/derive-state.ts` — `RunEvent` type union, state derivation logic; dynamic (no hardcoded stage assumptions)
- `scripts/src/startup-loop/event-validation.ts` — event type validator; accepts `run_aborted` not declared in `RunEvent`
- `scripts/src/startup-loop/bottleneck-detector.ts` — `UPSTREAM_PRIORITY_ORDER` array (22 IDs, correct); imports `StageId` from `stage-addressing`
- `scripts/src/startup-loop/growth-metrics-adapter.ts` — material derivation logic; **no test file**
- `scripts/src/startup-loop/funnel-metrics-extractor.ts` — profile adapter metrics (S2A schema doc, Section 2A) documented but **not implemented**
- `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` — Section 5 `upstream_priority_order` **missing S0A, S0B, S0C, S0D, S3B**
- `.claude/skills/startup-loop/modules/cmd-start.md` — Gate D: S0A documented; **S0B, S0C, and S0D sub-stages missing separate prompt_file/required_output_path guidance** — Gate D provides one block for the whole S0A–S0D sequence but does not enumerate handoff paths for each sub-stage individually
- `.claude/skills/startup-loop/modules/cmd-advance.md` — GATE-S3B-01 referenced in changelog but **not implemented** in any advance routing block
- `docs/business-os/startup-loop/artifact-registry.md` — dependency diagram **factually wrong**: shows `lp-forecast` nested under `lp-channels` (implies S3 depends on S6B); actual model is parallel fan-out from S2B

### Patterns & Conventions Observed
- Stage ID authority: `loop-spec.yaml` → `stage-operator-map.json` (generated) → TypeScript imports from `stage-addressing.ts` — evidence: `bottleneck-detector.ts` imports `StageId`
- Prompt-handoff pattern (lp-solution-space, brand-naming-research): skill produces prompt; operator runs in a deep research tool (OpenAI Deep Research or equivalent); results saved to `*.user.md` — evidence: `lp-solution-space/SKILL.md`, `brand-naming-research/SKILL.md`
- Fan-out-1 join barrier: S3, S3B (conditional, non-blocking), S6B run in parallel after S2B; all join at S4 — evidence: `loop-spec.yaml` edges
- Gate enforcement pattern: gates defined in `cmd-advance.md` gate blocks with pass/fail conditions and exit actions

### Data & Contracts
- Types/schemas/events:
  - `RunEvent` union in `derive-state.ts`: does NOT include `run_aborted`
  - `event-validation.ts` `VALID_EVENT_TYPES`: includes `run_aborted`
  - **Gap**: `run_aborted` accepted by validator but absent from `RunEvent` union in derive-state.ts — `recovery.ts` works around this with a cast (`"run_aborted" as RunEvent["event"]`), making this a type-unsafe failure rather than a guaranteed runtime no-op; whether the derive-state switch handles the event correctly is unverified
  - `event-state-schema.md` may document only 3 event types (unverified — confirm in planning phase whether schema doc update is in TASK-05 scope)
- Persistence:
  - `bottleneck-diagnosis-schema.md` Section 5 `upstream_priority_order`: lists 17 stages (pre-v1.7.0); missing S0A, S0B, S0C, S0D, S3B
- API/contracts:
  - GATE-S3B-01: changelog v1.6.0 defines advisory gate for S3B; no advance routing block executes it
  - GATE-S3B-01 changelog references skill `adjacent-product-research` — actual skill is `lp-other-products`

### Dependency & Impact Map
- Upstream dependencies:
  - `derive-state.ts` → `event-validation.ts` (event whitelist gate)
  - `bottleneck-detector.ts` → `stage-addressing.ts` (StageId, UPSTREAM_PRIORITY_ORDER)
  - `cmd-advance.md` → `loop-spec.yaml` gate definitions
  - `artifact-registry.md` → loop-spec topology (should match)
- Downstream dependents:
  - `run_aborted` gap: any workflow that emits `run_aborted` events would pass validation but produce no state transition (silent failure)
  - `bottleneck-diagnosis-schema.md` gap: operators reading the doc may generate bottleneck payloads with incomplete `upstream_priority_order` (22-stage runs mis-diagnosed)
  - `cmd-start.md` Gate D gap: operators starting a problem-first run won't know what files to create for S0B, S0C, or S0D handoffs
  - `artifact-registry.md` diagram gap: incorrect diagram may mislead developers designing new parallel tasks about fan-out-1 dependencies
- Likely blast radius:
  - **Medium** — no crash-path issues in production; gaps are silent failures or operator confusion
  - Most proposed fixes are localized to docs, gate text, and event typing/handling; regression risk is low once targeted suites are re-run

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (via `pnpm test:governed` / `scripts/src/startup-loop/__tests__/`)
- Commands:
  - Inventory command used in this audit: `find scripts/src/startup-loop/__tests__ -maxdepth 1 -type f -name '*.test.ts' | wc -l`
  - Targeted run pattern for execution: `pnpm -w run test:governed -- jest -- --config=scripts/src/startup-loop/jest.config.cjs --testPathPattern=<targeted-suite> --no-coverage --maxWorkers=2`
- CI integration: merge-gate.yml enforces; pre-commit hooks run typecheck/lint

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| stage-addressing | Unit | `__tests__/stage-addressing.test.ts` | VC-04 enumerates all 22 canonical stage IDs |
| derive-state | Unit | `__tests__/derive-state.test.ts` | Covered |
| event-validation | Unit | `__tests__/event-validation.test.ts` | Validator behavior is covered for stage events; no explicit `run_aborted` assertion found in this audit |
| bottleneck-detector | Unit | `__tests__/bottleneck-detector.test.ts` | Covered |
| growth-metrics-adapter | Unit | **none** | No test file; material logic uncovered |
| funnel-metrics-extractor | Unit | `__tests__/funnel-metrics-extractor.test.ts` | Exists; profile adapter section not tested (not implemented) |
| hospitality-scenarios | Unit | **none** | No test file |
| validate-process-assignment | Unit | `__tests__/validate-process-assignment.test.ts` | Suite exists in startup-loop test set |

#### Coverage Gaps
- Untested paths:
  - `growth-metrics-adapter.ts` — entire file has no test
  - `hospitality-scenarios.ts` — entire file has no test
  - `funnel-metrics-extractor.ts` profile adapter metrics — not implemented, so not tested
- Extinct tests: none identified

#### Testability Assessment
- Easy to test:
  - `run_aborted` type fix — add to `RunEvent` union; existing tests verify; add a new test case
  - `growth-metrics-adapter.ts` — pure derivation logic; unit-testable with mocked inputs
- Hard to test:
  - `diagnosis_status: 'partial_data'` path — would require triggering a state where partial data is detected; needs investigation of the correct trigger condition
- Test seams needed:
  - None blocking; existing Jest infrastructure sufficient

### Recent Git History (Targeted)
- Repository snapshot reviewed: `a15eb1306a` (2026-02-20)
- Command used: `git log --oneline -n 8 -- scripts/src/startup-loop docs/business-os/startup-loop .claude/skills/startup-loop`
- `scripts/src/startup-loop/` — recent commits include TASK-04 (stage ID expansions 17→22), TASK-09 (loop-spec.yaml GATE-BD-00 comment fix), TASK-10 (skill registry regeneration)
- `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` — last updated before v1.7.0 stage additions; `upstream_priority_order` not updated with new IDs

## Questions
### Resolved
- Q: Should `run_aborted` be additive (first-class event) or reductive (remove from validator)?
  - A: Additive is the long-term choice. Keep `run_aborted` as a run-level event and align schema + derivation + recovery around it.
  - Evidence: `scripts/src/startup-loop/event-validation.ts` already accepts it; `scripts/src/startup-loop/recovery.ts` emits it; `scripts/src/startup-loop/__tests__/recovery.test.ts` asserts it; removing it would discard explicit abort audit events.
- Q: Is there a current `run_aborted` type/runtime mismatch?
  - A: Yes — validator accepts `run_aborted`, while `derive-state.ts` omits it from the `RunEvent` union and event switch.
  - Evidence: `scripts/src/startup-loop/event-validation.ts`, `scripts/src/startup-loop/derive-state.ts`
- Q: Is GATE-S3B-01 draft/in-progress or genuinely missing?
  - A: Genuinely missing — v1.6.0 changelog entry exists, no advance routing block references it anywhere
  - Evidence: `cmd-advance.md` gate block search returned no GATE-S3B-01 routing
- Q: Is the fan-out topology (S3 ∥ S3B ∥ S6B → S4) correct in loop-spec?
  - A: Yes — edges in loop-spec.yaml are correct; only the artifact-registry diagram is wrong
  - Evidence: loop-spec edges confirm parallel fan-out; artifact-registry.md shows incorrect nesting

### Open (User Input Needed)
- None.

## Confidence Inputs
- Implementation: 92%
  - Evidence: Issues are clearly localized; no cross-cutting refactor required; fixes are additive or corrective.
  - What raises this to >=80: maintain current scoped task decomposition (no topology or API-surface expansion).
  - What raises this to >=90: keep `run_aborted` changes as one contract bundle (schema + validator + derive-state + tests).
- Approach: 90%
  - Evidence: Standard patterns (union type extension, doc update, gate block addition) all have precedent in the codebase.
  - What raises this to >=80: keep implementation aligned with existing recovery/event-ledger patterns.
  - What raises this to >=90: codify `run_aborted` derive-state behavior with explicit tests and schema examples.
- Impact: 95%
  - Evidence: All fixes are scoped; no topology changes; no public API changes.
  - What raises this to >=80: keep changes limited to identified files and existing startup-loop contracts.
  - What raises this to >=90: run targeted suites for changed modules and record green results in the build log.
- Delivery-Readiness: 92%
  - Evidence: Test infrastructure exists; writer lock protocol established; no external dependencies.
  - What raises this to >=80: ensure per-task validation commands are pre-declared in the plan.
  - What raises this to >=90: keep abort semantics deterministic and assertable (for example, `active_stage` cleared on `run_aborted`).
- Testability: 88%
  - Evidence: Most fixes are unit-testable with existing Jest infrastructure. `growth-metrics-adapter.ts` tests need to be written from scratch but logic is pure. `partial_data` diagnosis_status path needs investigation before it can be tested.
  - What raises this to >=80: keep coverage tasks for `growth-metrics-adapter.ts` and `hospitality-scenarios.ts` in scope.
  - What raises this to >=90: confirm `partial_data` trigger and add deterministic tests for both `partial_data` and `run_aborted` derivation behavior.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `run_aborted` contract alignment done partially (schema/docs/code out of sync) | Medium | Medium | Implement as one bundle: `event-state-schema.md` + `event-validation.ts` + `derive-state.ts` + recovery tests/docs in same task group |
| `GATE-S3B-01` implementation scope larger than a doc stub | Low | Medium | Investigate cmd-advance gate block pattern; if full implementation needed, add INVESTIGATE task |
| `diagnosis_status: 'partial_data'` — unknown trigger condition makes test hard to write | Medium | Low | Scope as INVESTIGATE task; don't block other fixes |
| `growth-metrics-adapter.ts` tests reveal logic bugs not caught by audit | Low | Medium | Treat test authoring as exploratory; red-flag any failures |
| Artifact registry diagram update diverges from loop-spec | Low | Low | Generate diagram directly from loop-spec edges rather than hand-drawing |

## Planning Constraints & Notes
- Must-follow patterns:
  - All commits under writer lock (`scripts/agents/with-writer-lock.sh`)
  - Targeted tests only — no unfiltered `pnpm test`
  - Pre-commit hooks must pass (no `--no-verify`)
  - TypeScript union type changes require `pnpm typecheck && pnpm lint` pass
- Rollout/rollback expectations:
  - All changes are doc or TypeScript source; no deploy required
  - Rollback: revert commit(s)
- Observability expectations:
  - All targeted startup-loop suites touching changed files must pass after each task

## Suggested Task Seeds (Non-binding)

**Priority 1 (fix — no open questions):**
1. TASK-01 (IMPLEMENT): Fix `bottleneck-diagnosis-schema.md` Section 5 `upstream_priority_order` — add S0A, S0B, S0C, S0D, S3B
2. TASK-02 (IMPLEMENT): Fix `artifact-registry.md` dependency diagram — correct S3/S3B/S6B fan-out topology
3. TASK-03 (IMPLEMENT): Fix changelog GATE-S3B-01 wrong skill name (`adjacent-product-research` → `lp-other-products`) in loop-spec.yaml + cmd-advance.md stub
4. TASK-04 (IMPLEMENT): Fix `cmd-start.md` Gate D — add per-sub-stage prompt_file/required_output_path entries for S0B (lp-solution-space → solution-space-prompt.md), S0C (lp-option-select → s0c-option-select.user.md), and S0D (brand-naming-research → naming-research-prompt.md)

**Priority 2 (integrity hardening + investigation):**
5. TASK-05 (IMPLEMENT): Apply `run_aborted` additive fix bundle — update `RunEvent` union, derive-state handling, and event schema docs to match validator/recovery behavior
6. TASK-06 (IMPLEMENT, depends on TASK-05): Add/extend tests for `run_aborted` behavior (validator acceptance + deterministic derive-state outcome — acceptance criteria defined by TASK-05 behavioral contract)
7. TASK-07 (INVESTIGATE): Determine trigger condition for `diagnosis_status: 'partial_data'` in bottleneck-detector; produce recommendation + stub test if feasible

**Priority 3 (coverage, advisory):**
8. TASK-08 (IMPLEMENT): Write unit tests for `growth-metrics-adapter.ts`
9. TASK-09 (IMPLEMENT): Write unit tests for `hospitality-scenarios.ts`

**Warnings (defer to backlog):**
- stage-addressing.ts suggestion string order cosmetic fix (S6B before S4)
- active_stage not cleared on `stage_completed` — add documentation note
- S10 loop-spec skill field `lp-experiment` → `lp-weekly`
- SKILL.md S1B/S2A Conditional column — update to `conditional` not `—`
- GATE-BD-01, BD-08, LOOP-GAP-01/02/03 — add to loop-spec (low priority, currently in cmd-advance only)
- funnel-metrics-extractor.ts profile adapter implementation gap — defer until S2A profile metrics are required by a specific business run

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build` (code-change + doc tasks)
- Supporting skills:
  - none
- Deliverable acceptance package:
  - All medium-severity issues resolved with test evidence or doc diffs
  - All targeted startup-loop suites for touched modules continue to pass
  - `pnpm typecheck && pnpm lint` pass
- Post-delivery measurement plan:
  - No ongoing measurement required; one-time cleanup

## Evidence Gap Review
### Gaps Addressed
- TypeScript layer and spec/skill layer both audited with direct file evidence pointers
- All 22 stage IDs verified across loop-spec, dictionary, generated map, and bottleneck-detector
- All cmd-* operator modules inspected for gate coverage
- Test file inventory completed for `scripts/src/startup-loop/__tests__/` (35 suites via command in Test Infrastructure)

### Confidence Adjustments
- Implementation confidence raised to 92% after resolving `run_aborted` direction to additive
- Approach confidence raised to 90% because the `run_aborted` decision is now explicit and evidence-backed
- Testability confidence raised to 88% with a concrete, testable `run_aborted` task bundle; `partial_data` remains the main unknown

### Remaining Assumptions
- `run_aborted` derive-state behavior should be terminal and deterministic — TASK-05 acceptance criteria must specify the exact state change (at minimum: `active_stage: null`, run-level event appended to event log); whether the existing derive-state switch has a `default` branch that partially handles unknown events is unverified and must be checked in TASK-05
- GATE-S3B-01 advisory gate implementation is a doc stub (not requiring a full advance routing block)
- `hospitality-scenarios.ts` and `growth-metrics-adapter.ts` logic is correct but untested (audit found no obvious bugs)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-integrity-audit` — decompose the updated task seeds above into plan tasks with confidence scoring and sequencing
