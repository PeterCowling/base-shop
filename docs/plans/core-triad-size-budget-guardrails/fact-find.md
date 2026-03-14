---
Type: Fact-Find
Outcome: Planning
Status: Complete
Domain: Skills / Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: core-triad-size-budget-guardrails
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: meta-loop-efficiency
Related-Plan: docs/plans/core-triad-size-budget-guardrails/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304122500-0002
Trigger-Why:
Trigger-Intended-Outcome:
---

# Core Triad Size Budget Guardrails Fact-Find Brief

## Scope
### Summary
Define an enforceable size-budget guardrail for the three core workflow orchestrators [`lp-do-fact-find`](../../../.claude/skills/lp-do-fact-find/SKILL.md), [`lp-do-plan`](../../../.claude/skills/lp-do-plan/SKILL.md), and [`lp-do-build`](../../../.claude/skills/lp-do-build/SKILL.md). The immediate problem is not just that the files grew; it is that nothing in the default validation path prevents further growth, while a naive hard cap at the current `meta-loop-efficiency` threshold of 200 lines would fail immediately because two triad skills already exceed it.

Current measured state on 2026-03-09:
- `lp-do-fact-find`: 247 lines
- `lp-do-plan`: 332 lines
- `lp-do-build`: 345 lines

The fact-find target is therefore: planning-ready evidence for a fail-closed growth guardrail plus explicit exception policy, not the triad shrink itself.

### Goals
- Reuse existing deterministic size-measurement logic instead of introducing a second ad hoc line-counter.
- Add a validation surface that runs in the normal local gate and can also be invoked directly.
- Define an explicit exception/waiver policy for skills already above the desired threshold.
- Make failure output agent-safe and compliant with the repo failure-message contract.

### Non-goals
- Shrink the three orchestrators back to `<=200` lines in this work item.
- Expand the guardrail to every skill family in the repo.
- Replace the weekly `meta-loop-efficiency` audit artifact.
- Treat line-count reduction alone as success without controlling future drift.

### Constraints & Assumptions
- Constraints:
  - `meta-loop-efficiency` defines the existing thin-shell H1 threshold as `SKILL.md > 200` lines.
  - `scripts/validate-changes.sh` is the canonical local validation gate before commit.
  - Repo policy blocks local Jest/test runs; new automated coverage must be CI-runnable.
  - The existing audit implementation is present in the workspace but currently untracked, and `scripts/package.json` already has unstaged references to it.
- Assumptions:
  - A temporary per-skill waiver/baseline manifest is acceptable if it is explicit, versioned, and expires through follow-up work rather than silent bypass.
  - The right first guardrail is “no further growth beyond checked-in limits,” with a separate follow-up to reduce the current over-budget files.

## Access Declarations
- None. This fact-find uses repository files only.

## Outcome Contract
- **Why:** The triad that every build cycle depends on has already regressed significantly; without guardrails it will drift back into monolith state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Define and implement enforceable size-budget checks and exception policy for `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-do-fact-find/SKILL.md` - 247-line fact-find orchestrator.
- `.claude/skills/lp-do-plan/SKILL.md` - 332-line planning orchestrator.
- `.claude/skills/lp-do-build/SKILL.md` - 345-line build orchestrator.
- `scripts/validate-changes.sh` - default local validation gate run before commits.
- `.claude/skills/meta-loop-efficiency/SKILL.md` - source of the current 200-line H1 threshold.

### Key Modules / Files
- `.claude/skills/lp-do-fact-find/modules/outcome-a-*.md` - existing module split is already in place; growth is in the orchestrator shell.
- `.claude/skills/lp-do-plan/modules/plan-*.md` - supporting modules exist; orchestrator still carries most coordination phases.
- `.claude/skills/lp-do-build/modules/build-*.md` - six modules exist; orchestrator still carries gates, routing, completion, and checklist logic.
- `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md` - source audit that created this dispatch.
- `scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts` - workspace audit engine with reusable size-metric logic (`computeSkillMetrics`, `buildSnapshot`, `buildAuditReport`), but currently untracked.
- `scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts` - workspace unit test harness for the audit engine, also currently untracked.
- `scripts/package.json` - modified workspace file already referencing `startup-loop:meta-loop-efficiency-audit`.

### Patterns & Conventions Observed
- The existing structural threshold is specific to skill orchestrators, not the repo-wide general file-boundary guidance.
  - Evidence: `.claude/skills/meta-loop-efficiency/SKILL.md`
  - Evidence: `AGENTS.md`
- `scripts/validate-changes.sh` already enforces deterministic repository policy checks before changed-file analysis, including byte budgets and skill-registry checks.
  - Evidence: `scripts/validate-changes.sh`
- All three triad skills already use `modules/`, so the current regression is not “missing modularization” but orchestrator accretion.
  - Evidence: `.claude/skills/lp-do-fact-find/modules/`
  - Evidence: `.claude/skills/lp-do-plan/modules/`
  - Evidence: `.claude/skills/lp-do-build/modules/`
- Largest current triad modules are well below the 400-line advisory threshold, which supports guarding `SKILL.md` specifically.
  - Evidence: `wc -l .claude/skills/lp-do-fact-find/modules/* .claude/skills/lp-do-plan/modules/* .claude/skills/lp-do-build/modules/*`

### Data & Contracts
- Current measured counts:
  - `lp-do-fact-find/SKILL.md`: 247
  - `lp-do-plan/SKILL.md`: 332
  - `lp-do-build/SKILL.md`: 345
- Existing module counts:
  - fact-find modules total 400 lines; max module 147
  - plan modules total 144 lines; max module 76
  - build modules total 426 lines; max module 151
- Existing audit logic:
  - `computeSkillMetrics(...)` computes `skillMdLines`, `hasModules`, `maxModuleLines`, H1/H2/H3/H4 signals
  - `buildSnapshot(...)` already centralizes the scan over `.claude/skills/*`
  - `buildAuditReport(...)` is a reporting wrapper around that snapshot logic
- Failure-message contract:
  - New validator failures must include failure reason, retry posture, exact next step, anti-retry list, and escalation/stop condition.
  - Evidence: `AGENTS.md`

### Dependency & Impact Map
- Upstream dependencies:
  - Edits to the three triad `SKILL.md` files.
  - The existing size-threshold contract defined by `meta-loop-efficiency`.
- Downstream dependents:
  - `scripts/validate-changes.sh`
  - Any developer using the default local validation gate
  - Future CI wiring that reuses the same validator command
  - `meta-loop-efficiency` weekly audit, which should remain aligned with the same budget source
- Likely blast radius:
  - Medium for `scripts/validate-changes.sh`
  - Medium for the audit engine if metric logic is extracted/shared
  - Low for the skill files themselves in this guardrail phase

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest exists for scripts package tests, but local execution is policy-blocked.
- Commands:
  - Local: deterministic shell/CLI checks only.
  - CI: scripts package Jest coverage can verify validator behavior.
- CI integration:
  - Validation failures are expected to surface through existing targeted validation and CI flows.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Audit metric logic | Jest (workspace, untracked) | `scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts` | Confirms H4/H5 reporting and previous-audit behavior. |
| Local validation gate | Shell | `scripts/validate-changes.sh` | No current size-budget enforcement for triad skills. |

#### Coverage Gaps
- No command today fails when a triad orchestrator grows.
- No checked-in manifest ties a desired threshold to an allowed temporary waiver.
- No failure-contract-compliant output exists yet for size-budget breaches.
- The reusable audit engine is not yet tracked in git, so a build cannot assume that baseline is stable.

#### Testability Assessment
- Easy to test:
  - exact line counts
  - manifest parsing
  - growth breach / waiver expired / missing entry cases
  - changed-file scoping in `validate-changes.sh`
- Hard to test:
  - keeping the weekly audit and commit-time validator aligned without duplicating logic
  - interacting safely with the current untracked audit-engine workspace state
- Test seams needed:
  - a pure shared collector/reader that both the weekly audit and the validator call

### Recent Git History (Targeted)
- `d23fdb8420` - added simulation-trace protocol to `lp-do-plan` and `lp-do-fact-find`, contributing orchestration growth.
- `9fdd73afd3` - added delivery rehearsal phase to `lp-do-plan`.
- `bcb2ace303` - added rehearsal terminology / reflection-only contracts to workflow skills.
- `4e08bd6829` - added Codex offload route to `lp-do-build` executor modules.
- `6f5c9c8518` - expanded `lp-do-build` plan-completion steps and checklist.
- `13a8f30f39` / `642f054383` - added build-side self-evolving and prefill workflow instructions touching the build lane.

## Questions
### Resolved
- Q: Can we simply enforce `<=200` lines immediately for the triad?
  - A: No. That would fail instantly because the current measured counts are 247, 332, and 345.
  - Evidence: `wc -l .claude/skills/lp-do-fact-find/SKILL.md .claude/skills/lp-do-plan/SKILL.md .claude/skills/lp-do-build/SKILL.md`
- Q: Is there already a deterministic measurement implementation to reuse?
  - A: Yes. The workspace audit engine already computes the exact metrics needed for a guardrail; what is missing is checked-in ownership and commit-time enforcement.
  - Evidence: `scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts`
- Q: Is `scripts/validate-changes.sh` the right enforcement surface?
  - A: Yes. It already holds repo-wide deterministic pre-commit gates such as AGENTS byte-size and skill-registry checks, so a triad-size guardrail belongs there more than in a weekly reporting skill.
  - Evidence: `scripts/validate-changes.sh`
- Q: Is the weekly audit itself a sufficient guardrail?
  - A: No. It is periodic, artifact-oriented, and non-blocking. It diagnoses drift after the fact rather than stopping it at edit/commit time.
  - Evidence: `.claude/skills/meta-loop-efficiency/SKILL.md`
  - Evidence: `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md`
- Q: Does guarding only `SKILL.md` still make sense now that modules exist?
  - A: Yes. The current problem is orchestrator-shell growth; the largest module is 151 lines, well below the separate 400-line advisory threshold.
  - Evidence: `wc -l .claude/skills/lp-do-fact-find/modules/* .claude/skills/lp-do-plan/modules/* .claude/skills/lp-do-build/modules/*`

### Open (Operator Input Required)
- None. The queued dispatch already defines the operational outcome and the repo evidence is sufficient to recommend an implementation shape.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Current triad size state | Yes | None | No |
| Existing threshold source (`meta-loop-efficiency`) | Yes | None | No |
| Commit-time enforcement surface | Yes | None | No |
| Reuse path for audit logic | Partial | [Moderate] Existing audit engine is present but untracked, so build must normalize or consciously work with current workspace state. | Yes |
| Immediate hard-cap feasibility | Yes | [Major] A direct 200-line hard fail would block the repo immediately. | Yes |

## Scope Signal
- Signal: right-sized
- Rationale: The work is bounded to skill-budget measurement, validator wiring, and waiver policy for three files. It is narrow enough for a focused code plan, but only if the implementation distinguishes between target budget and temporary allowed max.

## Confidence Inputs
- Implementation: 86%
  - Evidence basis: the measurement logic already exists in the workspace, `validate-changes.sh` already hosts deterministic gates, and the affected skill set is only three files.
  - What raises this to >=80: already met.
  - What raises this to >=90: confirm the shared metric collector is extracted cleanly enough that the weekly audit and validator call the same code path.
- Approach: 90%
  - Evidence basis: a manifest-backed baseline-plus-target model is the only fail-closed option that does not instantly break the repo while still preventing further drift.
  - What raises this to >=80: already met.
  - What raises this to >=90: already met.
- Impact: 82%
  - Evidence basis: the change closes a real gap in the default validation path for the repo’s highest-frequency workflow skills.
  - What raises this to >=80: already met.
  - What raises this to >=90: land a follow-up shrink plan for the triad itself so the waivers have a credible exit path.
- Delivery-Readiness: 78%
  - Evidence basis: design is clear, but the existing audit engine/test harness are still untracked workspace files, which introduces handoff risk.
  - What raises this to >=80: either commit/stabilize the existing audit engine first or extract the shared collector as part of this plan’s first task.
  - What raises this to >=90: same as above, plus a clean direct command in `scripts/package.json` for the validator.
- Testability: 84%
  - Evidence basis: validator behavior is deterministic and easy to unit test with fixture skills; CI-only test policy is manageable because the code lives in `scripts`.
  - What raises this to >=80: already met.
  - What raises this to >=90: add explicit tests for missing-entry, breach, expired-waiver, and changed-file-scoping cases.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Hard-coding a single `200` threshold as an immediate failure breaks the repo on day one | High | High | Separate `target_lines` from temporary `max_lines` or explicit waiver state. |
| Guardrail logic duplicates the weekly audit metric code and drifts later | Medium | High | Extract or reuse a shared collector rather than copy-pasting the counter logic. |
| Existing untracked audit-engine files conflict with implementation work | Medium | Medium | Treat normalization of that workspace state as an explicit first task, not an assumption. |
| Developers bypass the guardrail with ad hoc env vars or silent script skips | Medium | Medium | Use fail-closed defaults and failure messages that explicitly name non-working bypass paths. |
| Waiver policy becomes permanent tech debt | Medium | High | Require checked-in rationale, owner, and exit plan or expiry for every over-budget exception. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep the source of truth for the 200-line thin-shell target aligned with `meta-loop-efficiency`.
  - Add a direct validator command in the scripts package; do not hide logic only inside `validate-changes.sh`.
  - Failure output must satisfy the repo’s failure-message contract.
  - Changed-file scoping is preferred in the local gate, but a full-repo mode should exist for explicit use.
- Recommended exception-policy shape:
  - checked-in manifest with one entry per triad skill
  - fields for `target_lines`, `max_lines` (or equivalent no-growth ceiling), and waiver metadata
  - breach if file exceeds current allowed max, waiver expired, or manifest entry missing
  - warn or report separately when above target but still within a temporary waiver
- Anti-gaming note:
  - This idea should prevent further orchestrator growth; it does not itself prove simplification. Shrink work should still be tracked separately.

## Suggested Task Seeds (Non-binding)
- TASK-01: Stabilize shared skill-metric collection for triad budgets.
  - Preferred shape: extract a reusable collector from `meta-loop-efficiency-audit.ts` or formalize the existing workspace implementation into tracked code.
- TASK-02: Add a checked-in triad size-budget manifest with explicit per-skill target/max/waiver fields.
- TASK-03: Add a validator command in `scripts/package.json` and wire it into `scripts/validate-changes.sh` for changed triad skills.
- TASK-04: Add CI-runnable tests covering breach, expired waiver, missing manifest entry, and non-growth pass cases.
- TASK-05: Add a follow-up remediation note or linked plan for bringing the triad back to `<=200` so the waivers are not open-ended.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `meta-loop-efficiency`
- Deliverable acceptance package:
  - tracked size-budget data source for the triad
  - validator command invokable directly from the scripts package
  - `validate-changes.sh` integration
  - failure messages that satisfy the repo failure contract
  - CI-runnable automated coverage for validator behavior
- Post-delivery measurement plan:
  - local validation fails on synthetic growth above allowed max
  - local validation passes when files remain within allowed max
  - weekly audit and validator report the same line counts for the triad

## Evidence Gap Review
### Gaps Addressed
- Confirmed the triad’s current actual line counts rather than relying on the stale March 4 audit numbers.
- Confirmed the normal validation path lacks any triad size-budget enforcement today.
- Confirmed reusable metric logic already exists in the workspace.
- Confirmed the reuse path is complicated by untracked workspace state and captured that as an explicit implementation risk.

### Confidence Adjustments
- Reduced Delivery-Readiness below 80 because the most obvious reuse path depends on untracked workspace files.
- Kept Approach high because the baseline-plus-target model is strongly constrained by current measured reality.

### Remaining Assumptions
- The current workspace audit engine reflects the intended future committed direction rather than abandoned local experimentation.
- The triad budget manifest can live in tracked data/code without conflicting with other in-flight startup-loop refactors.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - Create `docs/plans/core-triad-size-budget-guardrails/plan.md` with an explicit first task to normalize/reuse shared size-metric logic, followed by manifest-backed validator wiring in `scripts/validate-changes.sh`.
