---
Type: Plan
Status: Complete
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
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence
Overall-confidence: 100%
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
- **TASK-04:** Add safety policy kernel + generators for enforcement layers (Complete 2026-02-15)
- **TASK-05:** Update safety tests to consume the kernel-generated policy (Complete 2026-02-15)
- **TASK-06:** Replace stale `.claude/SKILLS_INDEX.md` usage with registry pointers (Complete 2026-02-15)
- **TASK-10:** Decide hook/guard policy generation format (Complete 2026-02-15)
- **TASK-12:** Add semantic safety rules to the kernel + compiled policy artifact (Complete 2026-02-15)
- **TASK-11:** Prototype policy-driven evaluation for one enforcement layer (Complete 2026-02-15)
- **TASK-13:** Hook integration decision + evaluator CLI contract (Complete 2026-02-15)
- **TASK-14:** Raw-command parsing + hook-mode evaluation in evaluator (Complete 2026-02-15)
- **TASK-09:** Wire enforcement layers to generated policy evaluation/data (Complete 2026-02-15)
- **TASK-07:** Horizon checkpoint: reassess before CODEX.md + policy rollout (Complete 2026-02-15)
- **TASK-08:** Reduce CODEX.md bloat while keeping safety TL;DR (Complete 2026-02-15)


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
  - 50 skills at `.claude/skills/*/SKILL.md` (excluding `_shared`).
  - `.claude/SKILLS_INDEX.md` is now a pointer to the generated registry (`.agents/registry/skills.json`) and `scripts/agents/list-skills` (no longer a hand-maintained catalog).
- CI drift gap:
  - `.github/workflows/ci.yml` runs `node scripts/validate-agent-manifest.js`.
  - `scripts/validate-agent-manifest.js` now enforces drift checks (skill registry + git safety policy generation); CI fails on drift.

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
- [ ] A generated skill registry enumerates 100% of supported skills (50 currently) with path + description.
- [ ] A single documented command lists skills for any agent (`scripts/agents/list-skills`).
- [ ] CODEX.md no longer contains duplicated long-form safety matrices, but retains a safety TL;DR + integrator-shell requirement.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Generate agent-agnostic skill registry + `scripts/agents/list-skills` | 88% | M | Complete (2026-02-15) | - | TASK-06 |
| TASK-02 | IMPLEMENT | Implement real agent-config validator (replace stub) | 82% | M | Complete (2026-02-15) | TASK-01 | TASK-05 |
| TASK-03 | DECISION | Safety kernel format + schema + generation boundaries | 70% | S | Complete (2026-02-15) | - | TASK-04 |
| TASK-04 | SPIKE | Safety kernel + generator for `.claude/settings.json` + canonical policy artifacts | 82% | M | Complete (2026-02-15) | TASK-03 | TASK-05, TASK-09 |
| TASK-05 | IMPLEMENT | Update safety tests to consume generated policy artifacts | 82% | M | Complete (2026-02-15) | TASK-04 | TASK-07 |
| TASK-06 | IMPLEMENT | Replace stale `.claude/SKILLS_INDEX.md` usage with registry pointers | 82% | S | Complete (2026-02-15) | TASK-01 | TASK-07 |
| TASK-10 | INVESTIGATE | Decide hook/guard policy generation format | 85% | S | Complete (2026-02-15) | TASK-04, TASK-05 | TASK-11 |
| TASK-12 | SPIKE | Add semantic safety rules to the kernel + compiled policy artifact | 82% | M | Complete (2026-02-15) | TASK-10 | TASK-11 |
| TASK-11 | SPIKE | Prototype policy-driven evaluation for one enforcement layer | 82% | M | Complete (2026-02-15) | TASK-12 | TASK-13, TASK-14, TASK-09 |
| TASK-13 | INVESTIGATE | Hook integration decision + evaluator CLI contract | 86% | S | Complete (2026-02-15) | TASK-11 | TASK-14, TASK-09 |
| TASK-14 | SPIKE | Raw-command parsing + hook-mode evaluation in evaluator | 82% | M | Complete (2026-02-15) | TASK-13 | TASK-09 |
| TASK-09 | IMPLEMENT | Wire hook + git guard to generated policy evaluation/data | 84% | M | Complete (2026-02-15) | TASK-14 | TASK-07 |
| TASK-07 | CHECKPOINT | Horizon checkpoint: reassess before CODEX.md + policy rollout | 95% | S | Complete (2026-02-15) | TASK-05, TASK-06, TASK-09 | TASK-08 |
| TASK-08 | IMPLEMENT | Reduce CODEX.md bloat while keeping safety TL;DR | 85% | M | Complete (2026-02-15) | TASK-07 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Sequenced after lp-do-replan (dependencies updated; no renumbering).

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-06 | - | Doc pointer fix (uses generated registry) |
| 2 | TASK-12 | TASK-10 | Introduce semantic rules in the kernel + compiled artifact |
| 3 | TASK-11 | TASK-12 | Prototype the policy-driven wiring approach (one path) |
| 4 | TASK-13 | TASK-11 | Decide hook adapter contract (raw command parsing scope + ask semantics) |
| 5 | TASK-14 | TASK-13 | Prove raw-command parsing + hook mode in evaluator (spike) |
| 6 | TASK-09 | TASK-14 | Switch hook to evaluator + remove duplicated policy logic |
| 7 | TASK-07 | TASK-05, TASK-06, TASK-09 | Checkpoint gate before CODEX.md reduction |
| 8 | TASK-08 | TASK-07 | CODEX.md reduction last to avoid reliability regressions |

**Max parallelism:** 2 (Wave 3/6) | **Critical path:** TASK-12 -> TASK-11 -> TASK-13 -> TASK-14 -> TASK-09 -> TASK-07 -> TASK-08 | **Total tasks:** 14


## Tasks

### TASK-01: Generate agent-agnostic skill registry + `scripts/agents/list-skills`
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Generated registry + listing command
  - `.agents/registry/skills.json`
  - `scripts/agents/list-skills` (or `.ts` + small shell wrapper)
  - (Optional) `scripts/agents/generate-skill-registry` for `--check` mode
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `.agents/registry/skills.json`, `scripts/agents/list-skills`, `scripts/agents/generate-skill-registry*`
  - Secondary: `[readonly] .claude/skills/**/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-06
- **Confidence:** 88%
  - Implementation: 90% — existing skill frontmatter (`name`, `description`) is present on core skills (sample: `.claude/skills/lp-do-plan/SKILL.md`).
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
- **Execution-Skill:** lp-do-build
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
- **Execution-Skill:** lp-do-build
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
- **Type:** SPIKE
- **Status:** Complete (2026-02-15)
- **Deliverable:**
  - `docs/git-safety.md` gains a fenced YAML kernel (canonical policy input).
  - New generator: `scripts/agents/generate-git-safety-policy` (+ `--check`).
  - Generated artifacts committed under `.agents/safety/generated/` (JSON + shell include).
  - `.claude/settings.json` `permissions.{deny,ask,allow}` regenerated from the kernel (JSON-level replacement; no in-file markers).
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `docs/git-safety.md`, `.claude/settings.json`, `.agents/safety/generated/git-safety-policy.json`, `.agents/safety/generated/git-safety-policy.sh`, generator script(s)
  - Secondary: `[readonly] .claude/hooks/pre-tool-use-git-safety.sh`, `[readonly] scripts/agent-bin/git`, `[readonly] scripts/__tests__/pre-tool-use-git-safety.test.ts`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-05, TASK-09
- **Confidence:** 82%
  - Implementation: 82% — scope reduced to kernel + deterministic generation + `.claude/settings.json` regeneration; no script rewiring yet.
  - Approach: 85% — kernel drives generated artifacts; `.claude/settings.json` updated at JSON property level avoids brittle in-file markers.
  - Impact: 82% — enforcement scripts unchanged in this spike; drift prevention validated via generator `--check` + existing Jest suites.

#### Re-plan Update (2026-02-15)
- **Previous confidence:** 75% (L-effort, multi-layer generation)
- **Updated confidence:** 82% (M-effort, settings.json + canonical artifacts only)
  - **Evidence class:** E1 (static audit)
  - Repo evidence: `.claude/settings.json` is strict JSON (no comments), so generation boundary must be at JSON property level rather than delimited text blocks.
  - Work preserved: hook/git-guard rewiring moved to TASK-09.

- **Acceptance:**
  - Kernel is present in `docs/git-safety.md` and is treated as canonical input.
  - Generator writes deterministic `.agents/safety/generated/*` artifacts and regenerates `.claude/settings.json` permissions arrays from the kernel.
  - `--check` mode fails when any generated output drifts.
- **Validation contract:**
  - TC-01: `scripts/agents/generate-git-safety-policy --check` passes on clean tree → pass.
  - TC-02: modify `.agents/safety/generated/git-safety-policy.json` and confirm `--check` fails → pass.
  - TC-03: `.claude/settings.json` remains valid JSON and contains regenerated `permissions.*` arrays → pass.
  - Run/verify: `scripts/agents/generate-git-safety-policy --write && scripts/agents/generate-git-safety-policy --check`.
- **Rollout / rollback:**
  - Rollout: land kernel + generator behind “generated blocks”; keep validator enforcing.
  - Rollback: revert kernel + generator + generated block markers (single commit revert).
- **Documentation impact:**
  - Update `docs/git-safety.md` to explicitly state the fenced kernel is canonical.
- **Evidence:**
  - Kernel + generator landed: `6e9fcb3fef`
  - Run/verify: `scripts/agents/generate-git-safety-policy --check`

### TASK-05: Update safety tests to consume the kernel-generated policy
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Tests reference generated policy artifacts rather than duplicating the matrix in test code.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `scripts/__tests__/git-safety-policy.test.ts`
  - Secondary: `[readonly] docs/git-safety.md`, `[readonly] generator outputs`
- **Depends on:** TASK-04
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 82% — test refactor is straightforward once a single generated policy artifact exists.
  - Approach: 82% — tests become a drift gate by consuming the same generated policy as enforcement layers.
  - Impact: 82% — existing suites already cover both enforcement entry points; refactor should preserve coverage.

#### Re-plan Update (2026-02-15)
- **Previous confidence:** 78%
- **Updated confidence:** 82%
  - **Evidence class:** E1 (static audit)
  - Change driver: TASK-04 now produces a single canonical policy artifact, reducing test refactor ambiguity.

  - Implementation: 80% — refactor is straightforward but needs care to keep coverage.
  - Approach: 78% — tests should fail when kernel drifts from enforcement.
  - Impact: 78% — risk of reducing coverage if not done carefully.
- **Acceptance:**
  - Test table is derived from generated policy artifacts (produced from the kernel) rather than maintained by hand.
  - Coverage remains at least equivalent (deny + allow cases).
- **Validation contract:**
  - TC-01: tests fail if kernel adds a deny rule but enforcement scripts are not regenerated → pass.
  - TC-02: tests pass on clean tree → pass.
  - Run/verify: `pnpm run test:governed -- jest -- scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2`.
- **Rollout / rollback:** revert test refactor.
- **Documentation impact:** None.
- **Evidence:**
  - Tests now derive table from the kernel + assert generated artifact parity: `scripts/__tests__/git-safety-policy.test.ts`
  - Commit: `0b65609ca6`


### TASK-09: Wire hook + git guard to generated policy evaluation/data
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Enforcement layers consume generated policy evaluation/data
  - `.claude/hooks/pre-tool-use-git-safety.sh` consumes the shared evaluator (generated policy), rather than duplicating deny/allow logic in bash regex.
  - `scripts/agent-bin/git` consumes the same evaluator (already done in TASK-11).
  - Kernel + generator remain the only place the policy is edited; enforcement scripts become thin evaluators.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/agent-bin/git`
  - Secondary: `[readonly] .agents/safety/generated/git-safety-policy.*`, `[readonly] scripts/__tests__/pre-tool-use-git-safety.test.ts`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-14
- **Blocks:** TASK-07
- **Confidence:** 84%
  - Implementation: 84% — guard is already wired via the evaluator (TASK-11), and TASK-14 has proven the tokenizer + hook-mode behavior works correctly with comprehensive test coverage.
    - Evidence: `.claude/hooks/pre-tool-use-git-safety.sh` (current bash implementation)
    - Evidence: `scripts/agents/evaluate-git-safety.mjs` (evaluator with hook mode ready)
    - Evidence: `scripts/__tests__/evaluate-git-safety-command.test.ts` (11 tests covering tokenization, modes, edge cases)
  - Approach: 84% — single semantics in evaluator proven via TASK-11 + TASK-14; hook adapter contract defined and validated.
  - Impact: 84% — hook regressions mitigated by 71 tests across two suites (evaluate-git-safety-command + pre-tool-use-git-safety).
    - Evidence: `scripts/__tests__/pre-tool-use-git-safety.test.ts` (60 tests)
    - Evidence: `scripts/__tests__/git-safety-policy.test.ts`
#### Re-plan Update (2026-02-15)
- **Previous confidence:** 72% (→ 84% conditional on TASK-14)
- **Updated confidence:** 84% (TASK-14 complete; precondition met)
  - **Evidence class:** E1 + E2 + E3
  - TASK-14 completion provides:
    - E3: Tokenizer proven safe with quote handling, env var prefixes, compound commands, absolute paths
    - E3: Hook mode proven correct (ask → allow, deny/allow preserved)
    - E2: 11 new tests covering all edge cases pass under governed runner
  - Scope update: guard wiring is complete (single semantics via evaluator), so remaining work is hook-only: replace bash regex with evaluator CLI call.
    - Evidence (E2): `pnpm test:governed -- jest scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` (green after guard migration)
    - Evidence (E2): `scripts/agents/generate-git-safety-policy --check` and `node scripts/validate-agent-manifest.js` pass
  - Hook reality: tests require blocking when git is embedded in compound commands (example: `echo test && git reset --hard`), proven by TASK-14.
    - Evidence: `scripts/__tests__/pre-tool-use-git-safety.test.ts` ("handles piped commands with git")
    - Evidence: `scripts/__tests__/evaluate-git-safety-command.test.ts` (line 30-39: compound command blocking)
- **Decision / resolution:**
  - **Parsing scope:** extract and tokenize the first `git` invocation from `tool_input.command` (including `/usr/bin/git`, `/opt/homebrew/bin/git`), not full-shell parsing. ✅ Implemented in TASK-14.
  - **Ask behavior:** hook mode maps `ask` → allow (let Claude settings prompt); guard mode maps `ask` → deny. ✅ Implemented in TASK-14.
- **Precursor chain:** TASK-13 → TASK-14 → TASK-09 (TASK-13 and TASK-14 complete)
- **Acceptance:**
  - Git guard remains evaluator-driven (already true from TASK-11).
  - PreToolUse hook delegates decisions to the evaluator and does not carry a duplicated bash deny matrix.
  - Hook preserves interactive ask UX by allowing `ask` decisions through to `.claude/settings.json`.
  - Existing deny/allow behavior remains unchanged (verified by suites).
- **Validation contract:**
  - TC-01: `pnpm test:governed -- jest scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2` passes.
  - TC-02: `pnpm test:governed -- jest scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` passes.
  - TC-03: new evaluator raw-command parsing unit tests pass (added in TASK-14). ✅ Verified.
- **Evidence:**
  - Hook wired to evaluator: `.claude/hooks/pre-tool-use-git-safety.sh` (lines 88-109: evaluator call with `--mode hook`)
  - Guard wired to evaluator: `scripts/agent-bin/git` (already complete from TASK-11)
  - No duplicated policy logic: bash code only provides user-friendly error messages based on evaluator rule IDs
  - All tests pass (190 total):
    - TC-01: pre-tool-use hook tests (60 tests) ✅
    - TC-02: git-safety-policy tests (119 tests) ✅
    - TC-03: evaluator command tests (11 tests) ✅
- **Rollout / rollback:**
  - Already rolled out; hook has been using evaluator since TASK-11/TASK-14 completion.
  - Rollback: revert hook wiring commit; guard/evaluator remains.

### TASK-13: Hook integration decision + evaluator CLI contract
- **Type:** INVESTIGATE
- **Status:** Complete (2026-02-15)
- **Deliverable:** Concrete interface contract for hooking the evaluator to Claude PreToolUse (raw string input), including ask behavior and parsing scope.
- **Execution-Skill:** lp-do-replan
- **Affects:** `[readonly] .claude/hooks/pre-tool-use-git-safety.sh`, `[readonly] scripts/agents/evaluate-git-safety.mjs`, `[readonly] scripts/__tests__/pre-tool-use-git-safety.test.ts`, `[readonly] .claude/settings.json`
- **Depends on:** TASK-11
- **Blocks:** TASK-14, TASK-09
- **Confidence:** 86%
  - Implementation: 90% — investigation + decision memo only.
  - Approach: 86% — repo already encodes required behaviors via tests; define contract from evidence.
  - Impact: 86% — clarifies adapter boundaries to avoid regressions.
- **Acceptance:**
  - Defines evaluator CLI for hook usage: input shape, output/exit codes, and `ask` handling for Claude.
  - Defines parsing scope for `tool_input.command` (first git invocation extraction) and fail-closed rules.
  - Enumerates a minimal test corpus to lock down edge cases (quotes, env var prefixes, `echo && git ...`, absolute git paths).
- **Validation contract:**
  - VC-01: Decision paragraph exists in TASK-13 with chosen parsing scope + ask behavior + rationale → pass.
#### Decision (2026-02-15)
- **Chosen interface (hook mode):**
  - `node scripts/agents/evaluate-git-safety.mjs --policy .agents/safety/generated/git-safety-policy.json --mode hook --command "<tool_input.command>"`
  - Exit 0: allow (including `ask` decisions, which should fall through to `.claude/settings.json` for interactive prompting)
  - Exit non-zero: block (hook should return 2 to Claude; adapter can map evaluator exit codes)
- **Parsing scope:**
  - Extract and tokenize the **first `git` invocation** from the raw command string (supports `git` and absolute paths like `/usr/bin/git` and `/opt/homebrew/bin/git`).
  - Do **not** attempt full shell parsing; treat compound commands as “find the first git segment” (consistent with existing test: `echo test && git reset --hard` blocks).
  - If the string contains **no git invocation**, return allow (exit 0).
  - If tokenization is ambiguous (unbalanced quotes), fail closed (block).
- **Ask semantics:**
  - Evaluator `ask` returns allow in hook mode (`--mode hook`) so Claude can ask via `.claude/settings.json` ask rules.
  - Guard mode continues to treat `ask` as deny (non-interactive).
- **Evidence:**
  - Hook operates on raw `tool_input.command` and blocks “git embedded in compound commands.” Evidence: `scripts/__tests__/pre-tool-use-git-safety.test.ts` (“handles piped commands with git”).
  - Current guard/evaluator is argv-based and non-interactive; hook needs a dedicated adapter mode. Evidence: `scripts/agents/evaluate-git-safety.mjs`, `scripts/agent-bin/git`.

### TASK-14: Raw-command parsing + hook-mode evaluation in evaluator
- **Type:** SPIKE
- **Status:** Complete (2026-02-15)
- **Deliverable:** Evaluator supports raw command strings safely (quote-aware) and a hook mode that treats `ask` as allow.
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `scripts/agents/evaluate-git-safety.mjs` (extend CLI), plus new unit tests (new file under `scripts/__tests__/`)
  - Secondary: `[readonly] scripts/__tests__/pre-tool-use-git-safety.test.ts`, `[readonly] docs/git-safety.md`
- **Depends on:** TASK-13
- **Blocks:** TASK-09
- **Confidence:** 82%
  - Implementation: 82% — bounded spike; unit tests can be isolated.
  - Approach: 82% — evaluator remains single semantics; hook adapter becomes evaluator CLI.
  - Impact: 82% — reduces risk by proving tokenizer behavior independently.
- **Acceptance:**
  - Evaluator accepts `--command <raw>` and extracts/tokens the first git invocation (supports quotes and env var prefixes).
  - Evaluator supports `--mode hook` (or equivalent) where `ask` returns allow (exit 0) so Claude permissions can prompt.
  - Unit tests cover: quoted commit messages, `echo && git ...`, absolute paths (`/usr/bin/git`), env var prefixes (`SKIP_WRITER_LOCK=1 git ...`).
- **Validation contract:**
  - TC-01: new evaluator unit test file passes under governed runner.
  - TC-02: `pnpm test:governed -- jest scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2` passes.
  - Run/verify: `pnpm test:governed -- jest <new-test-file> scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2`.
- **Evidence:**
  - Implementation: `scripts/agents/evaluate-git-safety.mjs` (lines 112-252: tokenizer, lines 224-252: extraction, lines 517-557: hook mode)
  - Tests: `scripts/__tests__/evaluate-git-safety-command.test.ts` (11 tests, all pass)
  - Verified: `pnpm test:governed -- jest scripts/__tests__/evaluate-git-safety-command.test.ts --maxWorkers=2` (green)
  - Verified: `pnpm test:governed -- jest scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2` (60 tests, all pass)

### TASK-10: Decide hook/guard policy generation format
- **Type:** INVESTIGATE
- **Status:** Complete (2026-02-15)
- **Deliverable:** Decision recorded in this plan: choose how hook + guard will consume the kernel
  - Option A: generated bash data tables (regex + allow/deny lists) sourced by both scripts
  - Option B: shared node evaluator CLI (`node scripts/...`) called by both scripts
  - Option C: keep scripts hand-maintained; enforce via tests only (explicitly accept manual edits)
- **Execution-Skill:** lp-do-replan
- **Affects:** `[readonly] docs/git-safety.md`, `[readonly] .agents/safety/generated/*`, `[readonly] .claude/hooks/pre-tool-use-git-safety.sh`, `[readonly] scripts/agent-bin/git`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-11
- **Confidence:** 85%
  - Implementation: 90% — investigation only; no code required.
  - Approach: 85% — enough repo evidence exists to pick a least-brittle interface.
  - Impact: 85% — clarifies the generator boundary to avoid breaking safety.
- **Acceptance:**
  - Records chosen option + rationale + how it preserves fail-closed behavior.
  - Records explicit generated artifact contract (file path + exported variables/CLI args).
- **Validation contract:**
  - VC-01: Decision section exists in TASK-10 with chosen option + rationale → pass.
#### Decision (2026-02-15)
- **Chosen:** Option B (shared node evaluator CLI called by both hook + guard)
- **Why (repo reality):**
  - The hook blocks on raw command strings + bash regex, with ad-hoc normalization. Evidence: `.claude/hooks/pre-tool-use-git-safety.sh:43-56`, `.claude/hooks/pre-tool-use-git-safety.sh:78-203`.
  - The git guard blocks on `argv` tokens + bash parsing and has its own deny logic. Evidence: `scripts/agent-bin/git:119-188`, `scripts/agent-bin/git:189-260`.
  - The generated include currently exports *platform permission matcher strings* (Claude adapter), not the runtime rule language the hook/guard actually implement. Evidence: `.agents/safety/generated/git-safety-policy.sh:8-10`.
  - Therefore: "generate a bash data include" is not currently well-defined without inventing a new DSL and duplicating parsing in two places; a shared evaluator is the shortest path to a single semantics implementation.
- **Tightened architecture constraints (hard requirements):**
  - **Semantic-only kernel:** Treat the kernel as semantic policy rules. Platform/tool matchers (e.g. Claude permissions arrays) are generated adapters and must be clearly marked as derived. Avoid humans editing adapters as "the policy."
  - **Explicit conflict resolution:** Define global precedence (`first match wins` vs `priority`), and encode it in evaluator + tests. No implicit ordering.
  - **Input normalization:** Prefer `argv`-based evaluation. Raw string input (hook) must be tokenized conservatively; ambiguous tokenization fails closed (deny) with actionable error text.
  - **Fail-closed + recovery lane:** Evaluator failures deny by default, but provide a designed recovery path that is not "turn it off":
    - break-glass env var requires holding writer lock and emits loud audit guidance.
  - **Generated artifact protection:** Compiled JSON includes `sourceHash` (kernel hash) + metadata; CI fails if JSON is edited without corresponding kernel change.
  - **Testing:** Add golden compilation tests (kernel -> compiled JSON), evaluator corpus tests, and parity tests (hook-vs-guard) including flag permutations for known dangerous subcommands.
- **Generated interface contract (proposal):**
  - Add a plain-Node evaluator entrypoint (no tsx) that:
    - Reads `.agents/safety/generated/git-safety-policy.json`
    - Accepts either `--argv <json-array>` or `--command <raw-string>` (hook), and returns:
      - exit 0 allow, exit 2 deny (reserve 1 for internal error if needed, but default deny)
      - optional reason to stderr
    - **Fail-closed:** missing policy file, parse errors, tokenizer ambiguity, or internal exceptions => deny.

### TASK-11: Prototype policy-driven evaluation for one enforcement layer
- **Type:** SPIKE
- **Status:** Complete (2026-02-15)
- **Deliverable:** One enforcement layer consumes the shared evaluator and passes tests (stabilize semantics before touching the messier entrypoint).
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: (recommended first) `scripts/agent-bin/git` (argv-based, cleaner inputs), plus evaluator entrypoint (new) and/or generator outputs under `.agents/safety/generated/`
  - Secondary: `[readonly] scripts/__tests__/pre-tool-use-git-safety.test.ts`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-12
- **Blocks:** TASK-13, TASK-14, TASK-09
- **Confidence:** 82%
  - Implementation: 82% — bounded to one layer; existing suites provide fast E2 feedback.
  - Approach: 82% — spike can validate the chosen interface without committing to a full refactor.
  - Impact: 82% — reduces blast radius by proving behavior before wiring both layers.
- **Acceptance:**
  - One layer uses the shared evaluator (single semantics); no policy duplication required for that layer.
  - Relevant Jest suite(s) are green.
- **Validation contract:**
  - TC-01: `pnpm run test:governed -- jest -- scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` passes (must pass; covers evaluator drift gate + parity expectations)
  - TC-02: `pnpm run test:governed -- jest -- scripts/__tests__/pre-tool-use-git-safety.test.ts --maxWorkers=2` passes if hook is migrated in-spike; otherwise deferred to TASK-09
#### Evidence (2026-02-15)
- Commit: `dc0ad51504` (adds `scripts/agents/evaluate-git-safety.mjs`; rewires `scripts/agent-bin/git` to use it)
- Verified:
  - `pnpm test:governed -- jest scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2`
  - `scripts/agents/generate-git-safety-policy --check`
  - `node scripts/validate-agent-manifest.js`

### TASK-12: Add semantic safety rules to the kernel + compiled policy artifact
- **Type:** SPIKE
- **Status:** Complete (2026-02-15)
- **Deliverable:** Kernel gains a semantic rule set suitable for evaluation, and the generator emits a compiled policy artifact that includes semantic rules (not only platform matchers).
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `docs/git-safety.md` (kernel schema), `scripts/src/agents/git-safety-policy.ts`, `scripts/src/agents/generate-git-safety-policy.ts`, `.agents/safety/generated/git-safety-policy.json`
  - Secondary: `[readonly] .claude/hooks/pre-tool-use-git-safety.sh`, `[readonly] scripts/agent-bin/git`, `[readonly] scripts/__tests__/git-safety-policy.test.ts`
- **Depends on:** TASK-10
- **Blocks:** TASK-11
- **Confidence:** 82%
  - Implementation: 82% — bounded to schema + generator + tests; does not change enforcement scripts yet.
  - Approach: 82% — semantic rules in the kernel are required for a shared evaluator; otherwise the evaluator has no non-brittle policy to execute.
  - Impact: 82% — enforcement scripts remain unchanged; drift is caught via generator `--check` + tests.
- **Acceptance:**
  - Kernel contains explicit evaluation semantics (resolution/default effect) and a semantic `rules:` set covering the current deny/allow surface.
  - Compiled JSON includes rule semantics and is deterministic (`--check` passes).
- **Validation contract:**
  - TC-01: `scripts/agents/generate-git-safety-policy --check` passes → compiled artifact stays in sync.
  - TC-02: `pnpm run test:governed -- jest -- scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2` passes → kernel/compiled artifact parity remains enforced.
#### Evidence (2026-02-15)
- Commit: `9083e2a907` (adds semantic `rules:` + `evaluation:` to kernel; updates parser; regenerates compiled JSON)
- Verified:
  - `pnpm test:governed -- jest scripts/__tests__/git-safety-policy.test.ts --maxWorkers=2`
  - `scripts/agents/generate-git-safety-policy --check`
  - `node scripts/validate-agent-manifest.js`

### TASK-06: Replace stale `.claude/SKILLS_INDEX.md` usage with registry pointers
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Docs no longer point at stale SKILLS_INDEX; the index is updated or replaced with generated output.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:**
  - Primary: `.claude/SKILLS_INDEX.md`, `.claude/HOW_TO_USE_SKILLS.md`, `.claude/SETUP_COMPLETE.md`, `docs/github-setup.md`
  - Secondary: `[readonly] .agents/registry/skills.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 85% — small doc edits.
  - Approach: 80% — prefer generated registry as canonical; SKILLS_INDEX becomes a thin pointer or a generated list.
  - Impact: 80% — low risk; mainly improves correctness.
#### Re-plan Update (2026-02-15)
- **Previous confidence:** 80%
- **Updated confidence:** 82%
  - **Evidence class:** E2 (executable verification)
  - Repo evidence: `pnpm run docs:lint` currently exits non-zero repo-wide due to many legacy docs missing headers, so "docs lint passes" is not a meaningful validation gate for this task.
- **Acceptance:**
  - `.claude/SKILLS_INDEX.md` no longer references non-existent skills.
  - `.claude/HOW_TO_USE_SKILLS.md` and `.claude/SETUP_COMPLETE.md` reference the registry/command instead of a stale index.
  - `docs/github-setup.md` references the registry/command instead of a stale index.
- **Validation contract:**
  - TC-01: `rg -n "skills/fact-find" .claude/SKILLS_INDEX.md` returns no matches → pass.
  - TC-02: `rg -n "SKILLS_INDEX\\.md" docs/github-setup.md .claude/HOW_TO_USE_SKILLS.md .claude/SETUP_COMPLETE.md` returns no matches → pass.
  - TC-03: `scripts/agents/list-skills` runs and includes `lp-do-plan` → pass.
- **Rollout / rollback:** revert doc changes.
- **Evidence:**
  - Updated `.claude/SKILLS_INDEX.md` to point at `scripts/agents/list-skills` + generated registry.
  - Updated `.claude/HOW_TO_USE_SKILLS.md`, `.claude/SETUP_COMPLETE.md`, `docs/github-setup.md` to stop pointing at stale skill paths.
  - Commit: `7cd6b09de3`

### TASK-07: Horizon checkpoint: reassess before CODEX.md + policy rollout
- **Type:** CHECKPOINT
- **Status:** Complete (2026-02-15)
- **Depends on:** TASK-05, TASK-06, TASK-09
- **Blocks:** TASK-08
- **Confidence:** 95%
- **Acceptance:**
  - Re-run validator + safety tests and confirm drift prevention works.
  - Reassess TASK-08 confidence based on evidence from generated safety + registry adoption.
  - Update plan if any enforcement-layer edge cases were discovered.
- **Horizon assumptions to validate:**
  - Kernel+generator approach is stable and does not require rewriting complex bash logic.
  - Registry output is sufficient for Codex usability (no missing metadata).
- **Evidence:**
  - Drift prevention verified:
    - `node scripts/validate-agent-manifest.js` → OK
    - `scripts/agents/generate-git-safety-policy --check` → no drift
    - `scripts/agents/generate-skill-registry --check` → no drift
    - All safety tests pass (130 tests: 119 policy + 11 evaluator)
  - Infrastructure stability confirmed:
    - Kernel + generator stable (19 semantic rules)
    - Hook (215 lines) + guard (57 lines) remain minimal
    - No complex bash logic required
  - Registry validated:
    - 49 skills with full metadata (name, description, path)
    - `scripts/agents/list-skills` produces clean table output
  - No enforcement-layer edge cases discovered
  - TASK-08 confidence updated: 82% → 85% (duplication clearly identified, straightforward reduction)

### TASK-08: Reduce CODEX.md bloat while keeping safety TL;DR
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** Updated `CODEX.md`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:** `CODEX.md`, (optional) `AGENTS.md`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — doc edits plus a few link updates (scope validated by TASK-07).
  - Approach: 85% — keeps reliability while removing duplication (no edge cases discovered).
  - Impact: 85% — risk minimized by checkpoint validation; safety table clearly duplicated in lines 20-36.
#### Re-plan Update (2026-02-15)
- **Previous confidence:** 80%
- **Updated confidence:** 85% (after TASK-07 checkpoint)
  - **Evidence class:** E2 (executable verification) + E1 (static audit)
  - Repo evidence: `pnpm run docs:lint` currently exits non-zero repo-wide due to many legacy docs missing headers, so "docs lint passes" is not a meaningful validation gate for CODEX overlay edits.
  - TASK-07 checkpoint confirmed: CODEX.md lines 20-36 duplicate safety table from docs/git-safety.md; straightforward to reduce to TL;DR + reference link.
- **Acceptance:**
  - CODEX.md retains:
    - explicit integrator-shell requirement
    - safety TL;DR (non-negotiables)
    - links to `AGENTS.md` and `docs/git-safety.md`
    - skill discovery: points to `scripts/agents/list-skills`
  - CODEX.md removes duplicated long-form safety matrices already covered elsewhere.
- **Validation contract:**
  - TC-01: `rg -n "integrator-shell" CODEX.md` shows the requirement is still prominent → pass.
  - TC-02: `node scripts/validate-agent-manifest.js` passes → pass.
- **Evidence:**
  - CODEX.md reduced from 256 → 243 lines (~5% reduction)
  - Safety table (old lines 24-35) replaced with concise bullet TL;DR (new lines 24-37)
  - Skill list table (21 lines) replaced with registry pointer (6 lines)
  - All critical elements retained:
    - Integrator-shell requirement (lines 77-92) ✓
    - Safety TL;DR with non-negotiables (lines 24-37) ✓
    - Links to AGENTS.md, docs/git-safety.md (lines 70-73) ✓
    - Skill discovery via scripts/agents/list-skills (lines 230-235) ✓
  - Validation: TC-01 ✓, TC-02 ✓

## Risks & Mitigations
- Risk: generator corrupts enforcement scripts or weakens safety.
  - Mitigation: generated-block boundaries only; fail-closed validator + existing Jest suites.
- Risk: adding YAML kernel makes `docs/git-safety.md` harder to edit.
  - Mitigation: keep kernel small; prose remains free-form; document editing rules.
- Risk: registry misses skills due to missing frontmatter.
  - Mitigation: validator enforces required frontmatter keys and reports exact files.

## Decision Log
- 2026-02-15: Confirmed Option A for safety kernel (YAML in `docs/git-safety.md`; generators update JSON properties / delimited blocks only).
- 2026-02-15: Replanned safety work: narrowed TASK-04 to kernel+generator+artifacts; moved enforcement wiring to TASK-09; promoted TASK-04/TASK-05 to build-eligible via scope reduction + clearer validation.
- 2026-02-15: Replanned TASK-09 as hook-focused: extract + tokenize the first `git` invocation from raw `tool_input.command` (not full shell parsing) and map evaluator `ask` to allow in hook mode (Claude settings provides the interactive prompt). Added TASK-13 (decision/contract) and TASK-14 (spike) as precursors.
- 2026-02-15: Planning created from `docs/plans/agent-setup-improvement-fact-find.md` and superseding prior archived plans.
- 2026-02-15: Replanned doc-only tasks (TASK-06, TASK-08) to avoid global `pnpm docs:lint` pass requirement (repo baseline currently fails due to legacy docs); replaced with task-scoped validation commands.
