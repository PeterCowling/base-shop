---
Type: Plan
Status: Active
Domain: DevEx/Tooling
Last-reviewed: 2026-02-15
Relates-to charter: none
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: agent-setup-improvement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-sequence
Overall-confidence: 76%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: (pending — BOS_AGENT_API_BASE_URL not set in fact-find)
---

# Agent Setup Improvement Plan

## Summary
Unify and harden agent setup across Claude Code, Codex, and future agents by (1) eliminating safety-policy drift via a machine-readable kernel plus generators, (2) making skill discovery agent-agnostic via a generated registry + `scripts/agents/list-skills`, and (3) replacing the CI stub validator so drift is caught before merge. Reduce CODEX.md bloat without removing the safety muscle-memory overlay.

## Goals
- Single source of truth for git safety policy with generated enforcement artifacts and CI drift checks.
- Agent-agnostic skill discovery: any agent can list supported skills without memorizing paths.
- Replace the CI “PASS (stub)” validator with real checks.
- Reduce policy/config sprawl (fewer hand-edited copies of the same rules).

## Non-goals
- New orchestration infrastructure or multi-agent controller systems.
- Moving skills out of `.claude/skills/` (Claude auto-discovery depends on it).
- Achieving parity for platform features (MCP, hooks, subagents).

## Active tasks
- **TASK-01:** Generate agent-agnostic skill registry + `scripts/agents/list-skills` (Complete 2026-02-15)
- **TASK-02:** Implement real agent-config validator (replace stub) (Complete 2026-02-15)
- **TASK-03:** Safety kernel format + schema + generation boundaries (Complete 2026-02-15)
- **TASK-04:** Add safety policy kernel + generators for enforcement layers (Pending)
- **TASK-05:** Update safety tests to consume the kernel-generated policy (Pending)
- **TASK-06:** Replace stale `.claude/SKILLS_INDEX.md` usage with registry pointers (Pending)
- **TASK-07:** Horizon checkpoint: reassess before CODEX.md + policy rollout (Pending)
- **TASK-08:** Reduce CODEX.md bloat while keeping safety TL;DR (Pending)


## Constraints & Assumptions
- Constraints:
  - Hard safety enforcement is non-negotiable.
  - Claude Code uses hooks + `.claude/settings.json`; other agents rely on repo scripts (`scripts/agents/integrator-shell.sh`, `scripts/agent-bin/git`).
  - CI runs `node scripts/validate-agent-manifest.js` (currently a stub) and must remain green.
- Assumptions:
  - `.agents/` is readable by all agents and is suitable for agent-agnostic registries.

## Fact-Find Reference
- Related brief: `docs/plans/agent-setup-improvement-fact-find.md`
- Prior related work (historical):
  - `docs/plans/archive/agent-context-optimization-plan.md` (token measurement methodology; context trimming)
  - `docs/plans/archive/agent-enhancement-plan-archived-2026-02-14.md` (superseded)

## Existing System Notes (Evidence Anchors)
- Safety enforcement layers:
  - `scripts/agent-bin/git`
  - `.claude/hooks/pre-tool-use-git-safety.sh`
  - `.claude/settings.json` (`permissions.deny/ask/allow`)
  - `docs/git-safety.md`
  - Regression tests exist but do not eliminate duplication:
    - `scripts/__tests__/git-safety-policy.test.ts`
    - `scripts/__tests__/pre-tool-use-git-safety.test.ts`
- Skill inventory:
  - 49 skills at `.claude/skills/*/SKILL.md` (excluding `_shared`).
  - `.claude/SKILLS_INDEX.md` is referenced by docs but appears stale.
- CI drift gap:
  - `.github/workflows/ci.yml` runs `node scripts/validate-agent-manifest.js`.
  - `scripts/validate-agent-manifest.js` is a stub that always passes.

## Proposed Approach

### A) Safety: kernel + generators + validator (no manual sync)
- Embed a fenced YAML kernel in `docs/git-safety.md` (still the canonical doc) to hold the machine-readable policy.
- Implement a small generator that extracts the kernel and updates only clearly-delimited “generated” sections in:
  - `.claude/settings.json`
  - `.claude/hooks/pre-tool-use-git-safety.sh`
  - `scripts/agent-bin/git` (policy data only; keep UX + complex parsing logic hand-maintained)
- Update tests to consume the same kernel (or a compiled artifact from it) so policy drift is caught via Jest.

### B) Skills: generated registry + one command
- Generate `.agents/registry/skills.json` by scanning `.claude/skills/**/SKILL.md` frontmatter (`name`, `description`, optional fields).
- Add `scripts/agents/list-skills` to print the registry in a stable, greppable format.
- Update CODEX.md and docs that reference `.claude/SKILLS_INDEX.md` to point to the registry/command.

### C) Reliability: CI fails when drift exists
- Replace `scripts/validate-agent-manifest.js` with real validation that fails CI when:
  - safety kernel cannot be parsed
  - generated artifacts differ from committed outputs
  - skill registry differs from committed registry
  - critical cross-refs are broken

## Acceptance Criteria (Overall)
- [ ] A machine-readable safety policy kernel exists and is treated as canonical.
- [ ] Safety enforcement artifacts are generated from the kernel (no hand-edited duplication).
- [ ] CI fails when regenerated outputs differ from committed outputs.
- [ ] A generated skill registry enumerates 100% of supported skills (49 currently) with path + description.
- [ ] A single documented command lists skills for any agent (`scripts/agents/list-skills`).
- [ ] CODEX.md no longer contains duplicated long-form safety matrices, but retains a safety TL;DR + integrator-shell requirement.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Generate agent-agnostic skill registry + `scripts/agents/list-skills` | 88% | M | Pending | - | TASK-02, TASK-06 |
| TASK-02 | IMPLEMENT | Implement real agent-config validator (replace stub) | 82% | M | Pending | TASK-01 | TASK-05 |
| TASK-03 | DECISION | Safety kernel format + schema + generation boundaries | 70% ⚠️ | S | Needs-Input | - | TASK-04 |
| TASK-04 | IMPLEMENT | Add safety policy kernel + generators for enforcement layers | 75% ⚠️ | L | Pending | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Update safety tests to consume the kernel-generated policy | 78% ⚠️ | M | Pending | TASK-02, TASK-04 | TASK-07 |
| TASK-06 | IMPLEMENT | Replace stale `.claude/SKILLS_INDEX.md` usage with registry pointers | 80% | S | Pending | TASK-01 | TASK-07 |
| TASK-07 | CHECKPOINT | Horizon checkpoint: reassess before CODEX.md + policy rollout | 95% | S | Pending | TASK-05, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Reduce CODEX.md bloat while keeping safety TL;DR | 80% | M | Pending | TASK-07 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Initial sequencing (pre-`/lp-sequence`):

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-03 | - | Skill registry can proceed; safety kernel decision gates generator work |
| 2 | TASK-02, TASK-06 | TASK-01 | Validator depends on registry; SKILLS_INDEX cleanup depends on registry |
| 3 | TASK-04 | TASK-03 | Kernel + generators are gated on schema decision |
| 4 | TASK-05 | TASK-02, TASK-04 | Tests updated once generator outputs exist |
| 5 | TASK-07 | TASK-05, TASK-06 | Checkpoint before CODEX.md and any wide enforcement rollout |
| 6 | TASK-08 | TASK-07 | CODEX.md reduction is last to avoid reliability regressions |

**Max parallelism:** 2 (Wave 1) | **Critical path:** TASK-03 -> TASK-04 -> TASK-05 -> TASK-07 -> TASK-08 | **Total tasks:** 8

## Tasks

### TASK-01: Generate agent-agnostic skill registry + `scripts/agents/list-skills`
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Generated registry + listing command
  - `.agents/registry/skills.json`
  - `scripts/agents/list-skills` (or `.ts` + small shell wrapper)
  - (Optional) `scripts/agents/generate-skill-registry` for `--check` mode
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - Primary: `.agents/registry/skills.json`, `scripts/agents/list-skills`, `scripts/agents/generate-skill-registry*`
  - Secondary: `[readonly] .claude/skills/**/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-06
- **Confidence:** 88%
  - Implementation: 90% — existing skill frontmatter (`name`, `description`) is present on core skills (sample: `.claude/skills/lp-plan/SKILL.md`).
  - Approach: 88% — generated registry eliminates drift and works for all agents.
  - Impact: 85% — low blast radius; docs/overlays can adopt incrementally.
- **Acceptance:**
  - Registry includes all supported skills (exclude `.claude/skills/_shared/**`).
  - Each entry includes `name`, `path`, `description`.
  - `scripts/agents/list-skills` prints a stable table or JSON lines suitable for grep.
- **Validation contract:**
  - TC-01: scanning `.claude/skills/*/SKILL.md` yields registry length == skill count → pass.
  - TC-02: registry generation is deterministic (rerun produces identical output) → pass.
  - TC-03: list command runs without node dependencies beyond the repo toolchain → pass.
  - Run/verify: `node scripts/agents/generate-skill-registry --check` (or equivalent) and `scripts/agents/list-skills`.
- **Evidence:**
  - Generated registry: `.agents/registry/skills.json` (49 skills)
  - Commands: `scripts/agents/generate-skill-registry --check` and `scripts/agents/list-skills`

- **Rollout / rollback:**
  - Rollout: add registry + command; no behavior change until docs adopt it.
  - Rollback: delete registry + command.
- **Documentation impact:**
  - Update `.agents/README.md` to reference `scripts/agents/list-skills` (minimal).

### TASK-02: Implement real agent-config validator (replace stub)
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** CI-enforced validator
  - Replace `scripts/validate-agent-manifest.js` with real checks (or rename to `scripts/validate-agent-config.js` and update call sites).
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - Primary: `scripts/validate-agent-manifest.js` (and possibly `package.json`, `.github/workflows/ci.yml`)
  - Secondary: `[readonly] .agents/registry/skills.json`, `[readonly] docs/git-safety.md`, `[readonly] .claude/settings.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 85% — CI already calls the script; we can harden incrementally.
  - Approach: 82% — validator is the cheapest drift-prevention layer.
  - Impact: 80% — risk is CI churn if checks are flaky; mitigated by `--check` deterministic generators.
- **Acceptance:**
  - Script exits non-zero when skill registry is out of date.
  - Script exits non-zero when safety kernel cannot be parsed (once added).
  - Script exits non-zero on broken critical cross-refs (at minimum: referenced files exist).
- **Validation contract:**
  - TC-01: temporarily modify `.agents/registry/skills.json` and ensure validator fails → pass.
  - TC-02: validator passes on clean tree → pass.
  - Run/verify: `node scripts/validate-agent-manifest.js` (locally) and in CI.
- **Evidence:**
  - `node scripts/validate-agent-manifest.js` (passes locally)
  - Enforces skill registry drift check via `scripts/agents/generate-skill-registry --check`

- **Rollout / rollback:**
  - Rollout: land validator; keep checks minimal then expand after TASK-04.
  - Rollback: revert to stub (discouraged; only if CI is blocked).
- **Documentation impact:** None.

### TASK-03: Safety kernel format + schema + generation boundaries
- **Type:** DECISION
- **Status:** Complete (2026-02-15)
- **Deliverable:** Recorded decision in plan + implemented schema choice in `docs/git-safety.md`.
- **Execution-Skill:** lp-build
- **Affects:** `docs/git-safety.md`, `.claude/settings.json`, `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/agent-bin/git`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 70% ⚠️
  - Implementation: 80% — YAML parsing + generators are feasible.
  - Approach: 70% — must avoid a brittle generator that rewrites complex bash logic.
  - Impact: 70% — incorrect generation could weaken safety; must be fail-closed.
- **Options:**
  - Option A (recommended): YAML kernel in `docs/git-safety.md` + TS generator updates delimited blocks in enforcement layers.
  - Option B: TS module is the kernel; docs include a rendered copy (docs no longer primary SoT).
- **Recommendation:** Option A.
- **Decision:** Confirmed Option A (YAML kernel in `docs/git-safety.md` with generators updating delimited blocks only).

- **Acceptance:**
  - Decision recorded in Decision Log.
  - Schema includes explicit `deny`, `ask`, `allow` sets sufficient to generate `.claude/settings.json` and to drive tests.

### TASK-04: Add safety policy kernel + generators for enforcement layers
- **Type:** IMPLEMENT
- **Deliverable:** Kernel + deterministic generation
  - `docs/git-safety.md` contains fenced YAML kernel
  - generator script(s) that produce exact outputs for:
    - `.claude/settings.json` permissions patterns (deny/ask/allow) within a delimited block
    - `.claude/hooks/pre-tool-use-git-safety.sh` deny section within a delimited block
    - `scripts/agent-bin/git` policy tables within a delimited block (retain complex parsing + UX outside generated block)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - Primary: `docs/git-safety.md`, `.claude/settings.json`, `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/agent-bin/git`, generator script(s)
  - Secondary: `[readonly] scripts/__tests__/pre-tool-use-git-safety.test.ts`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 75% ⚠️
  - Implementation: 75% — generation must preserve hand-written bash logic; needs careful delimiting and escaping.
  - Approach: 80% — kernel+generator is the only durable anti-drift solution.
  - Impact: 75% — high blast radius if wrong; mitigated by tests + validator.
- **Acceptance:**
  - Kernel parses and is used as the only edited policy input.
  - Regeneration is deterministic and idempotent.
  - Enforcement behavior is unchanged (verified by existing tests).
- **Validation contract:**
  - TC-01: `scripts/__tests__/pre-tool-use-git-safety.test.ts` passes → hook behavior preserved.
  - TC-02: `scripts/__tests__/git-safety-policy.test.ts` passes → guard + hook agree.
  - TC-03: generator `--check` passes on clean tree and fails with diffs when outputs are modified → drift detection works.
  - Run/verify: targeted Jest run with `--maxWorkers=2` for the two suites above.
- **Rollout / rollback:**
  - Rollout: land kernel + generator behind “generated blocks”; keep validator enforcing.
  - Rollback: revert kernel + generator + generated block markers (single commit revert).
- **Documentation impact:**
  - Update `docs/git-safety.md` to explicitly state the fenced kernel is canonical.

### TASK-05: Update safety tests to consume the kernel-generated policy
- **Type:** IMPLEMENT
- **Deliverable:** Tests reference generated policy artifacts rather than duplicating the matrix in test code.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - Primary: `scripts/__tests__/git-safety-policy.test.ts`
  - Secondary: `[readonly] docs/git-safety.md`, `[readonly] generator outputs`
- **Depends on:** TASK-02, TASK-04
- **Blocks:** TASK-07
- **Confidence:** 78% ⚠️
  - Implementation: 80% — refactor is straightforward but needs care to keep coverage.
  - Approach: 78% — tests should fail when kernel drifts from enforcement.
  - Impact: 78% — risk of reducing coverage if not done carefully.
- **Acceptance:**
  - Test table is derived from kernel outputs (or a compiled artifact) rather than maintained by hand.
  - Coverage remains at least equivalent (deny + allow cases).
- **Validation contract:**
  - TC-01: tests fail if kernel adds a deny rule but enforcement scripts are not regenerated → pass.
  - TC-02: tests pass on clean tree → pass.
  - Run/verify: `pnpm test -- scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` (or repo standard test runner).
- **Rollout / rollback:** revert test refactor.
- **Documentation impact:** None.

### TASK-06: Replace stale `.claude/SKILLS_INDEX.md` usage with registry pointers
- **Type:** IMPLEMENT
- **Deliverable:** Docs no longer point at stale SKILLS_INDEX; the index is updated or replaced with generated output.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - Primary: `.claude/SKILLS_INDEX.md`, `docs/github-setup.md`
  - Secondary: `[readonly] .agents/registry/skills.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 85% — small doc edits.
  - Approach: 80% — prefer generated registry as canonical; SKILLS_INDEX becomes a thin pointer or a generated list.
  - Impact: 80% — low risk; mainly improves correctness.
- **Acceptance:**
  - `.claude/SKILLS_INDEX.md` no longer references non-existent skills.
  - `docs/github-setup.md` references the registry/command instead of a stale index.
- **Validation contract:**
  - TC-01: `rg -n "skills/fact-find" .claude/SKILLS_INDEX.md` returns no matches → pass.
  - TC-02: `pnpm run docs:lint` passes → pass.
- **Rollout / rollback:** revert doc changes.

### TASK-07: Horizon checkpoint: reassess before CODEX.md + policy rollout
- **Type:** CHECKPOINT
- **Depends on:** TASK-05, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
- **Acceptance:**
  - Re-run validator + safety tests and confirm drift prevention works.
  - Reassess TASK-08 confidence based on evidence from generated safety + registry adoption.
  - Update plan if any enforcement-layer edge cases were discovered.
- **Horizon assumptions to validate:**
  - Kernel+generator approach is stable and does not require rewriting complex bash logic.
  - Registry output is sufficient for Codex usability (no missing metadata).

### TASK-08: Reduce CODEX.md bloat while keeping safety TL;DR
- **Type:** IMPLEMENT
- **Deliverable:** Updated `CODEX.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `CODEX.md`, (optional) `AGENTS.md`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — doc edits plus a few link updates.
  - Approach: 80% — keeps reliability while removing duplication.
  - Impact: 75% — risk is Codex regressions if the overlay loses critical reminders.
- **Acceptance:**
  - CODEX.md retains:
    - explicit integrator-shell requirement
    - safety TL;DR (non-negotiables)
    - links to `AGENTS.md` and `docs/git-safety.md`
    - skill discovery: points to `scripts/agents/list-skills`
  - CODEX.md removes duplicated long-form safety matrices already covered elsewhere.
- **Validation contract:**
  - TC-01: `rg -n "integrator-shell" CODEX.md` shows the requirement is still prominent → pass.
  - TC-02: docs lint passes → pass.

## Risks & Mitigations
- Risk: generator corrupts enforcement scripts or weakens safety.
  - Mitigation: generated-block boundaries only; fail-closed validator + existing Jest suites.
- Risk: adding YAML kernel makes `docs/git-safety.md` harder to edit.
  - Mitigation: keep kernel small; prose remains free-form; document editing rules.
- Risk: registry misses skills due to missing frontmatter.
  - Mitigation: validator enforces required frontmatter keys and reports exact files.

## Decision Log
- 2026-02-15: Planning created from `docs/plans/agent-setup-improvement-fact-find.md` and superseding prior archived plans.
