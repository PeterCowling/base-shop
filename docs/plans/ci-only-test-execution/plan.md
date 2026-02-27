---
Type: Plan
Status: Active
Domain: Infra
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Wave-1-complete: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ci-only-test-execution
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-replan, ops-ship
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall is effort-weighted average (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
---

# CI-Only Test Execution Plan

## Summary

This plan establishes a CI-only test execution policy with two layers: (1) technical enforcement blocking the canonical agent-mediated test paths (`run-governed-test.sh` and `VALIDATE_INCLUDE_TESTS=1` in validate-changes.sh) via `BASESHOP_CI_ONLY_TESTS=1`, exported automatically from `integrator-shell.sh`; and (2) policy-only coverage for direct-shell invocations (e.g., `pnpm test:affected`, direct Cypress/Playwright commands) that do not go through the governed runner. Policy documents (AGENTS.md and docs/testing-policy.md) are rewritten to make the CI-only rule explicit. The resource governor plan is marked Superseded, as its scheduler and resource admission phases are unnecessary when the primary agent test paths are blocked. A docs lint rule prevents future plan documents from encoding local test commands.

## Active tasks

- [x] TASK-01: Update docs/testing-policy.md — CI-only rewrite
- [x] TASK-02: Update AGENTS.md — remove local test commands, add CI feedback guidance
- [x] TASK-03: Add BASESHOP_CI_ONLY_TESTS guard to run-governed-test.sh
- [ ] TASK-04: Export BASESHOP_CI_ONLY_TESTS=1 in integrator-shell.sh
- [ ] TASK-05: Block VALIDATE_INCLUDE_TESTS=1 in validate-changes.sh
- [x] TASK-06: Mark test-execution-resource-governor-plan.md Superseded
- [ ] TASK-07: Add docs lint rule for local Jest command patterns
- [ ] TASK-08: CHECKPOINT — validate CI-only policy after deployment
- [x] TASK-09: INVESTIGATE — CI trigger coverage for app-specific pipelines on dev push

## Goals

- Block agent-mediated local Jest test invocations via `BASESHOP_CI_ONLY_TESTS=1` in the governed runner (`run-governed-test.sh`) and validate-changes opt-in (`VALIDATE_INCLUDE_TESTS=1`). Direct-shell invocations (e.g., `pnpm test:affected`) are policy-only, not technically blocked.
- Update AGENTS.md and docs/testing-policy.md to replace local test guidance with CI-only policy.
- Supersede the test-execution-resource-governor plan, retaining only its command-guard layer (Phases 0-1).
- Add a docs lint rule that prevents future local Jest command patterns from appearing in active plan/doc files.
- Investigate whether app-specific CI pipelines need `dev`-branch push triggers added.

## Non-goals

- Linting and typechecking remain local (explicit exclusion from dispatch).
- Changing test coverage targets, CI pass/fail thresholds, or test file content.
- Replacing the CI infrastructure itself.
- Turbo Remote Cache or CI caching strategy changes.

## Constraints & Assumptions

- Constraints:
  - Pre-commit hooks must not be broken; confirmed they do not invoke Jest.
  - `--no-verify` on commits is prohibited; enforcement must not conflict with hooks.
  - The governed runner (`run-governed-test.sh`) stays in place as the CI-only block shim; it is not deleted.
  - All env vars use the `BASESHOP_*` namespace (consistent with existing governor vars).
  - `integrator-shell.sh` exposes env to agent shells via the PATH+env setup mechanism — TASK-04 exports `BASESHOP_CI_ONLY_TESTS=1` there.
- Assumptions:
  - `CI=true` in GitHub Actions environments means the governor's `CI=true` compatibility mode bypasses the block, so CI itself is unaffected.
  - The ship-to-staging script opens a PR on every push, ensuring app-specific pipelines (`prime.yml`, `brikette.yml`) run via pull_request trigger even if not configured for dev branch pushes.
  - `docs:lint` and `plans:lint` TypeScript scripts can be extended with a new rule via a small addition (confirmed: both are `node --import tsx scripts/src/docs-lint.ts` / `plans-lint.ts` structured TypeScript files).

## Inherited Outcome Contract

- **Why:** Running tests locally — even in governed mode — consumes 2-4 GB RAM per run and destabilises the machine under bursty multi-agent workflows. The resource governor targets the symptom (too many concurrent processes); this initiative targets the cause (tests run locally at all).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Establish a CI-only test policy with enforcement scoped to agent-mediated paths: a block rule via `BASESHOP_CI_ONLY_TESTS=1` in the governed runner (`run-governed-test.sh`) and validate-changes script, exported automatically from `integrator-shell.sh`. Direct-shell invocations (e.g., `pnpm test:affected`) are covered by policy only. Updates AGENTS.md and docs/testing-policy.md to reflect CI-only guidance; marks the resource governor plan Superseded (scheduler and admission phases no longer needed).
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/ci-only-test-execution/fact-find.md`
- Key findings used:
  - `scripts/tests/run-governed-test.sh` is the canonical local test entrypoint; adding a `BASESHOP_CI_ONLY_TESTS` check at its head is the lowest-risk enforcement point.
  - `validate-changes.sh` already defaults to `VALIDATE_INCLUDE_TESTS=0`; blocking the `=1` opt-in closes the remaining local test pathway.
  - `scripts/agents/integrator-shell.sh` is where agent-shell env is set; exporting `BASESHOP_CI_ONLY_TESTS=1` there covers all agent sessions.
  - `docs/testing-policy.md` Rules 1-5 govern local Jest patterns; replacement with a single CI-only rule is a text rewrite.
  - `AGENTS.md` Testing Rules section and Commands table encode local test commands that must be removed.
  - The governor plan (`docs/plans/test-execution-resource-governor-plan.md`) is `Status: Active`; Phases 2+3 (scheduler, resource admission) become unnecessary under CI-only policy.
  - Pre-commit hooks (`scripts/git-hooks/pre-commit.sh`) confirmed to not invoke Jest — no hook changes needed.
  - `CI=true` already bypasses the governor's scheduler/admission in CI environments; the new block will respect this too.

## Proposed Approach

- Option A: Add `BASESHOP_CI_ONLY_TESTS=1` guard to the governed runner entry point (first-line block when env var is set), export it from integrator-shell, block `VALIDATE_INCLUDE_TESTS=1` in validate-changes.sh. Rewrite policy docs. Mark governor plan Superseded. Add docs lint rule.
- Option B: Delete `run-governed-test.sh` entirely and replace with a one-line block script. Simpler artifact but loses the CI-compat mode path (used by CI workflows via `CI=true`) — would require CI workflows to be updated.
- Chosen approach: Option A. The governed runner stays in place; `BASESHOP_CI_ONLY_TESTS=1` is checked at the top before any scheduling/admission logic runs, and the `CI=true` bypass already handles CI execution paths correctly. This requires zero changes to CI workflows and preserves the command-guard infrastructure from Phases 0-1 of the governor.

## Plan Gates

- Foundation Gate: Pass — Deliverable-Type, Execution-Track, Primary-Execution-Skill, Startup-Deliverable-Alias all present; Delivery-Readiness 92%; test landscape and testability present in fact-find.
- Sequenced: Yes — waves defined below; `/lp-do-sequence` logic applied.
- Edge-case review complete: Yes — pre-commit hook confirmed safe; CI=true bypass confirmed present; docs lint scope confirmed extensible.
- Auto-build eligible: Yes — multiple IMPLEMENT tasks at ≥80%, no blocking DECISION tasks, mode is plan+auto.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rewrite docs/testing-policy.md for CI-only | 85% | M | Complete (2026-02-27) | - | TASK-08 |
| TASK-02 | IMPLEMENT | Update AGENTS.md testing rules | 90% | S | Complete (2026-02-27) | - | TASK-08 |
| TASK-03 | IMPLEMENT | Add CI-only block to run-governed-test.sh | 90% | S | Complete (2026-02-27) | - | TASK-04, TASK-05, TASK-08 |
| TASK-04 | IMPLEMENT | Export BASESHOP_CI_ONLY_TESTS in integrator-shell.sh | 90% | S | Pending | TASK-03 | TASK-08 |
| TASK-05 | IMPLEMENT | Block VALIDATE_INCLUDE_TESTS in validate-changes.sh | 85% | S | Pending | TASK-03 | TASK-08 |
| TASK-06 | IMPLEMENT | Mark governor plan Superseded | 95% | S | Complete (2026-02-27) | - | TASK-08 |
| TASK-07 | IMPLEMENT | Add docs lint rule for local Jest patterns | 80% | M | Pending | TASK-01, TASK-02 | TASK-08 |
| TASK-08 | CHECKPOINT | Validate policy after deployment | 95% | S | Pending | TASK-01..TASK-07 | - |
| TASK-09 | INVESTIGATE | CI trigger coverage for app pipelines on dev push | 80% | S | Complete (2026-02-27) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-06, TASK-09 | None | All independent; run in parallel |
| 2 | TASK-04, TASK-05, TASK-07 | TASK-03 complete (TASK-04, TASK-05); TASK-01+TASK-02 complete (TASK-07 must not fire false positives on unchanged docs) | TASK-07 depends on TASK-01+TASK-02 completing to avoid lint false positives |
| 3 | TASK-08 | All Wave 1+2 complete | CHECKPOINT — triggers /lp-do-replan for post-deployment validation |

## Tasks

---

### TASK-01: Rewrite docs/testing-policy.md for CI-only policy

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/testing-policy.md` — Rules 1-5 replaced with CI-only rule; Rule 6 preserved; decision table and reference commands updated; VALIDATE_INCLUDE_TESTS removed from examples.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/testing-policy.md`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — file identified; content structure understood; all sections that need changing are enumerated in the fact-find.
  - Approach: 85% — rewriting Rules 1-5 is a well-scoped text operation; the main risk is missing a reference to local test commands in a less-obvious section. Held-back test: a section like "Brikette CI Test Sharding" describes CI sharding — it could contain embedded local test commands. One such unknown could mean a missed reference; score stays at 85.
  - Impact: 85% — primary policy doc for testing; agents read it directly. Complete rewrite creates clear policy. Risk: if we remove too much, we lose documentation value for CI sharding/test infra details that are still useful.
- **Acceptance:**
  - Rules 1-5 (local execution patterns) are removed or replaced with a single "Tests run in CI only" rule.
  - Rule 6 (stable mock references) is preserved unchanged.
  - `VALIDATE_INCLUDE_TESTS=1` examples are removed from the `Automated Validation` section.
  - The Test Scope Decision Table is updated — all rows replaced with CI-only guidance.
  - The Reference Commands section removes local Jest commands and adds `gh run watch` pattern.
  - The "CI E2E Ownership" section, "Brikette CI Test Sharding", "Prime Firebase Cost-Safety Gate", and "Hydration Testing" sections are preserved (still relevant).
  - The Resource Admission Defaults section (TEG-08) and Test Scheduler/Governed Runner section are marked historical or removed since the governed runner is now a CI-redirect shim only.
- **Validation contract (TC-01):**
  - TC-01: `grep -n "pnpm --filter.*test" docs/testing-policy.md` returns zero matches outside of historical/archive sections.
  - TC-02: `grep -n "VALIDATE_INCLUDE_TESTS" docs/testing-policy.md` returns zero matches.
  - TC-03: Rule 6 content (stable mock references pattern) is still present and intact.
- **Execution plan:**
  - Red: Identify every section referencing local test execution (Rules 1-5, decision table, reference commands, validate-changes examples, governed runner section). Mark for replacement.
  - Green: Replace Rules 1-5 with a single rule: "All Jest and e2e tests run in CI only. Do not run test commands locally. Push your changes and monitor CI via `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`." Preserve CI-only sections (sharding, cost gate, hydration testing, e2e ownership). Update decision table and reference commands. Remove VALIDATE_INCLUDE_TESTS examples.
  - Refactor: Read the resulting file once end-to-end to catch any residual local test references.
- **Planning validation (required for M/L):**
  - Checks run: Read full `docs/testing-policy.md` (519 lines) to map all sections.
  - Validation artifacts: Fact-find Q "What AGENTS.md and testing-policy.md language needs reframing?" provides exact line ranges.
  - Unexpected findings: The "Resource Admission Defaults (TEG-08)" and "Test Scheduler and Governed Runner" subsections under Rule 4 describe the governed runner in detail — these become historical context once CI-only is active. They should be condensed or moved to a "Historical context" note.
- **Scouts:** Check that the `scripts/validate-changes.sh` section at the bottom of testing-policy.md does not conflict with TASK-05's changes to validate-changes.sh itself.
- **Edge Cases & Hardening:** The `brikette-deploy` preflight section (`pnpm preflight:brikette-deploy`) is distinct from test commands — it checks static-export readiness, not Jest. Preserve it.
- **What would make this >=90%:**
  - Complete read of the file confirms no sections reference local test commands that would be missed.
- **Rollout / rollback:**
  - Rollout: Committed in the same PR as TASK-03 (enforcement); policy and enforcement ship together.
  - Rollback: `git revert` the commit; revert docs change.
- **Documentation impact:** This task IS the documentation change. No secondary docs needed.
- **Notes / references:**
  - Fact-find: lines 194-203 enumerate exact passages to update.
  - The "Why This Matters" incident section at the bottom of testing-policy.md is preserved — it provides historical motivation.

---

### TASK-02: Update AGENTS.md — remove local test commands, add CI feedback guidance

- **Type:** IMPLEMENT
- **Deliverable:** Updated `AGENTS.md` — Commands table and Testing Rules section updated; local test rows removed; CI polling guidance added.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `AGENTS.md`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 90%
  - Implementation: 95% — exact lines identified in fact-find; file is 440 lines; changes are surgical removals and one addition.
  - Approach: 90% — clean text edits; no risk of breaking any scripts (AGENTS.md is read-only by scripts). Held-back test: "What single unknown would push below 80?" — no credible unknown; the file is documentation only.
  - Impact: 85% — AGENTS.md is the canonical runbook for all agents; removing local test commands here is the primary agent-facing signal. High impact.
- **Acceptance:**
  - Commands table: `Test (single file)` and `Test (pattern)` rows are replaced with `Test feedback` → `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`.
  - Testing Rules section: "When running tests locally, always use targeted scope" removed; replaced with "Do not run tests locally. Push to dev and watch CI for results."
  - `VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh` example removed from the Validation Gate section.
  - Remaining Testing Rules (worker limits, orphan checks) removed; all local-test bullet points condensed to CI-only statement.
  - `Full policy: docs/testing-policy.md` link kept.
- **Validation contract (TC-01):**
  - TC-01: `grep -n "locally, always use targeted" AGENTS.md` returns zero matches.
  - TC-02: `grep -n "VALIDATE_INCLUDE_TESTS" AGENTS.md` returns zero matches.
  - TC-03: `grep -n "gh run watch" AGENTS.md` returns at least one match (CI guidance added).
- **Execution plan:**
  - Red: Identify and remove or replace the three targeted passages (Commands table rows, Testing Rules bullets, validate-changes example).
  - Green: Add CI polling guidance as a replacement for local test commands. Keep all non-test sections unchanged.
  - Refactor: Quick scan to confirm no other local test invocations appear.
- **Planning validation:** None beyond the fact-find — AGENTS.md is a documentation-only file with no code dependency.
- **Scouts:** None: no script reads AGENTS.md content programmatically.
- **Edge Cases & Hardening:** The "ESM vs CJS in Jest" bullet in Testing Rules references JEST_FORCE_CJS=1. This is an exception handling note for when Jest fails in CI — it should be preserved as a CI debugging note, just not framed as a local run instruction.
- **What would make this >=90%:** Already at 90%; would reach 95% if operator confirms no other AGENTS.md sections reference local test commands.
- **Rollout / rollback:**
  - Rollout: Same commit as TASK-01; all doc changes together.
  - Rollback: `git revert`.
- **Documentation impact:** This task IS the documentation change.
- **Notes / references:** Fact-find lines 196-203.

---

### TASK-03: Add BASESHOP_CI_ONLY_TESTS guard to run-governed-test.sh

- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/tests/run-governed-test.sh` — CI-only block at entry point; exits 1 with redirect message when `BASESHOP_CI_ONLY_TESTS=1` and `CI` is not set.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/tests/run-governed-test.sh`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05, TASK-08
- **Confidence:** 90%
  - Implementation: 95% — the file is 478 lines; the entry point block is added after `set -euo pipefail` and the initial sourcing of helper scripts, before the intent-parsing logic. The pattern is: check `BASESHOP_CI_ONLY_TESTS` and `CI`, print message, exit 1.
  - Approach: 90% — minimal addition; no existing logic path is changed. Held-back test: "What if CI=true is not set by all CI runners?" — GitHub Actions sets `CI=true` by default; this is a standard guarantee. No credible unknown drops this below 80.
  - Impact: 85% — this is the primary enforcement mechanism for agent-mediated test invocations; high impact.
- **Acceptance:**
  - At the top of `run-governed-test.sh` (after sourcing helpers, before intent parsing), the following block is present:
    ```bash
    if [[ "${BASESHOP_CI_ONLY_TESTS:-0}" == "1" && "${CI:-}" != "true" ]]; then
      echo "BLOCKED: local test execution is disabled (BASESHOP_CI_ONLY_TESTS=1)." >&2
      echo "Tests run in GitHub Actions CI only. Push your changes and monitor:" >&2
      echo "  gh run watch \$(gh run list --limit 1 --json databaseId -q '.[0].databaseId')" >&2
      exit 1
    fi
    ```
  - `BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version` exits 1 with the block message in stderr.
  - `CI=true BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version` passes through (CI bypass active).
  - Unset `BASESHOP_CI_ONLY_TESTS` (default behavior): runner proceeds as before.
- **Validation contract (TC-01):**
  - TC-01: `BASESHOP_CI_ONLY_TESTS=1 bash scripts/tests/run-governed-test.sh jest -- --version 2>&1 | grep -q "BLOCKED"` exits 0 (grep found the message).
  - TC-02: `CI=true BASESHOP_CI_ONLY_TESTS=1 bash scripts/tests/run-governed-test.sh jest -- --version` does not print "BLOCKED" and exits per normal runner flow.
  - TC-03: Without `BASESHOP_CI_ONLY_TESTS`, runner behavior is unchanged.
- **Execution plan:**
  - Red: Locate the line after `source "$runner_shaping_script"` and before `intent="${1:-}"` in run-governed-test.sh (~line 131).
  - Green: Insert the CI-only block snippet. Confirm `BASESHOP_CI_ONLY_TESTS` spelling matches the established namespace.
  - Refactor: Verify the block does not interfere with the `CI=true` compatibility mode already at line 48 of the governed runner (`# Governed config path rule`).
- **Planning validation:**
  - Checks run: Read run-governed-test.sh lines 1-140 (entry + intent parsing section).
  - Validation artifacts: Confirmed intent parsing starts at line ~131 (`intent="${1:-}"`).
  - Unexpected findings: None — the insertion point is clean.
- **Scouts:** Confirm `CI` variable is the standard GitHub Actions env var (`CI=true`). Confirmed: GitHub Actions sets this automatically on all runners.
- **Edge Cases & Hardening:** The `CI=true` check must use `[[ "${CI:-}" != "true" ]]` not `[[ -z "${CI:-}" ]]` to match the GitHub Actions convention exactly. This avoids false positives if CI is set to a non-"true" value in some local override.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deployed before or with TASK-04 (env var must exist before the shell exports it to be meaningful, but the guard is harmless if the env var is unset).
  - Rollback: Remove the 6-line block from run-governed-test.sh.
- **Documentation impact:** TASK-01 and TASK-02 document the policy change. No additional docs needed here.
- **Notes / references:** Fact-find enforcement mechanism Q (line 205-207).

---

### TASK-04: Export BASESHOP_CI_ONLY_TESTS=1 in integrator-shell.sh

- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/agents/integrator-shell.sh` — exports `BASESHOP_CI_ONLY_TESTS=1` so all agent shells started via the integrator receive the block automatically.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/agents/integrator-shell.sh`
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 90%
  - Implementation: 90% — integrator-shell.sh is 185 lines; the export is added near the top of the shell environment setup section, before the `exec "$writer_lock"` or `exec "$git_guard"` calls that launch the child shell. The env var will be inherited by all child processes.
  - Approach: 90% — exporting a new env var is a minimal, low-risk addition. Held-back test: "What if integrator-shell passes env via exec and the child shell resets BASESHOP_CI_ONLY_TESTS?" — `exec` passes the current env to the child process; `set -euo pipefail` does not unset vars. No credible unknown.
  - Impact: 85% — covers all agent-mediated test invocations; high impact for the target use case.
- **Acceptance:**
  - `integrator-shell.sh` contains `export BASESHOP_CI_ONLY_TESTS=1` before the `exec` calls.
  - A shell started via `scripts/agents/integrator-shell.sh --read-only -- bash -c 'echo $BASESHOP_CI_ONLY_TESTS'` prints `1`.
  - The read-only path (git_guard exec) also receives the export.
- **Validation contract (TC-01):**
  - TC-01: `scripts/agents/integrator-shell.sh --read-only -- bash -c 'echo $BASESHOP_CI_ONLY_TESTS'` outputs `1`.
- **Execution plan:**
  - Red: Find the section of integrator-shell.sh where env vars for child processes are prepared (before line 119 `exec "$git_guard"` and line 185 `exec "$writer_lock"`).
  - Green: Add `export BASESHOP_CI_ONLY_TESTS=1` after the argument parsing block, before any `exec` call (~line 110).
  - Refactor: Confirm both the read-only path (line 119) and the write path (line 185) will inherit the export since both execute after the export statement.
- **Planning validation:**
  - Checks run: Read integrator-shell.sh lines 110-185 to confirm export placement is before all exec paths.
  - Validation artifacts: Confirmed two exec paths at lines 119 and 185; export before both is achievable from line ~110.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:** If `CI=true` is already set in the environment when the integrator shell runs (e.g., an agent running in a CI environment itself), the export of `BASESHOP_CI_ONLY_TESTS=1` will be harmless — the governed runner's CI bypass will take precedence and tests will not be blocked.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Same commit as TASK-03.
  - Rollback: Remove the `export BASESHOP_CI_ONLY_TESTS=1` line.
- **Documentation impact:** No separate doc; the policy docs (TASK-01/02) describe the env var.
- **Notes / references:** Fact-find blast radius: `scripts/agents/integrator-shell.sh (add BASESHOP_CI_ONLY_TESTS=1 export)`.

---

### TASK-05: Block VALIDATE_INCLUDE_TESTS=1 in validate-changes.sh

- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/validate-changes.sh` — exits 1 with redirect message when `VALIDATE_INCLUDE_TESTS=1` is set and `BASESHOP_CI_ONLY_TESTS=1` is active (and `CI` is not set).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/validate-changes.sh`
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — file is 622 lines; `VALIDATE_INCLUDE_TESTS` is set at line 20 and checked at lines 30, 188, 534, 597, 604. The block is added immediately after line 20, checking the combination of `VALIDATE_INCLUDE_TESTS=1` and `BASESHOP_CI_ONLY_TESTS=1`.
  - Approach: 85% — the block is simple; the risk is that the usage comment at the top of the file still mentions `VALIDATE_INCLUDE_TESTS=1` as a valid option. The comment must also be updated.
  - Impact: 85% — closes the last local test pathway that bypasses the governed runner. High impact completeness.
- **Acceptance:**
  - When `BASESHOP_CI_ONLY_TESTS=1` and `VALIDATE_INCLUDE_TESTS=1` are both set (and `CI` is not `true`), `validate-changes.sh` prints a CI-only message and exits 1.
  - When `BASESHOP_CI_ONLY_TESTS` is not set, `VALIDATE_INCLUDE_TESTS=1` works as before (backward compatibility for any environment where CI-only is not enforced).
  - The usage comment at the top of `validate-changes.sh` removes the `VALIDATE_INCLUDE_TESTS=1` example or marks it as blocked under CI-only policy.
- **Validation contract (TC-01):**
  - TC-01: `BASESHOP_CI_ONLY_TESTS=1 VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh 2>&1 | grep -q "BLOCKED"` exits 0.
  - TC-02: `VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh` (without CI_ONLY flag) continues to function (or is blocked at the governed runner layer separately).
- **Execution plan:**
  - Red: After line 20 (`VALIDATE_INCLUDE_TESTS="${VALIDATE_INCLUDE_TESTS:-0}"`), add:
    ```sh
    if [ "${BASESHOP_CI_ONLY_TESTS:-0}" = "1" ] && [ "${VALIDATE_INCLUDE_TESTS:-0}" = "1" ] && [ "${CI:-}" != "true" ]; then
      echo "BLOCKED: VALIDATE_INCLUDE_TESTS=1 is not permitted under CI-only test policy (BASESHOP_CI_ONLY_TESTS=1)." >&2
      echo "Push your changes and monitor CI: gh run watch" >&2
      exit 1
    fi
    ```
  - Green: Update the usage comment (lines 7-8) to note that `VALIDATE_INCLUDE_TESTS=1` is unavailable under CI-only policy.
  - Refactor: Scan remaining references to `VALIDATE_INCLUDE_TESTS` in the file — they become unreachable via the block, but leave them in place for completeness (they don't cause harm when the script exits early).
- **Planning validation:**
  - Checks run: Read validate-changes.sh lines 1-50 (header + var setup section).
  - Validation artifacts: `VALIDATE_INCLUDE_TESTS` variable at line 20; orphan check at line 30 gated on `VALIDATE_INCLUDE_TESTS=1`.
  - Unexpected findings: None.
- **Scouts:** Confirm the script uses `#!/bin/sh` (POSIX sh, not bash) at line 1 — yes, confirmed from fact-find read. Use `[ ]` not `[[ ]]` in the block (POSIX compatible).
- **Edge Cases & Hardening:** `CI=true` check must use POSIX `[ ]` syntax since the script is `#!/bin/sh`.
- **What would make this >=90%:** Read the full script to confirm no other pathways trigger test execution that bypass the VALIDATE_INCLUDE_TESTS check.
- **Rollout / rollback:**
  - Rollout: Same commit as TASK-03 and TASK-04.
  - Rollback: Remove the 6-line block.
- **Documentation impact:** TASK-01 removes the VALIDATE_INCLUDE_TESTS example from testing-policy.md.
- **Notes / references:** Fact-find validate-changes.sh section; TASK-03 defines the env var that this task checks.

---

### TASK-06: Mark test-execution-resource-governor-plan.md Superseded

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/plans/test-execution-resource-governor-plan.md` — `Status: Superseded`; forward pointer to this plan added; one-paragraph rationale explaining why Phases 2-3 are no longer needed.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/test-execution-resource-governor-plan.md`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% — clear text edit; frontmatter status change + rationale paragraph.
  - Approach: 95% — standard plan supersession pattern per AGENTS.md "Superseded plans" section.
  - Impact: 95% — provides clear audit trail; prevents agents from trying to continue governor plan work that is no longer needed.
- **Acceptance:**
  - Frontmatter `Status: Superseded`.
  - `Superseded-by: docs/plans/ci-only-test-execution/plan.md` added to frontmatter.
  - A `## Supersession Rationale` section added explaining: Phases 0-1 (command guard wrappers) are retained as the enforcement infrastructure for the CI-only block; Phases 2-3 (scheduler, resource admission) are unnecessary because tests no longer run locally at all.
  - The resource governor fact-find (`docs/plans/test-execution-resource-governor-fact-find.md`) has `Status: Superseded` added to its frontmatter as well.
- **Validation contract (TC-01):**
  - TC-01: `grep "Status: Superseded" docs/plans/test-execution-resource-governor-plan.md` returns a match.
  - TC-02: `grep "Superseded-by" docs/plans/test-execution-resource-governor-plan.md` returns a match pointing to this plan.
- **Execution plan:**
  - Red: Edit frontmatter.
  - Green: Add `Superseded-by` field and `## Supersession Rationale` section.
  - Refactor: Update fact-find frontmatter status too.
- **Planning validation:** None: pure metadata update.
- **Scouts:** None.
- **Edge Cases & Hardening:** Do not delete the governor plan; per AGENTS.md, superseded plans move to `docs/historical/plans/` or stay in place with `Status: Superseded`. Given the calibration doc is also in `docs/plans/`, leave all three governor files in place with updated status.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** No code change; rollback is reverting the status fields.
- **Documentation impact:** This task IS the documentation change.
- **Notes / references:** AGENTS.md "Superseded plans" section.

---

### TASK-07: Add docs lint rule for local Jest command patterns

- **Type:** IMPLEMENT
- **Deliverable:** New lint rule in `scripts/src/docs-lint.ts` or `scripts/src/plans-lint.ts` that fails when active (non-archive, non-historical) docs files contain raw local Jest invocation patterns.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/plans-lint.ts` (primary), `[readonly] scripts/src/docs-lint.ts`
- **Depends on:** TASK-01, TASK-02 (must be complete so docs are updated before the lint rule activates, preventing false positives on the old docs content)
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 80% — `plans-lint.ts` is a TypeScript file with existing rule structure; the pattern of adding a new rule is established. However, the exact implementation shape of existing rules is not fully read (only the docs-lint.ts top-level was read). Score at 80 per evidence cap rule (M task with reasoning-only evidence on the internals).
  - Approach: 80% — adding a regex-based rule to a TypeScript lint script is straightforward; the risk is the rule fires on legitimate historical/archive references that should be exempt. The exempt path list (archive, historical) must be correct.
  - Impact: 80% — prevents future docs from encoding local test commands; drift prevention value.
  - Held-back test (any dimension at 80): "What single unknown would push Implementation below 80?" — if `plans-lint.ts` uses a fundamentally different architecture than expected (e.g., rule-as-plugin rather than inline), the approach may need adjustment. This is a real unknown.
- **Acceptance:**
  - A new rule in `plans-lint.ts` (or equivalent) checks active plan docs for patterns: `npx jest`, `pnpm exec jest`, `--maxWorkers=`, `--runInBand`, `VALIDATE_INCLUDE_TESTS=1`.
  - Files under `docs/plans/archive/`, `docs/historical/`, and the fact-find/plan of the resource governor itself are exempt (they document historical patterns).
  - `pnpm run plans:lint` fails when any active plan file contains these patterns.
  - The rule is exemptable via an inline comment marker (e.g., `<!-- LINT-EXEMPT: local-jest-pattern -->`).
- **Validation contract (TC-01):**
  - TC-01: Create a temp active plan doc containing `npx jest --testPathPattern=foo` → `pnpm run plans:lint` exits non-zero.
  - TC-02: The same pattern in `docs/plans/archive/old-plan.md` does not trigger the rule.
  - TC-03: `pnpm run plans:lint` passes on the full repo after TASK-01 and TASK-02 doc changes are in place.
- **Execution plan:**
  - Red: Read `scripts/src/plans-lint.ts` to understand existing rule structure and how to add a new check.
  - Green: Add the pattern-based check with exempt paths and inline comment escape.
  - Refactor: Run `pnpm run plans:lint` against the current repo to verify no false positives in existing active docs (or identify any that need exemption markers).
- **Planning validation:**
  - Checks run: Read top 80 lines of `docs-lint.ts` (done); `plans-lint.ts` not yet read — read required before implementing.
  - Validation artifacts: `docs:lint` and `plans:lint` both called from `ci.yml` lint job, confirmed.
  - Unexpected findings: The docs-lint.ts file checks a `docs/` dir only (not `scripts/`); plans-lint.ts likely checks `docs/plans/` — need to confirm scope.
- **Scouts:** Read `scripts/src/plans-lint.ts` at build time to confirm rule addition approach before implementing.
- **Edge Cases & Hardening:** The current `docs/testing-policy.md` and `AGENTS.md` contain the patterns being blocked — they must be updated (TASK-01/02) before this lint rule passes. Sequence: TASK-01/02 must be committed before TASK-07 lands in CI, or TASK-07 must include exemptions for these specific files until they are updated.
- **What would make this >=90%:** Reading `plans-lint.ts` fully before implementing; confirming the rule structure and exempt path mechanism.
- **Rollout / rollback:**
  - Rollout: Deployed after or with TASK-01/02 to avoid false lint failures on the unchanged testing-policy.md.
  - Rollback: Remove the new rule from plans-lint.ts.
- **Documentation impact:** None beyond the rule itself.
- **Notes / references:** Governor plan Phase 4 had a similar docs lint rule planned; this task implements it.

---

### TASK-08: CHECKPOINT — validate CI-only policy after deployment

- **Type:** CHECKPOINT
- **Deliverable:** Updated `docs/plans/ci-only-test-execution/plan.md` with replan evidence; downstream validation.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/ci-only-test-execution/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents silent policy drift post-deployment.
  - Impact: 95% — ensures enforcement is working and no gaps remain.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on any downstream tasks.
  - Confirm: `BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version` exits 1.
  - Confirm: `pnpm run plans:lint` passes with new rule active.
  - Confirm: CI green on `dev` after the full PR is merged.
  - TASK-09 outcome documented in the plan.
- **Horizon assumptions to validate:**
  - Enforcement block fires correctly in agent shells.
  - Docs lint rule passes cleanly with no false positives on the updated docs.
  - No agent session has been broken by the removal of local test workflow.
- **Validation contract:** All Acceptance items above confirmed; plan updated with findings.
- **Planning validation:** None: checkpoint task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated with checkpoint findings.

---

### TASK-09: INVESTIGATE — CI trigger coverage for app pipelines on dev push

- **Type:** INVESTIGATE
- **Deliverable:** Decision recorded in `docs/plans/ci-only-test-execution/plan.md` (Decision Log) — whether `prime.yml`, `brikette.yml`, `caryina.yml` need `dev` added to `push.branches`; any trigger changes implemented.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] .github/workflows/prime.yml`, `[readonly] .github/workflows/brikette.yml`, `[readonly] .github/workflows/caryina.yml`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — reading three YAML files and making a decision is low effort; implementing any trigger change is also small (add `dev` to `push.branches`).
  - Approach: 80% — the decision depends on whether the ship-to-staging PR-based workflow provides sufficient coverage (the primary mitigating factor identified in the fact-find).
  - Impact: 80% — ensures no coverage gap opens as a result of eliminating local test runs.
- **Questions to answer:**
  1. Does the `ship-to-staging` script (`scripts/git/ship-to-staging.sh`) always open a PR before merging, ensuring `pull_request` triggers fire for prime/brikette? (Expected: yes, but confirm.)
  2. Are there agent workflows where code is committed to `dev` without an open PR (e.g., direct commit + push without ship-to-staging)? If so, prime/brikette tests would not run until the PR is opened.
  3. For caryina specifically (triggers only on `main` push + pull_request): does this create a gap where caryina tests don't run until the staging→main promotion? If so, is this acceptable?
  4. Decision: add `dev` to push.branches for prime/brikette/caryina, OR document the PR-based mitigation as sufficient.
- **Acceptance:**
  - Question 1-3 answered with evidence from the script/workflow files.
  - Decision recorded in the plan Decision Log with rationale.
  - If trigger changes are implemented: `prime.yml`, `brikette.yml`, or `caryina.yml` updated and CI confirmed green.
  - If trigger changes are deferred: rationale documented and any outstanding risk noted.
- **Validation contract:** Decision Log entry present; any workflow changes CI-green.
- **Planning validation:** None: investigate task.
- **Rollout / rollback:** If trigger changes made: revert the workflow YAML. If no changes: no rollback needed.
- **Documentation impact:** Decision Log in this plan.
- **Notes / references:** Fact-find constraint: "CI coverage gap on `dev` push" (line 57); `prime.yml` push.branches: `[main, staging]`; `brikette.yml` push.branches: `[main, staging]`; `caryina.yml` push.branches: `[main]` only.

---

## Risks & Mitigations

- CI feedback latency (15-25 min) may frustrate rapid iteration — Mitigation: `ops-ship` skill already normalises CI watch-fix loop; agents operate async by design.
- App-specific tests (prime, brikette) don't run on bare `dev` pushes without an open PR — Mitigation: TASK-09 investigates; ship-to-staging always opens a PR as partial mitigation.
- `VALIDATE_INCLUDE_TESTS=1` remains in agent memory from old AGENTS.md training — Mitigation: TASK-02 rewrites the doc; TASK-05 blocks the flag at runtime; TASK-07 catches it in lint.
- Governor plan work abandoned without clean archival — Mitigation: TASK-06 explicitly marks it Superseded with rationale.
- TASK-07 lint rule fires false positives on existing docs before TASK-01/02 land — Mitigation: sequence TASK-07 to deploy after TASK-01/02 in the same PR, or add file-level exemptions for the specific historical refs.

## Observability

- Logging: blocked invocations print to stderr with "BLOCKED: local test execution is disabled (BASESHOP_CI_ONLY_TESTS=1)" — visible in agent output. This is the primary observability mechanism for the block.
- Metrics: No new telemetry is added by this plan. The CI-only block (TASK-03) exits before the governed runner's existing scheduler/admission logic runs, so existing `.cache/test-governor/events.jsonl` telemetry does not record the block event. This is intentional: the block is meant to prevent all local test execution, not to measure it.
- Alerts/Dashboards: None required — the block is synchronous and self-reporting via stderr.

## Acceptance Criteria (overall)

- [ ] `docs/testing-policy.md` contains no local Jest command examples or `VALIDATE_INCLUDE_TESTS` references.
- [ ] `AGENTS.md` Testing Rules section directs agents to CI; no local test commands in Commands table.
- [ ] `BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version` exits 1 with redirect message.
- [ ] `CI=true BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version` exits 0 (CI bypass works).
- [ ] `scripts/agents/integrator-shell.sh --read-only -- bash -c 'echo $BASESHOP_CI_ONLY_TESTS'` prints `1`.
- [ ] `BASESHOP_CI_ONLY_TESTS=1 VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh` exits 1 with redirect message.
- [ ] `docs/plans/test-execution-resource-governor-plan.md` has `Status: Superseded` and a forward pointer.
- [ ] `pnpm run plans:lint` passes on the full repo (no false positives on updated docs).
- [ ] TASK-09 decision documented in Decision Log.
- [ ] CI green on `dev` after all changes are merged.

## Decision Log

- 2026-02-27: Chosen approach is Option A (add `BASESHOP_CI_ONLY_TESTS=1` guard to governed runner entry point). Option B (delete runner entirely) rejected because it would require CI workflow updates and loses the `CI=true` bypass that CI itself uses.
- 2026-02-27: Open question (pre-commit fast-subset exception) defaults to full block. No pre-commit test exception. Rationale: pre-commit hooks are confirmed to not invoke Jest; adding an exception would reintroduce local RAM load and complexity.
- 2026-02-27: Governor plan Phases 2-3 (scheduler, resource admission) deemed unnecessary under CI-only policy. Phases 0-1 (command guard wrappers) retained as the enforcement layer.
- 2026-02-27: TASK-09 INVESTIGATE complete. Evidence: `prime.yml` push triggers `[main, staging]`; `brikette.yml` push triggers `[main, staging]`; `caryina.yml` push triggers `[main]` only. All three pipelines have `pull_request` triggers for all branches. `ship-to-staging.sh` always opens a `gh pr create --head dev --base staging` PR — this guarantees `pull_request` triggers fire for all three pipelines on every `dev` push via the ship script. Decision: no changes to workflow YAML files needed. PR-based mitigation confirmed sufficient. Any direct `git push dev` without ship-to-staging would miss app pipeline tests, but that is policy-only (acceptable per constraint documentation).

## Overall-confidence Calculation

| Task | Confidence | Effort (weight) | Weighted |
|---|---|---|---|
| TASK-01 | 85% | M (2) | 170 |
| TASK-02 | 90% | S (1) | 90 |
| TASK-03 | 90% | S (1) | 90 |
| TASK-04 | 90% | S (1) | 90 |
| TASK-05 | 85% | S (1) | 85 |
| TASK-06 | 95% | S (1) | 95 |
| TASK-07 | 80% | M (2) | 160 |
| TASK-08 | 95% | S (1) | 95 |
| TASK-09 | 80% | S (1) | 80 |
| **Total** | | **11** | **955** |

**Overall-confidence = 955 / 11 = 86.8% → 86%**
