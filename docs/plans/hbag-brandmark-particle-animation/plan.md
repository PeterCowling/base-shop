---
Type: Plan
Status: Draft
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-brandmark-particle-animation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-qa
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
---

# Caryina BrandMark Hourglass Particle Animation Plan

## Summary
This plan implements the hourglass dissolution effect for the Caryina BrandMark by introducing a Canvas 2D particle layer while preserving the existing public API and `Car`+`ina` merge behavior. The approach is evidence-first: integrate a pure particle engine, wire it into the existing component lifecycle, then harden with deterministic tests and visual/performance checks. A dedicated investigation step captures physical-device evidence (iPhone Safari and Android Chrome) and operator pacing sign-off before rollout closure. Open brand-motion choices remain explicit as a DECISION gate so downstream work does not silently encode assumptions.

## Active tasks
- [ ] TASK-01: Finalize brand-motion defaults (color transform, small viewport behavior, hover replay profile)
- [ ] TASK-02: Build pure particle engine + text sampling utilities for BrandMark
- [ ] TASK-03: Integrate canvas choreography into BrandMark while preserving API and reduced-motion guarantees
- [ ] TASK-04: Add automated tests and visual/performance validation harness
- [ ] TASK-05: Run real-device validation and operator pacing review
- [ ] TASK-06: Horizon checkpoint for merge readiness and downstream replan
- [ ] TASK-07: Finalize rollout evidence package and documentation updates

## Goals
- Deliver the hourglass dissolution narrative in BrandMark with Canvas 2D (no external runtime deps).
- Preserve `BrandMarkProps` compatibility, including `mount` and `hover` triggers.
- Maintain accessibility guarantees (`prefers-reduced-motion` instant final state, no canvas requirement for semantics).
- Keep bundle delta under 5 KB gzipped for the feature implementation.
- Produce reproducible technical and visual evidence before merge.

## Non-goals
- Introducing WebGL/three.js/pixi.js/tsParticles.
- Changing Header structure or navigation behavior outside BrandMark integration needs.
- Creating a BOS card for this cycle (direct-inject remains intentional).
- Shipping without physical-device validation evidence.

## Constraints & Assumptions
- Constraints:
  - BrandMark remains a client component and must tolerate font readiness timing.
  - Existing Caryina token system and font loading (`next/font/google`) stay authoritative.
  - Reduced-motion path must bypass particle lifecycle entirely.
  - No public API breaks to `BrandMarkProps`.
- Assumptions:
  - Prototype evidence is sufficient to start implementation but not enough for release sign-off.
  - Pure module extraction (`particle engine` + `sampling`) will provide deterministic unit-test seams.
  - Operator decisions in TASK-01 can be resolved quickly enough to avoid long-lived `Needs-Input` state.

## Fact-Find Reference
- Related brief: `docs/plans/hbag-brandmark-particle-animation/fact-find.md`
- Key findings used:
  - Prototype and benchmark artifacts exist and are reproducible (`artifacts/prototype/*`).
  - Caryina now has executable Jest seams (`apps/caryina/jest.config.cjs`, BrandMark baseline test).
  - Highest remaining execution risks are real-device smoothness, pacing perception, and integration-specific font/resize behavior.

## Proposed Approach
- Option A: Implement full integration first, then backfill tests and device evidence.
  - Risk: expensive rewrites if physics/API seams are wrong.
- Option B: Build engine seams first, then integrate, then validate with automated + physical evidence.
  - Benefit: lower rework risk and cleaner confidence progression.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - Reason: `TASK-01` is `Needs-Input`, and Auto-Build-Intent is `plan-only`.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Finalize brand-motion defaults | 90% | S | Needs-Input | - | TASK-03 |
| TASK-02 | IMPLEMENT | Build pure particle engine + sampling utilities | 85% | M | Pending | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Integrate canvas choreography into BrandMark | 85% | L | Pending | TASK-01, TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Add unit/integration/visual validation harness | 85% | M | Pending | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | INVESTIGATE | Real-device validation + pacing sign-off | 85% | M | Pending | TASK-03, TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Horizon checkpoint: reassess downstream merge readiness | 95% | S | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Finalize rollout evidence package + docs | 90% | S | Pending | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Decision capture and engine groundwork can proceed in parallel. |
| 2 | TASK-03 | TASK-01, TASK-02 | Core integration after defaults and engine contracts exist. |
| 3 | TASK-04 | TASK-02, TASK-03 | Validation layers depend on integrated behavior. |
| 4 | TASK-05 | TASK-03, TASK-04 | Device evidence only meaningful after integration + automated checks. |
| 5 | TASK-06 | TASK-05 | Replan/continue checkpoint from latest evidence. |
| 6 | TASK-07 | TASK-06 | Documentation and rollout package closure. |

Max parallelism: 2 tasks (Wave 1)
Critical path: TASK-01 -> TASK-03 -> TASK-04 -> TASK-05 -> TASK-06 -> TASK-07 (6 waves)

## Tasks

### TASK-01: Finalize brand-motion defaults (color transform, small viewport behavior, hover replay profile)
- **Type:** DECISION
- **Deliverable:** Decision record in `docs/plans/hbag-brandmark-particle-animation/artifacts/decision-log.md` + plan Decision Log update
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Needs-Input
- **Affects:** `docs/plans/hbag-brandmark-particle-animation/plan.md`, `docs/plans/hbag-brandmark-particle-animation/artifacts/decision-log.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - structured decision framing already exists in fact-find.
  - Approach: 90% - options are isolated and reversible in implementation.
  - Impact: 90% - resolves the only explicit requirement ambiguity before integration hardening.
- **Options:**
  - Option A: Particle color remains primary throughout; animation enabled on all widths; full hover replay.
  - Option B: Primary -> accent color drift; disable below 480px; abbreviated hover replay.
  - Option C: Primary -> accent color drift; enable on all widths with adaptive particle cap; abbreviated hover replay.
- **Recommendation:** Option C (preserves mobile brand moment while managing density/perf risk).
- **Decision input needed:**
  - question: Approve Option C defaults for initial build?
  - why it matters: Determines timing/color/responsive branches in TASK-03 and acceptance assertions in TASK-04.
  - default + risk: Default to Option C if no response by implementation start; risk is subjective dissatisfaction with hover pacing.
- **Acceptance:**
  - Decision captured with date and chosen option.
  - Chosen defaults mapped to implementation constants in TASK-03 notes.
- **Validation contract:**
  - VC-01: Decision artifact updated with explicit chosen option + rationale.
- **Planning validation:**
  - None: decision task; all required options and tradeoffs are already documented.
- **Rollout / rollback:**
  - None: non-implementation task.
- **Documentation impact:**
  - Update decision log and this plan.

### TASK-02: Build pure particle engine + text sampling utilities for BrandMark
- **Type:** IMPLEMENT
- **Deliverable:** code-change — particle engine module, text sampling utility, and deterministic unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/components/BrandMark/` (new particle engine + utilities + tests), `[readonly] docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/prototype.js`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - prototype math/phase behavior already exists and can be ported to typed module seams.
  - Approach: 90% - pure-module extraction isolates Canvas coupling and maximizes testability.
  - Impact: 85% - establishes reusable contracts needed by integration and verification tasks.
- **Acceptance:**
  - Engine API supports init/tick/reset with deterministic phase progression.
  - Sampling utility returns bounded points for tagline glyph targets.
  - Unit tests cover lifecycle transitions and edge conditions (empty glyph sample, zero particles).
- **Validation contract (TC-XX):**
  - TC-01: Engine `tick()` advances through expected phase thresholds for fixed seed/time step.
  - TC-02: Sampling utility yields non-empty bounded points for tagline with Cormorant family configured.
  - TC-03: Engine handles zero/empty target input without runtime error.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing tests for phase progression/sampling bounds.
  - Green: Implement engine/sampler to satisfy deterministic contracts.
  - Refactor: Consolidate shared constants and remove prototype-only branches.
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark.test.tsx'`
    - `pnpm --filter @apps/caryina typecheck`
    - `pnpm --filter @apps/caryina lint`
  - Validation artifacts:
    - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/prototype.js`
    - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
  - Unexpected findings:
    - Existing baseline test currently exercises only static final-state seam; engine tests must be added in this task.
- **Consumer tracing (required for M/L):**
  - New outputs:
    - `ParticleEngineState` consumed by `BrandMark.tsx` animation orchestrator (TASK-03) and engine unit tests (TASK-04).
    - `sampleTextPixels()` consumed by engine setup in `BrandMark.tsx`; unchanged consumers are safe because utility is new.
  - Modified behavior:
    - None yet; this task adds modules only, no caller semantic changes.
- **Scouts:**
  - Confirm deterministic seed strategy does not regress visual quality: `None: covered by TC-01 and visual checks in TASK-04`.
- **Edge Cases & Hardening:**
  - Guard NaN/Infinity coordinates from font measurement anomalies.
  - Cap particle count by available target points to avoid index overruns.
- **What would make this >=90%:**
  - Green CI on new engine test file plus one successful integration consumer in TASK-03.
- **Rollout / rollback:**
  - Rollout: internal module addition; no user-visible change until TASK-03.
  - Rollback: remove new engine/sampling modules and associated tests.
- **Documentation impact:**
  - Add implementation notes to this plan task and update decision log if interfaces deviate.
- **Notes / references:**
  - Prototype evidence: `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`

### TASK-03: Integrate canvas choreography into BrandMark while preserving API and reduced-motion guarantees
- **Type:** IMPLEMENT
- **Deliverable:** code-change — BrandMark integration of canvas overlay, phase orchestration, responsive handling, and fallback behaviors
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/caryina/src/components/BrandMark/BrandMark.tsx`, `apps/caryina/src/components/BrandMark/BrandMark.module.css`, `apps/caryina/src/components/BrandMark/*` (new helper files), `[readonly] apps/caryina/src/components/Header.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 85% - existing measurement/state machine and prototype choreography provide concrete integration seams.
  - Approach: 85% - additive overlay design preserves DOM semantics and rollback path.
  - Impact: 90% - this task delivers the feature outcome while retaining backward-compatible API behavior.
- **Acceptance:**
  - BrandMark animates with hourglass dissolve/reform narrative for `animate={true}` in mount mode.
  - `hover` trigger replays configured short variant without breaking final-state stability.
  - Reduced-motion path skips canvas creation and renders immediate final state.
  - `BrandMarkProps` shape and existing consumer call sites remain unchanged.
- **Validation contract (TC-XX):**
  - TC-01: Mount trigger runs dissolve/funnel/settle phases and ends in crisp DOM tagline state.
  - TC-02: Hover trigger replay completes and returns to stable final state.
  - TC-03: `prefers-reduced-motion` prevents canvas branch and shows immediate final state.
  - TC-04: Font-ready + resize paths remeasure safely without drift or runtime errors.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Extend component tests to expose missing canvas/reduced-motion behavior.
  - Green: Wire engine/sampling utilities into BrandMark lifecycle; implement phase timing and cleanup.
  - Refactor: Minimize inline effect complexity; isolate timing/config constants.
- **Planning validation (required for M/L):**
  - Checks run:
    - Source audit of existing seams in `BrandMark.tsx` and `BrandMark.module.css` from fact-find.
    - Confirmed current consumer map (`Header.tsx` only) in fact-find dependency section.
  - Validation artifacts:
    - `docs/plans/hbag-brandmark-particle-animation/fact-find.md`
    - `docs/plans/hbag-brandmark-particle-animation/design-spec.md`
  - Unexpected findings:
    - None beyond already-documented open decisions captured in TASK-01.
- **Consumer tracing (required for M/L):**
  - New outputs:
    - `data-particle-state`/canvas orchestration state consumed by TASK-04 integration tests and visual assertions.
    - Engine configuration object consumed by internal animation loop only; no external callers.
  - Modified behavior:
    - `BrandMark.tsx` internal animation semantics change from CSS `y` fade to Canvas dissolve; downstream consumer `Header.tsx` remains safe because props and rendered link semantics are unchanged.
- **Scouts:**
  - Probe fallback behavior when `CanvasRenderingContext2D` is unavailable: verify CSS-only final-state fallback.
- **Edge Cases & Hardening:**
  - Prevent RAF leaks on unmount/rapid hover-enter/leave cycles.
  - Keep canvas `pointer-events: none` to avoid link hit-area regressions.
  - Ensure resolved font family string for canvas text sampling (avoid raw CSS var token in `ctx.font`).
- **What would make this >=90%:**
  - One successful real-device pass plus visual snapshot stability from TASK-05/TASK-04.
- **Rollout / rollback:**
  - Rollout: enable integrated path behind existing `animate`/trigger behavior.
  - Rollback: revert to prior CSS-only `y` transition and remove canvas integration.
- **Documentation impact:**
  - Update fact-find confidence evidence and decision log with final integration behavior.
- **Notes / references:**
  - Preserve current DOM accessibility role/label behavior.

### TASK-04: Add automated unit/integration/visual validation harness for the particle path
- **Type:** IMPLEMENT
- **Deliverable:** code-change — test coverage expansion and reproducible visual/performance validation commands
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/components/BrandMark/*.test.tsx`, `apps/caryina/jest.config.cjs`, `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`, `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-summary.md`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - baseline Jest harness is in place and prototype benchmarking runner already exists.
  - Approach: 85% - combining unit/integration/visual checks reduces false confidence from any single test type.
  - Impact: 85% - converts feature readiness from subjective review to repeatable evidence.
- **Acceptance:**
  - Engine lifecycle tests are deterministic and green.
  - BrandMark integration tests cover canvas-active and reduced-motion branches.
  - Visual regression for deterministic final frame is captured and comparable.
  - Bundle-delta check confirms feature stays within <5 KB gzipped budget.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'` passes with new cases.
  - TC-02: Visual snapshot command produces expected final-frame artifact and no diff.
  - TC-03: Benchmark runner executes without errors and updates summary artifact.
  - TC-04: Bundle analysis indicates added gzipped payload remains under threshold.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Introduce explicit tests for unimplemented canvas/reduced-motion branches.
  - Green: Implement tests + visual harness scripts and baseline artifacts.
  - Refactor: De-duplicate helper setup across BrandMark tests.
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark.test.tsx'`
    - `pnpm --filter @apps/caryina typecheck`
    - `pnpm --filter @apps/caryina lint`
  - Validation artifacts:
    - `apps/caryina/jest.config.cjs`
    - `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
  - Unexpected findings:
    - Existing test coverage is intentionally minimal; expanded deterministic hooks are required.
- **Consumer tracing (required for M/L):**
  - New outputs:
    - Added snapshot/perf artifacts consumed by TASK-05 (device comparison) and TASK-07 rollout packet.
    - New test IDs/selectors consumed only by test harness; production consumers unchanged.
  - Modified behavior:
    - None in runtime code expected; this task changes validation surface.
- **Scouts:**
  - `None: validation-focused task with explicit contracts.`
- **Edge Cases & Hardening:**
  - Ensure tests do not rely on non-deterministic timing (mock RAF/time).
  - Keep visual snapshots deterministic via fixed DPR/viewport and frozen animation frame capture.
- **What would make this >=90%:**
  - Green CI run of all added tests + stable snapshot in two consecutive executions.
- **Rollout / rollback:**
  - Rollout: merge test/harness updates with feature branch.
  - Rollback: remove new test artifacts and revert harness adjustments.
- **Documentation impact:**
  - Update benchmark summary and include commands in plan notes.
- **Notes / references:**
  - Keep runner usage compatible with governed test policy.

### TASK-05: Real-device validation and operator pacing sign-off
- **Type:** INVESTIGATE
- **Deliverable:** Validation artifact — `docs/plans/hbag-brandmark-particle-animation/artifacts/real-device-validation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/hbag-brandmark-particle-animation/artifacts/real-device-validation.md`, `docs/plans/hbag-brandmark-particle-animation/artifacts/decision-log.md`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - checklist and measurable thresholds are clear.
  - Approach: 85% - combines objective frame metrics with operator visual pacing decision.
  - Impact: 90% - closes the highest residual release risk from fact-find.
- **Questions to answer:**
  - Does iPhone Safari sustain acceptable frame pacing for the integrated animation?
  - Does Android Chrome sustain acceptable frame pacing for the integrated animation?
  - Is the 3-4s mount pacing perceived as intentional in live header context?
- **Acceptance:**
  - iPhone Safari and Android Chrome runs recorded with device/browser/version, frame stats, and outcome.
  - Operator signs off pacing (or records required timing adjustment).
  - Any required tuning actions are converted into explicit follow-up tasks before merge.
- **Validation contract:**
  - VC-01: `real-device-validation.md` contains both platform reports + pass/fail judgment.
  - VC-02: Decision log updated with pacing verdict and any configuration changes.
- **Planning validation:**
  - None: requires post-implementation execution evidence.
- **Rollout / rollback:**
  - None: non-implementation task.
- **Documentation impact:**
  - New real-device validation artifact and decision-log append.
- **Notes / references:**
  - Emulation evidence remains reference-only and cannot substitute for this task.

### TASK-06: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` (only if TASK-05 reveals unresolved blockers)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/hbag-brandmark-particle-animation/plan.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 95% - checkpoint procedure is defined.
  - Approach: 95% - enforced reassessment prevents risky downstream assumptions.
  - Impact: 95% - protects merge quality when late evidence changes scope.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run if TASK-05 exposes blocking issues.
  - Task sequencing and confidence updated before TASK-07.
- **Horizon assumptions to validate:**
  - No unresolved quality/performance blockers remain after TASK-05.
  - All acceptance evidence needed for closure is complete and attributable.
- **Validation contract:**
  - Plan updated with explicit checkpoint outcome and any replan deltas.
- **Planning validation:**
  - Replan evidence path: `docs/plans/hbag-brandmark-particle-animation/plan.md` updates recorded in Decision Log.
- **Rollout / rollback:**
  - None: planning control task.
- **Documentation impact:**
  - Plan checkpoint outcome entry.

### TASK-07: Finalize rollout evidence package and documentation updates
- **Type:** IMPLEMENT
- **Deliverable:** docs + evidence package updates for merge readiness
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/hbag-brandmark-particle-animation/fact-find.md`, `docs/plans/hbag-brandmark-particle-animation/artifacts/decision-log.md`, `docs/plans/hbag-brandmark-particle-animation/plan.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - update paths are known and in-repo.
  - Approach: 90% - consolidating final evidence avoids launch-by-memory failure modes.
  - Impact: 90% - provides explicit closure packet for reviewers/operators.
- **Acceptance:**
  - Fact-find confidence and evidence sections reflect post-build reality.
  - Decision log contains final chosen defaults and validation outcomes.
  - Plan task statuses updated accurately with completion dates/results.
- **Validation contract (TC-XX):**
  - TC-01: Referenced artifacts exist and match final implementation outcomes.
  - TC-02: Plan/fact-find metadata state is consistent (`Ready-for-planning` transitions documented).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Identify stale plan/fact-find statements after implementation completion.
  - Green: Update docs/evidence links and completion records.
  - Refactor: Remove superseded assumptions from notes.
- **Planning validation:**
  - None: S-effort closure task.
- **Scouts:**
  - None: deterministic documentation closeout.
- **Edge Cases & Hardening:**
  - Do not overwrite historical evidence; append dated updates.
- **What would make this >=90%:**
  - Already >=90% once checkpoint output is available.
- **Rollout / rollback:**
  - Rollout: merge docs with implementation branch.
  - Rollback: restore previous plan/fact-find snapshots if evidence mismatch is discovered.
- **Documentation impact:**
  - Final closure packet for this feature folder.

## Risks & Mitigations
- Real-device performance differs from emulation.
  - Mitigation: TASK-05 requires physical evidence before closure.
- Canvas/font readiness mismatch produces malformed samples.
  - Mitigation: TASK-03 explicit font-resolution and resize hardening criteria.
- Scope drift into API changes.
  - Mitigation: TASK-03 acceptance explicitly requires unchanged `BrandMarkProps` contract.
- Visual assertions become flaky.
  - Mitigation: TASK-04 deterministic frame capture and fixed environment settings.

## Observability
- Logging:
  - Dev-only animation diagnostics (frame pacing and phase timing) captured during TASK-05 when needed.
- Metrics:
  - Frame pacing stats by device profile in `real-device-validation.md`.
  - Bundle delta evidence stored with TASK-04 outputs.
- Alerts/Dashboards:
  - None: client-side feature with manual pre-merge gate.

## Acceptance Criteria (overall)
- [ ] Hourglass dissolve/funnel/reform animation is implemented and visually coherent in BrandMark.
- [ ] `BrandMarkProps` remains backward compatible and Header consumer behavior is unchanged.
- [ ] Reduced-motion path bypasses particle rendering and lands directly in final state.
- [ ] Automated unit/integration/visual checks pass for new behavior.
- [ ] Real-device validation evidence exists for iPhone Safari and Android Chrome.
- [ ] Bundle delta remains below 5 KB gzipped for feature code.

## Decision Log
- 2026-02-23: Plan created in `plan-only` mode with TASK-01 as explicit decision gate for remaining motion defaults.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted task scores:
  - TASK-01: 90 * 1 = 90
  - TASK-02: 85 * 2 = 170
  - TASK-03: 85 * 3 = 255
  - TASK-04: 85 * 2 = 170
  - TASK-05: 85 * 2 = 170
  - TASK-06: 95 * 1 = 95
  - TASK-07: 90 * 1 = 90
- Total weighted score = 1,040
- Total weight = 12
- Overall-confidence = 1,040 / 12 = 86.7% -> 87%

## Phase 11 Trigger Check
- Trigger 1 (Overall-confidence < 80%): No (`87%`).
- Trigger 2 (any task <80% without upstream SPIKE/INVESTIGATE): No (all task confidence values are >=85%).
- Action: `/lp-do-critique` auto-trigger skipped for this plan revision.
