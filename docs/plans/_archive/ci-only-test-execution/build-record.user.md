---
Status: Complete
Feature-Slug: ci-only-test-execution
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — CI-Only Test Execution

## What Was Built

**Wave 1 — Policy documents and primary enforcement (TASK-01, TASK-02, TASK-03, TASK-06, TASK-09)**

`docs/testing-policy.md` was completely rewritten (TASK-01). Rules 1–5, which described local test execution patterns, were replaced with a single "Rule 1: All Tests Run in CI Only" rule. A new CI feedback loop section was added with `gh run watch` commands. Rule 6 (stable mock references) was preserved unchanged. All `VALIDATE_INCLUDE_TESTS` examples were removed. Historical sections (CI E2E Ownership, Brikette CI Test Sharding, Prime Firebase Cost-Safety Gate, Hydration Testing) were preserved.

`AGENTS.md` was updated (TASK-02). The Commands table rows "Test (single file)" and "Test (pattern)" were replaced with a single "Test feedback" row pointing to `gh run watch`. The Testing Rules section was condensed to four CI-only bullets. The `VALIDATE_INCLUDE_TESTS=1` Validation Gate example was removed.

`scripts/tests/run-governed-test.sh` received a CI-only enforcement block (TASK-03) inserted immediately before intent parsing. When `BASESHOP_CI_ONLY_TESTS=1` is set and `CI` is not `true`, the runner exits 1 with a redirect message. GitHub Actions sets `CI=true` automatically, so CI itself is unaffected.

The test-execution-resource-governor plan was marked `Status: Superseded` (TASK-06), with a `Superseded-by` reference and a rationale section explaining that the scheduler and admission phases (Phases 2–3) are unnecessary when agent-mediated test paths are blocked. The resource governor fact-find was also marked Superseded.

TASK-09 (INVESTIGATE) confirmed no CI workflow YAML changes are needed: prime.yml and brikette.yml have `pull_request` triggers active on all branches, and `ship-to-staging.sh` always opens a PR on `gh pr create --head dev --base staging`, ensuring pipelines run on every dev push.

**Wave 2 — Shell enforcement and docs lint rule (TASK-04, TASK-05, TASK-07)**

`scripts/agents/integrator-shell.sh` was updated (TASK-04) to export `BASESHOP_CI_ONLY_TESTS=1` immediately after argument parsing and before the shell launch. This covers all agent sessions: both read-only (exec calls at lines 119, 126) and write-mode (lines 176, 185) paths receive the env var automatically.

`scripts/validate-changes.sh` (POSIX sh) was updated (TASK-05) to block `VALIDATE_INCLUDE_TESTS=1` when `BASESHOP_CI_ONLY_TESTS=1` and `CI` is not `true`. The usage comment was updated to remove the `VALIDATE_INCLUDE_TESTS=1` example and add a CI-only note.

`scripts/src/plans-lint.ts` was updated (TASK-07) to add a `checkLocalJestPatterns()` function that flags active plan docs containing local Jest command patterns (`npx jest`, `pnpm exec jest`, `pnpm run test:governed`, `VALIDATE_INCLUDE_TESTS=1`). Path-based exemptions cover the resource governor plan directory, historical and archive directories. An inline exemption marker `<!-- LINT-EXEMPT: local-jest-pattern -->` was added to three existing plan files (campaign-marketing-test-plan.md, reception-guest-email-cutover-plan.md, startup-loop-s2-market-intel-prompt-quality/plan.md) that contained historical references to local commands in build evidence sections.

**Wave 3 — CHECKPOINT (TASK-08)**

All 9 overall acceptance criteria verified passing:
1. `docs/testing-policy.md` contains no `VALIDATE_INCLUDE_TESTS` references (0 matches).
2. `AGENTS.md` contains `gh run watch` guidance (2 matches).
3. `run-governed-test.sh` exits 1 with "BLOCKED" when `BASESHOP_CI_ONLY_TESTS=1` (no CI).
4. `CI=true BASESHOP_CI_ONLY_TESTS=1` bypass exits 0.
5. `integrator-shell.sh` exports `BASESHOP_CI_ONLY_TESTS=1` (1 match).
6. `validate-changes.sh` blocks `VALIDATE_INCLUDE_TESTS=1` under the policy (exits 1 with BLOCKED).
7. Resource governor plan `Status: Superseded` (1 match).
8. `pnpm --filter scripts plans:lint` passes full repo with no errors.
9. TASK-09 decision documented in the plan Decision Log.

## Tests Run

- TC-01 (TASK-03): `BASESHOP_CI_ONLY_TESTS=1 bash scripts/tests/run-governed-test.sh jest -- --version 2>&1 | grep -q "BLOCKED"` — PASS.
- TC-02 (TASK-03): `CI=true BASESHOP_CI_ONLY_TESTS=1 bash scripts/tests/run-governed-test.sh jest -- --version` — exits 0, "BLOCKED" not printed — PASS.
- TC-01 (TASK-01): `grep -c "VALIDATE_INCLUDE_TESTS" docs/testing-policy.md` returned 0 — PASS.
- TC-02 (TASK-02): `grep -c "VALIDATE_INCLUDE_TESTS" AGENTS.md` returned 0 — PASS.
- TC-03 (TASK-02): `grep -c "gh run watch" AGENTS.md` returned 2 — PASS.
- TC-01 (TASK-04): `grep -c "export BASESHOP_CI_ONLY_TESTS=1" scripts/agents/integrator-shell.sh` returned 1 — PASS.
- TC-01 (TASK-05): `BASESHOP_CI_ONLY_TESTS=1 VALIDATE_INCLUDE_TESTS=1 bash scripts/validate-changes.sh 2>&1 | grep -q "BLOCKED"` — PASS (exits 1).
- TC-01 (TASK-06): `grep -c "Status: Superseded" docs/plans/test-execution-resource-governor-plan.md` returned 1 — PASS.
- TC-03 (TASK-07): `pnpm --filter scripts plans:lint` — "All plans passed basic structure checks." — PASS.
- TC-01 (TASK-07): Plans-lint correctly flags a temp plan doc containing `npx jest` (confirmed during development; caught as intended).

No Jest or e2e test suites were run locally (CI-only policy applies to this build too). All validation contracts used grep/bash invocations.

## Validation Evidence

| Contract | Task | Outcome |
|---|---|---|
| TC-01: No `VALIDATE_INCLUDE_TESTS` in testing-policy.md | TASK-01 | PASS — 0 matches |
| TC-02: Rule 6 (stable mocks) preserved | TASK-01 | PASS — section present |
| TC-01: `locally, always use targeted` removed from AGENTS.md | TASK-02 | PASS — 0 matches |
| TC-02: `VALIDATE_INCLUDE_TESTS` removed from AGENTS.md | TASK-02 | PASS — 0 matches |
| TC-03: `gh run watch` present in AGENTS.md | TASK-02 | PASS — 2 matches |
| TC-01: CI-only block exits 1 with BLOCKED | TASK-03 | PASS — grep found "BLOCKED" |
| TC-02: CI=true bypass exits 0 | TASK-03 | PASS — exit 0 |
| TC-01: `export BASESHOP_CI_ONLY_TESTS=1` present | TASK-04 | PASS — 1 match |
| TC-01: validate-changes blocks VALIDATE_INCLUDE_TESTS=1 | TASK-05 | PASS — exits 1 |
| TC-01: Governor plan Status: Superseded | TASK-06 | PASS — 1 match |
| TC-01: plans-lint flags local Jest pattern | TASK-07 | PASS — confirmed during development |
| TC-03: Full repo plans:lint passes clean | TASK-07 | PASS — "All plans passed basic structure checks." |
| Overall AC-1 through AC-9 | TASK-08 | All PASS (see CHECKPOINT above) |

## Scope Deviations

- **Expanded to LINT-EXEMPT existing plan files (TASK-07)**: Three existing active plan files (campaign-marketing-test-plan.md, reception-guest-email-cutover-plan.md, startup-loop-s2-market-intel-prompt-quality/plan.md) contained historical build evidence with local Jest command patterns. Rather than deleting historical evidence, the `<!-- LINT-EXEMPT: local-jest-pattern -->` marker was added to each. This was a controlled expansion bounded to the TASK-07 objective; it was required to make plans:lint pass on the existing repo state.
- **No other scope deviations.**

## Outcome Contract

- **Why:** Running tests locally — even in governed mode — consumes 2-4 GB RAM per run and destabilises the machine under bursty multi-agent workflows. The resource governor targets the symptom (too many concurrent processes); this initiative targets the cause (tests run locally at all).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Establish a CI-only test policy with enforcement scoped to agent-mediated paths: a block rule via `BASESHOP_CI_ONLY_TESTS=1` in the governed runner (`run-governed-test.sh`) and validate-changes script, exported automatically from `integrator-shell.sh`. Direct-shell invocations (e.g., `pnpm test:affected`) are covered by policy only. Updates AGENTS.md and docs/testing-policy.md to reflect CI-only guidance; marks the resource governor plan Superseded (scheduler and admission phases no longer needed).
- **Source:** operator
