---
Type: Plan
Status: Complete
Domain: Business-OS
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-assessment-post-build-refresh
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Assessment Post-Build Refresh Plan

## Summary
This plan closes the gap between strategy-relevant build outputs and the assessment balance sheet by adding a bounded post-build assessment refresh path. The implementation stays deliberately narrow: later assessment decisions may refresh only explicitly allowed intake fields and must not re-seed seed-once live-owned assessment docs. The first iteration targets the proven naming drift case, where a confirmed name decision can update revision-mode intake fields without touching downstream MEASURE seed artifacts. The build is auto-eligible because all tasks are unblocked, deterministic, and above confidence threshold.

## Active tasks
- [x] TASK-01: Implement the bounded assessment post-build refresh contract and utility
- [x] TASK-02: Add regression coverage for refresh, no-op, and seed-once protection
- [x] TASK-03: Apply the refresh path to the live HEAD naming drift and record evidence

## Goals
- Add an explicit post-build assessment refresh contract for strategy-relevant builds.
- Encode a deterministic target matrix instead of free-form prose-driven mutations.
- Support confirmed-name refresh into the intake packet as the first real strategy write-back case.
- Protect seed-once/live-owned docs from automated re-seeding.
- Leave non-strategy builds as no-op.

## Non-goals
- Re-running all ASSESSMENT-stage modules after every build.
- Refreshing seed-once artifacts such as `current-problem-framing.user.md`.
- Parsing arbitrary `results-review.user.md` prose into assessment mutations.
- Solving every later assessment write-back case in one pass.

## Constraints & Assumptions
- Constraints:
  - `results-review.user.md` remains the Layer B -> Layer A standing update artifact; assessment refresh must stay separate and deterministic.
  - Carry-mode semantics in `carry-mode-schema.md` remain authoritative.
  - Seed-once/live-owned docs must never be re-seeded from intake refresh.
  - The implementation must be additive and safe when no qualifying source artifact changed.
- Assumptions:
  - Strategy-relevant builds can be identified from changed-file scope and explicit business context.
  - The first bounded target matrix can focus on naming confirmation without blocking later expansion.
  - Updating the live HEAD intake packet is valid proof that the gap is closed for the confirmed-name case.

## Inherited Outcome Contract
- **Why:** The assessment layer represents the accumulated strategic knowledge of a business. Builds can change strategic facts such as brand name, solution posture, or product naming, but the assessment balance sheet is not refreshed after the build cycle, so it drifts out of sync with accumulated loop learnings.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A defined mechanism exists for assessment containers to be updated after builds that touch strategy-relevant artifacts, preventing the assessment layer from drifting out of sync with accumulated loop learnings.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-assessment-post-build-refresh/fact-find.md`
- Key findings used:
  - ASSESSMENT-09 is the only existing intake refresh mechanism.
  - `results-review.user.md` is standing-update feedback only and does not cover assessment write-back.
  - `Business name` and `Business name status` are revision-mode until confirmation.
  - HEAD has a live proven drift case: intake says `Nidilo`, later decision selects `Facilella`.
  - MEASURE-00 and similar downstream docs are seed-once/live-owned and must remain untouched.

## Proposed Approach
- Option A: Re-run `assessment-intake-sync.md` after every build.
- Option B: Add a deterministic post-build assessment refresh utility with an explicit target matrix and protected target list.
- Chosen approach: Option B. It matches carry-mode rules, supports later decision artifacts, and avoids blanket re-seeding.

## Validation Contracts
- `TC-01` Contract + utility path:
  - Deterministic post-build refresh utility updates only allowed intake fields for a confirmed name decision.
  - Contract docs and build skill state that seed-once/live-owned docs are excluded.
- `TC-02` Regression coverage:
  - Confirmed-name fixture updates intake packet name fields and naming summary.
  - Non-qualifying build scope produces no-op.
  - Seed-once assessment doc remains byte-identical.
- `TC-03` Live application + validation:
  - HEAD intake packet refreshes from `Nidilo` to `Facilella`.
  - Targeted typecheck passes for the scripts package.
  - Targeted lint passes for changed scripts files.

## Open Decisions
None.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add bounded assessment refresh contract, target matrix, and deterministic utility | 84% | M | Complete (2026-03-09) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add regression tests for refresh, no-op, and protected seed-once docs | 83% | M | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Apply the refresh path to the live HEAD drift case and capture validation evidence | 88% | S | Complete (2026-03-09) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract and utility seam must exist first |
| 2 | TASK-02 | TASK-01 | Tests depend on the concrete utility and target matrix |
| 3 | TASK-03 | TASK-02 | Apply the new path only after regression guards exist |

## Tasks

### TASK-01: Implement the bounded assessment post-build refresh contract and utility
- **Type:** IMPLEMENT
- **Deliverable:** Contract/spec updates plus deterministic refresh utility and package script
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/business-os/startup-loop/specifications/two-layer-model.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/business-os/startup-loop/schemas/carry-mode-schema.md`, `.claude/skills/lp-do-build/SKILL.md`, `scripts/package.json`, `scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 84%
  - Implementation: 82% - the code seam is clear, but this is a new utility with markdown mutation logic.
  - Approach: 84% - explicit target matrix + protected targets matches repo contracts.
  - Impact: 90% - this closes the real observed drift path without broad collateral writes.
- **Acceptance:**
  - A deterministic utility exists for post-build assessment refresh.
  - The target matrix explicitly allows confirmed-name refresh into the intake packet only.
  - The contract docs state that seed-once/live-owned docs are protected and excluded.
  - The build skill documents when the utility is run and what inputs it needs.
- **Validation contract (TC-01):**
  - TC-01: utility can classify a changed `DEC-<BIZ>-NAME-*` artifact as a refresh-eligible source.
  - TC-02: utility updates only bounded intake targets and reports no-op for unrelated files.
  - TC-03: contract docs and skill docs align on the same trigger boundary.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - traced current build artifact emitters in `scripts/src/startup-loop/build/`
    - traced carry-mode semantics in `docs/business-os/startup-loop/schemas/carry-mode-schema.md`
    - traced Layer A/Layer B write-back boundary in `docs/business-os/startup-loop/specifications/two-layer-model.md`
  - Validation artifacts:
    - `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts`
    - `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts`
    - `docs/business-os/startup-loop/specifications/two-layer-model.md`
  - Unexpected findings:
    - no existing post-build assessment write-back code path exists
    - strategy-relevant refresh must not piggyback on `results-review.user.md`
- **Scouts:** None: the source/target boundary is now explicit.
- **Edge Cases & Hardening:** missing intake packet, malformed decision doc, name decision without confirmed selection, unrelated changed files.
- **What would make this >=90%:**
  - fixture-backed proof that the utility preserves untouched assessment docs byte-for-byte
  - one live repo application against HEAD
- **Rollout / rollback:**
  - Rollout: ship additive docs + utility + package script.
  - Rollback: revert the new utility and contract edits.
- **Documentation impact:** adds explicit post-build assessment refresh rules to architecture and build docs.
- **Notes / references:** `docs/plans/startup-loop-assessment-post-build-refresh/fact-find.md`
- **Completion evidence (2026-03-09):**
  - Added deterministic utility: `scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts`
  - Added package entry: `scripts/package.json` -> `startup-loop:assessment-post-build-refresh`
  - Updated contracts/specs:
    - `docs/business-os/startup-loop/specifications/two-layer-model.md`
    - `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
    - `docs/business-os/startup-loop/schemas/carry-mode-schema.md`
    - `.claude/skills/lp-do-build/SKILL.md`
  - Implemented bounded name-confirmation mapping only:
    - source: `DEC-<BIZ>-NAME-*`
    - targets: intake naming summary, Section B naming fields, naming constraint row
    - protected: seed-once/live-owned downstream docs remain out of scope

### TASK-02: Add regression coverage for refresh, no-op, and seed-once protection
- **Type:** IMPLEMENT
- **Deliverable:** New startup-loop test file covering allowed refresh, no-op, and protected docs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/__tests__/lp-do-build-assessment-refresh.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 83%
  - Implementation: 82% - temp-fixture testing pattern is well established in `scripts/src/startup-loop/__tests__/`.
  - Approach: 83% - expected outcomes are concrete and deterministic.
  - Impact: 85% - protects the new utility from silent over-refresh regressions.
- **Acceptance:**
  - Tests cover confirmed-name refresh into intake.
  - Tests prove non-qualifying build scope is a no-op.
  - Tests prove a seed-once doc such as `current-problem-framing.user.md` is untouched.
- **Validation contract (TC-02):**
  - TC-01: refreshed intake packet contains updated business name and confirmed status.
  - TC-02: no-op path returns zero writes for unrelated changed files.
  - TC-03: protected doc content before/after remains identical.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - reviewed temp-dir fixture pattern in `assessment-completion.test.ts`
    - reviewed deterministic script test style in `lp-do-build-results-review-prefill.test.ts`
  - Validation artifacts:
    - `scripts/src/startup-loop/__tests__/assessment-completion.test.ts`
    - `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts`
  - Unexpected findings:
    - scripts package excludes test files from tsconfig, so local validation must rely on targeted lint/typecheck rather than Jest execution per repo policy
- **Scouts:** None.
- **Edge Cases & Hardening:** windows-style paths, multiple name decisions, pre-existing confirmed intake state.
- **What would make this >=90%:**
  - run CI and observe the new fixture suite pass
- **Rollout / rollback:**
  - Rollout: commit tests with the utility.
  - Rollback: revert the test file.
- **Documentation impact:** none.
- **Notes / references:** `docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md`
- **Completion evidence (2026-03-09):**
  - Added fixture-backed regression file: `scripts/src/startup-loop/__tests__/lp-do-build-assessment-refresh.test.ts`
  - Coverage includes:
    - qualifying name-decision detection
    - intake refresh on confirmed name decision
    - no-op for unrelated changed files
    - idempotent second run
    - byte-identical seed-once doc preservation
  - Local note: Jest was not run locally per repo testing policy; the fixture suite is ready for CI execution.

### TASK-03: Apply the refresh path to the live HEAD naming drift and record evidence
- **Type:** IMPLEMENT
- **Deliverable:** Updated HEAD intake packet plus completion evidence in plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md`, `docs/plans/startup-loop-assessment-post-build-refresh/plan.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 88% - the live target file and decision source are known.
  - Approach: 88% - use the new deterministic utility rather than manual editing.
  - Impact: 90% - closes the observed drift case in repo state, not just in theory.
- **Acceptance:**
  - HEAD intake packet reflects `Facilella` as confirmed business name.
  - Naming summary and bounded revision-mode fields no longer contradict the decision record.
  - Plan evidence records the exact validation commands and outcome.
- **Validation contract (TC-03):**
  - TC-01: utility updates the live HEAD intake packet from the confirmed decision doc.
  - TC-02: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` passes.
  - TC-03: `pnpm exec eslint --no-ignore --no-warn-ignored scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts scripts/src/startup-loop/__tests__/lp-do-build-assessment-refresh.test.ts` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None.
- **Edge Cases & Hardening:** utility must be idempotent on repeated runs against HEAD.
- **What would make this >=90%:**
  - second no-op run against the live HEAD case after refresh
- **Rollout / rollback:**
  - Rollout: run utility against HEAD and persist the refreshed intake packet.
  - Rollback: revert the intake packet change and utility if needed.
- **Documentation impact:** update plan completion evidence.
- **Notes / references:** `docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md`
- **Completion evidence (2026-03-09):**
  - Dry-run preview confirmed bounded writes for HEAD:
    - `node --import tsx scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts --root-dir . --changed-file docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md --dry-run`
  - Applied live refresh under writer lock:
    - `node --import tsx scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts --root-dir . --changed-file docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md`
  - Idempotence check passed on immediate rerun:
    - second invocation returned `status: "noop"` with `reason: "intake_already_matches_decision"`
  - HEAD intake packet now reflects:
    - `Business name = Facilella`
    - `Business name status = confirmed - selected on 2026-02-26; facilella.com registered`
    - `Naming territory = Easy Hair System`
  - Validation gate passed:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - `pnpm exec eslint --no-ignore --no-warn-ignored scripts/src/startup-loop/build/lp-do-build-assessment-refresh.ts scripts/src/startup-loop/__tests__/lp-do-build-assessment-refresh.test.ts`

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Implement the bounded assessment post-build refresh contract and utility | Yes | None | No |
| TASK-02: Add regression coverage for refresh, no-op, and seed-once protection | Yes | Moderate: local Jest execution is disallowed by repo policy, so coverage can be added but not run locally | No |
| TASK-03: Apply the refresh path to the live HEAD naming drift and record evidence | Yes | None | No |

## Risks & Mitigations
- Over-refresh into seed-once docs -> keep an explicit target matrix and default unknown targets to no-op.
- Drift remains in untouched fields -> start with the proven name-confirmation path and make the target matrix extensible.
- Build skill/docs diverge from utility behavior -> update contracts and build skill in the same task.
- Markdown mutation becomes brittle -> keep field targeting narrow and cover it with fixtures against real intake structure.

## Observability
- Logging: utility emits per-business applied/no-op summary to stderr/stdout.
- Metrics: None: deterministic maintenance utility only.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] Post-build assessment refresh has a defined contract separate from standing `results-review` updates.
- [x] A deterministic utility can refresh confirmed-name intake fields from a later decision record.
- [x] Protected seed-once docs are not mutated.
- [x] Live HEAD intake packet no longer contradicts `DEC-HEAD-NAME-01`.
- [x] Targeted typecheck and lint pass for the changed scripts surfaces.

## Decision Log
- 2026-03-09: Chose an explicit target matrix over blanket intake re-sync to preserve seed-once ownership boundaries.
- 2026-03-09: Scoped the first implementation to confirmed-name refresh because it is a proven live drift case with clear carry-mode authority.
- 2026-03-09: Made the utility repo-root aware so the package script works correctly when invoked via `pnpm --filter scripts`.

## Overall-confidence Calculation
- Weights (S=1, M=2, L=3): TASK-01(M), TASK-02(M), TASK-03(S)
- Weighted score = `(84*2 + 83*2 + 88*1) / (2+2+1) = 422/5 = 84.4%`
- Overall-confidence: **84%**

## Section Omission Rule
None: all core sections are populated for this run.
