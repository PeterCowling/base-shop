---
Type: Critique-History
Feature-Slug: ci-only-test-execution
Created: 2026-02-27
---

# Critique History — CI-Only Test Execution

## Round 1

- Route: codemoot
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision (partially credible)
- Findings:
  - Major: "CI runs on every push to dev" — overstated; ci.yml has paths-ignore and app pipelines only trigger on main/staging push
  - Major: "No code changes to CI workflows required" — inconsistent with app pipeline trigger gaps
  - Major: Enforcement model overstated — wrapper/env-var approach covers agent paths, not all direct shell paths
  - Minor: Pre-commit hook claim indirect; not directly audited

## Round 1 → Round 2 Fixes Applied

- Goal updated: scoped enforcement to "governed shell paths" with explicit acknowledgment that direct-shell invocations are policy-only
- Constraints: added CI coverage gap constraint with explicit per-pipeline trigger analysis (prime.yml, brikette.yml, caryina.yml)
- Patterns: corrected "every dev push" to "most dev pushes" with full paths-ignore and trigger analysis
- Patterns: added enforcement scope limitation note
- Resolved Q pre-commit: directly audited pre-commit.sh — confirmed no test invocations
- Resolved Q CI gap: confirmed trigger configurations, addressed in TASK-09
- Dependency/Impact: updated blast radius to include possible CI workflow trigger adjustments
- Risks: added CI trigger gap risk row
- TASK-09 added: INVESTIGATE CI trigger coverage for app-specific pipelines
- Evidence Gap Review: updated to reflect Round 1 findings and corrections

## Round 2

- Route: codemoot
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision (partially credible)
- Findings:
  - Major: Env var name inconsistent — `CI_ONLY_TESTS` in prose vs `BASESHOP_CI_ONLY_TESTS` in task seeds
  - Major: Acceptance criteria listed TASK-01..TASK-08 but TASK-09 was added and not included
  - Major: Outcome contract says "agent and human alike" but constraints say direct-shell is policy-only — misaligned
  - Minor: "Implementation Options below" reference — section does not exist
  - Minor: "Recommended Approach" reference — section does not exist

## Round 2 → Round 3 Fixes Applied

- Env var: standardized to `BASESHOP_CI_ONLY_TESTS` throughout (prose, rollback note, testability line)
- Outcome contract frontmatter and body: aligned to "agent-mediated paths + policy for direct-shell"
- Acceptance criteria: updated to explicitly include TASK-09
- Dangling "Implementation Options" ref: replaced with inline explanation
- Dangling "Recommended Approach" ref: replaced with inline statement of recommendation

## Round 3

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision (but score ≥ 4.0 = credible per protocol — score takes precedence)
- Findings addressed inline:
  - Major: e2e coverage gap — clarified scope: Jest covered via governed runner; Cypress/Playwright addressed by policy since e2e has never had a local-run pattern; out of scope for TASK-03 block
  - Major: integration test command malformed — corrected to `BASESHOP_CI_ONLY_TESTS=1 pnpm -w run test:governed -- jest -- --version`
  - Minor: Approach confidence inconsistency (88% vs 86%) — canonicalized to 86% everywhere
- Final status: CREDIBLE (lp_score 4.0 ≥ 4.0 threshold)

---

## Plan Critique (Phase 9 of lp-do-plan)

### Plan Round 1

- Route: codemoot
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision (partially credible)
- Findings:
  - Critical: Plan Summary claimed "all Jest and e2e test execution" routed to CI — enforcement tasks only guard `run-governed-test.sh` and `validate-changes.sh`; `pnpm test:affected`, Turbo, Cypress/Playwright commands not technically blocked
  - Major: TASK-07 sequenced as Wave 1 independent but task body stated it must land after TASK-01/02 to avoid lint false positives — dependency conflict in parallelism guide
  - Major: Observability section claimed new telemetry event class in `.cache/test-governor/events.jsonl` — TASK-03 only does stderr + exit 1, no telemetry emission task existed

### Plan Round 1 → Round 2 Fixes Applied

- Summary rewritten: two-layer model explicit — (1) technical enforcement for governed runner and validate-changes paths; (2) policy-only for direct-shell invocations
- Goals section updated: explicit note that direct-shell commands are policy-only, not technically blocked
- Intended Outcome Statement updated: scoped to agent-mediated paths; direct-shell policy-only documented
- Parallelism Guide: TASK-07 moved to Wave 2 with TASK-01+TASK-02 as prerequisites
- TASK-07 Depends-on field: set to TASK-01, TASK-02
- Task Summary table: TASK-07 Depends-on updated to TASK-01, TASK-02
- Observability: telemetry claim removed; clarified that no new telemetry is added (block exits before governor telemetry path)

### Plan Round 2

- Route: codemoot
- Score: 9/10 → lp_score 4.5
- Verdict: needs_revision (but score ≥ 4.0 = credible per protocol — score takes precedence)
- Findings:
  - Minor: Summary still had a scope contradiction — "eliminates local test runs via agent-mediated paths" read as partial elimination but was preceded by "eliminates local test runs entirely" framing
- Final status: CREDIBLE (lp_score 4.5 ≥ 4.0 threshold; no Critical findings; Round 3 not required)

### Plan Round 2 → Final Fixes Applied

- Summary rewritten to two-layer model with no internal contradiction: layer (1) technical enforcement, layer (2) policy-only — no "eliminates entirely" language
