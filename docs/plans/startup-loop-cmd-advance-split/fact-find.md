---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-cmd-advance-split
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-factcheck
Related-Plan: docs/plans/startup-loop-cmd-advance-split/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304122500-0003
Trigger-Why:
Trigger-Intended-Outcome:
---

# Startup-Loop `cmd-advance` Split Fact-Find Brief

## Scope
### Summary
Split the monolithic [`cmd-advance.md`](.claude/skills/startup-loop/modules/cmd-advance.md) into focused submodules while preserving the stable entrypoint path, existing `/startup-loop advance` behavior, and current contract/test expectations. The immediate goal is lower edit risk in the startup-loop command path, not a change in gate semantics or stage routing.

### Goals
- Reduce the entrypoint file size and isolate stage-family instructions into subordinate modules.
- Keep `.claude/skills/startup-loop/modules/cmd-advance.md` as the public/stable command module path.
- Preserve current gate/dispatch semantics and existing uncommitted SELL-01 additions already present in the working tree.
- Keep direct-path readers and contract checks working after the split.

### Non-goals
- Rewrite startup-loop stage semantics or gate behavior.
- Move `/startup-loop advance` to a new top-level module path.
- Resolve all prose-to-code duplication in this pass.
- Change loop-spec, stage IDs, or downstream execution skills.

### Constraints & Assumptions
- Constraints:
  - `startup-loop/SKILL.md` currently routes `/startup-loop advance` directly to `modules/cmd-advance.md`.
  - Current tests and contract guards read `modules/cmd-advance.md` directly.
  - `.claude/skills/startup-loop/modules/cmd-advance.md` already has uncommitted working-tree edits in the SELL-01 dispatch section and those edits must be preserved.
  - Repo policy forbids local Jest execution; validation must rely on non-test checks.
- Assumptions:
  - The startup-loop skill runtime can follow explicit “load submodules” instructions inside `cmd-advance.md`, matching other modularized skills in the repo.
  - A stage-family split is sufficient for this dispatch’s intended outcome even if deterministic extraction remains a later follow-up.

## Access Declarations
- None. This fact-find uses repository files only.

## Outcome Contract
- **Why:** A single 532-line module in the startup-loop command path concentrates complexity and raises edit risk.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Split `cmd-advance.md` into focused modules with unchanged external behavior and clearer maintenance boundaries.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/startup-loop/SKILL.md` - command router for `/startup-loop start|status|submit|advance`.
- `.claude/skills/startup-loop/modules/cmd-advance.md` - current `/startup-loop advance` gate and dispatch surface.

### Key Modules / Files
- `.claude/skills/startup-loop/SKILL.md` - routes `advance` to `modules/cmd-advance.md` and only exposes `assessment-intake-sync.md` as an internal helper today.
- `.claude/skills/startup-loop/modules/cmd-advance.md` - 535-line monolith containing 15 `###` gate/dispatch blocks plus closing contracts.
- `.claude/skills/startup-loop/modules/assessment-intake-sync.md` - precedent for internal helper modules called by `cmd-advance`.
- `.claude/skills/startup-loop/modules/cmd-status.md` - currently points advance-blocking readers back to `cmd-advance.md`.
- `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts` - asserts direct readability and specific SIGNALS strings in `cmd-advance.md`.
- `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts` - asserts WEBSITE->DO handoff strings remain in `cmd-advance.md`.
- `scripts/check-startup-loop-contracts.sh` - includes `cmd-advance.md` in active startup-loop contract checks.
- `scripts/src/startup-loop/s6b-gates.ts` - extracted executable SELL gate logic overlapping with markdown gate descriptions.
- `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md` - source audit identifying `cmd-advance.md` as the only startup-loop module-monolith.

### Patterns & Conventions Observed
- Startup-loop command routing keeps a stable top-level command module per command and may call internal helper modules for scoped work.
  - Evidence: `.claude/skills/startup-loop/SKILL.md`
  - Evidence: `.claude/skills/startup-loop/modules/assessment-intake-sync.md`
- Several skills in the repo already use thin orchestrators plus `modules/*.md` decomposition.
  - Evidence: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`
  - Evidence: `.claude/skills/lp-seo/SKILL.md`
- `cmd-advance.md` already separates naturally by stage family: ASSESSMENT, MARKET/PRODUCT/WEBSITE, SIGNALS, SELL, gap-fill, and closing contracts.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md`

### Data & Contracts
- Types/schemas/events:
  - `cmd-advance.md` is prose contract, not executable code, but its content is treated as active command-path authority by tests and shell checks.
  - `scripts/src/startup-loop/s6b-gates.ts` provides executable SELL gate results with `GateResult { gateId, status, reasons }`.
- Persistence:
  - Advance-time checks are filesystem-first and inspect `docs/business-os/strategy/<BIZ>/...`, `docs/business-os/startup-baselines/<BIZ>/...`, and `docs/plans/<slug>/...`.
- API/contracts:
  - The startup-loop run packet contract is defined in `.claude/skills/startup-loop/SKILL.md`.

### Dependency & Impact Map
- Upstream dependencies:
  - `.claude/skills/startup-loop/SKILL.md` command routing.
  - Existing stage artifact path conventions under `docs/business-os/...`.
- Downstream dependents:
  - `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`
  - `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`
  - `scripts/check-startup-loop-contracts.sh`
  - `.claude/skills/lp-signal-review/modules/audit-phase.md`
  - `.claude/skills/lp-weekly/SKILL.md`
- Likely blast radius:
  - High for path changes to `cmd-advance.md`.
  - Low-to-medium for content relocation if the entrypoint keeps key routing/anchor text and clearly loads submodules.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest tests exist under `scripts/src/startup-loop/__tests__/`.
- Commands:
  - Local Jest execution is repo-blocked by policy; use non-test validation locally.
- CI integration:
  - Startup-loop script tests run in CI.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| SIGNALS routing authority | Jest | `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts` | Reads `cmd-advance.md` directly and checks for `/lp-weekly`, `Phase 0 fallback`, `GATE-BD-08`, `weekly-kpcs`. |
| WEBSITE->DO parity | Jest | `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts` | Reads `cmd-advance.md` directly and checks for `GATE-WEBSITE-DO-01`, `/lp-do-fact-find`, `/lp-do-plan`, plan/fact-find paths. |
| SELL gate semantics | Jest | `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` | Exercises extracted SELL gate logic via `s6b-gates.ts`, not markdown module loading. |

#### Coverage Gaps
- No local non-test validator currently proves a new `cmd-advance/` submodule layout is acceptable to the skill runtime.
- Existing tests protect specific strings and path readability, but not the general “submodule include” pattern.
- No automated parity check links prose SELL gate text to `s6b-gates.ts`.

#### Testability Assessment
- Easy to test:
  - File existence, entrypoint size reduction, submodule presence, anchor-string preservation, shell contract checks.
- Hard to test:
  - Full runtime interpretation of the modularized markdown without running CI.
- Test seams needed:
  - Keep key contract strings in the entrypoint file so current direct readers remain satisfied.

### Recent Git History (Targeted)
- `53ca9b397f` - updated `cmd-advance.md` during path/container migration, which means the file is still part of active startup-loop evolution.
- `c0da5a5fbb` - added S10 weekly orchestration guidance, increasing direct test coupling to the SIGNALS section.
- `716e03df81` - added ongoing gap-fill gates, growing the monolith further.
- `e4bb2e3c64` / `8e4ce0f3d2` / `b45a14d046` - recent startup-loop script/test updates show the surrounding checks are still moving.

## Questions
### Resolved
- Q: Is the P1 concern only line-count theater?
  - A: No. The file is 535 lines and the only startup-loop module above the audit threshold, but the real issue is concentrated edit surface plus direct test/contract coupling.
  - Evidence: `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md`
  - Evidence: `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`
- Q: Can the file be safely renamed or relocated?
  - A: No. The stable path must remain `.claude/skills/startup-loop/modules/cmd-advance.md` unless all direct readers are updated together.
  - Evidence: `.claude/skills/startup-loop/SKILL.md`
  - Evidence: `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`
  - Evidence: `scripts/check-startup-loop-contracts.sh`
- Q: Is there already a natural decomposition seam?
  - A: Yes. The file already clusters into stage-family sections with bounded line ranges and only one shared closing contract area.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md`
- Q: Is any of the current complexity already extracted into code?
  - A: Yes. SELL gates are already implemented in `scripts/src/startup-loop/s6b-gates.ts`, so a markdown split should be treated as structural containment, not a full complexity removal.
  - Evidence: `scripts/src/startup-loop/s6b-gates.ts`
- Q: Is the current working tree safe to edit in place?
  - A: Yes, but only if the existing SELL-01 dispatch additions in `cmd-advance.md` are preserved during the split.
  - Evidence: `git diff -- .claude/skills/startup-loop/modules/cmd-advance.md`

### Open (Operator Input Required)
- None. The intended outcome and acceptable scope are already clear from the queued dispatch and your request to move it through `lp-do-fact-find -> lp-do-build`.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Command routing entrypoint (`startup-loop/SKILL.md` -> `cmd-advance.md`) | Yes | None | No |
| Direct readers/tests of `cmd-advance.md` | Yes | [Major] Existing readers assert strings in the entrypoint file, so a pure move would fail without summary anchors or test updates. | Yes |
| Internal module loading precedent | Yes | None | No |
| SELL executable/prose split | Partial | [Moderate] Markdown split alone does not remove duplicated SELL logic already extracted to `s6b-gates.ts`. | No |
| Uncommitted target-file changes | Yes | None - diff inspected; current SELL-01 additions are isolated and can be preserved. | No |

## Scope Signal
- Signal: right-sized
- Rationale: The change is bounded to startup-loop markdown orchestration surfaces plus lightweight contract references. The stable entrypoint requirement narrows the solution enough to make a single implementation task credible without widening into stage-semantics or script rewrites.

## Confidence Inputs
- Implementation: 88%
  - Evidence basis: natural module seams are already present in `cmd-advance.md`; the repo has established thin-orchestrator patterns; target files are markdown only.
  - What raises this to >=80: already met.
  - What raises this to >=90: one successful shell contract check after the split plus confirmation that key anchor strings remain in the entrypoint.
- Approach: 86%
  - Evidence basis: preserving the stable `cmd-advance.md` path avoids the largest breakage risk and matches the command-router contract in `startup-loop/SKILL.md`.
  - What raises this to >=80: already met.
  - What raises this to >=90: add explicit internal-module discoverability text in `startup-loop/SKILL.md` and keep `cmd-status.md` references coherent.
- Impact: 78%
  - Evidence basis: edit-risk reduction is clear, but real complexity remains partly duplicated in `s6b-gates.ts`.
  - What raises this to >=80: complete the split while preserving current readers and document deterministic-extraction follow-up as a non-goal/backlog.
  - What raises this to >=90: additional extraction of duplicated SELL logic or parity checks between prose and TS.
- Delivery-Readiness: 90%
  - Evidence basis: no external dependencies, no operator input needed, clear file set.
  - What raises this to >=80: already met.
  - What raises this to >=90: already met.
- Testability: 80%
  - Evidence basis: non-test validation and shell contract checks are available; CI will still be the final source of truth.
  - What raises this to >=80: already met.
  - What raises this to >=90: a dedicated local contract checker for modular markdown loading, which does not exist yet.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Moving or renaming `cmd-advance.md` breaks direct readers | Medium | High | Keep the current entrypoint path and load submodules from it. |
| Entry-point thinning removes strings current tests expect | Medium | Medium | Preserve key gate/dispatch anchors in the entrypoint summary or update readers in the same change. |
| Existing uncommitted SELL-01 additions get overwritten | Low | High | Build on top of current working tree content, not `HEAD`. |
| Split becomes cosmetic only | Medium | Medium | Call out deterministic SELL extraction as explicit non-goal/follow-up instead of pretending it was solved here. |

## Planning Constraints & Notes
- Must-follow patterns:
  - command path remains `.claude/skills/startup-loop/modules/cmd-advance.md`
  - stage-family modules live under a subordinate `cmd-advance/` folder
  - preserve current gate and dispatch wording unless relocation requires a thin summary in the entrypoint
- Rollout/rollback expectations:
  - Rollout is immediate on next startup-loop usage.
  - Rollback is a standard revert of markdown file moves/edits.
- Observability expectations:
  - Use shell contract checks and path/string assertions locally; rely on CI for test execution.

## Suggested Task Seeds (Non-binding)
- Implement stable-entrypoint split of `cmd-advance.md` into stage-family submodules.
- Add internal-module discoverability notes to `startup-loop/SKILL.md`.
- Keep `cmd-status.md` pointer language accurate if gate definitions move out of the entrypoint body.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `startup-loop`, `lp-do-factcheck`
- Deliverable acceptance package:
  - modularized `cmd-advance` entrypoint and submodules
  - updated startup-loop module discoverability text
  - targeted non-test validation evidence
- Post-delivery measurement plan:
  - verify entrypoint file size reduction
  - verify submodule files exist
  - verify shell contract checker remains green

## Evidence Gap Review
### Gaps Addressed
- Verified current working-tree diff on `cmd-advance.md` before planning edits.
- Verified direct reader/test coupling instead of inferring from routing alone.
- Verified executable SELL-gate overlap in `s6b-gates.ts`.

### Confidence Adjustments
- Reduced Impact below 80 because the split does not remove prose/code duplication.
- Kept Delivery-Readiness high because no missing information or external access is required.

### Remaining Assumptions
- The startup-loop skill runtime will honor explicit submodule-loading instructions embedded in the stable entrypoint.
- Preserving critical anchor strings in the entrypoint is sufficient to keep current readers coherent until CI confirms full parity.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan` with one bounded IMPLEMENT task followed by immediate `/lp-do-build`
