---
Type: Plan
Status: Archived
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
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
---

# Caryina BrandMark Hourglass Particle Animation Plan

## Summary
This plan implements the hourglass dissolution effect for the Caryina BrandMark by introducing a Canvas 2D particle layer while preserving the existing public API and `Car`+`ina` merge behavior. The approach is evidence-first: extract deterministic engine seams, integrate into the existing BrandMark lifecycle, and then close with automated and device evidence. For this cycle, physical-device validation was explicitly waived by operator instruction and recorded as accepted risk.

## Active tasks
- [x] TASK-01: Finalize brand-motion defaults (color transform, small viewport behavior, hover replay profile)
- [x] TASK-02: Build pure particle engine + text sampling utilities for BrandMark
- [x] TASK-03: Integrate canvas choreography into BrandMark while preserving API and reduced-motion guarantees
- [x] TASK-04: Add deterministic validation harness (Jest logic + Playwright visual/perf + bundle budget measurement)
- [x] TASK-05: Run real-device validation and operator pacing sign-off (operator-waived for this cycle)
- [x] TASK-06: Horizon checkpoint for merge readiness and downstream replan
- [x] TASK-07: Finalize rollout evidence package and documentation updates

## Goals
- Deliver the hourglass dissolution narrative in BrandMark with Canvas 2D and no runtime animation dependencies.
- Preserve `BrandMarkProps` compatibility, including `mount` and `hover` triggers.
- Keep accessibility semantics in the DOM while canvas remains presentation-only.
- Keep net runtime bundle delta attributable to this feature under 5 KB gzipped.
- Produce reproducible technical and device evidence before merge.

## Non-goals
- Introducing WebGL/three.js/pixi.js/tsParticles.
- Changing Header structure or navigation behavior outside BrandMark integration needs.
- Creating a BOS card for this cycle (direct-inject remains intentional).
- Replacing physical-device checks with emulation-only sign-off unless explicitly overridden by the operator.

## Constraints & Assumptions
- Constraints:
  - BrandMark remains a client component and must tolerate font readiness timing variance.
  - Existing Caryina token system and font loading (`next/font/google`) stay authoritative.
  - Reduced-motion path must bypass particle lifecycle entirely.
  - No public API breaks to `BrandMarkProps`.
- Assumptions:
  - Prototype evidence is sufficient to start implementation but not enough for release sign-off.
  - Pure module extraction (`particle engine` + `sampling`) will provide deterministic test seams.
  - Operator decision in TASK-01 is required before merge; engineering can prototype but cannot finalize behavior without sign-off.

## Fact-Find Reference
- Related brief: `docs/plans/_archive/hbag-brandmark-particle-animation/fact-find.md`
- Key findings used:
  - Prototype and benchmark artifacts exist and are reproducible (`artifacts/prototype/*`).
  - Caryina has executable Jest seams (`apps/caryina/jest.config.cjs`, baseline BrandMark test).
  - Highest remaining execution risks are real-device smoothness, pacing perception, and integrated font/resize behavior.

## Proposed Approach
- Option A: Implement full integration first, then backfill tests and device evidence.
  - Risk: expensive rewrites if physics or contracts are wrong.
- Option B: Build engine seams first, then integrate, then validate with automated + physical evidence.
  - Benefit: lower rework risk and clearer confidence progression.
- Chosen approach: Option B.

## Execution Contracts

### Standard Checks
Run these checks for every M/L task before marking complete:
- `pnpm --filter @apps/caryina typecheck`
- `pnpm --filter @apps/caryina lint`
- `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'`

### Validation Lane Decision (No Jest Canvas Pixel Assertions)
- Jest scope:
  - Engine math/lifecycle and React branch behavior.
  - Canvas APIs mocked or stubbed in jsdom.
- Playwright scope:
  - Deterministic final-frame screenshot checks in real browser engines.
  - Browser-level performance capture used by benchmark/device evidence.
- Explicit rule:
  - Visual fidelity sign-off is Playwright/device-based, not jsdom-based.

### Bundle Budget Contract
- Budget: net new runtime JS for this feature <= 5,120 bytes gzipped.
- Scope:
  - Runtime code only (`apps/caryina/src/components/BrandMark/**` and any new runtime utilities imported by BrandMark).
  - Excludes tests, docs, and local benchmark scripts.
- Measurement method:
  - Build baseline and candidate with `pnpm --filter @apps/caryina build`.
  - Use a task-owned script (`docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs`) to:
    - map route runtime chunks for `/` from build manifests,
    - compute gzip bytes per involved chunk,
    - report delta in `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/bundle-budget-report.json`.
- Pass condition:
  - `report.featureDeltaGzipBytes <= 5120`.

### Performance & Device Evidence Contract
- Pass thresholds for each required physical device run:
  - p95 frame time during active animation <= 24ms.
  - Long frames (>50ms) <= 8 during one mount animation sequence.
  - Total mount animation completion between 3.2s and 4.2s.
  - Repeatability: 3 consecutive runs after 30s warm-up; no run may exceed p95 28ms.
- Required matrix (minimum):
  - 1 physical iPhone + Safari (record exact model, iOS, Safari version).
  - 1 physical Android phone + Chrome (record exact model, Android, Chrome version).
- Fail rule:
  - If any required threshold fails, do not close TASK-05. Add tuning follow-up or `/lp-do-replan` at TASK-06.
- Cycle exception:
  - 2026-02-23: Operator waiver applied (`ok no prolems move on`), allowing TASK-05 closeout without physical-device captures for this cycle only.

### Real-Device Evidence Template
`docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/real-device-validation.md` must include:
- Device + OS + browser version
- Recording file path(s)
- Measurement method/tool used
- Run table with p95, long-frame count, duration
- Pass/fail verdict per run and per device
- Operator pacing verdict: `approved` or `adjustments required`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - Reason: All plan tasks are complete for this cycle.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Finalize brand-motion defaults | 90% | S | Complete (2026-02-23) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Build pure particle engine + sampling utilities | 85% | M | Complete (2026-02-23) | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Integrate canvas choreography into BrandMark | 80% | L | Complete (2026-02-23) | TASK-01, TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Add deterministic validation harness + bundle budget measurement | 85% | M | Complete (2026-02-23) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | INVESTIGATE | Real-device validation + pacing sign-off | 70% | M | Complete (2026-02-23, operator waiver) | TASK-03, TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Horizon checkpoint: proceed or replan based on evidence | 95% | S | Complete (2026-02-23) | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Finalize rollout evidence package + docs | 90% | S | Complete (2026-02-23) | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Decision capture and engine groundwork can proceed in parallel. |
| 2 | TASK-03 | TASK-01, TASK-02 | Core integration after defaults and engine contracts exist. |
| 3 | TASK-04 | TASK-02, TASK-03 | Validation harness depends on integrated behavior. |
| 4 | TASK-05 | TASK-03, TASK-04 | Device evidence only meaningful after integration + harness. |
| 5 | TASK-06 | TASK-05 | Formal proceed-or-replan gate. |
| 6 | TASK-07 | TASK-06 | Documentation and rollout packet closure. |

Max parallelism: 2 tasks (Wave 1)
Critical path: TASK-01 -> TASK-03 -> TASK-04 -> TASK-05 -> TASK-06 -> TASK-07 (6 waves)

## Tasks

### TASK-01: Finalize brand-motion defaults (color transform, small viewport behavior, hover replay profile)
- **Type:** DECISION
- **Deliverable:** decision record in `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/decision-log.md` + plan Decision Log update
- **Execution-Skill:** lp-design-qa
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Decision owner:** Operator (Pete)
- **Affects:** `docs/plans/_archive/hbag-brandmark-particle-animation/plan.md`, `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/decision-log.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - structured decision framing already exists in fact-find.
  - Approach: 90% - options are isolated and reversible in implementation.
  - Impact: 90% - resolves core requirement ambiguity before integration hardening.
- **Options:**
  - Option A: Particle color remains primary throughout; animation enabled on all widths; full hover replay.
  - Option B: Primary -> accent color drift; disable below 480px; abbreviated hover replay.
  - Option C: Primary -> accent color drift; enable on all widths with adaptive particle cap; abbreviated hover replay.
- **Recommendation:** Option C.
- **Decision input needed:**
  - question: Approve Option C defaults for initial build?
  - why it matters: Determines timing/color/responsive branches in TASK-03 and assertions in TASK-04/TASK-05.
  - default + risk: Decision resolved. Option C approved by operator.
- **Acceptance:**
  - Decision captured with date, option, and operator name. (Complete)
  - Chosen defaults mapped to implementation constants referenced by TASK-03. (Complete)
- **Validation contract:**
  - VC-01: Decision log entry exists with explicit option + rationale + operator sign-off. (Pass)
- **Planning validation:**
  - None: decision task; options and tradeoffs are documented.
- **Rollout / rollback:**
  - None: non-implementation task.
- **Documentation impact:**
  - Update decision log and this plan.

### TASK-02: Build pure particle engine + text sampling utilities for BrandMark
- **Type:** IMPLEMENT
- **Deliverable:** code-change — particle engine module, text sampling utility, deterministic unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/caryina/src/components/BrandMark/` (new particle engine + utilities + tests)
- **Referenced:** `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/prototype.js`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - prototype math/phase behavior exists and is portable to typed seams.
  - Approach: 90% - pure-module extraction isolates Canvas coupling and maximizes testability.
  - Impact: 85% - establishes contracts needed by integration and verification tasks.
- **Acceptance:**
  - Engine API supports init/tick/reset with deterministic phase progression.
  - Sampling utility returns bounded points for tagline glyph targets.
  - Sampling is cached by `(text, fontFamily, fontSize, dpr)` and is never recomputed per animation frame.
  - Particle state uses preallocated structures (typed arrays or object pool) with no per-frame allocations in hot `tick()` path.
  - Unit tests cover lifecycle transitions and edge conditions (empty glyph sample, zero particles, invalid dimensions).
- **Validation contract (TC-XX):**
  - TC-01: Engine `tick()` advances through expected phase thresholds for fixed seed/time step.
  - TC-02: Sampling utility yields non-empty bounded points for tagline with configured Cormorant family.
  - TC-03: Engine handles zero/empty target input without runtime error.
  - TC-04: Static code check confirms no per-frame sampling call in render loop.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing tests for phase progression, sampling bounds, and cache behavior.
  - Green: Implement engine/sampler to satisfy deterministic contracts.
  - Refactor: Consolidate constants and remove prototype-only branches.
- **Planning validation (required for M/L):**
  - Standard Checks: see `## Execution Contracts`.
  - Validation artifacts:
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/prototype.js`
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
  - Unexpected findings:
    - Existing baseline test exercises only static final-state seam; engine tests are net-new.
- **Consumer tracing (required for M/L):**
  - New outputs:
    - `ParticleEngineState` consumed by `BrandMark.tsx` orchestration (TASK-03) and engine tests.
    - `sampleTextPixels()` consumed by BrandMark setup path.
  - Modified behavior:
    - None yet; this task adds modules only, no caller semantic changes.
- **Scouts:**
  - `None: covered by TC-01..TC-04 and Playwright checks in TASK-04.`
- **Edge Cases & Hardening:**
  - Guard NaN/Infinity coordinates from font anomalies.
  - Cap particle count by available target points.
  - Define DPR policy (`dpr = min(window.devicePixelRatio, 2)`) to contain pixel-density cost.
- **What would make this >=90%:**
  - Green CI on new engine tests and one integrated consumer path in TASK-03.
- **Rollout / rollback:**
  - Rollout: internal module addition; no user-visible change until TASK-03.
  - Rollback: remove new engine/sampling modules and associated tests.
- **Documentation impact:**
  - Add implementation notes to this plan and decision log if interfaces deviate.
- **Notes / references:**
  - Prototype evidence: `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`
- **Build evidence (2026-02-23):**
  - Added pure engine module: `apps/caryina/src/components/BrandMark/particleEngine.ts`.
  - Added cached sampler utility: `apps/caryina/src/components/BrandMark/sampleTextPixels.ts`.
  - Added deterministic tests:
    - `apps/caryina/src/components/BrandMark/BrandMark.particleEngine.test.ts`
    - `apps/caryina/src/components/BrandMark/BrandMark.sampleTextPixels.test.ts`
  - Validation commands (pass):
    - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'`
    - `pnpm --filter @apps/caryina typecheck`
    - `pnpm --filter @apps/caryina lint`

### TASK-03: Integrate canvas choreography into BrandMark while preserving API and reduced-motion guarantees
- **Type:** IMPLEMENT
- **Deliverable:** code-change — BrandMark integration of canvas overlay, phase orchestration, responsive handling, and fallback behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/caryina/src/components/BrandMark/BrandMark.tsx`, `apps/caryina/src/components/BrandMark/BrandMark.module.css`, `apps/caryina/src/components/BrandMark/*` (new helper files)
- **Referenced:** `apps/caryina/src/components/Header.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 80%
  - Implementation: 80% - integration seams are clear, but unresolved motion-default decision and font-readiness edge behavior can still force rework.
  - Approach: 85% - additive overlay design preserves DOM semantics and rollback path.
  - Impact: 90% - this task delivers feature outcome while preserving API compatibility.
  - Held-back test: one unresolved unknown can still drop confidence below 80 (font-readiness fallback behavior on real Safari); score is therefore capped at 80 until TASK-05 evidence exists.
- **Acceptance:**
  - BrandMark animates with dissolve/funnel/settle narrative for `animate={true}` mount mode.
  - Hover replay runs only when `matchMedia('(hover: hover) and (pointer: fine)')` is true; no replay on coarse pointer devices.
  - Hover replay uses cooldown (>=1200ms) to prevent rapid re-trigger storms.
  - Reduced-motion path skips canvas creation and renders immediate final state.
  - Canvas overlay is `aria-hidden="true"`, `role="presentation"`, and `pointer-events: none`.
  - DOM text semantics remain available to assistive tech during and after animation.
  - Font readiness strategy is explicit: start sampling after `document.fonts?.ready` OR width stabilization across 2 RAF frames; fallback to immediate final state if unresolved after 500ms.
  - `BrandMarkProps` shape and existing consumer call sites remain unchanged.
- **Validation contract (TC-XX):**
  - TC-01: Mount trigger runs dissolve/funnel/settle phases and ends in crisp DOM tagline state.
  - TC-02: Hover replay only executes for fine-pointer devices and returns to stable final state.
  - TC-03: Reduced-motion branch creates no canvas and shows immediate final state.
  - TC-04: Font-ready + resize paths remeasure safely; fallback engages within timeout when readiness is unresolved.
  - TC-05: Logo link hit area and focus styles remain unchanged with overlay enabled.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Extend tests to expose missing canvas/reduced-motion/focus behavior.
  - Green: Wire engine/sampling utilities into BrandMark lifecycle; implement phase timing and cleanup.
  - Refactor: Isolate timing/config constants and remove duplicate conditional branches.
- **Planning validation (required for M/L):**
  - Standard Checks: see `## Execution Contracts`.
  - Validation artifacts:
    - `docs/plans/_archive/hbag-brandmark-particle-animation/fact-find.md`
    - `docs/plans/_archive/hbag-brandmark-particle-animation/design-spec.md`
  - Unexpected findings:
    - None.
- **Consumer tracing (required for M/L):**
  - New outputs:
    - `data-particle-state` attribute consumed by TASK-04 tests/visual assertions.
    - Engine configuration consumed only by internal animation loop.
  - Modified behavior:
    - `BrandMark.tsx` changes internal animation semantics from CSS `y` fade to Canvas dissolve; `Header.tsx` remains safe because props and link semantics are unchanged.
- **Scouts:**
  - Probe fallback when `CanvasRenderingContext2D` is unavailable.
- **Edge Cases & Hardening:**
  - Prevent RAF leaks on unmount and rapid enter/leave.
  - Keep canvas `pointer-events: none` to avoid hit-area regressions.
  - Resolve font family string for `ctx.font` from computed style; do not pass raw CSS variable token.
- **What would make this >=90%:**
  - TASK-05 pass on both physical devices with pacing sign-off and no fallback defects.
- **Rollout / rollback:**
  - Rollout: enable integrated path behind existing `animate`/trigger behavior.
  - Rollback: restore prior CSS-only `y` transition and remove canvas integration.
- **Documentation impact:**
  - Update fact-find confidence evidence and decision log with final integrated behavior.
- **Notes / references:**
  - Preserve DOM accessibility role/label behavior.
- **Build evidence (2026-02-23):**
  - Integrated Canvas overlay choreography into `BrandMark` while preserving `BrandMarkProps` and existing `Header` consumer.
  - Added lifecycle/data attributes and control flows:
    - `data-particle-state` (`idle|dissolving|funneling|settling|done`)
    - `data-particle-active` for overlay visibility
  - Implemented reduced-motion and fallback contracts:
    - No canvas render when reduced motion is active.
    - Canvas context unavailable or sampling timeout -> immediate final state fallback.
  - Implemented hover policy contracts:
    - Replay only for `(hover: hover) and (pointer: fine)`.
    - Cooldown enforced (`>=1200ms`) to prevent replay storms.
  - Implemented font readiness strategy:
    - Sampling starts after `document.fonts.ready` OR width stabilization across 2 RAF frames.
    - 500ms bounded timeout with safe fallback.
  - Added/updated supporting tests:
    - `apps/caryina/src/components/BrandMark/BrandMark.test.tsx`
    - `apps/caryina/src/components/BrandMark/BrandMark.particleEngine.test.ts`
    - `apps/caryina/src/components/BrandMark/BrandMark.sampleTextPixels.test.ts`
  - Validation commands (pass):
    - `pnpm --filter @apps/caryina lint`
    - `pnpm --filter @apps/caryina typecheck`
    - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'`

### TASK-04: Add deterministic validation harness (Jest logic + Playwright visual/perf + bundle budget measurement)
- **Type:** IMPLEMENT
- **Deliverable:** code-change + artifact scripts for reproducible validation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/caryina/src/components/BrandMark/*.test.tsx`, `apps/caryina/jest.config.cjs`, `apps/caryina/e2e/logo.visual.spec.ts` (new), `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`, `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs` (new), `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/bundle-budget-report.json`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - baseline Jest harness and prototype benchmark runner already exist.
  - Approach: 85% - split lanes (Jest logic, Playwright visual/perf) avoid jsdom-canvas false confidence.
  - Impact: 85% - converts readiness from subjective review to reproducible evidence.
- **Acceptance:**
  - Engine lifecycle tests are deterministic and green in Jest.
  - BrandMark integration tests cover canvas-active, reduced-motion, pointer-gating, and fallback branches.
  - Playwright final-frame screenshot baseline exists and passes on deterministic capture settings.
  - Benchmark script outputs updated summary for Chromium/WebKit profiles.
  - Bundle script outputs `bundle-budget-report.json` with `featureDeltaGzipBytes` and pass/fail status.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'` passes.
  - TC-02: `pnpm exec playwright test apps/caryina/e2e/logo.visual.spec.ts --reporter=list` passes and writes screenshot artifact(s).
  - TC-03: `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs` executes without errors and updates summary artifact.
  - TC-04: `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs` outputs report with `featureDeltaGzipBytes <= 5120`.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add explicit failing tests/specs for unimplemented branches and missing scripts.
  - Green: Implement test/spec/scripts and commit deterministic baselines.
  - Refactor: De-duplicate shared harness setup and isolate helpers.
- **Planning validation (required for M/L):**
  - Standard Checks: see `## Execution Contracts`.
  - Validation artifacts:
    - `apps/caryina/jest.config.cjs`
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
  - Unexpected findings:
    - Current coverage is minimal; this task introduces the first browser-level visual contract.
- **Consumer tracing (required for M/L):**
  - New outputs:
    - Playwright screenshot and performance artifacts consumed by TASK-05 and TASK-07.
    - Bundle-budget report consumed by TASK-07 acceptance package.
  - Modified behavior:
    - Runtime code behavior unchanged by harness itself.
- **Scouts:**
  - `None: validation task with explicit contracts.`
- **Edge Cases & Hardening:**
  - Freeze animation capture at deterministic phase marker to avoid flaky screenshots.
  - Ensure browser test runner does not rely on jsdom-only APIs.
- **What would make this >=90%:**
  - Stable Playwright snapshots in two consecutive CI runs.
- **Rollout / rollback:**
  - Rollout: merge validation harness with feature branch.
  - Rollback: remove new test/spec/scripts and revert baseline artifacts.
- **Documentation impact:**
  - Update benchmark summary and add bundle report path references.
- **Build evidence (2026-02-23):**
  - Added Playwright visual harness: `apps/caryina/e2e/logo.visual.spec.ts`.
  - Added bundle measurement script: `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs`.
  - Generated bundle artifacts:
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/bundle-budget-baseline.json`
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/bundle-budget-report.json`
  - Re-ran benchmark harness and refreshed:
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json`
    - `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-summary.md`
  - Validation commands (pass):
    - `pnpm exec playwright test apps/caryina/e2e/logo.visual.spec.ts --reporter=list`
    - `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`
    - `pnpm --filter @apps/caryina build`
    - `node docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/measure-bundle-delta.mjs`
    - `pnpm --filter @apps/caryina lint`
    - `pnpm --filter @apps/caryina typecheck`
    - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark'`

### TASK-05: Run real-device validation and operator pacing sign-off
- **Type:** INVESTIGATE
- **Deliverable:** validation artifact — `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/real-device-validation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-23, operator waiver)
- **Affects:** `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/real-device-validation.md`, `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/decision-log.md`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 70%
  - Implementation: 70% - automation evidence is strong, but physical-device contract was not executed in this environment.
  - Approach: 70% - accepted-risk operator override replaces the original hard evidence gate.
  - Impact: 90% - risk remains explicitly tracked and documented for future validation.
- **Questions to answer:**
  - Does iPhone Safari meet all frame/duration thresholds?
  - Does Android Chrome meet all frame/duration thresholds?
  - Does operator approve pacing in live header context?
- **Acceptance:**
  - Operator explicitly accepted risk and instructed this cycle to proceed without physical-device captures.
  - Waiver decision is recorded in the decision log and reflected in this plan/task status.
  - Real-device validation template remains in place for post-cycle capture.
- **Validation contract:**
  - VC-01: `real-device-validation.md` contains explicit waived-for-cycle state + retained capture procedure.
  - VC-02: Decision log includes operator waiver rationale and exact instruction text.
  - VC-03: Plan records accepted-risk checkpoint outcome before TASK-07 closeout.
- **Planning validation:**
  - None: closed by explicit operator waiver for this cycle.
- **Rollout / rollback:**
  - None: non-implementation task.
- **Documentation impact:**
  - New real-device validation artifact and decision-log append.
- **Notes / references:**
  - Emulation evidence remains informative; it does not replace physical-device evidence for future hard gates.
- **Build evidence (2026-02-23):**
  - Created validation artifact scaffold: `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/real-device-validation.md`.
  - Expanded artifact with an execution procedure and capture paths for iPhone Safari + Android Chrome evidence collection.
  - Environment probe confirms no local physical-device bridge tooling in this run:
    - `adb devices` -> `command not found`
    - `xcrun xctrace list devices` -> `xctrace not available`
  - Operator override recorded from user instruction: "ok no prolems move on".
  - Outcome: physical-device gate waived for this cycle with accepted risk.

### TASK-06: Horizon checkpoint - proceed or replan based on latest evidence
- **Type:** CHECKPOINT
- **Deliverable:** explicit checkpoint outcome in plan (`Proceed to TASK-07` or `Replan before proceed`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/_archive/hbag-brandmark-particle-animation/plan.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 95% - checkpoint procedure is defined.
  - Approach: 95% - forced reassessment prevents late-stage blind merge.
  - Impact: 95% - controls downstream risk when new evidence changes assumptions.
- **Acceptance:**
  - Checkpoint records one of two outcomes:
    - Proceed: evidence satisfies thresholds and no blockers remain.
    - Replan: unresolved blockers converted to new/updated tasks via `/lp-do-replan`.
  - If replan occurs, dependencies/confidence are updated before any further implementation.
- **Horizon assumptions to validate:**
  - No unresolved quality, performance, or accessibility blockers remain after TASK-05.
  - All acceptance evidence required for closure is complete and attributable.
- **Validation contract:**
  - Plan Decision Log includes dated checkpoint verdict and rationale.
- **Planning validation:**
  - Replan evidence path: `docs/plans/_archive/hbag-brandmark-particle-animation/plan.md`.
- **Rollout / rollback:**
  - None: planning control task.
- **Documentation impact:**
  - Checkpoint outcome entry in plan.
- **Build evidence (2026-02-23):**
  - Checkpoint verdict: **Proceed** to TASK-07 with accepted-risk waiver from TASK-05.
  - `/lp-do-replan` not required because no topology changes were needed for this cycle-close decision.
  - Remaining risk explicitly documented in plan + decision log for post-cycle follow-up.

### TASK-07: Finalize rollout evidence package and documentation updates
- **Type:** IMPLEMENT
- **Deliverable:** docs + evidence package updates for merge readiness
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/_archive/hbag-brandmark-particle-animation/fact-find.md`, `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/decision-log.md`, `docs/plans/_archive/hbag-brandmark-particle-animation/plan.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - update paths are known and local.
  - Approach: 90% - evidence consolidation avoids launch-by-memory failure modes.
  - Impact: 90% - provides explicit closure packet for review.
- **Acceptance:**
  - Fact-find confidence/evidence sections reflect post-build reality.
  - Decision log contains final defaults and validation outcomes.
  - Plan task statuses and completion dates are accurate.
  - Bundle/device artifacts are linked from a single closure list.
- **Validation contract (TC-XX):**
  - TC-01: Referenced artifacts exist and match final implementation outcomes.
  - TC-02: Plan/fact-find metadata states are internally consistent.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Identify stale assumptions after TASK-06 outcome.
  - Green: Update docs/evidence links and completion records.
  - Refactor: Remove superseded assumptions from notes.
- **Planning validation:**
  - None: S-effort closure task.
- **Scouts:**
  - None: deterministic documentation closeout.
- **Edge Cases & Hardening:**
  - Append updates; do not overwrite historical evidence records.
- **What would make this >=90%:**
  - Already >=90% once checkpoint outcome and artifact set are complete.
- **Rollout / rollback:**
  - Rollout: merge docs with implementation branch.
  - Rollback: restore prior doc snapshots if artifact mismatch is discovered.
- **Documentation impact:**
  - Final closure packet for this feature folder.
- **Build evidence (2026-02-23):**
  - Updated `fact-find.md` with post-build state and accepted-risk closure note.
  - Updated decision log with checkpoint/waiver outcome and validated automation evidence list.
  - Updated plan statuses, acceptance checklist, and confidence math to reflect cycle-complete state.

## Risks & Mitigations
- Real-device performance differs from emulation.
  - Mitigation: accepted-risk operator waiver recorded for this cycle; keep `real-device-validation.md` procedure for follow-up capture before broader rollout.
- Canvas/font readiness mismatch produces malformed sampling.
  - Mitigation: TASK-03 explicit readiness strategy with bounded fallback timeout.
- Scope drift into API changes.
  - Mitigation: TASK-03 acceptance requires unchanged `BrandMarkProps` contract.
- Visual assertions become flaky.
  - Mitigation: Playwright deterministic capture and fixed run settings in TASK-04.
- Bundle budget disputes.
  - Mitigation: TASK-04 script-based gzip delta report with explicit pass threshold.

## Observability
- Logging:
  - Dev-only phase and frame timing diagnostics during TASK-05 runs.
- Metrics:
  - p95 frame time, long-frame count, and sequence duration by physical device.
  - `featureDeltaGzipBytes` from bundle budget report.
- Alerts/Dashboards:
  - None: client-side feature with pre-merge manual gate.

## Acceptance Criteria (overall)
- [x] Hourglass dissolve/funnel/reform animation is implemented and visually coherent in BrandMark.
- [x] `BrandMarkProps` remains backward compatible and Header consumer behavior is unchanged.
- [x] Reduced-motion path bypasses particle rendering and lands directly in final state.
- [x] Canvas overlay remains presentation-only (`aria-hidden`, `role=presentation`, `pointer-events: none`).
- [x] Jest logic tests and Playwright visual checks pass with deterministic artifacts.
- [x] Physical-device validation gate was explicitly waived by operator for this cycle and documented as accepted risk.
- [x] `featureDeltaGzipBytes <= 5120` in bundle budget report.

## Decision Log
- 2026-02-23: Plan created in `plan-only` mode with TASK-01 as explicit operator decision gate.
- 2026-02-23: Validation lanes fixed: Jest for logic branches, Playwright/device runs for visual + perf evidence.
- 2026-02-23: TASK-01 completed. Operator approved Option C (`proceed`), unblocking TASK-03 implementation path.
- 2026-02-23: TASK-02 completed. Engine and text sampling seams are implemented and validated, unblocking TASK-03/TASK-04.
- 2026-02-23: TASK-03 completed. BrandMark now runs Canvas dissolve/funnel/settle choreography with reduced-motion, hover-gating, and bounded fallback behavior.
- 2026-02-23: TASK-04 completed. Playwright visual harness and bundle-budget measurement artifacts are now in place and passing.
- 2026-02-23: TASK-05 started and blocked pending physical-device evidence. Validation template created at `artifacts/real-device-validation.md`.
- 2026-02-23: Automated validation re-run passed end-to-end (lint, typecheck, BrandMark tests, build, Playwright visual, benchmark, bundle budget). Remaining blocker is physical-device evidence in TASK-05.
- 2026-02-23: Physical-device bridge probe in this environment failed (`adb` and `xctrace` unavailable); TASK-05 remains externally blocked until operator-provided captures are added.
- 2026-02-23: Operator override applied (`ok no prolems move on`). TASK-05 closed as accepted-risk waiver for this cycle.
- 2026-02-23: TASK-06 checkpoint verdict = Proceed (no topology change). TASK-07 docs/evidence closeout completed.
- 2026-02-23: Build record created at `docs/plans/_archive/hbag-brandmark-particle-animation/build-record.user.md`.
- 2026-02-23: Results review finalized at `docs/plans/_archive/hbag-brandmark-particle-animation/results-review.user.md`.
- 2026-02-23: Plan archived to `docs/plans/_archive/hbag-brandmark-particle-animation/plan.md` with `Status: Archived`.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted task scores:
  - TASK-01: 90 * 1 = 90
  - TASK-02: 85 * 2 = 170
  - TASK-03: 80 * 3 = 240
  - TASK-04: 85 * 2 = 170
  - TASK-05: 70 * 2 = 140
  - TASK-06: 95 * 1 = 95
  - TASK-07: 90 * 1 = 90
- Total weighted score = 995
- Total weight = 12
- Overall-confidence = 995 / 12 = 82.9% -> 83%

## Phase 11 Trigger Check
- Trigger 1 (Overall-confidence < 80%): No (`83%`).
- Trigger 2 (any task <80% without upstream SPIKE/INVESTIGATE): No (`TASK-05` is INVESTIGATE and complete via operator waiver).
- Action: `/lp-do-critique` auto-trigger skipped for this plan revision.
